const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/home/surya/.gemini/antigravity/brain/b526d79a-ca61-4305-bb13-397672d3c19e';

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

  // 1. Initial Dashboard
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_dashboard_mobile.png'), fullPage: false });
  console.log('Saved 01_dashboard_mobile.png');

  // 2. Nutrition Input - Deterministic Cache Test
  const mealInput = await page.waitForSelector('input[placeholder*="2 eggs"]');
  await mealInput.type('2 eggs on sourdough toast');
  await page.waitForTimeout(600); // debounce / DB query
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_cache_hit_preview.png'), fullPage: false });
  console.log('Saved 02_cache_hit_preview.png');

  // Click Log
  const logBtn = await page.waitForSelector('button:has-text("Log")');
  await logBtn.click();
  await page.waitForTimeout(500);

  // 3. Hydration Test
  const addWaterBtn = await page.waitForSelector('button:has-text("+500 ml")');
  await addWaterBtn.click();
  await page.waitForTimeout(300);

  // 4. Workout Modal Test (Push Day)
  const pushTemplate = await page.waitForSelector('button:has-text("Push Day")');
  await pushTemplate.click();
  await page.waitForSelector('h3:has-text("Push Day")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_workout_modal_memory.png'), fullPage: false });
  console.log('Saved 03_workout_modal_memory.png');

  // Start 60s Rest timer
  const timerBtn = await page.waitForSelector('button:has-text("60s")');
  await timerBtn.click();
  await page.waitForTimeout(500);

  // Complete & Save
  const completeBtn = await page.waitForSelector('button:has-text("Complete & Save Workout Session")');
  await completeBtn.click();
  await page.waitForTimeout(500);

  // 5. Target Override Modal
  const targetModalBtn = await page.waitForSelector('button[title="Daily Target Overrides"]');
  await targetModalBtn.click();
  await page.waitForSelector('h3:has-text("Target Overrides")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_target_override_modal.png'), fullPage: false });
  console.log('Saved 04_target_override_modal.png');

  // Close target modal
  const closeTargetBtn = await page.waitForSelector('button:has-text("Save Target Override for Today")');
  await closeTargetBtn.click();
  await page.waitForTimeout(500);

  // 6. Settings & Backup Modal
  const settingsBtn = await page.waitForSelector('button[title="Database Backup & Settings"]');
  await settingsBtn.click();
  await page.waitForSelector('h3:has-text("Settings & Data Management")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_settings_backup_modal.png'), fullPage: false });
  console.log('Saved 05_settings_backup_modal.png');

  // Close settings modal
  const closeSettingsBtn = await page.waitForSelector('div.fixed button:has(svg.lucide-x)');
  if (closeSettingsBtn) await closeSettingsBtn.click();
  await page.waitForTimeout(500);

  // 7. Final Dashboard State
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_final_dashboard_state.png'), fullPage: false });
  console.log('Saved 06_final_dashboard_state.png');

  await browser.close();
  console.log('All E2E Chrome UI tests completed successfully!');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
