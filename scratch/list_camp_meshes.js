import puppeteer from 'puppeteer-core';

async function listVisibleMeshesAtCamp() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const report = await page.evaluate(() => {
    const sm = window.AFTERFALL.sceneManager;
    sm.setFocus('medicalCamp', false);

    const visibleList = [];
    sm.scene.traverse((obj) => {
      if ((obj.isMesh || obj.isPoints) && obj.visible) {
        let parentName = obj.parent?.name || obj.parent?.constructor?.name || 'none';
        let grandParentName = obj.parent?.parent?.name || obj.parent?.parent?.constructor?.name || 'none';

        visibleList.push({
          type: obj.type,
          parent: `${grandParentName} -> ${parentName}`,
          castShadow: obj.castShadow,
          recvShadow: obj.receiveShadow,
          mat: obj.material?.type,
          isDynamic: !!obj.userData?.isDynamic,
          name: obj.name || 'unnamed'
        });
      }
    });

    return {
      totalVisible: visibleList.length,
      sample: visibleList
    };
  });

  console.log('Total Visible at Camp:', report.totalVisible);
  console.log('Visible Meshes at Camp:');
  console.table(report.sample.slice(0, 45));

  await browser.close();
}

listVisibleMeshesAtCamp().catch(console.error);
