# SiteSense — Setup & Run Guide

## Prerequisites
- **Node.js** v20+ (download from nodejs.org)
- **Python** 3.11+ (via uv: `uv python install 3.11`)

## Quick Start

### Backend
```bash
cd src/backend
cp .env.example .env
# Edit .env → add your ANTHROPIC_API_KEY

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd src/frontend
cp .env.local.example .env.local
# Edit .env.local → add your VITE_MAPBOX_TOKEN (from mapbox.com)

npm install
npm run dev
# Open http://localhost:5173
```

## How to Use
1. Open http://localhost:5173
2. Search for an address or navigate the satellite map to your lot
3. Click the **polygon tool** (top-left) and draw around the parcel
4. Fill in building type and click **Analyze Parcel**
5. Review the risk cards, elevation profile, cut/fill, and cost estimate
6. Click **Download PDF Report** to get the full report

## Demo Addresses (pre-tested)
| Address | What to show |
|---|---|
| 2323 W. Dunlap Ave, Phoenix AZ | Flat lot, expansive soil, low risk |
| 5402 Griggs Rd, Houston TX | Flood Zone AE, pile foundation |
| 4000 N. Fort Valley Rd, Flagstaff AZ | Steep slope, snow load |

## API Keys Needed
| Key | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `VITE_MAPBOX_TOKEN` | account.mapbox.com (free tier, 50K loads/mo) |

All GIS data (USGS, FEMA, USDA, USFWS) is free — no keys required.
