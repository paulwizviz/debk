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
 * Authenticated screens need either:
 *   - Normal sign-in: DEBK_USER_GUIDE_LOGIN and DEBK_USER_GUIDE_PASSWORD, or
 *   - Empty operators DB (bootstrap): set DEBK_USER_GUIDE_BOOTSTRAP_LOGIN and
 *     DEBK_USER_GUIDE_BOOTSTRAP_PASSWORD so the script can submit "Create first administrator",
 *     then the same values are used where a password is required for subsequent API/browser state.
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

  async function save(name, options = {}) {
    const p = path.join(outDir, name);
    await page.screenshot({ path: p, fullPage: options.fullPage ?? false });
    console.log('wrote', p);
  }

  async function waitAppChrome() {
    await page.getByRole('button', { name: 'toggle theme' }).waitFor({
      state: 'visible',
      timeout: 30000,
    });
    await page.waitForTimeout(800);
  }

  async function gotoShell(route) {
    const url = `${base}${route.startsWith('/') ? route : `/${route}`}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitAppChrome();
  }

  async function gotoLogin() {
    const url = `${base}/login`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('heading', { name: /Sign in|Create first administrator/ }).waitFor({
      state: 'visible',
      timeout: 30000,
    });
    await page.waitForTimeout(500);
  }

  try {
    await gotoLogin();
    await save('onboarding-login.png');
    const bootstrapHeading = page.getByRole('heading', { name: 'Create first administrator' });
    const isBootstrap = await bootstrapHeading.isVisible().catch(() => false);

    if (isBootstrap) {
      const bLogin = process.env.DEBK_USER_GUIDE_BOOTSTRAP_LOGIN?.trim();
      const bPass = process.env.DEBK_USER_GUIDE_BOOTSTRAP_PASSWORD?.trim();
      if (!bLogin || !bPass) {
        console.error(`
Bootstrap mode (no operators yet). Wrote onboarding-login.png (Create first administrator).
To capture the rest of the guide, either:
  - Create the first administrator in the browser, then rerun with DEBK_USER_GUIDE_LOGIN and DEBK_USER_GUIDE_PASSWORD, or
  - Rerun with DEBK_USER_GUIDE_BOOTSTRAP_LOGIN and DEBK_USER_GUIDE_BOOTSTRAP_PASSWORD (and optional DEBK_USER_GUIDE_BOOTSTRAP_DISPLAY_NAME) so this script can submit the form.
`);
        process.exit(1);
      }
      const disp = process.env.DEBK_USER_GUIDE_BOOTSTRAP_DISPLAY_NAME?.trim() || bLogin;
      await page.getByLabel('Login').fill(bLogin);
      await page.getByLabel(/Display name \(optional\)/).fill(disp);
      await page.locator('input[name="password"]').fill(bPass);
      await page.getByRole('button', { name: 'Create account' }).click();
      await page.getByRole('button', { name: 'toggle theme' }).waitFor({
        state: 'visible',
        timeout: 30000,
      });
      await page.waitForTimeout(800);
    } else {
      const login = process.env.DEBK_USER_GUIDE_LOGIN?.trim();
      const password = process.env.DEBK_USER_GUIDE_PASSWORD?.trim();
      if (!login || !password) {
        console.error(`
Wrote onboarding-login.png (Sign in). Set DEBK_USER_GUIDE_LOGIN and DEBK_USER_GUIDE_PASSWORD to capture authenticated screens.
`);
        process.exit(1);
      }
      await page.getByLabel('Login').fill(login);
      await page.locator('input[name="password"]').fill(password);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await waitAppChrome();
    }

    await gotoShell('/');
    await save('onboarding-home-portal.png');

    await gotoShell('/identity');
    await page.waitForTimeout(600);
    const identity = page.getByRole('heading', { name: 'Identity & access' });
    if (await identity.isVisible().catch(() => false)) {
      await save('onboarding-team-operators.png', { fullPage: true });
    } else {
      console.warn('skip onboarding-team-operators.png (Identity & access not available for this user)');
    }

    await gotoShell('/books');
    await save('01-financial-pulse.png');

    await gotoShell('/configure');
    await save('02-business-profile.png');

    await gotoShell('/books/accounts');
    await save('03-chart-of-accounts.png', { fullPage: true });

    await gotoShell('/books/periods');
    await save('04-periods-and-closing.png', { fullPage: true });

    await gotoShell('/books/journal');
    try {
      await page.getByRole('button', { name: 'New transaction' }).click();
      await page.getByRole('heading', { name: 'Quick Transaction' }).waitFor({ state: 'visible', timeout: 10000 });
      // Best-effort fill so the screenshot shows the auto-generated preview.
      await page.getByLabel('Description').fill('Monthly Printer Ink & Paper').catch(() => {});
      await page.getByLabel('Amount').fill('120').catch(() => {});
      try {
        await page.getByRole('combobox', { name: 'Category' }).click();
        await page.getByRole('option', { name: /Stationery/i }).first().click();
      } catch {
        /* leave Category empty if the picker shape differs */
      }
      try {
        await page.getByRole('combobox', { name: 'Paid from' }).click();
        await page.getByRole('option', { name: /Bank/i }).first().click();
      } catch {
        /* leave Paid from empty */
      }
      await page.waitForTimeout(500);
    } catch (e) {
      console.warn('quick transaction dialog capture was only partial:', e?.message);
    }
    await save('05-journal-workbench.png');
    await page.keyboard.press('Escape').catch(() => {});

    await gotoShell('/books/journal?tab=audit');
    const auditTab = page.getByRole('tab', { name: 'Audit' });
    if (await auditTab.isVisible().catch(() => false)) {
      await auditTab.click();
      await page.waitForTimeout(400);
    }
    await save('06-journal-audit.png', { fullPage: true });

    await gotoShell('/books/reports');
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
