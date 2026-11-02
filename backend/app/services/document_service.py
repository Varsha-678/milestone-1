import os
import re
import io
import time
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.app.config import DOCUMENTS_DIR, MAX_UPLOAD_SIZE_BYTES
from backend.app.database.session import SessionLocal
from backend.app.database.document_models import DocumentRecord, DocumentChunk, ViolationReportRecord

# Lazy loaded OCR engine
_RAPID_OCR = None

def get_ocr_engine():
    global _RAPID_OCR
    if _RAPID_OCR is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _RAPID_OCR = RapidOCR()
        except Exception as e:
            print(f"RapidOCR initialization warning: {e}")
            _RAPID_OCR = False
    return _RAPID_OCR if _RAPID_OCR is not False else None


def sanitize_doc_filename(filename: str) -> str:
    clean = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', filename)
    clean = re.sub(r'\.{2,}', '.', clean)
    return clean[:120]


def extract_keywords_from_text(text: str, max_keywords: int = 6) -> List[str]:
    # Extract salient industrial & safety terms
    safety_terms = [
        "hardhat", "helmet", "safety vest", "mask", "ppe", "zone a", "zone b", "zone c",
        "hazard", "inspection", "compliance", "osha", "respirator", "incident", "audit",
        "emergency", "evacuation", "chemical", "machinery", "fall protection", "scaffolding"
    ]
    lower = text.lower()
    found = [t.title() for t in safety_terms if t in lower]
    
    # Generic word extraction if not enough domain terms
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text)
    from collections import Counter
    stopwords = {"this", "that", "with", "from", "have", "were", "shall", "must", "should", "their", "there", "about", "which"}
    common = [w.title() for w, _ in Counter(w.lower() for w in words if w.lower() not in stopwords).most_common(max_keywords)]
    
    combined = list(dict.fromkeys(found + common))
    return combined[:max_keywords]


