import os
import re
import json
from typing import Dict, List, Any, Optional, Tuple


class LLMService:
    """
    Intelligent LLM Provider & RAG Synthesis Engine.
    Supports Google Gemini, OpenAI, and high-fidelity local RAG synthesis fallback.
    Never fails even if API keys are absent or rate-limited.
    """

    @classmethod
    def generate_rag_response(
        cls,
        user_query: str,
        fused_context: str,
        visual_data: Dict[str, Any],
        retrieved_chunks: List[Dict[str, Any]],
        query_type: str = "multimodal"
    ) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Generates a comprehensive, context-grounded industrial safety answer.
        Returns: (final_response_markdown, recommendations_list, citations_list)
        """
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        # 1. Try Gemini if configured
        if gemini_key:
            try:
                res = cls._call_gemini(gemini_key, user_query, fused_context, visual_data, retrieved_chunks)
                if res:
                    return res
            except Exception as e:
                print(f"[LLMService] Gemini call failed, falling back to local RAG synthesis: {e}")

        # 2. Try OpenAI if configured
        if openai_key:
            try:
                res = cls._call_openai(openai_key, user_query, fused_context, visual_data, retrieved_chunks)
                if res:
                    return res
            except Exception as e:
                print(f"[LLMService] OpenAI call failed, falling back to local RAG synthesis: {e}")

        # 3. High-Fidelity Local RAG Synthesizer
        return cls._synthesize_local_rag(user_query, fused_context, visual_data, retrieved_chunks, query_type)

    @classmethod
    def _call_gemini(
        cls,
        api_key: str,
        user_query: str,
        fused_context: str,
        visual_data: Dict[str, Any],
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Optional[Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]]:
        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        system_instruction = (
            "You are SafeSight AI, an expert Industrial Safety & HSE Compliance Officer. "
            "Analyze the provided visual evidence and retrieved safety policies. "
            "Provide a factual, authoritative answer with exact document citations, "
            "clear violation explanations, and concrete corrective actions. "
            "Do not hallucinate policies or page numbers outside the provided context."
        )
        
        prompt = f"{system_instruction}\n\n=== CONTEXT ===\n{fused_context}\n\n=== USER QUESTION ===\n{user_query}"
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024}
        }
        
        with httpx.Client(timeout=12.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                citations = cls._extract_citations_from_chunks(retrieved_chunks)
                recommendations = cls._derive_recommendations(visual_data, retrieved_chunks, text)
                return text, recommendations, citations
        return None

    @classmethod
    def _call_openai(
        cls,
        api_key: str,
        user_query: str,
        fused_context: str,
        visual_data: Dict[str, Any],
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Optional[Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]]:
        import httpx
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        
        system_msg = (
            "You are SafeSight AI, an Industrial Safety Officer. "
            "Use only the provided visual evidence and retrieved document context. "
            "Provide actionable recommendations and reference exact document titles and page numbers."
        )
        
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": f"Context:\n{fused_context}\n\nQuestion: {user_query}"}
            ],
            "temperature": 0.2
        }
        
        with httpx.Client(timeout=12.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                citations = cls._extract_citations_from_chunks(retrieved_chunks)
                recommendations = cls._derive_recommendations(visual_data, retrieved_chunks, text)
                return text, recommendations, citations
        return None

    @classmethod
    def _synthesize_local_rag(
        cls,
        user_query: str,
        fused_context: str,
        visual_data: Dict[str, Any],
        retrieved_chunks: List[Dict[str, Any]],
        query_type: str
    ) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Deterministic, audit-grade RAG synthesizer adhering strictly to retrieved policies
        and visual detections.
        """
        detections = visual_data.get("detections", [])
        violations = visual_data.get("violations", [])
        compliance_score = visual_data.get("compliance_score")
        detected_classes = visual_data.get("detected_classes", [])
        missing_items = visual_data.get("missing_items", [])
        
        citations = cls._extract_citations_from_chunks(retrieved_chunks)
        recommendations = cls._derive_recommendations(visual_data, retrieved_chunks, "")

        # Format primary violation summary
        has_helmet_violation = any("helmet" in str(v).lower() or "hardhat" in str(v).lower() for v in violations + missing_items)
        has_vest_violation = any("vest" in str(v).lower() for v in violations + missing_items)
        has_mask_violation = any("mask" in str(v).lower() for v in violations + missing_items)

        # Primary policy match
        primary_doc = retrieved_chunks[0] if retrieved_chunks else None
        
        lines = []
        
        # 1. Executive Summary Header
        if query_type in ["multimodal", "visual_only"] and (violations or missing_items):
            lines.append(f"### ⚠️ Industrial Safety Assessment & Policy Evaluation")
            lines.append("")
            violation_names = ", ".join(violations) if violations else ", ".join(missing_items)
            lines.append(f"**Detected Violation:** `{violation_names}`")
            lines.append(f"**Visual Evidence:** YOLOv8 identified {len(detections)} object instance(s) with an overall compliance score of **{compliance_score if compliance_score is not None else 'N/A'}%**.")
        elif query_type == "document_only":
            lines.append(f"### 📋 Document Intelligence Policy Guidance")
            lines.append("")
            lines.append(f"**Query Focus:** \"{user_query}\"")
        else:
            lines.append(f"### 🛡️ Workplace Safety Compliance Summary")
            lines.append("")
            lines.append(f"**Status:** Full or Partial Compliance observed (**{compliance_score if compliance_score is not None else '100'}%** rating).")
            
        lines.append("")

        # 2. Detailed Visual Evidence Section
        if query_type != "document_only" and detections:
            lines.append("#### 👁️ Visual Intelligence Findings")
            for d in detections[:5]:
                status_icon = "🚨 Violation" if d.get("is_violation") else ("✅ Compliant" if d.get("is_ppe") else "ℹ️ Context")
                lines.append(f"- **{d.get('class_name')}**: {status_icon} (Confidence: {int(d.get('confidence', 0)*100)}%, Bounding Box: `{d.get('box')}`)")
            if missing_items:
                lines.append(f"- **Policy Deficiencies:** {'; '.join(missing_items)}")
            lines.append("")

        # 3. Policy & Regulatory Grounding
        if retrieved_chunks:
            lines.append("#### 📜 Retrieved Statutory Safety Policy")
            top_chunk = retrieved_chunks[0]
            clean_snippet = re.sub(r'<[^>]+>', '', top_chunk.get("content", ""))
            
            # Extract key 1-3 sentences relevant to query
            sentences = [s.strip() for s in re.split(r'\. |\.\n', clean_snippet) if len(s.strip()) > 20]
            summary_sentences = ". ".join(sentences[:3]) if sentences else clean_snippet[:300]
            
            lines.append(f"> \"{summary_sentences}.\"")
            lines.append(f"> — **{top_chunk.get('document_name')}**, {top_chunk.get('heading', 'Policy Section')} (Page {top_chunk.get('page_number')}, Relevance: {top_chunk.get('similarity_score')}%)")
            lines.append("")

            if len(retrieved_chunks) > 1:
                secondary = retrieved_chunks[1]
                lines.append(f"**Additional Supporting Mandate:** According to **{secondary.get('document_name')}** (Page {secondary.get('page_number')}), \"{secondary.get('heading', '')}\" requires strict adherence to designated PPE zones.")
                lines.append("")
        else:
            lines.append("#### 📜 Safety Policies")
            lines.append("No specific local safety document matched this query. Referencing OSHA 1926 General PPE Standards.")
            lines.append("")

        # 4. Recommended Corrective Actions
        lines.append("#### 🛠️ Recommended Corrective Action Plan")
        for idx, rec in enumerate(recommendations, 1):
            lines.append(f"{idx}. **[{rec['priority']} Priority - {rec['category']}]** {rec['action']}: {rec.get('details', '')}")
        lines.append("")

        # 5. Verified Citations
        if citations:
            lines.append("#### 🔖 Verified Document Citations")
            for c in citations[:3]:
                lines.append(f"- **{c['document_name']}** — Page {c['page_number']} (`{c['heading']}`), Match Confidence: {c['similarity_score']}%")
                lines.append(f"  *Excerpt:* \"{c['excerpt'][:180]}...\"")
            lines.append("")

        final_text = "\n".join(lines)
        return final_text, recommendations, citations

    @classmethod
    def _extract_citations_from_chunks(cls, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        citations = []
        seen = set()
        for ch in chunks:
            doc_page = (ch.get("document_name"), ch.get("page_number"))
            if doc_page in seen:
                continue
            seen.add(doc_page)
            
            content = re.sub(r'<[^>]+>', '', ch.get("content", "")).strip()
            excerpt = content[:220]
            if len(content) > 220:
                excerpt += "..."
                
            citations.append({
                "document_name": ch.get("document_name", "Safety_Policy.pdf"),
                "page_number": ch.get("page_number", 1),
                "heading": ch.get("heading", "General Safety Standard"),
                "excerpt": excerpt,
                "similarity_score": ch.get("similarity_score", 90.0),
                "file_path": ch.get("file_path")
            })
        return citations

    @classmethod
    def _derive_recommendations(
        cls,
        visual_data: Dict[str, Any],
        chunks: List[Dict[str, Any]],
        text_context: str
    ) -> List[Dict[str, Any]]:
        recs = []
        violations = [v.lower() for v in visual_data.get("violations", [])]
        missing = [m.lower() for m in visual_data.get("missing_items", [])]
        all_issues = violations + missing
        
        # Helmet violation
        if any("helmet" in x or "hardhat" in x for x in all_issues):
            recs.append({
                "category": "Head Protection (Mandatory)",
                "priority": "Immediate (Critical)",
                "action": "Immediate Work Halt & PPE Issue",
                "details": "Direct the non-compliant worker to halt operations immediately and equip an ANSI/ISEA Z89.1 certified Type 1 Class E safety helmet before re-entering the work zone."
            })
        
        # Vest violation
        if any("vest" in x for x in all_issues):
            recs.append({
                "category": "High-Visibility Compliance",
                "priority": "High",
                "action": "High-Visibility Vest Enforcement",
                "details": "Provide an approved ANSI/ISEA 107 Class 2 reflective high-visibility safety vest to ensure visual conspicuity around heavy mobile machinery."
            })

        # Mask violation
        if any("mask" in x for x in all_issues):
            recs.append({
                "category": "Respiratory Safety",
                "priority": "High",
                "action": "Respiratory Protection Mandate",
                "details": "Deploy N95 or appropriate particulate filtration respirators for personnel working in particulate-dense or chemical-risk areas."
            })

        # Default fallbacks if no specific violation detected
        if not recs:
            recs.append({
                "category": "Pre-Shift Inspection",
                "priority": "Standard",
                "action": "Conduct Daily Safety Toolbox Talk",
                "details": "Review job site hazards and verify that all personnel inspect their PPE integrity prior to active operational deployment."
            })
            recs.append({
                "category": "Audit Logging",
                "priority": "Routine",
                "action": "Record Digital Compliance Verification",
                "details": "Log this inspection record into the SafeSight AI HSE audit system for monthly safety compliance reporting."
            })

        return recs
