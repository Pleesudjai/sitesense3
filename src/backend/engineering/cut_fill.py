"""
Cut & Fill volume calculation using the Grid Prismatic Method.
Also calculates slope statistics from the elevation grid.
Code basis: Standard earthwork engineering, ACI 360R-10 for subgrade.
"""

import numpy as np


def calculate_slope(elevation_grid: list, cell_width_ft: float) -> dict:
    """
    Calculate slope statistics from elevation grid using numpy gradient.
    Returns average slope, max slope, and slope grid (for visualization).
    """
    grid = np.array(elevation_grid)

    # Gradient in x and y directions (rise over run)
    dz_dy, dz_dx = np.gradient(grid, cell_width_ft)
    slope_fraction = np.sqrt(dz_dx**2 + dz_dy**2)
    slope_pct = slope_fraction * 100

    # Steep fraction = cells with slope > 30% (ACI 318 threshold)
    steep_mask = slope_pct > 30
    steep_fraction_pct = float(np.mean(steep_mask) * 100)

    return {
        "avg_slope_pct": round(float(np.mean(slope_pct)), 2),
        "max_slope_pct": round(float(np.max(slope_pct)), 2),
        "min_slope_pct": round(float(np.min(slope_pct)), 2),
        "steep_fraction_pct": round(steep_fraction_pct, 1),
        "slope_grid": slope_pct.tolist(),  # send to frontend for heatmap
    }


def calculate_cut_fill(
    elevation_grid: list,
    target_grade: float,
    cell_width_ft: float
) -> dict:
    """
    Grid Prismatic Method for cut and fill volumes.

    For each grid cell:
      - Cut: existing elevation ABOVE target grade (earth removed)
      - Fill: existing elevation BELOW target grade (earth added)

    target_grade: desired finished grade elevation (ft)
                  defaults to average existing elevation (balanced cut/fill)
    cell_width_ft: width of each grid cell in feet

    Returns volumes in cubic yards (CY).
    """
    grid = np.array(elevation_grid)
    cell_area_ft2 = cell_width_ft ** 2

    cut_depth_grid = np.maximum(grid - target_grade, 0)  # ft depth to cut
    fill_depth_grid = np.maximum(target_grade - grid, 0)  # ft depth to fill

    # Volume: depth × area; convert ft³ → CY (1 CY = 27 ft³)
    cut_vol_cy = float(np.sum(cut_depth_grid) * cell_area_ft2 / 27)
    fill_vol_cy = float(np.sum(fill_depth_grid) * cell_area_ft2 / 27)
    net_cy = cut_vol_cy - fill_vol_cy  # positive = export excess, negative = import needed

    return {
        "target_grade_ft": round(target_grade, 1),
        "cut_cy": round(cut_vol_cy),
        "fill_cy": round(fill_vol_cy),
        "net_cy": round(net_cy),
        "net_direction": "export" if net_cy > 0 else "import",
        "cut_grid": cut_depth_grid.tolist(),   # for frontend color overlay
        "fill_grid": fill_depth_grid.tolist(),  # for frontend color overlay
        "cut_description": f"{round(cut_vol_cy):,} CY of earth to be removed",
        "fill_description": f"{round(fill_vol_cy):,} CY of fill material needed",
        "net_description": (
            f"{abs(round(net_cy)):,} CY net {'export (surplus)' if net_cy > 0 else 'import (deficit)'}"
        ),
    }
