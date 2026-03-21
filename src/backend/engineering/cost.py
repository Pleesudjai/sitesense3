"""
ROM (Rough Order of Magnitude) cost estimation.
Based on RSMeans regional unit costs and ENR Construction Cost Index.
10-year projection at 4.5% annual inflation (ENR CCI 2015-2024 historical avg).
"""

# Arizona regional cost multipliers (relative to national baseline)
AZ_REGION_MULTIPLIERS = {
    "phoenix":   0.95,  # Maricopa County
    "tucson":    0.88,  # Pima County
    "flagstaff": 1.05,  # Coconino County (remote + elevation)
    "prescott":  0.98,  # Yavapai County
    "yuma":      0.82,  # Yuma County (remote)
    "scottsdale":0.97,
    "default":   0.95,
}

# Foundation unit costs ($/SF of buildable area)
FOUNDATION_COSTS_PER_SF = {
    "ELEVATED_PILE":       {"low": 35, "high": 65},
    "DRILLED_CAISSON":     {"low": 25, "high": 45},
    "DEEP_PILE_SEISMIC":   {"low": 40, "high": 70},
    "POST_TENSIONED_SLAB": {"low": 14, "high": 22},
    "GRADE_BEAM_ON_PIERS": {"low": 18, "high": 30},
    "MAT_FOUNDATION":      {"low": 20, "high": 35},
    "CONVENTIONAL_SLAB":   {"low": 8,  "high": 15},
}

INFLATION_RATE = 0.045  # ENR CCI 2015-2024 historical average


def estimate_cost(
    cut_cy: float,
    fill_cy: float,
    foundation_type: str,
    buildable_sf: float,
    lat: float,
    lon: float,
    load_multiplier: float = 1.0,
) -> dict:
    """
    Generate ROM cost estimate for site prep + foundation.
    Returns itemized breakdown and 10-year projection.
    """
    region = _identify_region(lat, lon)
    mult = AZ_REGION_MULTIPLIERS.get(region, AZ_REGION_MULTIPLIERS["default"])

    # Apply structural load cost multiplier (wind/seismic uplift)
    effective_mult = mult * load_multiplier

    # Earthwork
    cut_cost = cut_cy * 22 * mult       # $22/CY avg excavation + haul
    fill_cost = fill_cy * 26 * mult     # $26/CY avg import + compact

    # Foundation (use midpoint of range)
    fnd_rates = FOUNDATION_COSTS_PER_SF.get(
        foundation_type, FOUNDATION_COSTS_PER_SF["CONVENTIONAL_SLAB"]
    )
    fnd_rate_avg = (fnd_rates["low"] + fnd_rates["high"]) / 2
    foundation_cost = buildable_sf * fnd_rate_avg * effective_mult

    # Rough grading
    grading_cost = buildable_sf * 3.5 * mult

    # Site utilities (rough hookup estimate)
    utilities_cost = 27000 * mult

    breakdown = {
        "earthwork_cut":  round(cut_cost),
        "earthwork_fill": round(fill_cost),
        "foundation":     round(foundation_cost),
        "rough_grading":  round(grading_cost),
        "site_utilities": round(utilities_cost),
    }

    total_now = sum(breakdown.values())
    low_total = round(total_now * 0.80)   # -20% low bound
    high_total = round(total_now * 1.30)  # +30% high bound

    # 10-year projection with compound inflation
    projections = {
        yr: round(total_now * (1 + INFLATION_RATE) ** yr)
        for yr in [0, 2, 5, 10]
    }

    inflation_message = (
        f"Building now: ~${total_now:,.0f}. "
        f"Waiting 5 years: ~${projections[5]:,.0f} "
        f"(+{round((projections[5]/total_now - 1)*100)}%). "
        f"Waiting 10 years: ~${projections[10]:,.0f} "
        f"(+{round((projections[10]/total_now - 1)*100)}%). "
        f"Construction costs in this region have risen ~4.5%/year historically. "
        f"Early site acquisition and grading typically saves money."
    )

    return {
        "region": region,
        "regional_multiplier": mult,
        "breakdown": breakdown,
        "total_now": total_now,
        "low_estimate": low_total,
        "high_estimate": high_total,
        "projections": projections,
        "inflation_message": inflation_message,
        "foundation_rate_psf": round(fnd_rate_avg * effective_mult, 2),
        "note": "ROM estimate ±30%. For preliminary planning only. Not a construction bid.",
    }


def _identify_region(lat: float, lon: float) -> str:
    """Map lat/lon to AZ region for cost multiplier lookup."""
    if 33.2 < lat < 34.0 and -113.0 < lon < -111.5:
        return "phoenix"
    if 33.2 < lat < 34.0 and -112.2 < lon < -111.5:
        return "scottsdale"
    if 31.7 < lat < 32.5 and -111.3 < lon < -110.5:
        return "tucson"
    if 35.0 < lat < 35.5 and -111.8 < lon < -111.3:
        return "flagstaff"
    if 34.4 < lat < 34.7 and -113.0 < lon < -112.2:
        return "prescott"
    if 32.5 < lat < 33.0 and -115.0 < lon < -114.0:
        return "yuma"
    return "default"
