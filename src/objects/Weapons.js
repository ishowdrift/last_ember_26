import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

export class Weapons {
  constructor(scene, position = new THREE.Vector3(3.2, 0.98, 0.5)) {
    this.scene = scene;
    this.position = position;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = -1.57; // Aligned with the camp workbench

    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.buildWeaponRackMounts();
    this.buildAssaultRifle();
    this.buildShotgun();
    this.buildPistol();
    this.buildWeaponAccessories();

    // Merge static firearms and accessories into unified draw calls with fast shadows
    voxel.mergeStaticGroup(this.group, { castShadow: true, receiveShadow: false });
  }

  buildWeaponRackMounts() {
    const pegCol = 0x3d2b1d;
    // Wooden pegs on the workbench backboard to hold firearms
    // Top row pegs (Assault Rifle)
    voxel.addBlock(this.group, 0.08, 0.08, 0.28, pegCol, -0.4, 0.65, -0.38);
    voxel.addBlock(this.group, 0.08, 0.08, 0.28, pegCol, 0.4, 0.65, -0.38);

    // Mid row pegs (Shotgun)
    voxel.addBlock(this.group, 0.08, 0.08, 0.28, pegCol, -0.4, 0.35, -0.38);
    voxel.addBlock(this.group, 0.08, 0.08, 0.28, pegCol, 0.4, 0.35, -0.38);
  }

  buildAssaultRifle() {
    // "Vanguard AR-74" mounted on top row: Y = 0.68
    const ar = new THREE.Group();
    ar.position.set(0, 0.68, -0.26);

    const gunMetal = 0x24282e;
    const darkPolymer = 0x18191c;
    const tanPolymer = 0x6e604d; // Desert coyote accents

    // 1. Upper & Lower Receiver
    voxel.addBlock(ar, 0.92, 0.12, 0.09, gunMetal, 0, 0, 0, { metalness: 0.85, roughness: 0.35 });
    // Top Picatinny Rail
    voxel.addBlock(ar, 0.82, 0.03, 0.1, darkPolymer, 0, 0.075, 0, { metalness: 0.7 });

    // 2. Holographic Red Dot Sight
    const sight = new THREE.Group();
    sight.position.set(-0.05, 0.12, 0);
    voxel.addBlock(sight, 0.18, 0.09, 0.1, darkPolymer, 0, 0, 0);
    // Glowing red reticle glass
    voxel.addBlock(sight, 0.12, 0.06, 0.02, 0xff2222, 0, 0, 0, {
      emissive: 0xff1111,
      emissiveIntensity: 2.0
    });
    ar.add(sight);

    // 3. Barrel & Flash Suppressor
    voxel.addBlock(ar, 0.45, 0.06, 0.06, gunMetal, 0.55, 0.01, 0, { metalness: 0.9 });
    // Flash hider
    voxel.addBlock(ar, 0.1, 0.08, 0.08, darkPolymer, 0.8, 0.01, 0, { metalness: 0.9 });

    // 4. Ribbed Tactical Handguard
    voxel.addBlock(ar, 0.38, 0.11, 0.1, tanPolymer, 0.32, 0, 0);

    // 5. Pistol Grip
    voxel.addBlock(ar, 0.09, 0.18, 0.08, tanPolymer, -0.15, -0.12, 0, {
      rotation: { z: -0.3 }
    });

    // 6. Curved 30-round Magazine
    const mag = new THREE.Group();
    mag.position.set(0.06, -0.14, 0);
    mag.rotation.z = -0.22;
    voxel.addBlock(mag, 0.11, 0.22, 0.08, darkPolymer, 0, 0, 0);
    // Brass casing peeking out
    voxel.addBlock(mag, 0.06, 0.04, 0.06, 0xd4a017, 0, 0.11, 0, { metalness: 0.9 });
    ar.add(mag);

    // 7. Tactical Crane Stock
    voxel.addBlock(ar, 0.32, 0.14, 0.09, tanPolymer, -0.42, -0.02, 0);
    voxel.addBlock(ar, 0.06, 0.16, 0.1, 0x111111, -0.58, -0.03, 0); // Rubber buttpad

    this.group.add(ar);
  }

