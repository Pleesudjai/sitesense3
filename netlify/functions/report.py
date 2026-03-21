"""
Netlify Function: /api/report
Handles POST requests to generate and return a PDF report as base64.
"""

import json
import os
import sys
import asyncio
import base64

# Bundle src/backend into the Lambda path
_here = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.normpath(os.path.join(_here, "../../src/backend"))
if _backend not in sys.path:
    sys.path.insert(0, _backend)

# Re-use the full analysis logic from analyze.py
sys.path.insert(0, _here)
from analyze import _run_analysis
from report.pdf_report import generate_pdf_bytes


def _cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    }


async def _run_report(body: dict) -> bytes:
    """Run analysis then generate PDF bytes."""
    result = await _run_analysis(body)
    data = result["data"]
    return generate_pdf_bytes(data["summary"], data["report_text"])


def handler(event, context):
    """Netlify Function entry point — returns PDF as base64."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": _cors_headers(), "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
        pdf_bytes = asyncio.run(_run_report(body))
        return {
            "statusCode": 200,
            "headers": {
                **_cors_headers(),
                "Content-Type": "application/pdf",
                "Content-Disposition": "attachment; filename=SiteSense_Feasibility_Report.pdf",
            },
            "body": base64.b64encode(pdf_bytes).decode("utf-8"),
            "isBase64Encoded": True,
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {**_cors_headers(), "Content-Type": "application/json"},
            "body": json.dumps({"status": "error", "message": str(e)}),
        }
