import puppeteer from 'puppeteer-core';

async function profileFrame() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  const timings = await page.evaluate(() => {
    const sm = window.AFTERFALL.sceneManager;
    const measurements = {
      lighting: 0,
      camera: 0,
      atmosphere: 0,
      camp: 0,
      survivor: 0,
      zombie: 0,
      collectibles: 0,
      render: 0,
      total: 0
    };

    const count = 60;
    for (let i = 0; i < count; i++) {
      const delta = 0.016;
      const t0 = performance.now();

      const tL0 = performance.now();
      sm.lightingManager.update(delta);
      measurements.lighting += performance.now() - tL0;

      const tC0 = performance.now();
      sm.cameraController.update(delta);
      measurements.camera += performance.now() - tC0;

      const tA0 = performance.now();
      sm.atmosphere.update(delta, sm.lightingManager.isNightTime());
      measurements.atmosphere += performance.now() - tA0;

      const tCamp0 = performance.now();
      if (sm.camp) sm.camp.update(delta);
      measurements.camp += performance.now() - tCamp0;

      const tS0 = performance.now();
      if (sm.survivor) sm.survivor.update(delta);
      measurements.survivor += performance.now() - tS0;

      const tZ0 = performance.now();
      if (sm.zombie) sm.zombie.update(delta);
      measurements.zombie += performance.now() - tZ0;

      const tCol0 = performance.now();
      if (sm.collectibles) sm.collectibles.update(delta);
      measurements.collectibles += performance.now() - tCol0;

      const tR0 = performance.now();
      sm.rendererManager.render(sm.scene, sm.camera);
      measurements.render += performance.now() - tR0;

      measurements.total += performance.now() - t0;
    }

    for (const k in measurements) {
      measurements[k] = (measurements[k] / count).toFixed(3) + ' ms';
    }

    return measurements;
  });

  console.log('CPU Timings per frame:', timings);
  await browser.close();
}

profileFrame().catch(console.error);
