import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';
import { Campfire } from '../effects/Campfire.js';

/**
 * Region B: Medical Quarantine & Survivor Camp
 * Central focal point of the survivor sanctuary.
 * Features:
 * - Field triage canvas tents with red medical crosses
 * - Doctor treatment station with medical cots, IV drip stands, oxygen canisters
 * - Fortified perimeter with sandbag bunkers, spike barricades, and guard watchtower
 * - Central animated campfire and survival supply cache
 * - Radio communications post with ham radio and antenna
 * All static geometry is merged via voxel.mergeStaticGroup() for minimum draw calls.
 */
export class MedicalCampRegion {
  constructor(scene, lightingManager) {
    this.scene = scene;
    this.lightingManager = lightingManager;
    this.group = new THREE.Group();
    this.group.name = 'MedicalCampRegion';

    this.campfire = null;
    this.init();
    this.scene.add(this.group);
  }

  init() {
    // 1. Main Field Triage Tent (West side: X: -6.5, Z: -1.5)
    this.buildTriageTent(-7.0, -1.0, 0.2);

    // 2. Medical Treatment Station & Recovery Ward
    this.buildMedicalWard(-6.8, -1.0);

    // 3. Secondary Supply & Quarantine Tent (East side: X: 6.5, Z: -2.0)
    this.buildSupplyTent(6.8, -2.5, -0.25);

    // 4. Radio Communications Outpost (North-East: X: 4.5, Z: -6.0)
    this.buildRadioPost(4.8, -6.2);

    // 5. Fortified Perimeter: Sandbag Bunkers & Spiked Log Barriers
    this.buildPerimeterDefenses();

    // 6. Guard Watchtower (South-East entrance: X: 7.5, Z: 7.0)
    this.buildWatchtower(7.2, 6.8);

    // 7. Survivor Seating, Barrels, and Fuel Supply Cache
    this.buildCampSeating();
    this.buildSupplyCache();

    // 8. Lantern Posts for evening lighting
    this.buildLanterns();

    // Merge all static camp props into single-digit draw calls with fast shadows
    voxel.mergeStaticGroup(this.group, { castShadow: true, receiveShadow: false });

    // 9. Central Animated Campfire (Dynamic, instantiated AFTER merge so flames & embers remain unmerged)
    this.campfire = new Campfire(this.group, new THREE.Vector3(0, 0.08, 0));
  }

  buildTriageTent(x, z, rotY = 0) {
    const tentGroup = new THREE.Group();
    tentGroup.position.set(x, 0.08, z);
    tentGroup.rotation.y = rotY;

    const canvasWhite = 0xd5d1cb;
    const canvasWeathered = 0xbab3a7;
    const redCross = 0xb32424;
    const woodFrame = 0x4a3623;

    // Wooden A-frame ridge poles
    voxel.addBlock(tentGroup, 0.16, 3.4, 0.16, woodFrame, -2.4, 1.7, -3.2, { rotation: { z: 0.38 } });
    voxel.addBlock(tentGroup, 0.16, 3.4, 0.16, woodFrame, 2.4, 1.7, -3.2, { rotation: { z: -0.38 } });
    voxel.addBlock(tentGroup, 0.16, 3.4, 0.16, woodFrame, -2.4, 1.7, 3.2, { rotation: { z: 0.38 } });
    voxel.addBlock(tentGroup, 0.16, 3.4, 0.16, woodFrame, 2.4, 1.7, 3.2, { rotation: { z: -0.38 } });
    // Horizontal ridge beam
    voxel.addBlock(tentGroup, 0.18, 0.18, 6.6, woodFrame, 0, 3.0, 0);

    // Angled canvas roof slopes
    voxel.addBlock(tentGroup, 2.7, 0.12, 6.2, canvasWhite, -1.3, 1.85, 0, { rotation: { z: 0.58 }, roughness: 0.92 });
    voxel.addBlock(tentGroup, 2.7, 0.12, 6.2, canvasWeathered, 1.3, 1.85, 0, { rotation: { z: -0.58 }, roughness: 0.92 });

    // Weathered canvas ground skirt
    voxel.addBlock(tentGroup, 0.14, 0.6, 6.0, canvasWeathered, -2.3, 0.3, 0);
    voxel.addBlock(tentGroup, 0.14, 0.6, 6.0, canvasWeathered, 2.3, 0.3, 0);

    // Stenciled Red Cross on East roof slope (facing camp center)
    // Vertical bar
    voxel.addBlock(tentGroup, 0.45, 0.14, 1.4, redCross, 1.32, 1.88, 0, { rotation: { z: -0.58 } });
    // Horizontal bar
    voxel.addBlock(tentGroup, 1.25, 0.14, 0.5, redCross, 1.32, 1.88, 0, { rotation: { z: -0.58 } });

    // Tent interior wooden deck floor
    voxel.addBlock(tentGroup, 4.4, 0.12, 5.8, 0x5a432b, 0, 0.06, 0, { roughness: 0.95 });

    this.group.add(tentGroup);
  }

