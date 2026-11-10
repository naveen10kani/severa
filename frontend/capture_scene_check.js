const puppeteer = require('puppeteer-core');
const path = require('path');

async function capture() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const outDir = path.resolve(__dirname, '..', 'docs', 'screenshots');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  });

  const shoot = async (url, file, waitMs, beforeShot) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1512, height: 982, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.log(`[pageerror ${file}] ${String(e).slice(0, 300)}`));
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
    await new Promise((r) => setTimeout(r, waitMs));
    if (beforeShot) await beforeShot(page);
    await page.screenshot({ path: path.join(outDir, file), fullPage: false });
    console.log('saved', file);
    await page.close();
  };

  await shoot('http://localhost:3000/', '01_war_room.png', 9000);
  await shoot('http://localhost:3000/map', '02_tactical_map.png', 6000);
  await shoot('http://localhost:3000/', '01c_war_room_daylight.png', 6000, async (page) => {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Clear Urban Daylight')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 6000));
  });

  await browser.close();
}

capture().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
