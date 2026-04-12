/**
 * Captures PNG screenshots for docs/user-guide.md.
 *
 * Prerequisites:
 *   1. Build the web UI: npm run build (from web/)
 *   2. Start DEBK so the API and embedded UI are available.
 *   3. Install browser: npx playwright install chromium
 *
 * Run (from web/):
 *   DEBK_BASE_URL=http://127.0.0.1:PORT npm run capture-user-guide-screens
 *
 * Or pass the base URL as the first argument.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../..');
const outDir = path.join(repoRoot, 'docs/images/user-guide');

function baseURL() {
  const u = process.env.DEBK_BASE_URL || process.argv[2];
  if (!u?.trim()) {
    console.error(`
Set DEBK_BASE_URL to the address DEBK printed when it started, for example:
  DEBK_BASE_URL=http://127.0.0.1:54321 npm run capture-user-guide-screens

Or pass it as the first argument:
  npm run capture-user-guide-screens -- http://127.0.0.1:54321
`);
    process.exit(1);
  }
  return u.replace(/\/$/, '');
}

async function main() {
  const base = baseURL();
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  async function goto(route) {
    const url = `${base}${route.startsWith('/') ? route : `/${route}`}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByText('DEBK — Double-entry bookkeeping', { exact: true }).waitFor({
      state: 'visible',
      timeout: 30000,
    });
    await page.waitForTimeout(800);
  }

  async function save(name, options = {}) {
    const p = path.join(outDir, name);
    await page.screenshot({ path: p, fullPage: options.fullPage ?? false });
    console.log('wrote', p);
  }

  try {
    await goto('/');
    await save('01-financial-pulse.png');

    await goto('/setup');
    await save('02-business-profile.png');

    await page.getByRole('tab', { name: 'Chart of accounts' }).click();
    await page.waitForTimeout(500);
    await save('03-chart-of-accounts.png');

    await goto('/periods');
    await save('04-periods-and-closing.png', { fullPage: true });

    await goto('/workbench');
    await save('05-journal-workbench.png', { fullPage: true });

    await goto('/journal');
    await save('06-journal-audit.png', { fullPage: true });

    await goto('/reports');
    await save('07-reports-trial-balance.png', { fullPage: true });
  } finally {
    await browser.close();
  }

  console.log('\nDone. Images are in docs/images/user-guide/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
