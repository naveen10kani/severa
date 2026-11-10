const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const outDir = path.resolve(__dirname, '..', 'docs', 'screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Launching browser via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });

  const pages = [
    { url: 'http://localhost:3000/', file: '01_war_room.png', name: 'War Room Dashboard' },
    { url: 'http://localhost:3000/map', file: '02_tactical_map.png', name: 'Tactical Hotspot Map' },
    { url: 'http://localhost:3000/lab', file: '03_model_lab.png', name: 'Model Lab & Benchmarks' },
    { url: 'http://localhost:3000/insights', file: '04_insights.png', name: 'Storytelling Insights' }
  ];

  for (const p of pages) {
    console.log(`Navigating to ${p.name}: ${p.url}...`);
    try {
      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 30000 });
      // Small pause to allow animations to settle
      await new Promise(r => setTimeout(r, 2000));
      const targetPath = path.join(outDir, p.file);
      await page.screenshot({ path: targetPath, fullPage: false });
      console.log(`Successfully saved screenshot: ${targetPath}`);
    } catch (err) {
      console.error(`Error capturing ${p.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
