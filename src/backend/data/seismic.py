"""
Seismic hazard data from USGS National Seismic Hazard Model API.
Also returns design wind speed from ASCE 7-22 lookup table.
Free API, no auth required.
"""

import httpx
from shapely.geometry import shape


USGS_SEISMIC_URL = "https://earthquake.usgs.gov/hazard/designmaps/us/json"

# ASCE 7-22 Table 26.5-1 — Basic wind speed (Risk Category II) by state/region
# Simplified lookup for AZ demo (mph)
WIND_SPEED_LOOKUP = {
    # AZ: most areas 90-110 mph; mountains higher
    "az_low": 90,      # Phoenix, Tucson valleys
    "az_mountain": 100, # Flagstaff, Prescott elevations
    "tx_coast": 130,   # Houston area (hurricane zone)
    "tx_inland": 100,
    "default": 95,
}


async def get_seismic_data(polygon_geojson: dict) -> dict:
    """
    Query USGS NSHM for seismic design parameters.
    Returns Ss, S1, SDS, SD1, and design wind speed.
    """
    geom = shape(polygon_geojson)
    centroid = geom.centroid
    lon, lat = centroid.x, centroid.y

    seismic = await _fetch_seismic(lat, lon)
    wind_mph = _lookup_wind_speed(lat, lon)

    return {
        **seismic,
        "wind_mph": wind_mph,
        "center_lat": lat,
        "center_lon": lon,
    }


async def _fetch_seismic(lat: float, lon: float) -> dict:
    """Fetch USGS seismic design values."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "riskCategory": "II",    # residential / ordinary buildings
        "siteClass": "D",        # stiff soil (conservative default)
        "title": "SiteSense",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(USGS_SEISMIC_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        output = data.get("response", {}).get("data", {})
        # USGS returns nested structure with "twoPctIn50Years" etc.
        # Use mapped design values
        mapped = output.get("mapped", {})
        design = output.get("design", {})

        ss = design.get("ss", mapped.get("ss", 0.05))
        s1 = design.get("s1", mapped.get("s1", 0.02))
        sds = design.get("sds", ss * 2/3)
        sd1 = design.get("sd1", s1 * 2/3)

        return {
            "ss": round(float(ss), 3),
            "s1": round(float(s1), 3),
            "sds": round(float(sds), 3),
            "sd1": round(float(sd1), 3),
        }

    except Exception:
        # Arizona defaults (low seismic)
        return _az_defaults(lat, lon)


def _az_defaults(lat: float, lon: float) -> dict:
    """Arizona-specific seismic defaults when API fails."""
    # White Mountains (east AZ) have higher seismicity
    if lon > -110.5 and lat > 33.5:
        return {"ss": 0.25, "s1": 0.09, "sds": 0.17, "sd1": 0.06}
    # Rest of AZ: very low seismic
    return {"ss": 0.06, "s1": 0.02, "sds": 0.04, "sd1": 0.01}


def _lookup_wind_speed(lat: float, lon: float) -> int:
    """Simplified ASCE 7-22 wind speed lookup by location."""
    # Houston / Gulf Coast: hurricane zone
    if 28 < lat < 31 and -96 < lon < -93:
        return 130
    # AZ high elevation (Flagstaff ~7,000 ft)
    if 34.5 < lat < 36 and -113 < lon < -110:
        return 100
    # AZ general
    if 31 < lat < 37 and -115 < lon < -109:
        return 90
    # Default continental US
    return 95
