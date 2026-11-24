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
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  console.log('Loaded dashboard successfully.');
  await sleep(1000);

  // 1. Home Screen (Coral ring, macros, chips, water, weight sparkline)
  await saveBoth(page, '01_dashboard_mobile.png');

  // 2. Open Snap Meal Modal via Center Floating Action Button (FAB)
  const fabBtn = await page.waitForSelector('button[title*="Snap Meal"]');
  if (fabBtn) {
    await fabBtn.click();
    await sleep(800);
    await saveBoth(page, '02_cache_hit_preview.png');

    // Click Log Meal
    const logBtns = await page.$$('button');
    for (const b of logBtns) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && text.includes('Log meal')) {
        await b.click();
        break;
      }
    }
    await sleep(600);
  }

  // 3. Navigate to Meals Tab
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

  // 4. Navigate to Train Tab
  for (const b of await page.$$('nav button')) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes('Train')) {
      await b.click();
      console.log('Switched to Train tab');
      break;
    }
  }
  await sleep(600);
  await saveBoth(page, '04_train_screen.png');

  // 5. Open Push Day Workout Session Modal from Train tab
  const allBtns = await page.$$('button');
  for (const b of allBtns) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes('Push day')) {
      await b.click();
      console.log('Clicked Push day button');
      break;
    }
  }
  await sleep(800);
  await saveBoth(page, '06_workout_modal_memory.png');

  // Close workout modal
  const closeBtns = await page.$$('div.fixed button');
  if (closeBtns.length > 0) {
    await closeBtns[0].click();
    await sleep(400);
  }

  // 6. Navigate to Progress Tab
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

  await browser.close();
  console.log('All redesigned screens captured successfully.');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
