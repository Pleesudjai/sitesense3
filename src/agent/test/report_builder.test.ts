import { reportBuilder } from '../src/mcp/report_builder.js';

// Synthetic input modeled on the actual 4-tool agent output for APN 13209099.
const result = await reportBuilder({
  apn: '13209099',
  address: '1435 N DORSEY LN, TEMPE, AZ 85288',
  verdict: 'not_recommended',
  verdict_one_liner:
    'Lot is 58% below the R1-4 minimum and PUC 8530 suggests a non-buildable common-element parcel — independent development is unlikely without a variance and clarification of the use code.',
  sections: [
    {
      heading: 'Parcel Summary',
      body_md:
        '- **Lot size:** 1,681 sf (0.039 ac)\n- **Owner:** GERING DENISE Y / BRADFORD J / DOUGLAS CHAMPIE\n- **Use code (PUC):** 8530 — likely common-element / HOA / auxiliary parcel; **verify with Maricopa County Assessor**\n- **Boundary:** irregular (L-shaped)',
    },
    {
      heading: 'Zoning Envelope',
      body_md:
        '- **District:** R1-4 — Single-Family Residential, 4,000 sf min lot (City of Tempe)\n- **Setbacks:** 15 ft front, 5 ft side, 20 ft rear\n- **Max height:** 30 ft\n- **Max density:** 10 du/ac\n- **Confidence:** medium — verify against current Tempe ZDC Part 4-2',
    },
    {
      heading: 'Constraints',
      body_md:
        '- **Flood:** FEMA Zone X (shaded) — moderate risk, between 100-yr and 500-yr floodplains. Not SFHA, no BFE. Voluntary flood insurance advisable.\n- **Slope:** USGS EPQS could not resolve at parcel scale (sub-DEM-resolution lot). Tempe is flat valley floor; Hillside Overlay unlikely but unconfirmed.\n- **Easements / deed restrictions:** not in available tools — title search required.',
    },
    {
      heading: 'Buildable Area',
      body_md:
        'Approximate envelope using boundary extremes (~65 ft wide × ~38 ft deep) and R1-4 setbacks (15 ft front, 5 ft side, 20 ft rear):\n\n`(65 − 2×5) × (38 − 15 − 20) = 55 × 3 = ~165 sf`\n\n**Effectively unbuildable.** Only ~3 ft of unencumbered depth between front and rear setbacks.',
    },
    {
      heading: 'Red Flags',
      body_md:
        '- **CRITICAL:** Lot is 1,681 sf vs 4,000 sf R1-4 minimum (2,319 sf deficit, 58% below). Variance required.\n- **CRITICAL:** Setbacks consume nearly all available depth — habitable structure will not fit.\n- **HIGH:** PUC 8530 may indicate common-element / HOA-owned land — could be legally non-buildable regardless of zoning.\n- **MODERATE:** Zone X (shaded) — moderate flood risk.\n- **MODERATE:** Three owners on title — all must consent to any development action.\n- **LOW:** No easement or deed restriction data — title search required.',
    },
    {
      heading: 'Recommendation',
      body_md:
        'Do not commit capital to this parcel without first: (1) confirming the parcel\'s legal buildability with the City of Tempe Planning Division and the Maricopa County Assessor, (2) obtaining a full title report including any HOA declarations or CC&Rs, and (3) reviewing the subdivision plat. Most likely outcome: this parcel is not independently developable.\n\nNext steps:\n- Tempe Planning & Zoning: (480) 350-4311\n- Maricopa County Assessor: clarify PUC 8530 classification\n- Order preliminary title report\n- Order ALTA survey if proceeding past initial diligence',
    },
  ],
  citations: [
    {
      claim: 'Lot size, owner, address, PUC, boundary',
      source: 'Maricopa County Assessor GIS',
      url: 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query',
    },
    {
      claim: 'FEMA Zone X (shaded), moderate risk, not SFHA',
      source: 'FEMA National Flood Hazard Layer (NFHL), layer 28',
      url: 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query',
    },
    {
      claim: 'Tempe R1-4 zoning + dimensional standards',
      source: 'City of Tempe Zoning Districts (TempeData AGOL) + Tempe ZDC Part 4-2',
      url: 'https://services.arcgis.com/lQySeXwbBg53XWDi/arcgis/rest/services/zoning_districts/FeatureServer/1/query',
    },
    {
      claim: 'Slope data unavailable at parcel scale',
      source: 'USGS 3DEP via EPQS',
      url: 'https://epqs.nationalmap.gov/v1/json',
    },
  ],
});

console.log(JSON.stringify(result, null, 2));
console.log(`\nOpen this in your browser to preview:`);
console.log(`  ${result.html_path}`);
