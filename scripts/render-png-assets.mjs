import puppeteer from 'puppeteer-core';
import path from 'path';

async function render() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Render 1024x1024 icon.png
  await page.setViewport({ width: 1024, height: 1024 });
  await page.goto('file://' + path.resolve('assets/icon.svg'));
  await page.screenshot({ path: 'assets/icon.png', omitBackground: true });
  await page.screenshot({ path: 'assets/adaptive-icon.png', omitBackground: true });
  console.log('Rendered assets/icon.png and adaptive-icon.png');

  // Render 1284x2778 splash.png
  await page.setViewport({ width: 1284, height: 2778 });
  await page.goto('file://' + path.resolve('assets/splash.svg'));
  await page.screenshot({ path: 'assets/splash.png' });
  console.log('Rendered assets/splash.png');

  await browser.close();
}

render().catch(console.error);
