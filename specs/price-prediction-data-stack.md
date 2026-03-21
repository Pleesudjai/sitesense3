# Feature Spec: Price Prediction Data Stack
Date: 2026-03-21
Layer: backend-module + netlify-function + frontend

## What We're Building
Build a government-data-driven price prediction and cost escalation layer for SiteSense.

This feature should support:

- rough house construction cost prediction
- house price and cost trend updates
- inflation-aware cost escalation
- location-aware price adjustment
- forecast-ready indicators for future estimate ranges

This is not a replacement for contractor bids, lender appraisals, or final cost engineering.
It is a data-driven forecasting layer for concept estimates and decision support.

## Core Approach

Do not use one inflation number by itself.

Use a layered forecasting model:

1. `Macro inflation anchor`
2. `Construction-cost inflation`
3. `Construction labor inflation`
4. `Housing market price trend`
5. `Local cost-level adjustment`
6. `Supply / demand activity indicators`

This is the recommended government-data-first approach.

## Recommended Indicator Stack

### 1. Macro inflation anchor

Use:

- `BEA PCE`
- `BEA Core PCE`

Why:

- this is the main inflation measure the Federal Reserve uses for its 2 percent target
- it gives the macro inflation regime for forecast baselines

Role in model:

- macro prior for general inflation path
- default inflation assumption when construction-specific signals are thin

### 2. Construction-cost inflation

Use:

- `BLS input price indexes for residential construction industries`

Important note:

- BLS explicitly says output PPIs for residential construction are not calculated
- BLS says input price indexes are the right substitute and are ideal for contract price adjustment when paired with wage data

Role in model:

- main driver for construction-material and input escalation
- better than CPI for construction estimate updates

### 3. Construction labor inflation

Use:

- `BLS Employment Cost Index`
- optional supporting wage series from `BLS OEWS`

Why:

- labor pressure matters separately from material/input inflation
- ECI is a cleaner wage/benefit inflation signal than a raw local wage lookup alone

Role in model:

- labor escalation factor
- supports regional labor sensitivity assumptions

### 4. Housing market price trend

Use:

- `FHFA House Price Index`

Why:

- strong government repeat-sales indicator for house-price appreciation
- useful for local market trend and demand-side adjustment

Role in model:

- price trend and market sentiment adjustment
- not a direct replacement for construction cost, but important for sale price expectation

### 5. House-type pricing benchmark

Use:

- `Census Characteristics of New Housing (CHARS)`

Why:

- this is the best government benchmark for house attributes and contract price per square foot
- includes bedrooms, bathrooms, floors/stories, framing, foundation, wall material, contract price, and contract price per square foot

Role in model:

- benchmark base price by home type
- calibration target for generated house concepts

### 6. Local cost-level adjustment

Use:

- `BEA Regional Price Parities (RPP)`

Why:

- gives state and metro cost-level differences
- better than a flat regional multiplier guess

Role in model:

- localize the benchmark estimate
- convert national base assumptions into metro/state-adjusted costs

### 7. Supply / demand activity indicators

Use:

- `Census New Residential Construction`
- `Census New Residential Sales`
- `Freddie Mac mortgage rate survey`

Why:

- these show whether the market is tightening or cooling
- starts, permits, completions, inventory, and rates help explain price pressure and forecast direction

Role in model:

- cyclical housing adjustment
- optional short-term forecast feature set

### 8. Forecast prior

Use:

- `Philadelphia Fed Survey of Professional Forecasters`
- optional `Federal Reserve Summary of Economic Projections`

Why:

- useful as an official-style forward inflation prior
- helps create forward estimate bands instead of flat extrapolation

Role in model:

- forward-looking inflation path for 1-year, 2-year, and 5-year scenarios

## Source of Truth Policy

### Primary sources

Use official agency sources first:

- `BEA`
- `BLS`
- `Census`
- `FHFA`
- `Freddie Mac`
- `Philadelphia Fed`

### Convenience layer

Use `FRED` only as a convenience integration layer when it reduces implementation effort.

Rules:

- do not treat FRED as the primary authority when the agency source is available
- preserve original source attribution
- comply with FRED attribution requirements

## Model Design

### Conceptual formula

`predicted_cost = base_house_cost * local_cost_factor * construction_inflation_factor * labor_factor * housing_cycle_factor * quality_factor`

Where:

- `base_house_cost` comes from Census CHARS benchmarking by home type
- `local_cost_factor` comes from BEA RPP
- `construction_inflation_factor` comes from BLS residential construction input indexes
- `labor_factor` comes from ECI and optional local wage data
- `housing_cycle_factor` comes from FHFA HPI, mortgage rates, permits, starts, and sales
- `quality_factor` comes from product-level estimate assumptions

