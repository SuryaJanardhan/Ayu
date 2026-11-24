import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/surya/.gemini/antigravity/brain/b526d79a-ca61-4305-bb13-397672d3c19e';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('Launching Chrome in mobile emulation mode...');
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

  // 1. Initial Dashboard Screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_dashboard_mobile.png') });
  console.log('Saved 01_dashboard_mobile.png');

  // 2. Nutrition Input - Deterministic Cache Test
  const mealInput = await page.waitForSelector('input[placeholder*="2 eggs"]');
  await mealInput.type('2 eggs on sourdough toast');
  await sleep(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_cache_hit_preview.png') });
  console.log('Saved 02_cache_hit_preview.png');

  // Press Enter to log
  await page.keyboard.press('Enter');
  await sleep(600);

  // 3. Hydration Test: Click +500 ml
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.includes('+500 ml')) {
      await btn.click();
      console.log('Clicked +500 ml button');
      break;
    }
  }
  await sleep(400);

  // 4. Workout Modal Test (Push Day)
  const allButtons = await page.$$('button');
  for (const btn of allButtons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.includes('Push Day')) {
      await btn.click();
      console.log('Clicked Push Day template button');
      break;
    }
  }
  await sleep(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_workout_modal_memory.png') });
  console.log('Saved 03_workout_modal_memory.png');

  // Click 60s Rest Timer
  const timerButtons = await page.$$('button');
  for (const btn of timerButtons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.trim() === '60s') {
      await btn.click();
      console.log('Triggered 60s rest timer');
      break;
    }
  }
  await sleep(500);

  // Complete and save workout
  const modalButtons = await page.$$('button');
  for (const btn of modalButtons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.includes('Complete & Save Workout Session')) {
      await btn.click();
      console.log('Saved workout session');
      break;
    }
  }
  await sleep(600);

  // 5. Target Override Modal
  const targetModalBtn = await page.waitForSelector('button[title="Daily Target Overrides"]');
  if (targetModalBtn) {
    await targetModalBtn.click();
    await sleep(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_target_override_modal.png') });
    console.log('Saved 04_target_override_modal.png');

    const targetBtns = await page.$$('button');
    for (const btn of targetBtns) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('Save Target Override')) {
        await btn.click();
        break;
      }
    }
    await sleep(500);
  }

  // 6. Settings & Backup Modal
  const settingsBtn = await page.waitForSelector('button[title="Database Backup & Settings"]');
  if (settingsBtn) {
    await settingsBtn.click();
    await sleep(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_settings_backup_modal.png') });
    console.log('Saved 05_settings_backup_modal.png');

    // Close settings modal
    const closeBtns = await page.$$('div.fixed button');
    if (closeBtns.length > 0) {
      await closeBtns[0].click();
    }
    await sleep(400);
  }

  // 7. Final Dashboard State
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_final_dashboard_state.png') });
  console.log('Saved 06_final_dashboard_state.png');

  await browser.close();
  console.log('E2E Chrome UI execution finished successfully.');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
