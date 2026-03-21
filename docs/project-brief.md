# Project Brief — HackASU 2025
# Choose ONE option to build. Update "Selected Project" when decided.

**Selected Project:** TBD

---

## Option 1: Heat-Resilient Pavement Selector
Build a tool that takes: site location, traffic level, orientation, material options, maintenance constraints → recommends pavement/surface-treatment choices with a heat/maintenance tradeoff report.

**MVP:** Web app + decision engine + map-based demo
**Data:** Phoenix Cool Pavement Program data, ADOT surface treatment catalog
**AI Role:** Scoring engine + generate tradeoff report

---

## Option 2: Foundation-Risk Scanner for Arizona Homes
Takes: soil/geology layer, irrigation-leak inputs, crack photos, structural observations → flags expansive-soil or moisture-related movement risk.

**MVP:** Form-based web app + risk score dashboard
**Data:** AZGS expansive soil maps
**AI Role:** Analyze inputs, classify risk, generate inspection checklist

---

## Option 3: Earth-Fissure and Subsidence Risk Map
Overlays known fissure zones with roads, canals, utilities, parcels → generates screening memo and inspection priority ranking.

**MVP:** Map-first web app (Leaflet) + risk overlay + memo generator
**Data:** AZGS fissure zone GeoJSON, ADOT road network
**AI Role:** Generate screening memos and priority justification

---

## Option 4: Monsoon Flood + Roadway-Failure Hotspot Predictor
Ingests rainfall/drainage data → flags likely street-flooding or culvert/roadway distress hotspots for public works.

**MVP:** Map dashboard + risk hotspot layer + alert system
**Data:** Maricopa County ALERT network (430+ stations), Phoenix floodplain data
**AI Role:** Interpret rainfall patterns, predict failure points

---

## Option 5: Water-Leak to Structural-Risk Triage
Takes: leak report, location, soil type, structure type, duration → ranks risk of slab movement, subgrade softening, erosion.

**MVP:** Triage form + risk ranking output + report generator
**Data:** Phoenix/Tempe public leak reports, AZGS soil maps
**AI Role:** Risk classification + generate triage report

---

## Option 6: Bridge and Pavement Rehab Copilot for Local Agencies
Converts inspection notes, photos, condition data → rehab options, urgency ranking, draft maintenance memos.

**MVP:** Upload interface + structured output + memo generator
**Data:** ADOT bridge inventory, standard inspection templates
**AI Role:** Parse inspection text, classify condition, suggest rehab treatments

---

## Option 7: Heat-Safe Construction Scheduling and Curing Assistant
Tells contractors when to pour, cure, inspect, or stage work under heat constraints, with worker exposure alerts.

**MVP:** Calendar/schedule interface + material-performance alerts
**Data:** NOAA historical Phoenix temperature data, ACI hot-weather concreting limits
**AI Role:** Optimization logic + alert generation + scheduling recommendations

---

## Option 8: Structural Materials Test Interpreter (SMC Labs Concept)
Upload beam test, stress-strain file, or spec sheet → extracts key points, classifies behavior, suggests constitutive model, drafts engineering interpretation.

**MVP:** File upload + structured analysis output + report generator
**Data:** User-uploaded test files (CSV, Excel)
**AI Role:** Full analysis — this is the most AI-heavy option