  buildMedicalWard(x, z) {
    const ward = new THREE.Group();
    ward.position.set(x, 0.14, z);

    const metalFrame = 0x6e7882;
    const sheetWhite = 0xdde2e8;
    const mattressCol = 0x7b8893;
    const woodTrunk = 0x5c4228;

    // Cot 1: Left Medical Bed
    voxel.addBlock(ward, 1.0, 0.45, 2.1, sheetWhite, -1.1, 0.35, -1.2);
    voxel.addBlock(ward, 0.9, 0.12, 0.5, 0x9fb0bc, -1.1, 0.62, -1.9); // Elevated pillow
    // Metal legs
    voxel.addBlock(ward, 0.08, 0.45, 0.08, metalFrame, -1.5, 0.22, -2.1);
    voxel.addBlock(ward, 0.08, 0.45, 0.08, metalFrame, -0.7, 0.22, -2.1);
    voxel.addBlock(ward, 0.08, 0.45, 0.08, metalFrame, -1.5, 0.22, -0.3);
    voxel.addBlock(ward, 0.08, 0.45, 0.08, metalFrame, -0.7, 0.22, -0.3);

    // Cot 2: Right Medical Bed
    voxel.addBlock(ward, 1.0, 0.45, 2.1, mattressCol, 1.1, 0.35, -1.2);
    voxel.addBlock(ward, 0.9, 0.12, 0.5, sheetWhite, 1.1, 0.62, -1.9);

    // IV Drip Stand beside Cot 1
    voxel.addBlock(ward, 0.4, 0.04, 0.4, metalFrame, -0.4, 0.02, -1.8); // Base
    voxel.addBlock(ward, 0.05, 1.8, 0.05, metalFrame, -0.4, 0.9, -1.8); // Pole
    voxel.addBlock(ward, 0.35, 0.04, 0.05, metalFrame, -0.4, 1.78, -1.8); // Arm
    voxel.addBlock(ward, 0.14, 0.32, 0.14, 0x88ccff, -0.52, 1.55, -1.8, { transparent: true, opacity: 0.75 }); // IV bag

    // Doctor treatment supply table
    voxel.addBlock(ward, 1.6, 0.75, 0.8, 0x47515a, 0, 0.38, 1.6);
    // Medical supply kit on table
    voxel.addBlock(ward, 0.65, 0.3, 0.4, 0xbb3322, 0, 0.9, 1.6);
    voxel.addBlock(ward, 0.15, 0.32, 0.3, 0xffffff, 0, 0.91, 1.6);
    // Oxygen canister
    voxel.addBlock(ward, 0.26, 0.9, 0.26, 0x247ba0, 0.9, 0.45, 1.6);
    voxel.addBlock(ward, 0.14, 0.18, 0.14, 0xc0c8d0, 0.9, 0.95, 1.6, { metalness: 0.8 });

    // Wooden medicine crates
    voxel.addBlock(ward, 0.8, 0.55, 0.8, woodTrunk, -1.2, 0.28, 1.6);
    voxel.addBlock(ward, 0.6, 0.45, 0.6, woodTrunk, -1.2, 0.78, 1.6);

    this.group.add(ward);
  }

