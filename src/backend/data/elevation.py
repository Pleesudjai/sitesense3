"""
Elevation data from USGS 3DEP Point Query Service.
Builds a 20x20 grid over the polygon + 100m buffer.
Free API, no auth required.
"""

import asyncio
import numpy as np
import httpx
from shapely.geometry import shape


USGS_EPQS_URL = "https://epqs.nationalmap.gov/v1/json"


async def query_single_elevation(client: httpx.AsyncClient, lon: float, lat: float) -> float:
    """Query USGS for a single elevation point. Returns feet."""
    try:
        resp = await client.get(
            USGS_EPQS_URL,
            params={"x": lon, "y": lat, "units": "Feet", "includeDate": "false"},
            timeout=10.0
        )
        resp.raise_for_status()
        val = resp.json().get("value", -999)
        return float(val) if val is not None and float(val) > -900 else None
    except Exception:
        return None


async def get_elevation_grid(polygon_geojson: dict, buffer_m: float = 100, grid_size: int = 20) -> dict:
    """
    Fetch a grid_size x grid_size elevation grid for the polygon + buffer.
    Returns grid array, bbox, stats, and cell dimensions.
    """
    geom = shape(polygon_geojson)
    area_m2 = geom.area if geom.geom_type == "Polygon" else 1000.0

    # Convert area to approximate acres
    # In geographic coords, rough conversion near AZ (~33° lat)
    # 1 degree lat ≈ 111,000m, 1 degree lon ≈ 91,000m at 33°N
    area_acres = area_m2 * 1.0  # placeholder - turf area in m² is accurate
    # Use shapely bounds (degrees) and approximate
    bounds = geom.bounds  # (minx, miny, maxx, maxy) in degrees

    # Buffer in degrees (~100m ≈ 0.0009 degrees)
    buffer_deg = buffer_m / 111000
    minx = bounds[0] - buffer_deg
    miny = bounds[1] - buffer_deg
    maxx = bounds[2] + buffer_deg
    maxy = bounds[3] + buffer_deg

    # Center point
    center_lon = (minx + maxx) / 2
    center_lat = (miny + maxy) / 2

    # Calculate approximate area in acres
    width_m = (maxx - minx) * 91000  # deg to meters at 33°N
    height_m = (maxy - miny) * 111000
    parcel_width_m = (bounds[2] - bounds[0]) * 91000
    parcel_height_m = (bounds[3] - bounds[1]) * 111000
    area_acres = (parcel_width_m * parcel_height_m) / 4047  # m² to acres

    # Cell width for the grid
    cell_width_m = width_m / grid_size
    cell_width_ft = cell_width_m * 3.281

    lons = np.linspace(minx, maxx, grid_size)
    lats = np.linspace(miny, maxy, grid_size)

    # Async parallel queries
    async with httpx.AsyncClient() as client:
        tasks = [
            query_single_elevation(client, float(lon), float(lat))
            for lat in lats
            for lon in lons
        ]
        results = await asyncio.gather(*tasks)

    # Fill None values with median (simple interpolation for hackathon)
    elevs = [r if r is not None else None for r in results]
    valid = [e for e in elevs if e is not None]
    median_elev = float(np.median(valid)) if valid else 1000.0
    elevs = [e if e is not None else median_elev for e in elevs]

    grid = np.array(elevs).reshape(grid_size, grid_size)

    return {
        "grid": grid.tolist(),
        "bbox": [minx, miny, maxx, maxy],
        "center_lat": center_lat,
        "center_lon": center_lon,
        "area_acres": round(max(area_acres, 0.01), 4),
        "min_ft": round(float(np.min(grid)), 1),
        "max_ft": round(float(np.max(grid)), 1),
        "avg_elevation_ft": round(float(np.mean(grid)), 1),
        "relief_ft": round(float(np.max(grid) - np.min(grid)), 1),
        "cell_width_ft": round(cell_width_ft, 1),
        "grid_size": grid_size,
    }