### Suggested forecast path

1. Build a `current-cost estimate`
2. Build a `1-year forecast`
3. Build a `2-year forecast`
4. Build a `5-year scenario range`

### Suggested bands

Return:

- low
- expected
- high

The forecast band should widen as the forecast horizon gets longer.

## Minimal MVP

For the first working version, implement:

1. `CHARS` benchmark base price
2. `BEA RPP` local multiplier
3. `BLS residential construction input index` escalation
4. `BLS ECI` labor escalation
5. `FHFA HPI` market trend adjustment

This is enough for a meaningful first prediction model.

## Phase 2 Additions

Add later:

- Census permits / starts / completions
- Census new home sales
- Freddie Mac mortgage rates
- SPF forecast prior
- more granular metro calibration

## Recommended Runtime Design

### New backend modules

- `src/backend/forecast/indicators.py`
  - fetch and normalize BEA, BLS, Census, FHFA, and related indicators
- `src/backend/forecast/inflation.py`
  - compute macro and construction inflation factors
- `src/backend/forecast/housing_market.py`
  - compute housing-cycle and demand-side adjustments
- `src/backend/forecast/localization.py`
  - apply BEA RPP and regional multipliers
- `src/backend/forecast/price_model.py`
  - combine all features into current and future estimate outputs
- `src/backend/forecast/benchmarks.py`
  - map concept home attributes to CHARS-style benchmark groups

### New endpoint

- `netlify/functions/price_predict.py`
  - POST endpoint for cost and price prediction

### Frontend additions

- `src/frontend/src/api.js`
  - add `predictPrice()`
- `src/frontend/src/components/PriceForecastCard.jsx`
  - show current, 1-year, 2-year, and 5-year estimate ranges
- `src/frontend/src/components/IndicatorBreakdown.jsx`
  - show which indicators are driving the estimate

## Files to Create or Edit

- `specs/price-prediction-data-stack.md` - this spec
- `src/backend/forecast/__init__.py` - new package
- `src/backend/forecast/indicators.py` - indicator fetch/normalize
- `src/backend/forecast/inflation.py` - inflation factor logic
- `src/backend/forecast/housing_market.py` - housing-cycle logic
- `src/backend/forecast/localization.py` - local cost adjustment
- `src/backend/forecast/price_model.py` - prediction model
- `src/backend/forecast/benchmarks.py` - CHARS benchmark mapping
- `netlify/functions/price_predict.py` - price prediction endpoint
- `src/frontend/src/api.js` - add endpoint helper
- `src/frontend/src/components/PriceForecastCard.jsx` - forecast output
- `src/frontend/src/components/IndicatorBreakdown.jsx` - explain forecast drivers

## Implementation Steps

1. [ ] Build a source registry for BEA, BLS, Census, FHFA, and Freddie Mac inputs
2. [ ] Implement CHARS benchmark extraction and house-type mapping
3. [ ] Implement BEA RPP localization logic
4. [ ] Implement BLS construction input index escalation logic
5. [ ] Implement BLS ECI labor inflation logic
6. [ ] Implement FHFA HPI trend adjustment
7. [ ] Build price model returning current / 1-year / 2-year / 5-year ranges
8. [ ] Build `price_predict.py` endpoint
9. [ ] Add frontend forecast card and indicator breakdown
10. [ ] Validate outputs on at least one Arizona example and one non-Arizona example

## Demo Test

### Example 1
- House type: `2 bed / 2 bath / 2 storey`
- Area: `1,500 sf`
- Quality: `standard`
- Location: `Tempe, AZ`

Expected behavior:

- returns current estimate band
- returns 1-year, 2-year, and 5-year ranges
- shows indicator breakdown
- explains that construction inflation and local adjustment are separate from macro inflation

### Example 2
- House type: `3 bed / 2 bath / 1 storey`
- Area: `1,800 sf`
- Quality: `standard`
- Location: `Houston, TX`

Expected behavior:

- returns a meaningfully different range from Arizona
- reflects local cost and market conditions

## Out of Scope

- exact contractor bid pricing
- parcel-specific sitework pricing without site analysis
- instant lender-grade appraisal
- private-source replacement for RSMeans or Marshall & Swift
- exact permitting and impact-fee modeling for every city

## Success Criteria

- The model uses official government indicators instead of a single hardcoded inflation number
- The output clearly separates macro inflation from construction inflation
- The forecast is localized using government cost-level data
- The system can explain which indicators are driving the estimate
- The result is useful for concept estimating and future-cost scenarios
