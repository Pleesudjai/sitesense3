"""
Soil data from SoilWeb API (UC Davis / USDA SSURGO).
Returns soil texture class, shrink-swell potential, and caliche flag.
Free API, no auth required.
"""

import httpx
from shapely.geometry import shape


SOILWEB_URL = "https://casoilresource.lawr.ucdavis.edu/api/point/"

# Shrink-swell lookup by USDA texture class
SHRINK_SWELL_BY_TEXTURE = {
    "C": "High", "CL": "High", "SiC": "High", "SiCL": "Moderate",
    "SC": "Moderate", "SCL": "Low",
    "SiL": "Low", "Si": "Low", "L": "Low",
    "SL": "Low", "LS": "Low", "S": "Low",
    "SaC": "Moderate", "SaCL": "Low",
    # Default: Low
}

# Arizona-dominant soils prone to caliche
CALICHE_PRONE_TEXTURES = {"S", "LS", "SL", "SCL"}  # sandy loams in desert


async def get_soil_data(polygon_geojson: dict) -> dict:
    """
    Query SoilWeb for soil properties at polygon centroid.
    Returns texture, drainage, shrink-swell potential, and caliche flag.
    """
    geom = shape(polygon_geojson)
    centroid = geom.centroid
    lon, lat = centroid.x, centroid.y

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                SOILWEB_URL,
                params={"lon": lon, "lat": lat},
                timeout=15.0
            )
            resp.raise_for_status()
            data = resp.json()

        # SoilWeb returns list of soil components
        series = data.get("series", [])
        if not series:
            return _default_soil(lat, lon)

        # Use dominant component (first in list)
        dominant = series[0]
        texture = dominant.get("texture", "L")
        drainage = dominant.get("drainagecl", "well drained")
        series_name = dominant.get("series", "Unknown")

        # Derive shrink-swell from texture
        shrink_swell = SHRINK_SWELL_BY_TEXTURE.get(texture, "Low")

        # Caliche flag: common in AZ desert soils (aridisols, entisols in low precip areas)
        # Heuristic: sandy soils in southwestern US latitudes
        caliche = (lat < 37 and lon < -104 and texture in CALICHE_PRONE_TEXTURES)

        return {
            "series_name": series_name,
            "texture_class": texture,
            "texture_description": _texture_description(texture),
            "drainage_class": drainage,
            "shrink_swell": shrink_swell,
            "caliche": caliche,
            "bearing_hint": _bearing_hint(texture, drainage),
        }

    except Exception as e:
        return {**_default_soil(lat, lon), "error": str(e)}


def _texture_description(texture: str) -> str:
    """Human-readable texture description."""
    descriptions = {
        "C": "Clay (high plasticity)", "CL": "Clay Loam (expansive)",
        "SiC": "Silty Clay", "SiCL": "Silty Clay Loam",
        "L": "Loam (well-balanced)", "SiL": "Silt Loam",
        "SL": "Sandy Loam", "S": "Sand", "LS": "Loamy Sand",
        "SC": "Sandy Clay", "SCL": "Sandy Clay Loam",
    }
    return descriptions.get(texture, f"Soil texture: {texture}")


def _bearing_hint(texture: str, drainage: str) -> str:
    """Qualitative bearing capacity hint for engineers."""
    if texture in {"C", "CL", "SiC"} or "poor" in drainage.lower():
        return "Low — possible soft/expansive conditions; soil boring recommended"
    if texture in {"S", "LS"}:
        return "Variable — sandy soil; compaction important before foundation"
    return "Moderate — standard bearing; verify with geotechnical investigation"


def _default_soil(lat: float, lon: float) -> dict:
    """Default when SoilWeb unavailable. Arizona-specific guess."""
    # Phoenix area defaults: sandy loam, caliche common
    if 31 < lat < 36 and -115 < lon < -109:
        return {
            "series_name": "Mohave-Laveen (AZ typical, API unavailable)",
            "texture_class": "SL",
            "texture_description": "Sandy Loam",
            "drainage_class": "well drained",
            "shrink_swell": "Low",
            "caliche": True,  # caliche very common in AZ
            "bearing_hint": "Variable — caliche possible; get soil boring",
        }
    return {
        "series_name": "Unknown (API unavailable)",
        "texture_class": "L",
        "texture_description": "Loam",
        "drainage_class": "well drained",
        "shrink_swell": "Low",
        "caliche": False,
        "bearing_hint": "Moderate — verify with geotechnical investigation",
    }
