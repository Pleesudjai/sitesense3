"""
Netlify Function: /api/analyze
Handles POST requests from the frontend to run full site analysis.
"""

import json
import os
import sys
import asyncio

# Bundle src/backend into the Lambda path
_here = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.normpath(os.path.join(_here, "../../src/backend"))
if _backend not in sys.path:
    sys.path.insert(0, _backend)

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


def _cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json",
    }


async def _run_analysis(body: dict) -> dict:
    """Core async analysis logic — mirrors main.py /analyze endpoint."""
    polygon = body.get("polygon")
    if not polygon:
        raise ValueError("polygon is required")

    address       = body.get("address", "")
    building_type = body.get("building_type", "single_family")

    # Fetch all GIS data in parallel
    (elev_data, flood_data, soil_data,
     seismic_data, fire_data, wetlands_data) = await asyncio.gather(
        get_elevation_grid(polygon),
        get_flood_zone(polygon),
        get_soil_data(polygon),
        get_seismic_data(polygon),
        get_fire_risk(polygon),
        get_wetlands(polygon),
    )

    # Engineering calculations
    slope_data = calculate_slope(elev_data["grid"], elev_data["cell_width_ft"])
    cut_fill   = calculate_cut_fill(
        elev_data["grid"],
        target_grade=elev_data["avg_elevation_ft"],
        cell_width_ft=elev_data["cell_width_ft"],
    )

    sdc = get_seismic_design_category(
        seismic_data.get("sds", 0.1),
        seismic_data.get("sd1", 0.05),
        building_type,
    )

    foundation_type, foundation_code = recommend_foundation(
        flood_zone=flood_data.get("zone", "X"),
        slope_pct=slope_data["avg_slope_pct"],
        soil_class=soil_data.get("texture_class", "CL"),
        shrink_swell=soil_data.get("shrink_swell", "Low"),
        seismic_sdc=sdc,
        caliche_present=soil_data.get("caliche", False),
    )

    loads = estimate_structural_loads(
        wind_mph=seismic_data.get("wind_mph", 90),
        sds=seismic_data.get("sds", 0.1),
        sd1=seismic_data.get("sd1", 0.05),
        sdc=sdc,
        elevation_ft=elev_data["avg_elevation_ft"],
    )

    runoff = calculate_runoff(
        area_acres=elev_data["area_acres"],
        slope_pct=slope_data["avg_slope_pct"],
        soil_class=soil_data.get("texture_class", "CL"),
    )

    # Buildable area
    steep_fraction   = slope_data.get("steep_fraction_pct", 0) / 100
    wetland_fraction = wetlands_data.get("coverage_pct", 0) / 100
    total_area_sf    = elev_data["area_acres"] * 43560
    buildable_sf     = max(
        total_area_sf * (1 - steep_fraction) * (1 - wetland_fraction) - 5000,
        0,
    )

    costs = estimate_cost(
        cut_cy=cut_fill["cut_cy"],
        fill_cy=cut_fill["fill_cy"],
        foundation_type=foundation_type,
        buildable_sf=buildable_sf,
        lat=elev_data.get("center_lat", 33.45),
        lon=elev_data.get("center_lon", -112.07),
        load_multiplier=loads["cost_multiplier"],
    )

    summary = {
        "address": address,
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

    report_text = await generate_report_text(summary)

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
            "summary": summary,
            "report_text": report_text,
        },
    }


def handler(event, context):
    """Netlify Function entry point."""
    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": _cors_headers(), "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
        result = asyncio.run(_run_analysis(body))
        return {
            "statusCode": 200,
            "headers": _cors_headers(),
            "body": json.dumps(result),
        }
    except ValueError as e:
        return {
            "statusCode": 400,
            "headers": _cors_headers(),
            "body": json.dumps({"status": "error", "message": str(e)}),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": _cors_headers(),
            "body": json.dumps({"status": "error", "message": str(e)}),
        }
