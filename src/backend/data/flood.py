"""
FEMA NFHL (National Flood Hazard Layer) flood zone lookup.
Free REST API, no auth required.
Returns flood zone classification and base flood elevation.
"""

import httpx
from shapely.geometry import shape


FEMA_URL = (
    "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query"
)

# Human-readable descriptions for FEMA flood zones
ZONE_DESCRIPTIONS = {
    "AE": "Special Flood Hazard Area (1% annual chance) — base flood elevation established",
    "A":  "Special Flood Hazard Area (1% annual chance) — no BFE established",
    "AO": "Special Flood Hazard Area — shallow flooding, sheet flow",
    "AH": "Special Flood Hazard Area — ponding, BFE established",
    "VE": "Coastal High Hazard Area — wave action, BFE established",
    "X":  "Minimal flood risk (outside 500-year floodplain)",
    "B":  "Moderate flood risk (between 100- and 500-year floodplain)",
    "C":  "Minimal flood risk",
    "D":  "Undetermined flood risk",
}

ZONE_RISK_LEVEL = {
    "AE": "HIGH", "A": "HIGH", "AO": "HIGH", "AH": "HIGH", "VE": "HIGH",
    "X": "LOW", "B": "MODERATE", "C": "LOW", "D": "UNKNOWN",
}


async def get_flood_zone(polygon_geojson: dict) -> dict:
    """
    Query FEMA NFHL for the flood zone intersecting the polygon centroid.
    Returns zone code, risk level, base flood elevation if available.
    """
    geom = shape(polygon_geojson)
    centroid = geom.centroid
    lon, lat = centroid.x, centroid.y

    # Build FEMA geometry query (point query for centroid)
    params = {
        "geometry": f"{lon},{lat}",
        "geometryType": "esriGeometryPoint",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "FLD_ZONE,SFHA_TF,BFE_DFE,ZONE_SUBTY",
        "returnGeometry": "false",
        "f": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(FEMA_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        features = data.get("features", [])
        if not features:
            return _default_zone()

        attrs = features[0].get("attributes", {})
        zone = (attrs.get("FLD_ZONE") or "X").strip()
        bfe = attrs.get("BFE_DFE")

        return {
            "zone": zone,
            "description": ZONE_DESCRIPTIONS.get(zone, f"Flood Zone {zone}"),
            "risk_level": ZONE_RISK_LEVEL.get(zone, "UNKNOWN"),
            "bfe_ft": float(bfe) if bfe and float(bfe) > 0 else None,
            "sfha": attrs.get("SFHA_TF") == "T",  # Special Flood Hazard Area
        }

    except Exception as e:
        # Return safe default rather than crash during demo
        return {**_default_zone(), "error": str(e)}


def _default_zone() -> dict:
    """Default when FEMA API unavailable."""
    return {
        "zone": "X",
        "description": "Minimal flood risk (data unavailable — verify with FEMA)",
        "risk_level": "LOW",
        "bfe_ft": None,
        "sfha": False,
    }
