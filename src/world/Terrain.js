import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

export class Terrain {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.buildBaseGround();
    this.buildElevations();
    this.buildDirtTrails();
    this.buildHighway();
    this.buildGrassTufts();

    // Merge all static terrain meshes into minimal high-performance draw calls
    voxel.mergeStaticGroup(this.group, { castShadow: false, receiveShadow: true });
  }

  buildBaseGround() {
    // Large base ground slab (48x48)
    const baseCol = 0x3d4b32; // Muted post-apocalyptic olive-soil green
    voxel.addBlock(this.group, 52, 1.0, 52, baseCol, 0, -0.5, 0, {
      roughness: 0.95,
      metalness: 0.05
    });

    // Deep subterranean rock foundation
    voxel.addBlock(this.group, 52, 2.0, 52, 0x221e1b, 0, -2.0, 0, {
      roughness: 0.98
    });
  }

  buildElevations() {
    // Voxel stepped terrain terraces for organic depth
    const rockCol = 0x48423d;
    const mossRockCol = 0x3d4432;
    const grassCol = 0x475936;
    const dryGrassCol = 0x5a5b3a;

    // North-West hill (where the Abandoned Outpost sits elevated)
    const hillBlocks = [
      { w: 18, h: 0.6, d: 18, x: -16, y: 0.3, z: -14, col: grassCol },
      { w: 14, h: 0.8, d: 14, x: -16, y: 0.7, z: -14, col: mossRockCol },
      { w: 10, h: 0.6, d: 10, x: -16, y: 1.3, z: -14, col: rockCol },
      // Rock outcrop stairs
      { w: 3, h: 0.4, d: 2, x: -8, y: 0.2, z: -8, col: rockCol },
      { w: 2.5, h: 0.4, d: 2, x: -6, y: 0.1, z: -7, col: rockCol }
    ];

    hillBlocks.forEach(b => {
      voxel.addBlock(this.group, b.w, b.h, b.d, b.col, b.x, b.y, b.z, {
        roughness: 0.92
      });
    });

    // South-East rocky ridge
    const ridgeBlocks = [
      { w: 12, h: 0.5, d: 8, x: 14, y: 0.25, z: 12, col: dryGrassCol },
      { w: 8, h: 0.7, d: 6, x: 15, y: 0.6, z: 13, col: rockCol },
      { w: 5, h: 0.6, d: 4, x: 16, y: 1.1, z: 13, col: rockCol }
    ];

    ridgeBlocks.forEach(b => {
      voxel.addBlock(this.group, b.w, b.h, b.d, b.col, b.x, b.y, b.z, {
        roughness: 0.95
      });
    });

    // Camp plateau subtle elevation
    voxel.addBlock(this.group, 16, 0.15, 16, 0x435232, 0, 0.08, 0, {
      roughness: 0.9
    });
  }

  buildDirtTrails() {
    // Worn dirt and gravel paths stamped into terrain
    const dirtCol = 0x4a3c2c;
    const gravelCol = 0x584c3e;

    // Trail connecting Camp to Abandoned Outpost
    const trailSegments = [
      { w: 2.2, h: 0.04, d: 4.0, x: -3.5, y: 0.1, z: -3.5, rot: 0.6 },
      { w: 2.0, h: 0.04, d: 5.0, x: -7.0, y: 0.1, z: -7.0, rot: 0.7 },
      { w: 2.2, h: 0.04, d: 6.0, x: -11.0, y: 0.35, z: -10.5, rot: 0.8 },
      // Trail connecting Camp to Forest Highway
      { w: 2.4, h: 0.04, d: 6.0, x: 3.5, y: 0.1, z: 4.5, rot: -0.4 },
      { w: 2.2, h: 0.04, d: 7.0, x: 6.5, y: 0.1, z: 9.5, rot: -0.3 },
      // Around campfire circle worn earth
      { w: 4.5, h: 0.03, d: 4.5, x: 0, y: 0.09, z: 0, rot: 0 }
    ];

    trailSegments.forEach(s => {
      voxel.addBlock(this.group, s.w, s.h, s.d, dirtCol, s.x, s.y, s.z, {
        rotation: { y: s.rot },
        roughness: 0.96
      });
    });

    // Scattered gravel patches
    for (let i = 0; i < 20; i++) {
      const rx = (Math.random() - 0.5) * 14;
      const rz = (Math.random() - 0.5) * 14;
      voxel.addBlock(
        this.group,
        0.5 + Math.random() * 0.6,
        0.05,
        0.5 + Math.random() * 0.6,
        gravelCol,
        rx,
        0.1,
        rz,
        { roughness: 0.98 }
      );
    }
  }

  buildHighway() {
    // Abandoned cracked 2-lane asphalt highway on East perimeter (Z from -24 to 24 at X = 17)
    const roadX = 18;
    const roadWidth = 6.4;
    const roadLength = 50;

    // Asphalt bed
    voxel.addBlock(this.group, roadWidth, 0.12, roadLength, 0x22252a, roadX, 0.06, 0, {
      roughness: 0.88,
      metalness: 0.1
    });

    // Concrete curbs
    voxel.addBlock(this.group, 0.4, 0.22, roadLength, 0x61666d, roadX - roadWidth / 2 - 0.2, 0.11, 0, {
      roughness: 0.9
    });
    voxel.addBlock(this.group, 0.4, 0.22, roadLength, 0x61666d, roadX + roadWidth / 2 + 0.2, 0.11, 0, {
      roughness: 0.9
    });

    // Broken yellow double centerline
    const dashLength = 2.4;
    const gapLength = 2.0;
    const totalDashes = Math.floor(roadLength / (dashLength + gapLength));
    for (let i = 0; i < totalDashes; i++) {
      // Skip some dashes to simulate worn/cracked road
      if (i % 3 === 2) continue;
      const zPos = -roadLength / 2 + i * (dashLength + gapLength) + dashLength / 2;
      
      // Left yellow line
      voxel.addBlock(this.group, 0.16, 0.02, dashLength, 0xd4a017, roadX - 0.18, 0.13, zPos, {
        roughness: 0.7
      });
      // Right yellow line
      voxel.addBlock(this.group, 0.16, 0.02, dashLength, 0xd4a017, roadX + 0.18, 0.13, zPos, {
        roughness: 0.7
      });
    }

    // Road cracks and weeds breaking through
    const crackSpots = [-18, -10, -2, 6, 14, 21];
    crackSpots.forEach(z => {
      // Asphalt crack chunk
      voxel.addBlock(this.group, 1.8, 0.06, 0.8, 0x181a1d, roadX + (Math.random() - 0.5) * 2, 0.13, z, {
        rotation: { y: Math.random() * 2 }
      });
      // Weed tuft poking through crack
      voxel.addBlock(this.group, 0.25, 0.35, 0.25, 0x475c2e, roadX + (Math.random() - 0.5) * 2, 0.25, z);
    });
  }

  buildGrassTufts() {
    // Voxel grass blades scattered across non-road terrain
    const grassColors = [0x4d6335, 0x3d5027, 0x5a6e3d, 0x6e7d44];
    for (let i = 0; i < 70; i++) {
      const rx = (Math.random() - 0.5) * 38;
      const rz = (Math.random() - 0.5) * 38;
      // Keep clear of road
      if (rx > 13 && rx < 23) continue;
      // Keep clear of campfire center
      if (Math.abs(rx) < 2.5 && Math.abs(rz) < 2.5) continue;

      const col = grassColors[i % grassColors.length];
      const h = 0.25 + Math.random() * 0.35;
      const w = 0.18 + Math.random() * 0.15;
      
      const tuftGroup = new THREE.Group();
      tuftGroup.position.set(rx, 0.1, rz);
      
      // 2-3 intersecting voxel blades
      voxel.addBlock(tuftGroup, w, h, 0.06, col, 0, h / 2, 0, {
        rotation: { y: Math.random() * Math.PI },
        castShadow: false
      });
      voxel.addBlock(tuftGroup, w, h * 0.8, 0.06, col, 0, (h * 0.8) / 2, 0, {
        rotation: { y: Math.random() * Math.PI },
        castShadow: false
      });

      this.group.add(tuftGroup);
    }
  }
}
