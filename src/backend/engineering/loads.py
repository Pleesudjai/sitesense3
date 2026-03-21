"""
Structural load estimation for preliminary cost context.
NOT structural design — produces cost multipliers for budget estimates.

Code basis:
  - ASCE 7-22 Ch.26-27 (wind)
  - ASCE 7-22 Ch.12 (seismic)
  - ASCE 7-22 Ch.7 Fig.7.2-1 (snow)
"""


# Snow load lookup table (ground snow load Pg, psf) by elevation zone in AZ
AZ_SNOW_LOAD_BY_ELEVATION = [
    (4000, 0),    # Below 4,000 ft: 0 psf (Phoenix, Tucson)
    (5000, 10),   # 4,000–5,000 ft: 10 psf
    (6000, 20),   # 5,000–6,000 ft: 20 psf (Prescott area)
    (7000, 40),   # 6,000–7,000 ft: 40 psf (Flagstaff lower)
    (8000, 60),   # 7,000–8,000 ft: 60 psf (Flagstaff area)
    (99999, 80),  # Above 8,000 ft: 80 psf (White Mountains peaks)
]


def estimate_structural_loads(
    wind_mph: float,
    sds: float,
    sd1: float,
    sdc: str,
    elevation_ft: float = 1000,
) -> dict:
    """
    Estimate structural loads and derive cost multipliers.
    Returns wind pressure, seismic coefficient, snow load, and composite cost multiplier.
    """
    wind_pressure = _wind_velocity_pressure(wind_mph)
    seismic_cs = _seismic_response_coefficient(sds, sd1)
    snow_psf = _snow_load(elevation_ft)

    # Cost multipliers relative to baseline (SDC A, 90 mph wind, 0 snow)
    wind_mult = 1.0 + max(0, (wind_mph - 90)) * 0.002    # +0.2% per mph above 90
    seismic_mult = {"A": 1.00, "B": 1.02, "C": 1.05, "D": 1.12, "E": 1.18, "F": 1.25}.get(sdc, 1.0)
    snow_mult = 1.0 + (snow_psf / 100) * 0.05             # +5% per 100 psf snow

    composite_mult = round(wind_mult * seismic_mult * snow_mult, 3)

    return {
        "wind_pressure_psf": round(wind_pressure, 1),
        "wind_mph": wind_mph,
        "seismic_response_coefficient": round(seismic_cs, 4),
        "seismic_sdc": sdc,
        "snow_psf": round(snow_psf, 1),
        "cost_multiplier": composite_mult,
        "multiplier_breakdown": {
            "wind":    round(wind_mult, 3),
            "seismic": round(seismic_mult, 3),
            "snow":    round(snow_mult, 3),
        },
        "notes": _load_notes(wind_mph, sdc, snow_psf),
    }


def _wind_velocity_pressure(wind_mph: float) -> float:
    """ASCE 7-22 Eq.26.10-1: qz = 0.00256 × Kz × Kzt × Ke × V²"""
    Kz = 0.85    # Exposure B, height 15 ft (residential)
    Kzt = 1.0    # No topographic effects (conservative)
    Ke = 1.0     # Ground elevation factor
    return 0.00256 * Kz * Kzt * Ke * wind_mph**2


def _seismic_response_coefficient(sds: float, sd1: float) -> float:
    """
    ASCE 7-22 §12.8.1.1 — Simplified seismic response coefficient Cs.
    R = 6 (light frame wood or concrete shear wall, residential).
    Ie = 1.0 (Risk Category II).
    T = 0.2s (rough estimate for 1-2 story).
    """
    R = 6.0
    Ie = 1.0
    T = 0.2  # fundamental period estimate
    Cs = min(sds / (R / Ie), sd1 / (T * (R / Ie)))
    Cs = max(Cs, 0.044 * sds * Ie)  # minimum per ASCE 7-22 §12.8.1.1
    return Cs


def _snow_load(elevation_ft: float) -> float:
    """
    Approximate ground snow load (Pg) by elevation in Arizona.
    Uses lookup table based on ASCE 7-22 Fig.7.2-1 AZ values.
    """
    for threshold, pg in AZ_SNOW_LOAD_BY_ELEVATION:
        if elevation_ft <= threshold:
            return pg
    return 80.0  # max for very high elevations


def _load_notes(wind_mph: float, sdc: str, snow_psf: float) -> list:
    """Return notable flags for the report."""
    notes = []
    if wind_mph >= 115:
        notes.append(f"High wind area ({wind_mph} mph) — hurricane strapping may be required (ASCE 7-22 Ch.26).")
    if sdc in {"D", "E", "F"}:
        notes.append(f"Seismic Design Category {sdc} — seismic detailing required throughout structure (ASCE 7-22 Ch.12).")
    if snow_psf >= 30:
        notes.append(f"Significant snow load ({snow_psf} psf) — structural roof design required (ASCE 7-22 Ch.7).")
    if not notes:
        notes.append("Standard structural requirements — no unusual load conditions detected.")
    return notes
