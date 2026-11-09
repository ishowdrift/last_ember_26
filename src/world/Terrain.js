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
    // Large base ground slab covering the full 120m (Z) x 64m (X) 3-region world
    const baseCol = 0x3d4b32; // Muted post-apocalyptic olive-soil green
    voxel.addBlock(this.group, 68, 1.0, 126, baseCol, 0, -0.5, 0, {
      roughness: 0.95,
      metalness: 0.05
    });

    // Subterranean rock foundation
    voxel.addBlock(this.group, 68, 2.0, 126, 0x221e1b, 0, -2.0, 0, {
      roughness: 0.98
    });
  }

  buildElevations() {
    // Voxel stepped terrain terraces for organic depth across all 3 regions
    const rockCol = 0x48423d;
    const mossRockCol = 0x3d4432;
    const grassCol = 0x475936;
    const dryGrassCol = 0x5a5b3a;
    const jungleSoil = 0x2e271d;

    // 1. North City Terraces (Elevated shop foundations)
    voxel.addBlock(this.group, 22, 0.25, 20, 0x4a4d52, -14, 0.12, -42, { roughness: 0.9 });
    voxel.addBlock(this.group, 22, 0.25, 20, 0x4a4d52, 14, 0.12, -42, { roughness: 0.9 });

    // 2. Outpost Ridge (North-West elevated hill)
    const hillBlocks = [
      { w: 18, h: 0.6, d: 18, x: -16, y: 0.3, z: -14, col: grassCol },
      { w: 14, h: 0.8, d: 14, x: -16, y: 0.7, z: -14, col: mossRockCol },
      { w: 10, h: 0.6, d: 10, x: -16, y: 1.3, z: -14, col: rockCol },
      { w: 3, h: 0.4, d: 2, x: -8, y: 0.2, z: -8, col: rockCol },
      { w: 2.5, h: 0.4, d: 2, x: -6, y: 0.1, z: -7, col: rockCol }
    ];

    hillBlocks.forEach(b => {
      voxel.addBlock(this.group, b.w, b.h, b.d, b.col, b.x, b.y, b.z, {
        roughness: 0.92
      });
    });

    // 3. Central Camp Plateau
    voxel.addBlock(this.group, 22, 0.15, 22, 0x435232, 0, 0.08, 0, {
      roughness: 0.9
    });

    // 4. South Jungle Terraces (Steep rocky ridges and jungle gully)
    const jungleRidges = [
      { w: 20, h: 0.8, d: 16, x: -16, y: 0.4, z: 38, col: jungleSoil },
      { w: 14, h: 1.0, d: 12, x: -17, y: 0.9, z: 40, col: mossRockCol },
      { w: 22, h: 0.7, d: 18, x: 15, y: 0.35, z: 36, col: dryGrassCol },
      { w: 16, h: 1.1, d: 14, x: 16, y: 0.85, z: 42, col: rockCol }
    ];

    jungleRidges.forEach(r => {
      voxel.addBlock(this.group, r.w, r.h, r.d, r.col, r.x, r.y, r.z, {
        roughness: 0.96
      });
    });
  }

  buildDirtTrails() {
    // Worn dirt and gravel paths connecting City -> Camp -> Jungle
    const dirtCol = 0x4a3c2c;
    const gravelCol = 0x584c3e;

    // Trail connecting Camp to Abandoned Outpost
    const trailSegments = [
      { w: 2.2, h: 0.04, d: 4.0, x: -3.5, y: 0.1, z: -3.5, rot: 0.6 },
      { w: 2.0, h: 0.04, d: 5.0, x: -7.0, y: 0.1, z: -7.0, rot: 0.7 },
      { w: 2.2, h: 0.04, d: 6.0, x: -11.0, y: 0.35, z: -10.5, rot: 0.8 },
      // Trail connecting Camp Southward into Jungle Traversal Path
      { w: 2.8, h: 0.04, d: 8.0, x: -1.5, y: 0.1, z: 12.0, rot: 0.1 },
      { w: 2.6, h: 0.04, d: 10.0, x: -3.0, y: 0.1, z: 21.0, rot: -0.15 },
      { w: 2.8, h: 0.04, d: 12.0, x: -5.5, y: 0.1, z: 32.0, rot: -0.22 },
      { w: 3.2, h: 0.04, d: 14.0, x: -8.0, y: 0.1, z: 44.0, rot: 0.1 }, // Leads directly to Civilian Rescue Point!
      // Central campfire worn earth circle
      { w: 5.0, h: 0.03, d: 5.0, x: 0, y: 0.09, z: 0, rot: 0 }
    ];

    trailSegments.forEach(s => {
      voxel.addBlock(this.group, s.w, s.h, s.d, dirtCol, s.x, s.y, s.z, {
        rotation: { y: s.rot },
        roughness: 0.96
      });
    });

    // Scattered gravel patches
    for (let i = 0; i < 35; i++) {
      const rx = (Math.random() - 0.5) * 28;
      const rz = (Math.random() - 0.5) * 60;
      voxel.addBlock(
        this.group,
        0.5 + Math.random() * 0.7,
        0.05,
        0.5 + Math.random() * 0.7,
        gravelCol,
        rx,
        0.1,
        rz,
        { roughness: 0.98 }
      );
    }
  }

  buildHighway() {
    // 1. Abandoned cracked 2-lane North-South Highway on East perimeter (Z: -55 to 15 at X = 18)
    const roadX = 18;
    const roadWidth = 6.4;
    const roadLength = 70;

    // Asphalt bed
    voxel.addBlock(this.group, roadWidth, 0.12, roadLength, 0x22252a, roadX, 0.06, -20, {
      roughness: 0.88,
      metalness: 0.1
    });

    // Concrete curbs
    voxel.addBlock(this.group, 0.4, 0.22, roadLength, 0x61666d, roadX - roadWidth / 2 - 0.2, 0.11, -20, {
      roughness: 0.9
    });
    voxel.addBlock(this.group, 0.4, 0.22, roadLength, 0x61666d, roadX + roadWidth / 2 + 0.2, 0.11, -20, {
      roughness: 0.9
    });

    // 2. City Commercial Main Street (East-West at Z = -36, Width: 8m, Length: 52m)
    voxel.addBlock(this.group, 52, 0.12, 7.6, 0x1f2226, 0, 0.06, -36, {
      roughness: 0.85,
      metalness: 0.12
    });
    // City Sidewalk North
    voxel.addBlock(this.group, 52, 0.24, 2.2, 0x585c63, 0, 0.12, -40.9, { roughness: 0.9 });
    // City Sidewalk South
    voxel.addBlock(this.group, 52, 0.24, 2.2, 0x585c63, 0, 0.12, -31.1, { roughness: 0.9 });

    // Broken yellow double centerline on Highway
    const dashLength = 2.4;
    const gapLength = 2.0;
    const totalDashes = Math.floor(roadLength / (dashLength + gapLength));
    for (let i = 0; i < totalDashes; i++) {
      if (i % 3 === 2) continue;
      const zPos = -20 - roadLength / 2 + i * (dashLength + gapLength) + dashLength / 2;
      voxel.addBlock(this.group, 0.16, 0.02, dashLength, 0xd4a017, roadX - 0.18, 0.13, zPos, {
        roughness: 0.7
      });
      voxel.addBlock(this.group, 0.16, 0.02, dashLength, 0xd4a017, roadX + 0.18, 0.13, zPos, {
        roughness: 0.7
      });
    }

    // City street pedestrian crosswalk stripes (X: -16 and X: 10)
    [-16, 10].forEach(crossX => {
      for (let z = -35.2; z <= -32.8; z += 0.8) {
        voxel.addBlock(this.group, 2.2, 0.02, 0.45, 0xdddddd, crossX, 0.13, z, { roughness: 0.8 });
      }
    });

    // Road asphalt fracture spots
    const crackSpots = [-50, -42, -28, -10, 2, 10];
    crackSpots.forEach(z => {
      voxel.addBlock(this.group, 1.8, 0.06, 0.8, 0x16181b, roadX + (Math.random() - 0.5) * 2, 0.13, z, {
        rotation: { y: Math.random() * 2 }
      });
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
