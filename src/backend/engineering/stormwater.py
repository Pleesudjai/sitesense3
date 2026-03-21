"""
Stormwater runoff estimation using the Rational Method.
Q = C × i × A (peak flow, cfs)
Rainfall intensity from NOAA Atlas 14 approximate lookup.
"""

# Runoff coefficient C by soil texture and slope
# Based on ASCE 7 / standard hydrology references
RUNOFF_COEFF = {
    # (soil_texture, slope_class): C value
    ("S", "flat"):    0.20, ("S", "moderate"): 0.25, ("S", "steep"): 0.30,
    ("SL", "flat"):   0.25, ("SL", "moderate"): 0.30, ("SL", "steep"): 0.35,
    ("L", "flat"):    0.30, ("L", "moderate"):  0.35, ("L", "steep"):  0.40,
    ("CL", "flat"):   0.40, ("CL", "moderate"): 0.45, ("CL", "steep"): 0.50,
    ("C", "flat"):    0.50, ("C", "moderate"):  0.55, ("C", "steep"):  0.60,
}

# NOAA Atlas 14 approximate 10-yr, 1-hr rainfall intensity by AZ region (in/hr)
# These are ROM values for demonstration
AZ_RAINFALL_INTENSITY = {
    "phoenix":   1.0,   # Phoenix metro (monsoon)
    "tucson":    1.2,   # Tucson (higher monsoon intensity)
    "flagstaff": 0.8,   # Higher elevation, lower intensity per hour
    "yuma":      0.5,   # Driest area in AZ
    "default":   1.0,
}


async def calculate_runoff(
    area_acres: float,
    slope_pct: float,
    soil_class: str,
) -> dict:
    """
    Calculate peak stormwater runoff using Rational Method.
    Returns peak flow (cfs) and detention volume estimate.
    """
    slope_class = _classify_slope(slope_pct)
    C = _get_runoff_coeff(soil_class, slope_class)

    # Default to 1.0 in/hr intensity (10-yr, 1-hr Phoenix area)
    i = 1.0  # in/hr — use NOAA Atlas 14 for real project

    Q_cfs = C * i * area_acres  # Rational method

    # Detention volume estimate if Q > threshold
    # Rough: store 24hr of peak flow excess
    # Standard: required detention = Q × 3600 × 24 × fraction / 7.48 gal/ft³
    detention_needed = Q_cfs > 2.0  # arbitrary threshold for small lots
    detention_volume_cf = Q_cfs * 3600 * 0.5 if detention_needed else 0

    return {
        "runoff_coeff": C,
        "rainfall_intensity_in_hr": i,
        "area_acres": area_acres,
        "peak_cfs": round(Q_cfs, 2),
        "detention_needed": detention_needed,
        "detention_volume_cf": round(detention_volume_cf),
        "detention_volume_cy": round(detention_volume_cf / 27),
        "note": (
            "10-yr storm Rational Method estimate. "
            "Detailed drainage study required per local municipality before permit."
        )
    }


def _classify_slope(slope_pct: float) -> str:
    if slope_pct < 5:
        return "flat"
    if slope_pct < 15:
        return "moderate"
    return "steep"


def _get_runoff_coeff(soil_class: str, slope_class: str) -> float:
    key = (soil_class, slope_class)
    if key in RUNOFF_COEFF:
        return RUNOFF_COEFF[key]
    # Default: loam, moderate slope
    return 0.35