  buildShotgun() {
    // "Breaker 12G" Pump Shotgun on mid row: Y = 0.38
    const sg = new THREE.Group();
    sg.position.set(0, 0.38, -0.26);

    const steelCol = 0x30353b;
    const walnutWood = 0x483222;
    const shellRed = 0xc72c21;
    const brassGold = 0xd4a017;

    // 1. Receiver
    voxel.addBlock(sg, 0.42, 0.14, 0.1, steelCol, -0.1, 0, 0, { metalness: 0.85 });

    // 2. Heavy Gauge Twin Barrels (top barrel + mag tube below)
    voxel.addBlock(sg, 0.75, 0.06, 0.06, steelCol, 0.42, 0.03, 0, { metalness: 0.9 });
    voxel.addBlock(sg, 0.65, 0.06, 0.06, steelCol, 0.38, -0.03, 0, { metalness: 0.9 });

    // 3. Ribbed Wood Slide Pump
    voxel.addBlock(sg, 0.22, 0.1, 0.1, walnutWood, 0.32, -0.03, 0, { roughness: 0.85 });

    // 4. Perforated Heat Shield on barrel
    voxel.addBlock(sg, 0.36, 0.08, 0.08, 0x1f2226, 0.25, 0.05, 0, { metalness: 0.8 });

    // 5. Classic Walnut Wood Stock
    voxel.addBlock(sg, 0.35, 0.15, 0.09, walnutWood, -0.42, -0.05, 0, {
      rotation: { z: 0.12 },
      roughness: 0.8
    });
    // Buttpad
    voxel.addBlock(sg, 0.05, 0.16, 0.1, 0x1a1a1a, -0.58, -0.07, 0);

    // 6. Receiver Side-Saddle with 4 Red Shotgun Shells!
    for (let i = 0; i < 4; i++) {
      const shell = new THREE.Group();
      shell.position.set(-0.22 + i * 0.08, 0.01, 0.07);
      // Red hull
      voxel.addBlock(shell, 0.06, 0.12, 0.05, shellRed, 0, 0, 0);
      // Brass rim
      voxel.addBlock(shell, 0.065, 0.03, 0.055, brassGold, 0, 0.06, 0, { metalness: 0.9 });
      sg.add(shell);
    }

    this.group.add(sg);
  }

  buildPistol() {
    // "Sidekick 9mm" resting flat on workbench surface: Y = 0.06
    const pistol = new THREE.Group();
    pistol.position.set(0.45, 0.06, 0.15);
    pistol.rotation.x = -1.57; // Resting flat on table
    pistol.rotation.z = 0.45;

    const slideMetal = 0x22252a;
    const framePolymer = 0x32383e;
    const tritiumGreen = 0x38ef7d;

    // Slide
    voxel.addBlock(pistol, 0.28, 0.07, 0.06, slideMetal, 0, 0.08, 0, { metalness: 0.85 });
    // Front serrations
    voxel.addBlock(pistol, 0.08, 0.072, 0.062, 0x111315, 0.08, 0.08, 0);

    // Polymer Frame & Grip
    voxel.addBlock(pistol, 0.26, 0.06, 0.055, framePolymer, -0.02, 0.02, 0);
    // Grip handle
    voxel.addBlock(pistol, 0.08, 0.18, 0.055, framePolymer, -0.08, -0.08, 0, {
      rotation: { z: 0.25 }
    });
    // Trigger guard
    voxel.addBlock(pistol, 0.08, 0.06, 0.02, slideMetal, 0.02, 0, 0);

    // Tritium Night Sights (glowing green dots)
    voxel.addBlock(pistol, 0.02, 0.02, 0.02, tritiumGreen, 0.12, 0.125, 0, {
      emissive: tritiumGreen,
      emissiveIntensity: 2.0
    });
    voxel.addBlock(pistol, 0.02, 0.02, 0.04, tritiumGreen, -0.12, 0.125, 0, {
      emissive: tritiumGreen,
      emissiveIntensity: 2.0
    });

    this.group.add(pistol);
  }

  buildWeaponAccessories() {
    // 1. Opened Ammo Box with loose cartridges on workbench table
    const ammoBox = new THREE.Group();
    ammoBox.position.set(-0.55, 0.08, 0.12);
    ammoBox.rotation.y = 0.35;

    // Metal tin body
    voxel.addBlock(ammoBox, 0.32, 0.16, 0.22, 0x3d4734, 0, 0, 0, { metalness: 0.6 });
    // Open lid flipped back
    voxel.addBlock(ammoBox, 0.32, 0.04, 0.22, 0x3d4734, 0, 0.1, -0.15, {
      rotation: { x: -1.2 }
    });
    // Brass cartridges inside
    for (let x = -0.09; x <= 0.09; x += 0.06) {
      for (let z = -0.05; z <= 0.05; z += 0.05) {
        voxel.addBlock(ammoBox, 0.03, 0.08, 0.03, 0xd4a017, x, 0.06, z, { metalness: 0.9 });
      }
    }
    this.group.add(ammoBox);

    // 2. Gun oil aerosol can
    const oilCan = new THREE.Group();
    oilCan.position.set(-0.15, 0.12, 0.22);
    voxel.addBlock(oilCan, 0.1, 0.22, 0.1, 0x1f3b52, 0, 0, 0, { metalness: 0.7 });
    voxel.addBlock(oilCan, 0.06, 0.06, 0.06, 0xd43828, 0, 0.14, 0); // red spray nozzle
    this.group.add(oilCan);
  }
}
