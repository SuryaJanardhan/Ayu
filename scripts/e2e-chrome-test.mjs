import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/home/surya/.gemini/antigravity/brain/b526d79a-ca61-4305-bb13-397672d3c19e';
const ROOT_UI_DIR = '/home/surya/Desktop/Ayu/ayu_ui_verification';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function saveBoth(page, filename) {
  const p1 = path.join(ARTIFACT_DIR, filename);
  const p2 = path.join(ROOT_UI_DIR, filename);
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, p2);
  console.log(`Saved ${filename} to both directories.`);
}

async function run() {
  console.log('Launching Chrome in mobile viewport mode...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: {
      width: 412,
      height: 915,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    }
  });

  const page = await browser.newPage();
  
  // 1. Splash Screen Capture
  const navPromise = page.goto('http://localhost:5173/');
  await sleep(400);
  await saveBoth(page, '00_splash_screen.png');

  await navPromise;
  console.log('Loaded dashboard successfully.');
  await sleep(1400);

  // 2. Home Screen
  await saveBoth(page, '01_dashboard_mobile.png');

  // 3. Open Snap Meal Modal via Center FAB
  const fabBtn = await page.waitForSelector('button[title*="Snap Meal"]');
  if (fabBtn) {
    await fabBtn.click();
    await sleep(600);
    await saveBoth(page, '02_cache_hit_preview.png');

    const closeBtns = await page.$$('div.fixed button');
    if (closeBtns.length > 0) {
      await closeBtns[0].click();
      await sleep(300);
    }
  }

  // 4. Navigate to Meals Tab (showing images & edit/delete)
  const navButtons = await page.$$('nav button');
  for (const b of navButtons) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes('Meals')) {
      await b.click();
      console.log('Switched to Meals tab');
      break;
    }
  }
  await sleep(600);
  await saveBoth(page, '03_meals_screen.png');

  // 5. Open Edit Meal Modal
  const editMealBtns = await page.$$('button[title*="Edit meal"]');
  if (editMealBtns.length > 0) {
    await editMealBtns[0].click();
    await sleep(500);
    await saveBoth(page, '04_edit_meal_modal.png');

    const closeBtns = await page.$$('div.fixed button');
    if (closeBtns.length > 0) {
      await closeBtns[0].click();
      await sleep(300);
    }
  }

  // 6. Navigate to Progress Tab (showing Before/After photo vault)
  for (const b of await page.$$('nav button')) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes('Progress')) {
      await b.click();
      console.log('Switched to Progress tab');
      break;
    }
  }
  await sleep(600);
  await saveBoth(page, '05_progress_screen.png');

  // 7. Open Settings Modal (showing Two-Tier Storage & Compressed Weekly Snapshots)
  for (const b of await page.$$('nav button')) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes('Home')) {
      await b.click();
      break;
    }
  }
  await sleep(400);

  const settingsBtn = await page.waitForSelector('button[title="Settings & Backup"]');
  if (settingsBtn) {
    await settingsBtn.click();
    await sleep(600);
    await saveBoth(page, '06_storage_vault_snapshots.png');

    const closeBtns = await page.$$('div.fixed button');
    if (closeBtns.length > 0) {
      await closeBtns[0].click();
      await sleep(300);
    }
  }

  await browser.close();
  console.log('All E2E captures finished successfully.');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
