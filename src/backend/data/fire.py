"""
Wildfire risk data.
Uses a heuristic lookup based on lat/lon + elevation + state.
For production: query USGS Wildfire Hazard Potential raster.
For hackathon: rule-based lookup using known AZ risk zones.
"""

from shapely.geometry import shape


# Known high wildfire risk regions (lat/lon bounding boxes)
HIGH_RISK_ZONES = [
    # Prescott / Bradshaw Mountains
    {"name": "Prescott Area", "bbox": (34.3, -113.0, 35.0, -111.5), "risk": "High"},
    # Mogollon Rim / Payson
    {"name": "Mogollon Rim", "bbox": (34.0, -112.0, 35.0, -110.0), "risk": "Very High"},
    # White Mountains
    {"name": "White Mountains", "bbox": (33.5, -110.5, 34.5, -109.0), "risk": "High"},
    # Flagstaff ponderosa pine
    {"name": "Flagstaff Area", "bbox": (34.8, -112.5, 35.5, -111.0), "risk": "High"},
    # Sierra Vista / Huachuca
    {"name": "Huachuca Mountains", "bbox": (31.3, -111.0, 31.9, -110.0), "risk": "Moderate"},
    # Texas Hill Country (demo case)
    {"name": "TX Hill Country", "bbox": (29.5, -100.0, 32.0, -97.0), "risk": "Moderate"},
]

MODERATE_RISK_ZONES = [
    # Tucson foothills
    {"name": "Tucson Metro Foothills", "bbox": (31.8, -111.5, 32.6, -110.5), "risk": "Moderate"},
]

RISK_DESCRIPTIONS = {
    "Low": "Low wildfire risk — standard construction applies",
    "Moderate": "Moderate wildfire risk — Class A roofing recommended",
    "High": "High wildfire risk — WUI requirements apply (ASCE 7-22 Ch.27)",
    "Very High": "Very High wildfire risk — ignition-resistant construction required (WUI)",
}

RISK_COLORS = {
    "Low": "green", "Moderate": "yellow", "High": "orange", "Very High": "red"
}


async def get_fire_risk(polygon_geojson: dict) -> dict:
    """
    Return wildfire risk classification for the polygon centroid.
    Rule-based lookup using known AZ WUI boundaries.
    """
    geom = shape(polygon_geojson)
    centroid = geom.centroid
    lon, lat = centroid.x, centroid.y

    risk_class = _classify_fire_risk(lat, lon)

    return {
        "risk_class": risk_class,
        "description": RISK_DESCRIPTIONS.get(risk_class, "Unknown"),
        "color": RISK_COLORS.get(risk_class, "gray"),
        "wui_zone": risk_class in {"High", "Very High"},
        "construction_requirement": _construction_req(risk_class),
    }


def _classify_fire_risk(lat: float, lon: float) -> str:
    """Check if point falls in a known high-risk zone."""
    for zone in HIGH_RISK_ZONES:
        b = zone["bbox"]
        if b[0] <= lat <= b[2] and b[1] <= lon <= b[3]:
            return zone["risk"]

    for zone in MODERATE_RISK_ZONES:
        b = zone["bbox"]
        if b[0] <= lat <= b[2] and b[1] <= lon <= b[3]:
            return zone["risk"]

    # Phoenix / Tucson valleys: low risk
    if 31 < lat < 34 and -113 < lon < -111:
        return "Low"

    # Default for rest of USA
    return "Low"


def _construction_req(risk_class: str) -> str:
    """Return construction requirement note for fire risk level."""
    if risk_class in {"High", "Very High"}:
        return (
            "WUI (Wildland-Urban Interface) zone — ignition-resistant construction required. "
            "Class A roof covering, ember-resistant vents, noncombustible siding. "
            "See ASCE 7-22 Ch.27 and local fire code."
        )
    if risk_class == "Moderate":
        return "Class A roof covering recommended. Check local fire code for defensible space requirements."
    return "Standard construction applies for fire."
