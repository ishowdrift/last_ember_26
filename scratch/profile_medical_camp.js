import puppeteer from 'puppeteer-core';

async function profileMedicalCamp() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--disable-gpu-vsync',
      '--disable-frame-rate-limit'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1.0 });

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const report = await page.evaluate(() => {
    const sm = window.AFTERFALL.sceneManager;
    sm.setFocus('medicalCamp', false);

    // Turn off things one by one to find the exact bottleneck
    const gl = sm.rendererManager.renderer.getContext();
    const timeRender = () => {
      const start = performance.now();
      for (let i = 0; i < 30; i++) {
        sm.rendererManager.render(sm.scene, sm.camera);
        gl.finish();
      }
      return ((performance.now() - start) / 30).toFixed(2);
    };

    const initialTime = timeRender();

    // 1. Hide campfire
    sm.medicalCamp.campfire.setVisible(false);
    const withoutCampfire = timeRender();
    sm.medicalCamp.campfire.setVisible(true);

    // 2. Hide campfire light
    sm.lightingManager.campfireLight.visible = false;
    const withoutCampfireLight = timeRender();
    sm.lightingManager.campfireLight.visible = true;

    // 3. Hide mist planes
    sm.atmosphere.group.visible = false;
    const withoutAtmosphere = timeRender();
    sm.atmosphere.group.visible = true;

    // 4. Hide medical ward (cots, IV stands)
    sm.medicalCamp.group.visible = false;
    const withoutMedicalCamp = timeRender();
    sm.medicalCamp.group.visible = true;

    return {
      initialTime: initialTime + ' ms',
      withoutCampfire: withoutCampfire + ' ms',
      withoutCampfireLight: withoutCampfireLight + ' ms',
      withoutAtmosphere: withoutAtmosphere + ' ms',
      withoutMedicalCamp: withoutMedicalCamp + ' ms'
    };
  });

  console.log('Medical Camp Diagnostic:', report);
  await browser.close();
}

profileMedicalCamp().catch(console.error);
