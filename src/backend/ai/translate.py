"""
Claude API integration — plain-English translation layer.
The AI layer ONLY translates engineering output.
All engineering decisions are made by the rule engine (rules.py, cost.py, loads.py).
"""

import os
import anthropic


async def generate_report_text(summary: dict) -> str:
    """
    Call Claude API to translate engineering analysis into plain English.
    Returns a formatted 6-section report string.
    """
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    # Build risk summary for context
    flood_risk = "HIGH" if summary.get("flood_zone") in {"AE", "VE", "A", "AO"} else "LOW"
    wetlands_flag = "YES — Section 404 permit likely required" if summary.get("wetlands_present") else "None detected"
    caliche_flag = "Yes — common in this area" if summary.get("caliche") else "Not detected"
    net_dir = "export (surplus)" if summary.get("net_cy", 0) > 0 else "import (deficit)"

    prompt = f"""You are a friendly civil engineer explaining a land feasibility study to a homeowner
or small affordable housing developer. Use plain English. No jargon. Be direct about risks.
Use bullet points and short paragraphs. Be encouraging but honest.

SITE ANALYSIS DATA:
- Address: {summary.get("address", "User-selected parcel")}
- Parcel area: {summary.get("area_acres", 0):.2f} acres ({summary.get("buildable_sf", 0):,.0f} SF estimated buildable)
- Elevation: {summary.get("avg_elevation_ft", 0):.0f} ft avg, {summary.get("min_elevation_ft", 0):.0f}–{summary.get("max_elevation_ft", 0):.0f} ft range
- Slope: {summary.get("avg_slope_pct", 0):.1f}% average, {summary.get("max_slope_pct", 0):.1f}% maximum
- Flood zone: {summary.get("flood_zone", "X")} — Risk: {flood_risk}
- Base flood elevation: {summary.get("base_flood_elevation_ft") or "Not established"}
- Seismic Design Category: {summary.get("seismic_sdc", "A")}
- Wildfire risk: {summary.get("fire_risk", "Low")}
- Soil type: {summary.get("soil_texture", "Unknown")}
- Shrink-swell potential: {summary.get("shrink_swell", "Low")} (expansive soil concern)
- Caliche hardpan: {caliche_flag}
- Wetlands: {wetlands_flag}
- Wind design speed: {summary.get("wind_mph", 90)} mph
- Snow load: {summary.get("snow_psf", 0)} psf

CIVIL ENGINEERING RESULTS:
- Cut: {summary.get("cut_cy", 0):,} CY (earth to remove)
- Fill: {summary.get("fill_cy", 0):,} CY (material to add)
- Net earthwork: {abs(summary.get("net_cy", 0)):,} CY {net_dir}
- Foundation recommendation: {summary.get("foundation_type", "Conventional Slab")}
  Code basis: {summary.get("foundation_code", "ACI 360R-10")}
- Peak stormwater runoff: {summary.get("runoff_cfs", 0):.1f} cfs (10-yr storm)

COST ESTIMATE:
- Site prep cost NOW: ${summary.get("total_now", 0):,.0f}
- Cost in 5 years: ${summary.get("cost_5yr", 0):,.0f}
- Cost in 10 years: ${summary.get("cost_10yr", 0):,.0f}
- Note: These are rough order-of-magnitude estimates ±30%

Write a report with exactly these 6 sections. Use ## for section headers.

## 1. Site Snapshot
3–4 bullets describing what this land is like in simple terms.

## 2. Risk Assessment
One line per risk. Use 🟢 GREEN, 🟡 YELLOW, or 🔴 RED before each item.
Cover: flood, fire, seismic, soil conditions, wetlands.
Be direct — if it's red, say why clearly.

## 3. What You Can Build
2–3 scenarios for what structures are feasible here (given the foundation rec and constraints).
Reference the code basis briefly (e.g., "per ACI 360R-10").

## 4. Earthwork & Site Prep Summary
Explain cut and fill in plain English — what does it mean for this lot?
Is it mostly flat (easy/cheap) or sloped (more work)?

## 5. Cost Estimate & 10-Year Projection
Present the cost now vs 5yr vs 10yr clearly.
Give a clear "build now vs wait" recommendation based on the numbers.

## 6. Your Next Steps
Bullet list of 4–6 specific actions the owner should take next before meeting an engineer.
Be practical and specific.

---
⚠️ DISCLAIMER: This report is for preliminary planning purposes only. It is not a substitute
for a licensed Professional Engineer (PE) review. All engineering decisions must be verified
by a qualified engineer before construction. Site conditions may vary from data shown.
"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1800,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text
