"""
PDF report generation using ReportLab.
Produces a professional 1-2 page PDF with site analysis results.
"""

import os
import tempfile
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER


# Brand colors
NAVY = colors.HexColor("#065A82")
TEAL = colors.HexColor("#1C7293")
LIGHT_BG = colors.HexColor("#F0F7FF")
RED_RISK = colors.HexColor("#C0392B")
YELLOW_RISK = colors.HexColor("#F39C12")
GREEN_RISK = colors.HexColor("#27AE60")
DARK_GRAY = colors.HexColor("#2C3E50")


def generate_pdf(summary: dict, report_text: str) -> str:
    """
    Generate a PDF report from site analysis summary and AI-generated text.
    Saves to a temp file and returns the file path.
    """
    tmp = tempfile.NamedTemporaryFile(
        delete=False, suffix=".pdf", prefix="SiteSense_Report_"
    )
    tmp_path = tmp.name
    tmp.close()

    doc = SimpleDocTemplate(
        tmp_path,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    story = []

    # --- Header ---
    title_style = ParagraphStyle(
        "Title", parent=styles["Title"],
        textColor=colors.white, fontSize=20, leading=24,
        backColor=NAVY, alignment=TA_CENTER,
        spaceAfter=0, leftIndent=-0.75*inch, rightIndent=-0.75*inch,
        borderPadding=(10, 0, 10, 0),
    )
    story.append(Paragraph("SiteSense — Land Feasibility Report", title_style))
    story.append(Spacer(1, 0.15 * inch))

    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        textColor=TEAL, fontSize=10, alignment=TA_CENTER
    )
    addr = summary.get("address", "User-selected parcel")
    area = summary.get("area_acres", 0)
    story.append(Paragraph(
        f"<b>{addr}</b> &nbsp;|&nbsp; {area:.2f} acres &nbsp;|&nbsp; "
        "For preliminary planning only — not a PE-stamped document",
        subtitle_style
    ))
    story.append(Spacer(1, 0.15 * inch))
    story.append(HRFlowable(width="100%", thickness=2, color=NAVY))
    story.append(Spacer(1, 0.1 * inch))

    # --- Key metrics table ---
    metrics = [
        ["Metric", "Value", "Status"],
        ["Flood Zone", summary.get("flood_zone", "X"),
         _risk_label(summary.get("flood_zone", "X"), "flood")],
        ["Seismic Cat.", summary.get("seismic_sdc", "A"),
         _risk_label(summary.get("seismic_sdc", "A"), "seismic")],
        ["Wildfire Risk", summary.get("fire_risk", "Low"),
         _risk_label(summary.get("fire_risk", "Low"), "fire")],
        ["Avg Slope", f"{summary.get('avg_slope_pct', 0):.1f}%",
         _risk_label(summary.get("avg_slope_pct", 0), "slope")],
        ["Foundation Type",
         summary.get("foundation_type", "N/A").replace("_", " ").title(), "—"],
        ["Earthwork (Cut)", f"{summary.get('cut_cy', 0):,} CY", "—"],
        ["Earthwork (Fill)", f"{summary.get('fill_cy', 0):,} CY", "—"],
        ["Site Prep Cost (Now)", f"${summary.get('total_now', 0):,.0f}", "—"],
        ["Cost in 10 Years", f"${summary.get('cost_10yr', 0):,.0f}", "+inflation"],
    ]

    table_style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_BG, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])

    tbl = Table(metrics, colWidths=[2.2*inch, 2.0*inch, 2.6*inch])
    tbl.setStyle(table_style)
    story.append(tbl)
    story.append(Spacer(1, 0.2 * inch))

    # --- AI Report Text ---
    section_style = ParagraphStyle(
        "Section", parent=styles["Heading2"],
        textColor=NAVY, fontSize=11, spaceAfter=4, spaceBefore=10
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=9, leading=13, textColor=DARK_GRAY
    )

    # Parse and render the AI text sections
    for line in report_text.split("\n"):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 0.05 * inch))
        elif line.startswith("## "):
            story.append(Paragraph(line[3:], section_style))
        elif line.startswith("- ") or line.startswith("• "):
            story.append(Paragraph(f"• {line[2:]}", body_style))
        else:
            # Clean up emoji for PDF (ReportLab doesn't render emoji)
            clean = line.replace("🟢", "[GREEN]").replace("🟡", "[YELLOW]").replace("🔴", "[RED]")
            story.append(Paragraph(clean, body_style))

    # --- Footer ---
    story.append(Spacer(1, 0.2 * inch))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontSize=7, textColor=colors.grey, alignment=TA_CENTER
    )
    story.append(Paragraph(
        "Generated by SiteSense — AI Land Feasibility Tool | HackASU 2025 | Mobasher Group, ASU | "
        "Data: USGS, FEMA, USDA, USFWS | AI: Claude (Anthropic) | "
        "⚠️ For preliminary planning only. Not a substitute for licensed PE review.",
        footer_style
    ))

    doc.build(story)
    return tmp_path


