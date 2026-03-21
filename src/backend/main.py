"""
SiteSense — AI Land Feasibility Tool
FastAPI backend: /analyze endpoint + /report endpoint
"""

import asyncio
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from data.elevation import get_elevation_grid
from data.flood import get_flood_zone
from data.soil import get_soil_data
from data.seismic import get_seismic_data
from data.fire import get_fire_risk
from data.wetlands import get_wetlands
from engineering.cut_fill import calculate_cut_fill, calculate_slope
from engineering.rules import recommend_foundation, get_seismic_design_category
from engineering.cost import estimate_cost
from engineering.loads import estimate_structural_loads
from engineering.stormwater import calculate_runoff
from ai.translate import generate_report_text
from report.pdf_report import generate_pdf

load_dotenv()

app = FastAPI(title="SiteSense API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    polygon: dict          # GeoJSON polygon geometry
    address: str = ""
    building_type: str = "single_family"  # single_family | multifamily | commercial
    floors: int = 1
    budget: str = "mid"    # low | mid | high
    priority: str = "cost" # cost | space | safety


@app.get("/health")
async def health():
    return {"status": "ok", "service": "SiteSense API"}


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """
    Main analysis endpoint. Takes a GeoJSON polygon + user prefs.
    Returns full civil engineering analysis + AI report text.
    """
    polygon = req.polygon

    # --- Step 1: Pull all data in parallel ---
    try:
        elevation_task = get_elevation_grid(polygon)
        flood_task = get_flood_zone(polygon)
        soil_task = get_soil_data(polygon)
        seismic_task = get_seismic_data(polygon)
        fire_task = get_fire_risk(polygon)
        wetlands_task = get_wetlands(polygon)

        (elev_data, flood_data, soil_data,
         seismic_data, fire_data, wetlands_data) = await asyncio.gather(
            elevation_task, flood_task, soil_task,
            seismic_task, fire_task, wetlands_task
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data fetch error: {str(e)}")

    # --- Step 2: Civil engineering calculations ---
    slope_data = calculate_slope(elev_data["grid"], elev_data["cell_width_ft"])
    cut_fill = calculate_cut_fill(
        elev_data["grid"],
        target_grade=elev_data["avg_elevation_ft"],
        cell_width_ft=elev_data["cell_width_ft"]
    )

    sdc = get_seismic_design_category(
        seismic_data.get("sds", 0.1),
        seismic_data.get("sd1", 0.05),
        req.building_type
    )

    foundation_type, foundation_code = recommend_foundation(
        flood_zone=flood_data.get("zone", "X"),
        slope_pct=slope_data["avg_slope_pct"],
        soil_class=soil_data.get("texture_class", "CL"),
        shrink_swell=soil_data.get("shrink_swell", "Low"),
        seismic_sdc=sdc,
        caliche_present=soil_data.get("caliche", False)
    )

    loads = estimate_structural_loads(
        wind_mph=seismic_data.get("wind_mph", 90),
        sds=seismic_data.get("sds", 0.1),
        sd1=seismic_data.get("sd1", 0.05),
        sdc=sdc,
        elevation_ft=elev_data["avg_elevation_ft"]
    )

    runoff = calculate_runoff(
        area_acres=elev_data["area_acres"],
        slope_pct=slope_data["avg_slope_pct"],
        soil_class=soil_data.get("texture_class", "CL")
    )

    # Buildable area estimate (polygon - wetlands - steep zones - setbacks)
    steep_fraction = slope_data.get("steep_fraction_pct", 0) / 100
    wetland_fraction = wetlands_data.get("coverage_pct", 0) / 100
    setback_buffer_sf = 5000  # rough setback area estimate
    total_area_sf = elev_data["area_acres"] * 43560
    buildable_sf = max(
        total_area_sf * (1 - steep_fraction) * (1 - wetland_fraction) - setback_buffer_sf,
        0
    )

    # Cost estimate
    costs = estimate_cost(
        cut_cy=cut_fill["cut_cy"],
        fill_cy=cut_fill["fill_cy"],
        foundation_type=foundation_type,
        buildable_sf=buildable_sf,
        lat=elev_data.get("center_lat", 33.45),
        lon=elev_data.get("center_lon", -112.07),
        load_multiplier=loads["cost_multiplier"]
    )

    # --- Step 3: AI report ---
    analysis_summary = {
        "address": req.address,
        "area_acres": elev_data["area_acres"],
        "avg_elevation_ft": elev_data["avg_elevation_ft"],
        "min_elevation_ft": elev_data["min_ft"],
        "max_elevation_ft": elev_data["max_ft"],
        "avg_slope_pct": slope_data["avg_slope_pct"],
        "max_slope_pct": slope_data["max_slope_pct"],
        "flood_zone": flood_data.get("zone", "X"),
        "base_flood_elevation_ft": flood_data.get("bfe_ft"),
        "soil_texture": soil_data.get("texture_class", "Unknown"),
        "shrink_swell": soil_data.get("shrink_swell", "Low"),
        "caliche": soil_data.get("caliche", False),
        "seismic_sdc": sdc,
        "fire_risk": fire_data.get("risk_class", "Low"),
        "wetlands_present": wetlands_data.get("present", False),
        "wetlands_coverage_pct": wetlands_data.get("coverage_pct", 0),
        "foundation_type": foundation_type,
        "foundation_code": foundation_code,
        "cut_cy": cut_fill["cut_cy"],
        "fill_cy": cut_fill["fill_cy"],
        "net_cy": cut_fill["net_cy"],
        "wind_mph": seismic_data.get("wind_mph", 90),
        "snow_psf": loads.get("snow_psf", 0),
        "runoff_cfs": runoff.get("peak_cfs", 0),
        "buildable_sf": round(buildable_sf),
        "total_now": costs["total_now"],
        "cost_5yr": costs["projections"][5],
        "cost_10yr": costs["projections"][10],
    }

    report_text = await generate_report_text(analysis_summary)

    return {
        "status": "ok",
        "data": {
            "elevation": elev_data,
            "slope": slope_data,
            "flood": flood_data,
            "soil": soil_data,
            "seismic": {**seismic_data, "sdc": sdc},
            "fire": fire_data,
            "wetlands": wetlands_data,
            "cut_fill": cut_fill,
            "foundation": {"type": foundation_type, "code_ref": foundation_code},
            "loads": loads,
            "runoff": runoff,
            "buildable_sf": round(buildable_sf),
            "costs": costs,
            "summary": analysis_summary,
            "report_text": report_text,
        }
    }


@app.post("/report")
async def create_report(req: AnalyzeRequest):
    """Generate and return a PDF report for the analyzed parcel."""
    # Re-run analyze to get fresh data (or accept pre-computed summary)
    analysis_result = await analyze(req)
    data = analysis_result["data"]

    pdf_path = generate_pdf(data["summary"], data["report_text"])
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="SiteSense_Feasibility_Report.pdf"
    )