  buildSupplyTent(x, z, rotY = 0) {
    const tent = new THREE.Group();
    tent.position.set(x, 0.08, z);
    tent.rotation.y = rotY;

    const canvasOlive = 0x48583c;
    const woodFrame = 0x3d2c1e;

    // Lean-to supply shed
    voxel.addBlock(tent, 0.18, 2.6, 0.18, woodFrame, -1.8, 1.3, -2.0);
    voxel.addBlock(tent, 0.18, 2.6, 0.18, woodFrame, 1.8, 1.3, -2.0);
    voxel.addBlock(tent, 0.18, 1.8, 0.18, woodFrame, -1.8, 0.9, 2.0);
    voxel.addBlock(tent, 0.18, 1.8, 0.18, woodFrame, 1.8, 0.9, 2.0);

    // Sloped tarp roof
    voxel.addBlock(tent, 4.0, 0.1, 4.4, canvasOlive, 0, 2.2, 0, { rotation: { x: 0.2 }, roughness: 0.9 });

    // Stored supply pallets underneath
    voxel.addBlock(tent, 3.4, 0.14, 3.4, 0x594129, 0, 0.07, 0);

    // Stacked ration crates & water jerrycans
    voxel.addBlock(tent, 1.0, 0.8, 1.0, 0x4a3a2a, -0.9, 0.54, -0.6);
    voxel.addBlock(tent, 0.8, 0.7, 0.8, 0x5a4835, -0.9, 1.28, -0.6);
    voxel.addBlock(tent, 1.2, 0.6, 0.9, 0x3e3020, 0.8, 0.44, -0.7);

    // Olive water barrels & blue chemical drums
    voxel.addBlock(tent, 0.7, 1.1, 0.7, 0x2b4a5f, 0.8, 0.55, 0.8, { roughness: 0.6 });
    voxel.addBlock(tent, 0.68, 1.05, 0.68, 0x384a32, -0.8, 0.52, 0.8, { roughness: 0.7 });

    this.group.add(tent);
  }

  buildRadioPost(x, z) {
    const post = new THREE.Group();
    post.position.set(x, 0.08, z);

    // Sturdy wooden workbench
    voxel.addBlock(post, 2.2, 0.12, 1.0, 0x4a3724, 0, 0.86, 0);
    // Legs
    voxel.addBlock(post, 0.14, 0.86, 0.14, 0x3d2b1a, -0.95, 0.43, -0.38);
    voxel.addBlock(post, 0.14, 0.86, 0.14, 0x3d2b1a, 0.95, 0.43, -0.38);
    voxel.addBlock(post, 0.14, 0.86, 0.14, 0x3d2b1a, -0.95, 0.43, 0.38);
    voxel.addBlock(post, 0.14, 0.86, 0.14, 0x3d2b1a, 0.95, 0.43, 0.38);

    // Ham Radio military transceiver unit
    voxel.addBlock(post, 0.7, 0.32, 0.45, 0x2e3532, -0.4, 1.08, 0, { metalness: 0.6 });
    voxel.addBlock(post, 0.22, 0.12, 0.06, 0x22ee55, -0.4, 1.12, 0.24, { emissive: 0x22ee55, emissiveIntensity: 1.2 }); // Green display
    voxel.addBlock(post, 0.08, 0.08, 0.08, 0xddaa22, -0.15, 1.08, 0.24); // Dial knob

    // Tall comms whip antenna mast
    voxel.addBlock(post, 0.12, 0.12, 0.12, 0x111111, 0.8, 0.98, 0);
    voxel.addBlock(post, 0.04, 5.2, 0.04, 0x88949d, 0.8, 3.5, 0, { metalness: 0.9 });
    // Antenna red warning beacon on top
    voxel.addBlock(post, 0.12, 0.16, 0.12, 0xff2222, 0.8, 6.15, 0, { emissive: 0xff2222, emissiveIntensity: 1.5 });

    // Weatherproof tin canopy over radio
    voxel.addBlock(post, 2.6, 0.08, 1.6, 0x555e62, 0, 2.2, 0, { rotation: { x: 0.15 }, metalness: 0.7 });
    voxel.addBlock(post, 0.1, 2.2, 0.1, 0x333b3e, -1.1, 1.1, -0.6);
    voxel.addBlock(post, 0.1, 2.2, 0.1, 0x333b3e, 1.1, 1.1, -0.6);

    this.group.add(post);
  }

