import puppeteer from 'puppeteer-core';

async function inspectDrawCalls() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const report = await page.evaluate(() => {
    const sm = window.AFTERFALL.sceneManager;
    const modules = {
      atmosphere: sm.atmosphere?.group,
      terrain: sm.terrain?.group,
      city: sm.city?.group,
      medicalCamp: sm.medicalCamp?.group,
      jungle: sm.jungle?.group,
      building: sm.building?.group,
      forest: sm.forest?.group,
      survivor: sm.survivor?.group,
      zombie: sm.zombie?.group,
      brute: sm.brute?.group,
      weapons: sm.weapons?.group,
      collectibles: sm.collectibles?.group
    };

    const moduleStats = {};
    for (const [name, grp] of Object.entries(modules)) {
      if (!grp) continue;
      let meshCount = 0;
      let shadowCasters = 0;
      let shadowReceivers = 0;
      let dynamicCount = 0;

      grp.traverse((obj) => {
        if (obj.isMesh || obj.isPoints) {
          meshCount++;
          if (obj.castShadow) shadowCasters++;
          if (obj.receiveShadow) shadowReceivers++;
          if (obj.userData?.isDynamic) dynamicCount++;
        }
      });

      moduleStats[name] = {
        meshCount,
        shadowCasters,
        shadowReceivers,
        dynamicCount
      };
    }

    return {
      moduleStats,
      rendererInfo: sm.rendererManager.getRenderInfo()
    };
  });

  console.log('Module Breakdown:', JSON.stringify(report.moduleStats, null, 2));
  console.log('Renderer Info:', JSON.stringify(report.rendererInfo, null, 2));

  await browser.close();
}

inspectDrawCalls().catch(console.error);