def generate_pdf_bytes(summary: dict, report_text: str) -> bytes:
    """
    Generate PDF and return raw bytes (used by Netlify Function / Lambda).
    """
    import io
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle(
        "Title2", parent=styles["Title"],
        textColor=colors.white, fontSize=20, leading=24,
        backColor=NAVY, alignment=TA_CENTER,
        spaceAfter=0, leftIndent=-0.75*inch, rightIndent=-0.75*inch,
        borderPadding=(10, 0, 10, 0),
    )
    story.append(Paragraph("SiteSense — Land Feasibility Report", title_style))
    story.append(Spacer(1, 0.15 * inch))

    subtitle_style = ParagraphStyle(
        "Subtitle2", parent=styles["Normal"],
        textColor=TEAL, fontSize=10, alignment=TA_CENTER
    )
    addr = summary.get("address", "User-selected parcel")
    area = summary.get("area_acres", 0)
    story.append(Paragraph(
        f"<b>{addr}</b> &nbsp;|&nbsp; {area:.2f} acres &nbsp;|&nbsp; "
        "For preliminary planning only — not a PE-stamped document",
        subtitle_style
    ))
    story.append(Spacer(1, 0.15 * inch))
    story.append(HRFlowable(width="100%", thickness=2, color=NAVY))
    story.append(Spacer(1, 0.1 * inch))

    metrics = [
        ["Metric", "Value", "Status"],
        ["Flood Zone", summary.get("flood_zone", "X"),
         _risk_label(summary.get("flood_zone", "X"), "flood")],
        ["Seismic Cat.", summary.get("seismic_sdc", "A"),
         _risk_label(summary.get("seismic_sdc", "A"), "seismic")],
        ["Wildfire Risk", summary.get("fire_risk", "Low"),
         _risk_label(summary.get("fire_risk", "Low"), "fire")],
        ["Avg Slope", f"{summary.get('avg_slope_pct', 0):.1f}%",
         _risk_label(summary.get("avg_slope_pct", 0), "slope")],
        ["Foundation Type",
         summary.get("foundation_type", "N/A").replace("_", " ").title(), "—"],
        ["Earthwork (Cut)", f"{summary.get('cut_cy', 0):,} CY", "—"],
        ["Earthwork (Fill)", f"{summary.get('fill_cy', 0):,} CY", "—"],
        ["Site Prep Cost (Now)", f"${summary.get('total_now', 0):,.0f}", "—"],
        ["Cost in 10 Years", f"${summary.get('cost_10yr', 0):,.0f}", "+inflation"],
    ]

    tbl = Table(metrics, colWidths=[2.2*inch, 2.0*inch, 2.6*inch])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_BG, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 0.2 * inch))

    section_style = ParagraphStyle(
        "Section2", parent=styles["Heading2"],
        textColor=NAVY, fontSize=11, spaceAfter=4, spaceBefore=10
    )
    body_style = ParagraphStyle(
        "Body2", parent=styles["Normal"],
        fontSize=9, leading=13, textColor=DARK_GRAY
    )

    for line in report_text.split("\n"):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 0.05 * inch))
        elif line.startswith("## "):
            story.append(Paragraph(line[3:], section_style))
        elif line.startswith("- ") or line.startswith("• "):
            story.append(Paragraph(f"• {line[2:]}", body_style))
        else:
            clean = line.replace("🟢", "[GREEN]").replace("🟡", "[YELLOW]").replace("🔴", "[RED]")
            story.append(Paragraph(clean, body_style))

    story.append(Spacer(1, 0.2 * inch))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    footer_style = ParagraphStyle(
        "Footer2", parent=styles["Normal"],
        fontSize=7, textColor=colors.grey, alignment=TA_CENTER
    )
    story.append(Paragraph(
        "Generated by SiteSense — AI Land Feasibility Tool | HackASU 2025 | Mobasher Group, ASU | "
        "Data: USGS, FEMA, USDA, USFWS | AI: Claude (Anthropic) | "
        "For preliminary planning only. Not a substitute for licensed PE review.",
        footer_style
    ))

    doc.build(story)
    return buf.getvalue()


def _risk_label(value, risk_type: str) -> str:
    """Return LOW / MODERATE / HIGH label for metric."""
    if risk_type == "flood":
        return "HIGH" if value in {"AE", "VE", "A", "AO"} else "LOW"
    if risk_type == "seismic":
        return "HIGH" if value in {"D", "E", "F"} else ("MODERATE" if value == "C" else "LOW")
    if risk_type == "fire":
        return value.upper() if isinstance(value, str) else "LOW"
    if risk_type == "slope":
        return "HIGH" if value > 20 else ("MODERATE" if value > 10 else "LOW")
    return "—"
