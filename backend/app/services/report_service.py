from pathlib import Path
from typing import Dict, Any
import json
from backend.app.config import REPORT_DIR


def generate_html_report(job_dict: Dict[str, Any]) -> str:
    """
    Generates a professional, self-contained HTML safety report for download / printing.
    """
    job_id = job_dict.get("id", "N/A")
    filename = job_dict.get("original_filename", "N/A")
    media_type = job_dict.get("media_type", "image").capitalize()
    upload_time = job_dict.get("upload_timestamp", "N/A")
    comp_time = job_dict.get("processing_completed_at", "N/A")
    model_name = job_dict.get("model_identifier", "YOLOv8 Workplace Safety Model")
    supported_classes = job_dict.get("model_supported_classes", [])
    
    compliance = job_dict.get("compliance_details") or {}
    status_label = compliance.get("status_label", "Evaluated")
    score = job_dict.get("compliance_score")
    score_display = f"{score}%" if score is not None else "Insufficient Data"
    
    formula = compliance.get("formula", "N/A")
    detected_req = compliance.get("detected_required_items", [])
    missing_items = compliance.get("missing_items", [])
    direct_violations = compliance.get("direct_violations", [])
    
    detections = job_dict.get("detection_results") or []
    
    # HTML styling for report
    status_color = "#16a34a" if status_label == "Fully Compliant" else "#dc2626" if "Violations" in status_label else "#d97706"

    # Detections table rows
    detection_rows = ""
    if media_type.lower() == "image" and isinstance(detections, list):
        for idx, d in enumerate(detections, 1):
            badge_color = "#16a34a" if d.get("is_ppe") else "#dc2626" if d.get("is_violation") else "#475569"
            detection_rows += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{idx}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{d.get('class_name')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{int(d.get('confidence', 0) * 100)}%</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                    <span style="background-color: {badge_color}22; color: {badge_color}; padding: 3px 8px; border-radius: 4px; font-weight: 500; font-size: 12px;">
                        {'Compliant PPE' if d.get('is_ppe') else 'Direct Violation' if d.get('is_violation') else 'Context Object'}
                    </span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 12px;">{d.get('box')}</td>
            </tr>
            """
    elif media_type.lower() == "video" and isinstance(detections, list):
        for frame in detections:
            f_idx = frame.get("sample_number", frame.get("frame_index", 0))
            ts = frame.get("timestamp_sec", 0.0)
            d_count = frame.get("detection_count", 0)
            v_count = frame.get("violation_count", 0)
            f_comp = frame.get("compliance", {}).get("status_label", "N/A")
            detection_rows += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Sample #{f_idx}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{ts}s</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{d_count} objects</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: {'#dc2626' if v_count > 0 else '#16a34a'};">{v_count} violations</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{f_comp}</td>
            </tr>
            """

    if not detection_rows:
        detection_rows = '<tr><td colspan="5" style="padding: 16px; text-align: center; color: #64748b;">No detected items found.</td></tr>'

    missing_html = "".join([f"<li style='margin-bottom: 6px; color: #b91c1c;'>{item}</li>" for item in missing_items]) or "<li style='color: #16a34a;'>No missing required PPE items observed.</li>"
    violations_html = "".join([f"<li style='margin-bottom: 6px; color: #b91c1c;'>Direct Violation: {item}</li>" for item in direct_violations]) or "<li style='color: #16a34a;'>No direct violation classes detected.</li>"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SafeSight AI — Safety Inspection Report #{job_id[:8]}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 40px;
        }}
        .report-card {{
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            padding: 40px;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0f766e;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }}
        .title {{
            font-size: 24px;
            font-weight: 700;
            color: #0f766e;
            margin: 0 0 6px 0;
        }}
        .meta-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            background-color: #f1f5f9;
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 24px;
            font-size: 14px;
        }}
        .badge-status {{
            display: inline-block;
            background: {status_color}1a;
            color: {status_color};
            border: 1px solid {status_color};
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 14px;
        }}
        .section-heading {{
            font-size: 18px;
            font-weight: 600;
            margin: 24px 0 12px 0;
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            margin-top: 10px;
        }}
        th {{
            background: #f8fafc;
            color: #475569;
            text-align: left;
            padding: 10px;
            border-bottom: 2px solid #cbd5e1;
            font-weight: 600;
        }}
        .disclaimer {{
            margin-top: 40px;
            padding: 16px;
            background: #fefce8;
            border: 1px solid #fef08a;
            border-radius: 6px;
            font-size: 12px;
            color: #713f12;
            line-height: 1.5;
        }}
        @media print {{
            body {{ padding: 0; background: white; }}
            .report-card {{ border: none; box-shadow: none; padding: 0; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="report-card">
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="background: #0f766e; color: white; border: none; padding: 8px 18px; border-radius: 4px; cursor: pointer; font-weight: 600;">Print / Save as PDF</button>
        </div>

        <div class="header">
            <div>
                <h1 class="title">SafeSight AI — Workplace Safety Analysis Report</h1>
                <div style="font-size: 14px; color: #64748b;">Intelligent PPE Detection & Site Compliance Verification</div>
            </div>
            <div>
                <span class="badge-status">{status_label}</span>
            </div>
        </div>

        <div class="meta-grid">
            <div><strong>Record ID:</strong> {job_id}</div>
            <div><strong>Original File:</strong> {filename}</div>
            <div><strong>Media Type:</strong> {media_type}</div>
            <div><strong>Upload Timestamp:</strong> {upload_time}</div>
            <div><strong>Analysis Completed:</strong> {comp_time}</div>
            <div><strong>Inference Model:</strong> {model_name}</div>
        </div>

        <div class="section-heading">Compliance Summary</div>
        <div style="display: flex; gap: 24px; margin-bottom: 16px;">
            <div style="flex: 1; background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px;">
                <div style="font-size: 13px; color: #64748b; font-weight: 500;">Compliance Rating</div>
                <div style="font-size: 28px; font-weight: 700; color: {status_color}; margin-top: 4px;">{score_display}</div>
            </div>
            <div style="flex: 1; background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px;">
                <div style="font-size: 13px; color: #64748b; font-weight: 500;">Total Detections</div>
                <div style="font-size: 28px; font-weight: 700; color: #0f766e; margin-top: 4px;">{job_dict.get('detection_count', 0)}</div>
            </div>
            <div style="flex: 1; background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px;">
                <div style="font-size: 13px; color: #64748b; font-weight: 500;">Potential Violations</div>
                <div style="font-size: 28px; font-weight: 700; color: #dc2626; margin-top: 4px;">{job_dict.get('violation_count', 0)}</div>
            </div>
        </div>

        <div style="background: #f8fafc; padding: 12px 16px; border-left: 4px solid #0f766e; border-radius: 4px; font-size: 14px; margin-bottom: 20px;">
            <strong>Compliance Evaluation Formula:</strong> {formula}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 6px;">
                <strong style="color: #166534; font-size: 14px;">Detected Compliant PPE</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px;">
                    {"".join([f"<li style='color: #15803d; margin-bottom: 4px;'>{item}</li>" for item in detected_req]) or "<li style='color: #64748b;'>None</li>"}
                </ul>
            </div>
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px;">
                <strong style="color: #991b1b; font-size: 14px;">Identified PPE Violations / Missing Items</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px;">
                    {missing_html}
                    {violations_html if direct_violations else ""}
                </ul>
            </div>
        </div>

        <div class="section-heading">Detailed Detection Breakdown</div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Class / Timestamp</th>
                    <th>Confidence / Objects</th>
                    <th>Status</th>
                    <th>Details / Bounding Box</th>
                </tr>
            </thead>
            <tbody>
                {detection_rows}
            </tbody>
        </table>

        <div class="section-heading">Supported Model Classes</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            {"".join([f"<span style='background: #e2e8f0; color: #334155; font-size: 12px; padding: 3px 8px; border-radius: 4px;'>{c}</span>" for c in supported_classes]) or "<span>None configured</span>"}
        </div>

        <div class="disclaimer">
            <strong>Important Safety Notice & Disclaimer:</strong><br>
            This automated safety analysis report was produced by SafeSight AI using a YOLOv8 computer vision model. Model detections are probabilistic and subject to optical occlusions, lighting conditions, and camera angles. This automated output serves to assist and augment safety compliance reviews, but does NOT replace qualified human safety inspectors or on-site OSHA/statutory safety inspections.
        </div>
    </div>
</body>
</html>
"""
    # Save to disk
    report_file = REPORT_DIR / f"{job_id}_safety_report.html"
    report_file.write_text(html_content, encoding="utf-8")
    return str(report_file)
