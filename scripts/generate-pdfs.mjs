/**
 * Generate PDF reports from dry-run JSON results using Playwright.
 * Opens the live site, navigates to each address, runs analysis, and downloads PDF.
 *
 * Usage: npx playwright test scripts/generate-pdfs.mjs
 * Or:    node scripts/generate-pdfs.mjs
 */
import { chromium } from 'playwright'
import path from 'path'

const SITE = 'https://musical-cuchufli-3cd9f8.netlify.app'
const OUT_DIR = 'C:/Users/chidc/Documents/GitHub/sitesense'

const LOCATIONS = [
  { name: 'CA', address: '200 N Spring St, Los Angeles, CA 90012', center: [-118.2432, 34.0527] },
  { name: 'AZ', address: '1900 E Apache Blvd, Tempe, AZ 85281', center: [-112.072, 33.4498] },
  { name: 'NY', address: '350 5th Ave, New York, NY 10118', center: [-73.9852, 40.7489] },
]

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 })

  for (const loc of LOCATIONS) {
    console.log(`\n=== ${loc.name}: ${loc.address} ===`)
    const context = await browser.newContext({ acceptDownloads: true })
    const page = await context.newPage()
    page.setDefaultTimeout(120000)

    try {
      // 1. Load site
      await page.goto(SITE, { waitUntil: 'networkidle' })
      await page.waitForTimeout(3000)

      // 2. Type address
      const searchInput = page.locator('input[placeholder*="Search"]')
      await searchInput.fill(loc.address)
      await page.waitForTimeout(500)

      // 3. Click search button
      await page.locator('button:has-text("🔍"), button[aria-label="Search"]').first().click().catch(() => {
        // Try pressing Enter instead
        return searchInput.press('Enter')
      })
      await page.waitForTimeout(3000)

      // 4. Draw a rectangle by clicking the draw button, then clicking on map
      // The draw tool should be available - click on the map to start drawing
      const drawBtn = page.locator('button.mapbox-gl-draw_polygon, button.mapbox-gl-draw_rect, [class*="draw"]').first()
      if (await drawBtn.isVisible().catch(() => false)) {
        await drawBtn.click()
        await page.waitForTimeout(500)
      }

      // Click 4 points on the map to draw a rectangle
      const mapContainer = page.locator('.maplibregl-canvas, .mapboxgl-canvas, [class*="map"]').first()
      const box = await mapContainer.boundingBox()
      if (box) {
        const cx = box.x + box.width / 2
        const cy = box.y + box.height / 2
        const offset = 60
        // Click 4 corners + close
        await page.mouse.click(cx - offset, cy - offset)
        await page.waitForTimeout(300)
        await page.mouse.click(cx + offset, cy - offset)
        await page.waitForTimeout(300)
        await page.mouse.click(cx + offset, cy + offset)
        await page.waitForTimeout(300)
        await page.mouse.click(cx - offset, cy + offset)
        await page.waitForTimeout(300)
        await page.mouse.click(cx - offset, cy - offset) // close polygon
        await page.waitForTimeout(1000)
      }

      // 5. Click Analyze Parcel
      const analyzeBtn = page.locator('button:has-text("Analyze Parcel")').first()
      await analyzeBtn.click()
      console.log('  Analyzing...')

      // 6. Wait for results (look for risk cards or verdict)
      await page.waitForSelector('[class*="verdict"], [class*="risk"], [class*="summary"]', { timeout: 45000 }).catch(() => {
        console.log('  Waiting longer for results...')
      })
      await page.waitForTimeout(5000)

      // 7. Click PDF Report button
      const pdfBtn = page.locator('button:has-text("PDF"), button:has-text("Download PDF")').first()

      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 60000 })
      await pdfBtn.click()
      console.log('  Generating PDF...')

      // 8. Wait for download
      const download = await downloadPromise
      const outPath = path.join(OUT_DIR, `SiteSense_Report_${loc.name}.pdf`)
      await download.saveAs(outPath)
      console.log(`  ✓ Saved: ${outPath}`)

    } catch (e) {
      console.error(`  ✗ Failed: ${e.message}`)
      // Save screenshot as fallback
      const ssPath = path.join(OUT_DIR, `SiteSense_Screenshot_${loc.name}.png`)
      await page.screenshot({ path: ssPath, fullPage: true })
      console.log(`  Screenshot saved: ${ssPath}`)
    }

    await context.close()
  }

  await browser.close()
  console.log('\nDone!')
}

run().catch(console.error)
