"""
Wetlands data from USFWS National Wetlands Inventory (NWI).
Free REST API, no auth required.
"""

import httpx
from shapely.geometry import shape


NWI_URL = "https://www.fws.gov/wetlands/arcgis/rest/services/Wetlands/MapServer/0/query"


async def get_wetlands(polygon_geojson: dict) -> dict:
    """
    Query USFWS NWI for wetlands intersecting the polygon.
    Returns presence flag, wetland types, and coverage estimate.
    """
    geom = shape(polygon_geojson)
    centroid = geom.centroid
    lon, lat = centroid.x, centroid.y

    # Build GeoJSON geometry string for ESRI REST API
    bounds = geom.bounds
    envelope = {
        "xmin": bounds[0], "ymin": bounds[1],
        "xmax": bounds[2], "ymax": bounds[3],
        "spatialReference": {"wkid": 4326}
    }

    params = {
        "geometry": str(envelope).replace("'", '"'),
        "geometryType": "esriGeometryEnvelope",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "WETLAND_TYPE,ACRES,ATTRIBUTE",
        "returnGeometry": "false",
        "f": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(NWI_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        features = data.get("features", [])
        if not features:
            return {"present": False, "wetland_types": [], "coverage_pct": 0,
                    "description": "No wetlands detected in polygon area."}

        types = list({f["attributes"].get("WETLAND_TYPE", "Unknown") for f in features})
        total_wetland_acres = sum(
            float(f["attributes"].get("ACRES", 0) or 0) for f in features
        )

        # Rough coverage as percentage of parcel (estimate)
        # We don't have exact intersection area, so flag presence
        coverage_pct = min(100, total_wetland_acres * 10)  # rough estimate

        return {
            "present": True,
            "wetland_types": types,
            "coverage_pct": round(coverage_pct, 1),
            "total_wetland_acres": round(total_wetland_acres, 2),
            "description": (
                f"Wetlands detected: {', '.join(types)}. "
                "Section 404 CWA permit may be required before any grading or fill."
            ),
            "permit_required": True,
        }

    except Exception as e:
        return {
            "present": False,
            "wetland_types": [],
            "coverage_pct": 0,
            "description": "Wetlands data unavailable — verify with USFWS NWI mapper.",
            "error": str(e),
        }
