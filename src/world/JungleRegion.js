import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

/**
 * Region C: Dense Jungle & Evacuation Forest
 * Southern zone of the world (Z: 16m to 56m).
 * Features:
 * - Towering 10-14m canopy conifer trees (5-6x survivor height) with layered needles
 * - Dead charred snag trees, overgrown underbrush, mossy boulders, fallen log bridge
 * - Overturned police patrol cruiser (Civilian Rescue Point) at X: -8, Z: 46 with flashing hazard beacon
 * - The Infected Nest / Ambush Clearing at X: 12, Z: 42 with bones, barricaded blind, warning drums
 * - Evacuation dirt trail linking directly North to Medical Camp
 * All static meshes merged via voxel.mergeStaticGroup() for peak 60 FPS performance.
 */
export class JungleRegion {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'JungleRegion';

    // Dynamic flashing beacon mesh
    this.hazardBeacon = null;
    this.beaconTimer = 0;

    this.init();
    this.scene.add(this.group);
  }

  init() {
    // 1. Tall Conifer Canopy (10m - 14m tall)
    this.buildCanopyConifers();

    // 2. Charred Dead Snags & Deciduous Trees
    this.buildDeadSnags();
    this.buildDeciduousTrees();

    // 3. Dense Undergrowth: Mossy Boulders, Ferns, Fallen Logs
    this.buildBouldersAndLogs();
    this.buildUndergrowth();

    // 4. CIVILIAN RESCUE SPAWN POINT (Overturned Police Cruiser at X: -8, Z: 46)
    this.buildCivilianRescuePoint(-8, 46);

    // 5. THE INFECTED NEST / AMBUSH CLEARING (X: 12, Z: 42)
    this.buildInfectedNest(12, 42);

    // Merge all static forest & vehicle geometry into unified draw calls with fast shadows
    voxel.mergeStaticGroup(this.group, { castShadow: true, receiveShadow: false });
  }

  buildCanopyConifers() {
    const coniferColors = [0x1f3822, 0x19301c, 0x254228, 0x162c19];
    const trunkCol = 0x38281b;

    // Coordinated placements across the jungle perimeter and dense thickets
    const treeCoords = [
      { x: -18, z: 22, h: 12.5, s: 1.3, c: 0 },
      { x: -22, z: 32, h: 14.0, s: 1.45, c: 1 },
      { x: -16, z: 42, h: 13.0, s: 1.35, c: 2 },
      { x: -24, z: 48, h: 11.5, s: 1.2, c: 3 },
      { x: -14, z: 52, h: 13.5, s: 1.4, c: 0 },
      // East flank thicket
      { x: 18, z: 24, h: 13.0, s: 1.35, c: 1 },
      { x: 22, z: 34, h: 14.2, s: 1.5, c: 2 },
      { x: 24, z: 46, h: 12.0, s: 1.25, c: 0 },
      { x: 16, z: 52, h: 13.8, s: 1.4, c: 3 },
      // Deep South boundary
      { x: -4, z: 54, h: 14.0, s: 1.45, c: 1 },
      { x: 4, z: 55, h: 13.2, s: 1.35, c: 2 }
    ];

    treeCoords.forEach(t => {
      const tree = new THREE.Group();
      tree.position.set(t.x, 0, t.z);

      // Huge massive trunk (height ~13m)
      voxel.addBlock(tree, 0.75 * t.s, t.h, 0.75 * t.s, trunkCol, 0, t.h / 2, 0, { roughness: 0.95 });

      // 6 Layered canopy tiers tapering upward
      const col = coniferColors[t.c];
      const tiers = [
        { y: t.h * 0.35, w: 5.2 * t.s, h: 1.6 },
        { y: t.h * 0.50, w: 4.4 * t.s, h: 1.5 },
        { y: t.h * 0.65, w: 3.6 * t.s, h: 1.4 },
        { y: t.h * 0.78, w: 2.8 * t.s, h: 1.3 },
        { y: t.h * 0.90, w: 1.9 * t.s, h: 1.2 },
        { y: t.h * 1.02, w: 1.0 * t.s, h: 1.0 }
      ];

      tiers.forEach(tier => {
        voxel.addBlock(tree, tier.w, tier.h, tier.w, col, 0, tier.y, 0, { roughness: 0.9 });
      });

      this.group.add(tree);
    });
  }

  buildDeadSnags() {
    const snagCol = 0x221a14; // Charred lightning struck deadwood
    const snagPositions = [
      { x: -5, z: 28, h: 7.2, rotZ: 0.12 },
      { x: 6, z: 32, h: 8.5, rotZ: -0.15 },
      { x: 14, z: 50, h: 6.8, rotZ: 0.18 }
    ];

    snagPositions.forEach(s => {
      const snag = new THREE.Group();
      snag.position.set(s.x, 0, s.z);
      snag.rotation.z = s.rotZ;

      // Broken jagged trunk
      voxel.addBlock(snag, 0.5, s.h, 0.5, snagCol, 0, s.h / 2, 0, { roughness: 0.98 });
      // Broken jagged top fracture
      voxel.addBlock(snag, 0.28, 0.9, 0.28, snagCol, 0.1, s.h + 0.4, 0);

      // Bare dead branches jutting out
      voxel.addBlock(snag, 1.8, 0.22, 0.22, snagCol, 0.8, s.h * 0.7, 0, { rotation: { z: 0.35 } });
      voxel.addBlock(snag, 1.6, 0.2, 0.2, snagCol, -0.7, s.h * 0.55, 0.2, { rotation: { z: -0.4 } });

      this.group.add(snag);
    });
  }

  buildDeciduousTrees() {
    const leafColors = [0x365427, 0x48642d, 0x2d4822];
    const trunkCol = 0x443324;

    const spots = [
      { x: -10, z: 22, scale: 1.0, col: 0 },
      { x: 8, z: 26, scale: 1.15, col: 1 },
      { x: 3, z: 46, scale: 1.05, col: 2 }
    ];

    spots.forEach(sp => {
      const tree = new THREE.Group();
      tree.position.set(sp.x, 0, sp.z);
      const s = sp.scale;

      // Curved organic trunk
      voxel.addBlock(tree, 0.55 * s, 4.2 * s, 0.55 * s, trunkCol, 0, 2.1 * s, 0, { roughness: 0.9 });
      voxel.addBlock(tree, 0.4 * s, 2.4 * s, 0.4 * s, trunkCol, 0.35 * s, 4.8 * s, 0, { rotation: { z: 0.25 } });

      // Rounded cloud-like voxel foliage clusters
      const foliageCol = leafColors[sp.col];
      voxel.addBlock(tree, 3.4 * s, 2.2 * s, 3.4 * s, foliageCol, 0, 5.0 * s, 0, { roughness: 0.88 });
      voxel.addBlock(tree, 2.6 * s, 1.8 * s, 2.6 * s, foliageCol, 0.4 * s, 6.2 * s, 0.2 * s, { roughness: 0.88 });
      voxel.addBlock(tree, 2.2 * s, 1.6 * s, 2.2 * s, foliageCol, -0.6 * s, 4.4 * s, -0.3 * s, { roughness: 0.88 });

      this.group.add(tree);
    });
  }

  buildBouldersAndLogs() {
    const mossRock = 0x444d38;
    const darkRock = 0x383935;
    const logBark = 0x362719;

    // 1. Fallen Log Bridge spanning across the jungle gully (X: -2 to X: 4, Z: 36)
    const logBridge = new THREE.Group();
    logBridge.position.set(0, 0.35, 36);
    voxel.addBlock(logBridge, 7.5, 0.65, 0.7, logBark, 0, 0, 0, { rotation: { y: 0.15, z: 0.05 }, roughness: 0.95 });
    // Overgrown moss strip along top of log
    voxel.addBlock(logBridge, 6.8, 0.08, 0.5, mossRock, 0, 0.36, 0, { rotation: { y: 0.15, z: 0.05 } });
    this.group.add(logBridge);

    // 2. Large Moss-Covered Boulders
    const boulders = [
      { x: -12, z: 34, w: 2.8, h: 1.8, d: 2.4, col: mossRock },
      { x: -14, z: 35, w: 1.8, h: 1.2, d: 1.6, col: darkRock },
      { x: 10, z: 30, w: 3.2, h: 2.1, d: 2.8, col: mossRock },
      { x: 13, z: 32, w: 2.2, h: 1.4, d: 2.0, col: darkRock },
      { x: -6, z: 50, w: 2.5, h: 1.6, d: 2.2, col: mossRock }
    ];

    boulders.forEach(b => {
      voxel.addBlock(this.group, b.w, b.h, b.d, b.col, b.x, b.h / 2, b.z, {
        rotation: { y: Math.random() * 2, x: (Math.random() - 0.5) * 0.2 },
        roughness: 0.95
      });
    });
  }

  buildUndergrowth() {
    const fernCol = 0x334e26;
    const dryPatch = 0x4d4c2a;

    // Low voxel ferns and shrub patches
    for (let i = 0; i < 18; i++) {
      const x = (Math.random() - 0.5) * 36;
      const z = 20 + Math.random() * 32;
      // Skip path corridor
      if (Math.abs(x) < 2.5) continue;

      const w = 1.0 + Math.random() * 1.4;
      const h = 0.35 + Math.random() * 0.45;
      const d = 1.0 + Math.random() * 1.4;
      const col = Math.random() > 0.4 ? fernCol : dryPatch;

      voxel.addBlock(this.group, w, h, d, col, x, h / 2, z, {
        rotation: { y: Math.random() * Math.PI },
        roughness: 0.95,
        castShadow: false
      });
    }
  }

  buildCivilianRescuePoint(x, z) {
    const rescue = new THREE.Group();
    rescue.position.set(x, 0, z);

    // 1. Black tire skid marks on asphalt/dirt
    voxel.addBlock(rescue, 1.4, 0.02, 6.0, 0x1a1918, 0, 0.02, -2.0, { rotation: { y: 0.25 }, castShadow: false });

    // 2. Overturned Police Patrol Cruiser (Flipped on its side at 75-degree angle)
    const car = new THREE.Group();
    car.position.set(0, 0.85, 0);
    car.rotation.z = 1.35; // Flipped on right side!
    car.rotation.y = 0.3;

    const paintWhite = 0xd5dce2;
    const paintBlack = 0x22262a;
    const glassCyan = 0x335566;
    const tireRubber = 0x18181a;
    const rimSilver = 0x909aa2;

    // Lower Chassis
    voxel.addBlock(car, 4.4, 0.45, 1.9, paintBlack, 0, 0.2, 0);
    // Body panels (White police cruiser livery)
    voxel.addBlock(car, 4.2, 0.55, 1.85, paintWhite, 0, 0.7, 0);
    // Black hood and trunk
    voxel.addBlock(car, 1.3, 0.56, 1.86, paintBlack, 1.4, 0.7, 0);
    voxel.addBlock(car, 1.0, 0.56, 1.86, paintBlack, -1.5, 0.7, 0);

    // Cabin and windows
    voxel.addBlock(car, 2.0, 0.65, 1.7, glassCyan, 0, 1.3, 0, { transparent: true, opacity: 0.65 });
    // Roof
    voxel.addBlock(car, 2.05, 0.1, 1.75, paintWhite, 0, 1.68, 0);

    // 4 Wheels
    const makeWheel = (wx, wy, wz) => {
      const w = new THREE.Group();
      w.position.set(wx, wy, wz);
      voxel.addBlock(w, 0.72, 0.72, 0.32, tireRubber, 0, 0, 0);
      voxel.addBlock(w, 0.42, 0.42, 0.34, rimSilver, 0, 0, 0, { metalness: 0.8 });
      return w;
    };
    car.add(makeWheel(-1.3, 0.1, 0.95));
    car.add(makeWheel(1.3, 0.1, 0.95));
    car.add(makeWheel(-1.3, 0.1, -0.95));
    car.add(makeWheel(1.3, 0.1, -0.95));

    // Police Lightbar on roof (Blue & Amber Emergency Flashers)
    voxel.addBlock(car, 0.3, 0.15, 1.2, 0x1a2430, 0, 1.78, 0);
    voxel.addBlock(car, 0.28, 0.18, 0.5, 0x1166dd, 0, 1.8, -0.32, { emissive: 0x1166dd, emissiveIntensity: 1.5 });
    voxel.addBlock(car, 0.28, 0.18, 0.5, 0xee8811, 0, 1.8, 0.32, { emissive: 0xee8811, emissiveIntensity: 1.5 });

    rescue.add(car);

    // 3. Survival Distress Beacon / Road Flare on ground beside vehicle
    const flare = new THREE.Group();
    flare.position.set(1.4, 0.1, 0.8);
    // Red flare stick
    voxel.addBlock(flare, 0.4, 0.1, 0.1, 0xcc2222, 0, 0.05, 0);
    // Blazing magnesium tip (dynamic pulsing glow)
    const flareTip = voxel.addBlock(flare, 0.16, 0.16, 0.16, 0xff3311, 0.24, 0.08, 0, {
      emissive: 0xff4411,
      emissiveIntensity: 2.5
    });
    flareTip.userData.isDynamic = true;
    this.hazardBeacon = flareTip;
    rescue.add(flare);

    // 4. Shattered Glass and Cargo Crates on ground
    voxel.addBlock(rescue, 1.8, 0.04, 1.6, 0x88bbcc, -0.8, 0.04, 1.2, { transparent: true, opacity: 0.6, castShadow: false });
    // Overturned survivor suitcase
    voxel.addBlock(rescue, 0.7, 0.22, 0.5, 0x824e2c, -1.8, 0.11, 1.4);

    this.group.add(rescue);
  }

  buildInfectedNest(x, z) {
    const nest = new THREE.Group();
    nest.position.set(x, 0, z);

    // 1. Dark corrupted bloodstained earth circle
    voxel.addBlock(nest, 7.0, 0.03, 7.0, 0x241512, 0, 0.03, 0, { roughness: 0.98, castShadow: false });

    // 2. Makeshift Hunter's Blind / Barricaded Stash (Overrun)
    const blind = new THREE.Group();
    blind.position.set(0, 0, -1.5);
    // Timber pallets lashed together
    voxel.addBlock(blind, 3.2, 1.8, 0.18, 0x3d2c1e, 0, 0.9, 0, { roughness: 0.95 });
    voxel.addBlock(blind, 0.18, 1.8, 2.2, 0x3d2c1e, -1.5, 0.9, 1.0, { roughness: 0.95 });
    // Corrugated rusted iron roof sheet
    voxel.addBlock(blind, 3.4, 0.08, 2.6, 0x5a3625, 0, 1.9, 1.0, { rotation: { x: 0.1 }, metalness: 0.7 });
    nest.add(blind);

    // 3. Biohazard Toxic Waste Barrel
    voxel.addBlock(nest, 0.72, 1.1, 0.72, 0xd4a017, 1.8, 0.55, 0.8, { roughness: 0.7 }); // Yellow toxic drum
    // Glowing toxic spill puddle
    voxel.addBlock(nest, 1.8, 0.02, 1.8, 0x66cc22, 1.8, 0.04, 0.8, {
      emissive: 0x44aa11,
      emissiveIntensity: 0.9,
      castShadow: false
    });

    // 4. Animal & Human Skeletal Remains (Voxel bone fragments)
    const boneCol = 0xded8ce;
    voxel.addBlock(nest, 0.35, 0.25, 0.35, boneCol, -0.6, 0.14, 0.8); // Skull
    voxel.addBlock(nest, 0.8, 0.12, 0.2, boneCol, -0.4, 0.08, 1.2, { rotation: { y: 0.4 } }); // Femur
    voxel.addBlock(nest, 0.7, 0.12, 0.18, boneCol, -0.8, 0.08, 0.4, { rotation: { y: -0.6 } }); // Ribcage segment

    this.group.add(nest);
  }

  update(delta) {
    // Pulse the survival distress beacon / emergency magnesium flare
    if (this.hazardBeacon) {
      this.beaconTimer += delta * 6;
      const intensity = 1.4 + Math.sin(this.beaconTimer) * 1.1;
      this.hazardBeacon.material.emissiveIntensity = intensity;
    }
  }
}