  buildPerimeterDefenses() {
    const defenses = new THREE.Group();

    const makeSpikeBarrier = (x, z, rotY) => {
      const b = new THREE.Group();
      b.position.set(x, 0.08, z);
      b.rotation.y = rotY;

      // Heavy horizontal log
      voxel.addBlock(b, 3.2, 0.26, 0.26, 0x38281a, 0, 0.58, 0);
      // 5 sharpened stakes angled forward
      for (let i = 0; i < 5; i++) {
        const sx = -1.2 + i * 0.6;
        voxel.addBlock(b, 0.18, 1.5, 0.18, 0x483424, sx, 0.65, 0, { rotation: { x: 0.52 } });
        // Sharpened tip
        voxel.addBlock(b, 0.12, 0.35, 0.12, 0x6e5239, sx, 1.25, 0.38, { rotation: { x: 0.52 } });
      }
      // Cross supports
      voxel.addBlock(b, 0.18, 1.2, 0.18, 0x38281a, -1.2, 0.5, 0, { rotation: { z: 0.5 } });
      voxel.addBlock(b, 0.18, 1.2, 0.18, 0x38281a, -1.2, 0.5, 0, { rotation: { z: -0.5 } });
      voxel.addBlock(b, 0.18, 1.2, 0.18, 0x38281a, 1.2, 0.5, 0, { rotation: { z: 0.5 } });
      voxel.addBlock(b, 0.18, 1.2, 0.18, 0x38281a, 1.2, 0.5, 0, { rotation: { z: -0.5 } });
      return b;
    };

    // Barriers guarding South trail (leading to Jungle)
    defenses.add(makeSpikeBarrier(-3.2, 7.5, 0.15));
    defenses.add(makeSpikeBarrier(3.5, 7.8, -0.2));

    // Barriers guarding North highway entrance (leading to City)
    defenses.add(makeSpikeBarrier(-3.8, -8.5, 0.05));
    defenses.add(makeSpikeBarrier(3.6, -8.5, -0.1));

    // Heavy Sandbag Bunkers flanking the entry points
    const makeSandbagWall = (x, z, rotY, length = 4) => {
      const wall = new THREE.Group();
      wall.position.set(x, 0.08, z);
      wall.rotation.y = rotY;

      const bagCol = 0x8a7a58;
      for (let layer = 0; layer < 4; layer++) {
        const offset = layer % 2 === 1 ? 0.35 : 0;
        for (let i = 0; i < length; i++) {
          voxel.addBlock(
            wall,
            0.7,
            0.24,
            0.4,
            bagCol,
            -((length - 1) * 0.35) + i * 0.7 + offset,
            0.12 + layer * 0.24,
            0,
            { roughness: 0.95 }
          );
        }
      }
      return wall;
    };

    defenses.add(makeSandbagWall(-6.8, 5.5, 0.4, 4));
    defenses.add(makeSandbagWall(7.5, -5.5, -0.6, 4));

    this.group.add(defenses);
  }

  buildWatchtower(x, z) {
    const tower = new THREE.Group();
    tower.position.set(x, 0.08, z);

    const postCol = 0x3d2c1e;
    const floorCol = 0x5a432b;
    const roofCol = 0x485055;

    // 4 Heavy timber vertical legs (height 5.2m)
    const legOffset = 1.3;
    voxel.addBlock(tower, 0.24, 5.2, 0.24, postCol, -legOffset, 2.6, -legOffset);
    voxel.addBlock(tower, 0.24, 5.2, 0.24, postCol, legOffset, 2.6, -legOffset);
    voxel.addBlock(tower, 0.24, 5.2, 0.24, postCol, -legOffset, 2.6, legOffset);
    voxel.addBlock(tower, 0.24, 5.2, 0.24, postCol, legOffset, 2.6, legOffset);

    // Cross bracing struts
    voxel.addBlock(tower, 3.8, 0.16, 0.16, postCol, 0, 1.8, -legOffset, { rotation: { z: 0.6 } });
    voxel.addBlock(tower, 3.8, 0.16, 0.16, postCol, 0, 1.8, legOffset, { rotation: { z: -0.6 } });
    voxel.addBlock(tower, 0.16, 0.16, 3.8, postCol, -legOffset, 1.8, 0, { rotation: { x: 0.6 } });
    voxel.addBlock(tower, 0.16, 0.16, 3.8, postCol, legOffset, 1.8, 0, { rotation: { x: -0.6 } });

    // Elevated Sentry Platform (Y = 4.8m)
    voxel.addBlock(tower, 3.2, 0.2, 3.2, floorCol, 0, 4.8, 0, { roughness: 0.92 });

    // Guard rails
    voxel.addBlock(tower, 3.2, 0.8, 0.12, postCol, 0, 5.3, -1.5);
    voxel.addBlock(tower, 3.2, 0.8, 0.12, postCol, 0, 5.3, 1.5);
    voxel.addBlock(tower, 0.12, 0.8, 3.2, postCol, -1.5, 5.3, 0);
    voxel.addBlock(tower, 0.12, 0.8, 3.2, postCol, 1.5, 5.3, 0);

    // Pyramid hipped tin roof
    voxel.addBlock(tower, 3.6, 0.15, 3.6, roofCol, 0, 6.4, 0, { metalness: 0.8 });

    // Access ladder on North face
    for (let rung = 0; rung < 10; rung++) {
      voxel.addBlock(tower, 0.8, 0.08, 0.08, 0x222225, 0, 0.45 + rung * 0.44, -legOffset - 0.12, { metalness: 0.8 });
    }

    // High-powered tactical spotlight on platform railing
    voxel.addBlock(tower, 0.4, 0.35, 0.45, 0x1f2427, 0, 5.4, 1.4, { metalness: 0.7 });
    voxel.addBlock(tower, 0.35, 0.3, 0.05, 0xfff0aa, 0, 5.4, 1.65, { emissive: 0xfff0aa, emissiveIntensity: 1.8 });

    this.group.add(tower);
  }

