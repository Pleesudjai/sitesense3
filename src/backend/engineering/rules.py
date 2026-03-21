"""
Civil engineering rule engine.
Code basis:
  - ACI 350-20 / 350R-20: Environmental engineering concrete structures
  - ACI 360R-10: Slab-on-ground design and construction
  - ASCE 7-22: Wind (Ch.26-27), seismic (Ch.12), flood (Ch.5), snow (Ch.7)
  - IBC 2021: Soils §1803, flood §1612
  - CWA §404: Wetlands jurisdiction
"""


def get_seismic_design_category(sds: float, sd1: float, building_type: str = "single_family") -> str:
    """
    Determine Seismic Design Category (SDC) per ASCE 7-22 Table 11.6-1 / 11.6-2.
    Risk Category II (residential / ordinary).
    """
    # ASCE 7-22 Table 11.6-1 — SDC based on SDS
    if sds < 0.167:
        sdc_by_sds = "A"
    elif sds < 0.33:
        sdc_by_sds = "B"
    elif sds < 0.50:
        sdc_by_sds = "C"
    else:
        sdc_by_sds = "D"

    # ASCE 7-22 Table 11.6-2 — SDC based on SD1
    if sd1 < 0.067:
        sdc_by_sd1 = "A"
    elif sd1 < 0.133:
        sdc_by_sd1 = "B"
    elif sd1 < 0.20:
        sdc_by_sd1 = "C"
    else:
        sdc_by_sd1 = "D"

    # Use the more severe category
    order = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5}
    if order.get(sdc_by_sd1, 0) > order.get(sdc_by_sds, 0):
        return sdc_by_sd1
    return sdc_by_sds


def recommend_foundation(
    flood_zone: str,
    slope_pct: float,
    soil_class: str,
    shrink_swell: str,
    seismic_sdc: str,
    caliche_present: bool,
) -> tuple[str, str]:
    """
    Recommend foundation type based on site conditions.
    Returns (foundation_type, code_reference_string).

    Priority order (most restrictive first):
    1. Flood zone AE/VE → pile/elevated (ASCE 7-22 Ch.5)
    2. Slope > 30% → drilled caisson (ACI 350-20 §4.3)
    3. Seismic SDC D/E/F → deep pile with seismic detailing (ASCE 7-22 Ch.12)
    4. Expansive clay (shrink-swell High) → post-tensioned slab (ACI 360R-10 §5.4)
    5. Caliche hardpan → grade beams on piers (ACI 360R-10 §4.2)
    6. Soft/saturated soil → mat foundation (ACI 350-20)
    7. Default → conventional slab-on-ground (ACI 360R-10)
    """
    if flood_zone in {"AE", "VE", "AO", "AH"}:
        return (
            "ELEVATED_PILE",
            "ASCE 7-22 Ch.5 §5.3 — Elevated or pile foundation required in Special Flood Hazard Area (Zone "
            + flood_zone + "). Structure must be elevated above Base Flood Elevation."
        )

    if slope_pct > 30:
        return (
            "DRILLED_CAISSON",
            "ACI 350-20 §4.3 + IBC 2021 §1807 — Drilled caisson or pier foundation required for "
            "slope > 30%. Bearing strata must be verified below slip plane."
        )

    if seismic_sdc in {"D", "E", "F"}:
        return (
            "DEEP_PILE_SEISMIC",
            "ASCE 7-22 Ch.12 §12.13 — Deep pile foundation with seismic detailing required for "
            f"Seismic Design Category {seismic_sdc}. Ductile connections and overstrength factor apply."
        )

    if shrink_swell == "High" or soil_class in {"C", "CL", "SiC", "CH", "OH", "MH"}:
        return (
            "POST_TENSIONED_SLAB",
            "ACI 360R-10 §5.4 — Post-tensioned slab-on-ground recommended for expansive / "
            "high-shrink-swell soils. Prestress level per PTI DC10.5-12. "
            "Vapor barrier required. Soil treatment may also be specified."
        )

    if caliche_present:
        return (
            "GRADE_BEAM_ON_PIERS",
            "ACI 360R-10 §4.2 + IBC 2021 §1803 — Grade beams on drilled piers recommended to bypass "
            "caliche hardpan layer. Pier depth below caliche; bearing verified by geotechnical engineer. "
            "Caliche layer may also be scarified if < 18\" depth."
        )

    if soil_class in {"OH", "OL", "Pt"} or "poor" in shrink_swell.lower():
        return (
            "MAT_FOUNDATION",
            "ACI 350-20 §4.5 — Mat (raft) foundation for soft, organic, or saturated soils. "
            "Provides uniform load distribution. Settlement analysis required."
        )

    return (
        "CONVENTIONAL_SLAB",
        "ACI 360R-10 — Conventional slab-on-ground feasible for site conditions. "
        "Design per ACI 360R-10: subgrade modulus k, slab thickness, joint spacing, "
        "vapor barrier. Compacted fill to 95% standard Proctor before placement."
    )


# Human-readable labels for UI display
FOUNDATION_LABELS = {
    "ELEVATED_PILE": "Elevated / Pile Foundation",
    "DRILLED_CAISSON": "Drilled Caisson / Pier",
    "DEEP_PILE_SEISMIC": "Deep Pile (Seismic)",
    "POST_TENSIONED_SLAB": "Post-Tensioned Slab-on-Ground",
    "GRADE_BEAM_ON_PIERS": "Grade Beams on Piers",
    "MAT_FOUNDATION": "Mat / Raft Foundation",
    "CONVENTIONAL_SLAB": "Conventional Slab-on-Ground",
}