class DocumentProcessor:
    """
    Handles PDF, DOCX, and Scanned Image parsing, chunking, OCR, and indexing.
    """

    @staticmethod
    def extract_from_pdf(file_path: str) -> Tuple[List[Dict[str, Any]], List[str], bool]:
        """
        Extracts structured text from PDF page by page.
        Returns: (pages_data, extracted_headings, ocr_performed)
        """
        import pypdf
        pages_data = []
        headings = []
        ocr_performed = False
        ocr_engine = None

        with open(file_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            total_pages = len(reader.pages)

            for idx, page in enumerate(reader.pages):
                page_num = idx + 1
                text = page.extract_text() or ""
                page_text = text.strip()

                # If text is extremely short or empty, check for scanned image and run OCR
                if len(page_text) < 40:
                    if ocr_engine is None:
                        ocr_engine = get_ocr_engine()
                    
                    # Extract images if available
                    if ocr_engine and len(page.images) > 0:
                        ocr_texts = []
                        for img_obj in page.images:
                            try:
                                img_bytes = img_obj.data
                                result, _ = ocr_engine(img_bytes)
                                if result:
                                    ocr_texts.extend([line[1] for line in result])
                            except Exception as e:
                                print(f"OCR page image extract error: {e}")
                        if ocr_texts:
                            page_text = "\n".join(ocr_texts)
                            ocr_performed = True

                # Identify potential headings (lines that are capitalized or short with no trailing period)
                lines = [l.strip() for l in page_text.split("\n") if l.strip()]
                for l in lines:
                    if (l.isupper() or (len(l) < 60 and not l.endswith('.'))) and len(l) > 4:
                        if l not in headings:
                            headings.append(l)

                pages_data.append({
                    "page_number": page_num,
                    "text": page_text
                })

        return pages_data, headings[:20], ocr_performed

    @staticmethod
    def extract_from_docx(file_path: str) -> Tuple[List[Dict[str, Any]], List[str], bool]:
        """
        Extracts structured text from DOCX (paragraphs, headings, tables).
        """
        import docx
        doc = docx.Document(file_path)
        headings = []
        paragraphs_data = []
        current_heading = "General"

        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue
            
            # Check if paragraph style is heading
            style_name = p.style.name.lower()
            if "heading" in style_name or p.text.isupper() and len(text) < 80:
                current_heading = text
                if text not in headings:
                    headings.append(text)
            
            paragraphs_data.append({
                "heading": current_heading,
                "text": text
            })

        # Also extract text from tables
        for t_idx, table in enumerate(doc.tables):
            table_rows = []
            for row in table.rows:
                cells = [c.text.strip() for c in row.cells if c.text.strip()]
                if cells:
                    table_rows.append(" | ".join(cells))
            if table_rows:
                paragraphs_data.append({
                    "heading": f"Table {t_idx + 1}",
                    "text": "\n".join(table_rows)
                })

        # Normalize into simulated pages (~3 paragraphs per page)
        pages_data = []
        chunk_size = 4
        for i in range(0, max(len(paragraphs_data), 1), chunk_size):
            slice_items = paragraphs_data[i:i+chunk_size]
            page_text = "\n\n".join([f"[{item['heading']}]\n{item['text']}" for item in slice_items])
            pages_data.append({
                "page_number": (i // chunk_size) + 1,
                "text": page_text,
                "heading": slice_items[0]["heading"] if slice_items else "General"
            })

        return pages_data, headings[:20], False

    @staticmethod
    def chunk_document(pages_data: List[Dict[str, Any]], max_chunk_chars: int = 500) -> List[Dict[str, Any]]:
        """
        Divides extracted page text into meaningful semantic chunks.
        Preserves page reference, heading, and keywords.
        """
        chunks = []
        chunk_idx = 0

        for page in pages_data:
            page_num = page["page_number"]
            full_text = page["text"]
            if not full_text:
                continue

            # Split text by double newlines or paragraph breaks
            paragraphs = [p.strip() for p in re.split(r'\n{2,}|\.\s+', full_text) if p.strip()]
            
            buffer = ""
            current_heading = page.get("heading", "")

            for para in paragraphs:
                # Detect inline headings like [Heading Title]
                heading_match = re.match(r'^\[(.*?)\]', para)
                if heading_match:
                    current_heading = heading_match.group(1)
                    para = para[heading_match.end():].strip()

                if len(buffer) + len(para) > max_chunk_chars and buffer:
                    # Save current chunk
                    chunks.append({
                        "chunk_index": chunk_idx,
                        "page_number": page_num,
                        "heading": current_heading,
                        "content": buffer.strip(),
                        "token_count": len(buffer.split()),
                        "keywords": extract_keywords_from_text(buffer)
                    })
                    chunk_idx += 1
                    buffer = para + " "
                else:
                    buffer += para + " "

            if buffer.strip():
                chunks.append({
                    "chunk_index": chunk_idx,
                    "page_number": page_num,
                    "heading": current_heading,
                    "content": buffer.strip(),
                    "token_count": len(buffer.split()),
                    "keywords": extract_keywords_from_text(buffer)
                })
                chunk_idx += 1

        return chunks


class SemanticSearchEngine:
    """
    Intelligent natural language & keyword vector search across indexed chunks.
    """

    @staticmethod
    def search(
        query: str, 
        doc_id: Optional[str] = None, 
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Performs semantic vector and term matching against stored document chunks.
        """
        query_clean = query.strip()
        if not query_clean:
            return {"query": query, "total_matches": 0, "results": []}

        db = SessionLocal()
        try:
            # Fetch chunks from DB
            q = db.query(DocumentChunk, DocumentRecord).join(
                DocumentRecord, DocumentChunk.document_id == DocumentRecord.id
            ).filter(DocumentRecord.processing_status == "Completed")

            if doc_id:
                q = q.filter(DocumentRecord.id == doc_id)

            records = q.all()
            if not records:
                return {"query": query, "total_matches": 0, "results": []}

            corpus = []
            chunk_metadata_list = []

            for chunk, doc in records:
                # Enrich text with document title, heading and keywords for semantic matching
                enriched = f"{doc.original_filename} {chunk.heading or ''} {chunk.content} {' '.join(chunk.keywords or [])}"
                corpus.append(enriched)
                chunk_metadata_list.append((chunk, doc))

            # Build TF-IDF vector space with sublinear term frequency
            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                stop_words='english',
                sublinear_tf=True
            )
            tfidf_matrix = vectorizer.fit_transform(corpus)
            query_vec = vectorizer.transform([query_clean])

            # Cosine similarity
            cosine_sims = cosine_similarity(query_vec, tfidf_matrix).flatten()

            # Score boosting for exact keyword appearances
            terms = [t.lower() for t in re.findall(r'\b[a-zA-Z0-9_\-]+\b', query_clean) if len(t) > 1]

            scored_results = []
            for idx, sim in enumerate(cosine_sims):
                chunk, doc = chunk_metadata_list[idx]
                content_lower = chunk.content.lower()
                heading_lower = (chunk.heading or "").lower()
                doc_name_lower = doc.original_filename.lower()

                # Boosts
                boost = 0.0
                match_count = 0
                for term in terms:
                    if term in heading_lower:
                        boost += 0.25
                        match_count += 1
                    if term in doc_name_lower:
                        boost += 0.15
                        match_count += 1
                    if term in content_lower:
                        boost += 0.10
                        match_count += 1

                combined_score = float(sim) + boost
                if combined_score > 0.05 or match_count > 0:
                    # Convert to normalized percentage (max 99.4%)
                    final_pct = min(round((combined_score / 1.4) * 100, 2), 99.4)
                    if final_pct < 15.0:
                        final_pct = round(15.0 + (combined_score * 30), 2)

                    # Highlight matched snippet
                    snippet = chunk.content
                    highlight_snippet = snippet
                    for term in terms:
                        pattern = re.compile(rf'({re.escape(term)})', re.IGNORECASE)
                        highlight_snippet = pattern.sub(r'<mark class="bg-amber-400/30 text-amber-200 px-1 py-0.5 rounded font-bold">\1</mark>', highlight_snippet)

                    scored_results.append({
                        "chunk_id": chunk.id,
                        "document_id": doc.id,
                        "document_name": doc.original_filename,
                        "file_type": doc.file_type,
                        "page_number": chunk.page_number,
                        "heading": chunk.heading or "General Section",
                        "content": chunk.content,
                        "highlighted_snippet": highlight_snippet,
                        "similarity_score": final_pct,
                        "token_count": chunk.token_count,
                        "keywords": chunk.keywords or [],
                        "file_path": f"/api/documents/{doc.id}/file"
                    })

            # Sort descending by score
            scored_results.sort(key=lambda x: x["similarity_score"], reverse=True)
            top_results = scored_results[:limit]

            return {
                "query": query,
                "total_matches": len(scored_results),
                "results": top_results
            }
        finally:
            db.close()


def seed_standard_knowledge_base():
    """
    Populates standard industrial safety manuals, Q3 incident reports, and
    monthly safety performance records if database is fresh.
    """
    db = SessionLocal()
    try:
        existing_count = db.query(DocumentRecord).count()
        if existing_count > 0:
            return

        print("Initializing SafeSight AI Milestone 2 Standard Knowledge Base...")

        # 1. Safety Manual v2.pdf
        doc1_id = str(uuid.uuid4())
        doc1 = DocumentRecord(
            id=doc1_id,
            original_filename="Safety_Manual_v2.pdf",
            stored_filename=f"safety_manual_v2_{doc1_id[:8]}.pdf",
            file_type="pdf",
            file_size_bytes=2458900,
            file_path=str(DOCUMENTS_DIR / f"safety_manual_v2_{doc1_id[:8]}.pdf"),
            processing_status="Completed",
            page_count=48,
            chunk_count=6,
            ocr_performed=True,
            extraction_accuracy=97.28,
            processing_duration_ms=420,
            extracted_headings=[
                "Section 1: General PPE Requirements",
                "Section 4: Zone A High-Risk Operational Mandates (Page 42)",
                "Section 7: Respiratory & Mask Protection Standards",
                "Section 12: High-Visibility Vest Color Codes",
                "Section 15: Emergency Evacuation & Incident Escalation"
            ],
            metadata_info={"author": "Apex Safety Board", "version": "2.4", "classification": "Statutory"}
        )
        db.add(doc1)

        # Chunks for Safety Manual v2
        manual_chunks = [
            (
                42,
                "Section 4: Zone A High-Risk Operational Mandates",
                "PPE Zone A Mandatory Protocols: All personnel entering Zone A (heavy overhead machinery, active fabrication lines, and crane loading portals) MUST continuously wear a certified Type II Class E Safety Helmet (Hardhat) and Class 2 High-Visibility Vest at all times. Failure to secure helmet chin straps or wearing unapproved headgear constitutes a Grade 1 Safety Violation subject to immediate site removal. Workers in Zone A must maintain continuous visual clearance of 5 meters from moving transport vehicles.",
                ["PPE Zone A", "Hardhat", "Safety Vest", "Class E", "Crane Portals", "Grade 1 Violation"]
            ),
            (
                43,
                "Section 4.2: Zone A Chemical & Airborne Hazard Addendum",
                "Where Zone A operations intersect with welding, spray finishing, or grinding stations, all operators and adjacent workers within a 15-meter radius must equip N95-rated or P100 particulate safety masks. Standard cloth coverings are strictly prohibited in Zone A. Mask seal checks must be verified by site safety officers at the start of each work shift.",
                ["PPE Zone A", "Mask", "Welding", "N95", "Airborne Hazard"]
            ),
            (
                12,
                "Section 2: High-Visibility Protective Vest Specifications",
                "High-Visibility Safety Vests must meet EN ISO 20471 / ANSI 107 Class 2 minimum compliance. Retroreflective stripes must span a minimum width of 50mm, wrapping horizontally around the torso and vertically over both shoulders. In low-light warehouse aisles and evening operations, vests with Class 3 coverage and LED beacon integration are mandatory.",
                ["Safety Vest", "Reflective", "ANSI 107", "Warehouse", "Lighting"]
            ),
            (
                24,
                "Section 5: Protective Headgear & Impact Tolerance",
                "Hardhat shells must be inspected prior to each shift for micro-cracks, UV degradation, and harness fatigue. Any hardhat subjected to an impact—regardless of visible exterior damage—must be immediately retired and logged into the site safety register. Altering or drilling suspension attachments voids manufacturer compliance.",
                ["Hardhat", "Helmet", "Impact", "Inspection", "Compliance"]
            ),
            (
                31,
                "Section 6: Respiratory Protection in Confined Spaces",
                "Respiratory safety masks with activated carbon cartridges are required in paint booths, solvent storage vaults, and confined underground conduits. Safety officers must conduct qualitative fit testing bi-annually for all full-time plant technicians.",
                ["Mask", "Respiratory", "Confined Space", "Carbon Filter"]
            ),
            (
                45,
                "Section 8: Site Vehicle Traffic & Hazard Perimeter Cones",
                "Traffic boundary cones with reflective sleeves (minimum height 750mm) must delineate all automated forklift paths and staging zones. Cones must be spaced at intervals not exceeding 3 meters along pedestrian walkways adjacent to active loading bays.",
                ["Safety Cone", "Vehicle", "Forklift", "Pedestrian", "Perimeter"]
            )
        ]

        for c_idx, (pg, hd, ct, kws) in enumerate(manual_chunks):
            db.add(DocumentChunk(
                document_id=doc1_id,
                chunk_index=c_idx,
                page_number=pg,
                heading=hd,
                content=ct,
                token_count=len(ct.split()),
                keywords=kws,
                chunk_metadata={"section": hd}
            ))

        # 2. Incident_Report_Q3.docx
        doc2_id = str(uuid.uuid4())
        doc2 = DocumentRecord(
            id=doc2_id,
            original_filename="Incident_Report_Q3.docx",
            stored_filename=f"incident_report_q3_{doc2_id[:8]}.docx",
            file_type="docx",
            file_size_bytes=842100,
            file_path=str(DOCUMENTS_DIR / f"incident_report_q3_{doc2_id[:8]}.docx"),
            processing_status="Completed",
            page_count=14,
            chunk_count=4,
            ocr_performed=False,
            extraction_accuracy=98.50,
            processing_duration_ms=180,
            extracted_headings=[
                "Executive Summary Q3 Safety Audits",
                "Incident Record #204: Zone A Unfastened Helmet Violation",
                "Incident Record #219: Missing High-Visibility Vest near Bay 4",
                "Corrective Actions & Safety Committee Recommendations"
            ],
            metadata_info={"quarter": "Q3-2026", "site": "North Plant Unit 2"}
        )
        db.add(doc2)

        # Chunks for Incident Report Q3
        incident_chunks = [
            (
                3,
                "Incident Record #204: Zone A Unfastened Helmet Violation",
                "Incident Record Row #204: On 14-Aug-2026 at 14:22, during afternoon crane positioning in PPE Zone A, two contractor mechanics were observed operating without secured safety helmets (Hardhats). Camera feed flagged NO-Hardhat status. Operations were halted for 18 minutes while retraining was issued. Root cause analysis identified insufficient pre-task briefing.",
                ["PPE Zone A", "Incident Record", "NO-Hardhat", "Crane", "Mechanics"]
            ),
            (
                5,
                "Incident Record #219: Missing High-Visibility Vest near Bay 4",
                "Incident Record Row #219: On 28-Aug-2026, automated AI surveillance flagged a pallet loader without a high-visibility safety vest entering the forklift transit lane at Bay 4. Warning beacon was triggered automatically, and site safety supervisor intervened within 90 seconds. No injuries recorded.",
                ["Safety Vest", "Bay 4", "Forklift", "Surveillance", "Incident Record"]
            ),
            (
                8,
                "Section 3: Contractor Compliance Audit Summary",
                "During Q3 audits across 48 site evaluations, overall PPE compliance stood at 79% for sub-contractors versus 94% for core facility staff. Primary recurring violation categories were unclasped helmet straps (38%) and uncertified dust masks in hot weather (26%).",
                ["Contractor", "Compliance", "PPE", "Audit", "Violation"]
            ),
            (
                11,
                "Section 4: Corrective Actions & Preventative Protocol",
                "The Safety Committee has implemented mandatory biometric gate-entry PPE scans, preventing turnstile access to any personnel lacking approved safety helmet, vest, and footwear. All zone supervisors must log daily spot checks in the SafeSight AI command console.",
                ["Corrective Action", "Gate Entry", "Turnstile", "Supervisor"]
            )
        ]

        for c_idx, (pg, hd, ct, kws) in enumerate(incident_chunks):
            db.add(DocumentChunk(
                document_id=doc2_id,
                chunk_index=c_idx,
                page_number=pg,
                heading=hd,
                content=ct,
                token_count=len(ct.split()),
                keywords=kws,
                chunk_metadata={"incident_id": f"INC-{200+c_idx}"}
            ))

        # 3. Monthly Safety Performance Report (matching Presentation Slide 6)
        rep1_id = str(uuid.uuid4())
        rep1 = ViolationReportRecord(
            id=rep1_id,
            title="Monthly Safety Performance Report - Industrial Plant & PPE Audit",
            report_number="HSE-MSR-2026-10",
            period="October 2026",
            report_type="Monthly Safety Performance Report",
            contractor="Apex Site Dynamics Ltd",
            client="SafeSight Industrial Safety Directorate",
            department="EHS & Field Engineering",
            audit_score_previous=88.5,
            audit_score_current=94.2,
            observations_by_category=[
                {"category": "Unsafe Acts (PPE non-compliance)", "previous_month": 42, "this_month": 32, "trend": "down"},
                {"category": "Unsafe Conditions (Blocked exits, tripping)", "previous_month": 19, "this_month": 14, "trend": "down"},
                {"category": "Missing Protective Helmets / Vest", "previous_month": 28, "this_month": 18, "trend": "down"},
                {"category": "Machinery Guard Deficiencies", "previous_month": 11, "this_month": 8, "trend": "down"},
                {"category": "Housekeeping & Spill Hazards", "previous_month": 22, "this_month": 15, "trend": "down"}
            ],
            hse_statistics={
                "average_manpower": 85,
                "total_man_hours_worked": 41200,
                "hours_worked_per_day": 8.0,
                "lost_time_injury_lti": 0,
                "medical_treatment_cases": 1,
                "first_aid_cases": 4,
                "near_misses_reported": 12,
                "safe_man_hours_streak": 312000
            },
            lagging_indicators={
                "fatalities": 0,
                "permanent_disabilities": 0,
                "work_days_lost": 0,
                "recordable_incident_rate": 0.48
            },
            audit_recommendations=[
                {
                    "sr_no": 1,
                    "audit_date": "2026-10-12",
                    "recommendation": "Provide dedicated thermal rest shelter and hydration station in Zone A fabrication area",
                    "target_date": "2026-10-25",
                    "status": "Closed",
                    "action_taken": "Rest shelter erected and fully operational with potable water coolers."
                },
                {
                    "sr_no": 2,
                    "audit_date": "2026-10-15",
                    "recommendation": "Install high-luminosity LED safety boundary line projectors around crane loading portal",
                    "target_date": "2026-11-05",
                    "status": "In Progress",
                    "action_taken": "Projector units received from supplier; electrical wiring scheduled for weekend shift."
                },
                {
                    "sr_no": 3,
                    "audit_date": "2026-10-20",
                    "recommendation": "Replace worn reflective safety cones along forklift transport lane Bay 2 to Bay 4",
                    "target_date": "2026-10-28",
                    "status": "Closed",
                    "action_taken": "45 high-intensity prism cones deployed with chain link barricading."
                },
                {
                    "sr_no": 4,
                    "audit_date": "2026-10-26",
                    "recommendation": "Enforce automated YOLOv8 PPE checkpoint scanning at contractor shift turnaround",
                    "target_date": "2026-11-02",
                    "status": "Closed",
                    "action_taken": "SafeSight AI Scanner integrated at main turnstiles; real-time dashboard active."
                }
            ]
        )
        db.add(rep1)

        db.commit()
        print("Standard Knowledge Base seeded successfully with 2 rich documents, 10 chunks, and Monthly Safety Report!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding knowledge base: {e}")
    finally:
        db.close()
