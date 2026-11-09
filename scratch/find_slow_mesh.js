import puppeteer from 'puppeteer-core';

async function findSlowMesh() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1.0 });
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(async () => {
    const sm = window.AFTERFALL.sceneManager;
    sm.setFocus('medicalCamp', false);
    await new Promise(r => setTimeout(r, 500));

    const gl = sm.rendererManager.renderer.getContext();
    const testOne = (action, name) => {
      action();
      gl.finish();
      const t0 = performance.now();
      for (let i = 0; i < 40; i++) {
        sm.rendererManager.render(sm.scene, sm.camera);
        gl.finish();
      }
      return `${name}: ${((performance.now() - t0) / 40).toFixed(2)} ms`;
    };

    const out = [];
    out.push(testOne(() => {}, 'Full Scene at MedicalCamp'));

    out.push(testOne(() => { sm.medicalCamp.campfire.setVisible(false); }, 'Campfire Hidden'));
    out.push(testOne(() => { sm.medicalCamp.campfire.setVisible(true); sm.lightingManager.campfireLight.visible = false; }, 'Campfire PointLight Off'));
    out.push(testOne(() => { sm.lightingManager.campfireLight.visible = true; sm.atmosphere.group.visible = false; }, 'Atmosphere Off'));
    out.push(testOne(() => { sm.terrain.group.visible = false; }, 'Terrain Off'));
    out.push(testOne(() => { sm.terrain.group.visible = true; sm.building.group.visible = false; }, 'Building Off'));
    out.push(testOne(() => { sm.building.group.visible = true; sm.forest.group.visible = false; }, 'Forest Off'));

    return out;
  });

  console.log(result);
  await browser.close();
}

findSlowMesh().catch(console.error);