  buildCampSeating() {
    const seating = new THREE.Group();
    const woodBark = 0x3d2b1f;
    const woodCore = 0x6e5239;

    // Log Bench North of campfire (Z = -2.4)
    voxel.addBlock(seating, 2.6, 0.38, 0.55, woodCore, 0, 0.38, -2.4, { roughness: 0.92 });
    voxel.addBlock(seating, 2.62, 0.12, 0.57, woodBark, 0, 0.22, -2.4, { roughness: 0.95 });
    voxel.addBlock(seating, 0.45, 0.35, 0.45, woodBark, -1.0, 0.18, -2.4);
    voxel.addBlock(seating, 0.45, 0.35, 0.45, woodBark, 1.0, 0.18, -2.4);

    // Log Bench South of campfire (Z = 2.4)
    voxel.addBlock(seating, 2.4, 0.38, 0.55, woodCore, 0.2, 0.38, 2.4, { roughness: 0.92 });
    voxel.addBlock(seating, 0.45, 0.35, 0.45, woodBark, -0.8, 0.18, 2.4);
    voxel.addBlock(seating, 0.45, 0.35, 0.45, woodBark, 1.0, 0.18, 2.4);

    // Weathered camping folding chair (West: X = -2.5)
    voxel.addBlock(seating, 0.7, 0.1, 0.65, 0x384a32, -2.4, 0.45, 0.3, { roughness: 0.85 });
    voxel.addBlock(seating, 0.1, 0.65, 0.65, 0x384a32, -2.75, 0.75, 0.3); // Backrest

    this.group.add(seating);
  }

  buildSupplyCache() {
    const cache = new THREE.Group();

    // Rusted 55-gallon oil drums around campfire perimeter
    const drumColors = [0x50281e, 0x223545, 0x384032];
    voxel.addBlock(cache, 0.68, 1.1, 0.68, drumColors[0], 2.8, 0.55, 1.8, { roughness: 0.8 });
    voxel.addBlock(cache, 0.68, 1.1, 0.68, drumColors[1], 3.4, 0.55, 1.4, { roughness: 0.8 });
    // Overturned rusted barrel
    voxel.addBlock(cache, 1.1, 0.68, 0.68, drumColors[2], 3.2, 0.34, 2.4, { rotation: { y: 0.4 }, roughness: 0.9 });

    // Wooden ammo boxes
    voxel.addBlock(cache, 0.7, 0.35, 0.45, 0x485838, -2.6, 0.18, -1.5);
    voxel.addBlock(cache, 0.7, 0.35, 0.45, 0x485838, -2.6, 0.53, -1.5);

    this.group.add(cache);
  }

  buildLanterns() {
    const postCol = 0x3b2a1c;
    const ironCol = 0x222225;

    const makeLantern = (x, z) => {
      const p = new THREE.Group();
      p.position.set(x, 0.08, z);

      voxel.addBlock(p, 0.2, 3.0, 0.2, postCol, 0, 1.5, 0);
      voxel.addBlock(p, 0.1, 0.1, 0.7, ironCol, 0, 2.9, 0.35, { metalness: 0.8 });

      // Lantern lantern glass & wick
      voxel.addBlock(p, 0.22, 0.4, 0.22, 0xffaa33, 0, 2.5, 0.65, {
        transparent: true,
        opacity: 0.85,
        emissive: 0xff8811,
        emissiveIntensity: 1.2
      });
      voxel.addBlock(p, 0.26, 0.06, 0.26, ironCol, 0, 2.72, 0.65, { metalness: 0.8 });
      voxel.addBlock(p, 0.26, 0.06, 0.26, ironCol, 0, 2.28, 0.65, { metalness: 0.8 });

      if (this.lightingManager) {
        this.lightingManager.addLanternLight(new THREE.Vector3(x, 2.58, z + 0.65), 0xffaa44, 1.6, 10);
      }
      return p;
    };

    this.group.add(makeLantern(-2.8, -3.2));
    this.group.add(makeLantern(3.2, 2.8));
  }

  update(delta) {
    if (this.campfire) {
      this.campfire.update(delta);
    }
  }
}
