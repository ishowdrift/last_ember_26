import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

export class ForestBiome {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    
    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.buildConiferTrees();
    this.buildDeadTrees();
    this.buildDeciduousTrees();
    this.buildFallenLogs();
    this.buildBoulders();
    this.buildBushes();
    this.buildMushrooms();
    this.buildHighwayProps();

    // Merge static forest trees, foliage, and highway props into minimal draw calls
    voxel.mergeStaticGroup(this.group, { castShadow: true, receiveShadow: true });
  }

  buildPineTree(x, z, scale = 1.0, colorVariant = 0) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.set(scale, scale, scale);

    const trunkCol = 0x3d2b1f;
    const needleColors = [0x223d24, 0x1d3621, 0x274535, 0x2e4228];
    const needleCol = needleColors[colorVariant % needleColors.length];

    // Trunk
    const trunkH = 3.6 + scale * 1.2;
    voxel.addBlock(tree, 0.45, trunkH, 0.45, trunkCol, 0, trunkH / 2, 0, { roughness: 0.92 });

    // Layered tiered foliage
    const layers = [
      { y: trunkH * 0.45, w: 2.8, h: 1.0, d: 2.8 },
      { y: trunkH * 0.65, w: 2.2, h: 0.9, d: 2.2 },
      { y: trunkH * 0.85, w: 1.6, h: 0.8, d: 1.6 },
      { y: trunkH * 1.05, w: 1.0, h: 0.8, d: 1.0 },
      { y: trunkH * 1.22, w: 0.5, h: 0.6, d: 0.5 }
    ];

    layers.forEach((l) => {
      voxel.addBlock(tree, l.w, l.h, l.d, needleCol, 0, l.y, 0, {
        rotation: { y: Math.random() * 0.3 },
        roughness: 0.85
      });
    });

    this.group.add(tree);
  }

  buildDeadTree(x, z, scale = 1.0) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.set(scale, scale, scale);

    const charredWood = 0x272422;
    const splinterWood = 0x423830;

    // Trunk with jagged break at top
    const trunkH = 3.8 + Math.random() * 1.5;
    voxel.addBlock(tree, 0.45, trunkH, 0.45, charredWood, 0, trunkH / 2, 0, {
      rotation: { z: (Math.random() - 0.5) * 0.15 },
      roughness: 0.98
    });

    // Jagged splintered fracture pieces at trunk top
    voxel.addBlock(tree, 0.22, 0.8, 0.22, splinterWood, 0.1, trunkH + 0.3, 0);
    voxel.addBlock(tree, 0.15, 0.5, 0.15, splinterWood, -0.1, trunkH + 0.15, 0.1);

    // Bare, twisted branches
    const branches = [
      { y: trunkH * 0.6, len: 1.6, rotZ: 0.7, rotY: 0.5 },
      { y: trunkH * 0.75, len: 1.3, rotZ: -0.8, rotY: 2.2 },
      { y: trunkH * 0.85, len: 1.1, rotZ: 0.6, rotY: -1.2 }
    ];

    branches.forEach((b) => {
      const bGrp = new THREE.Group();
      bGrp.position.set(0, b.y, 0);
      bGrp.rotation.y = b.rotY;
      bGrp.rotation.z = b.rotZ;
      voxel.addBlock(bGrp, 0.16, b.len, 0.16, charredWood, 0, b.len / 2, 0);
      // Secondary twig
      voxel.addBlock(bGrp, 0.1, 0.6, 0.1, charredWood, 0.1, b.len * 0.7, 0, {
        rotation: { z: 0.6 }
      });
      tree.add(bGrp);
    });

    this.group.add(tree);
  }

  buildDeciduousTree(x, z, scale = 1.0) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.set(scale, scale, scale);

    const trunkCol = 0x483626;
    const leafCol = Math.random() > 0.5 ? 0x8a4b28 : 0x9e6a2b; // Autumn decay

    const trunkH = 2.8;
    voxel.addBlock(tree, 0.4, trunkH, 0.4, trunkCol, 0, trunkH / 2, 0);

    // Chunky voxel canopy
    const canopyY = trunkH + 0.8;
    voxel.addBlock(tree, 2.6, 1.6, 2.6, leafCol, 0, canopyY, 0, { roughness: 0.85 });
    voxel.addBlock(tree, 1.8, 1.0, 1.8, leafCol, 0, canopyY + 1.1, 0, { roughness: 0.85 });
    voxel.addBlock(tree, 1.6, 0.9, 1.6, leafCol, 0.6, canopyY - 0.2, 0.4, { roughness: 0.85 });

    this.group.add(tree);
  }

  buildConiferTrees() {
    // Strategic placement creating an organic forest perimeter around the camp
    const pines = [
      // North forest edge
      { x: -5, z: -10, s: 1.2, c: 0 },
      { x: -1, z: -12, s: 1.4, c: 1 },
      { x: 3, z: -11, s: 1.1, c: 2 },
      { x: 7, z: -13, s: 1.3, c: 3 },
      { x: -9, z: -8, s: 1.0, c: 0 },
      // East forest edge (near highway)
      { x: 12, z: -6, s: 1.3, c: 1 },
      { x: 11, z: 2, s: 1.2, c: 2 },
      { x: 13, z: 8, s: 1.4, c: 0 },
      { x: 10, z: 15, s: 1.1, c: 3 },
      // South forest edge
      { x: 6, z: 12, s: 1.3, c: 1 },
      { x: 1, z: 14, s: 1.2, c: 0 },
      { x: -4, z: 13, s: 1.4, c: 2 },
      { x: -8, z: 11, s: 1.1, c: 3 },
      // West perimeter (near outpost)
      { x: -14, z: -2.5, s: 1.2, c: 1 },
      { x: -12, z: 4, s: 1.3, c: 0 },
      { x: -10, z: 8, s: 1.0, c: 2 }
    ];

    pines.forEach(p => this.buildPineTree(p.x, p.z, p.s, p.c));
  }

  buildDeadTrees() {
    // Eerie dead trees positioned in key view corridors
    const deadTrees = [
      { x: -7, z: -5, s: 1.1 },
      { x: 8.5, z: -1.5, s: 1.2 },
      { x: 5, z: 6, s: 1.0 },
      { x: -9, z: 2, s: 1.3 },
      { x: -13, z: -9, s: 0.9 },
      { x: 14, z: -12, s: 1.2 }
    ];

    deadTrees.forEach(d => this.buildDeadTree(d.x, d.z, d.s));
  }

  buildDeciduousTrees() {
    const deciduous = [
      { x: -3, z: -8, s: 1.1 },
      { x: 5, z: -9, s: 1.0 },
      { x: 8, z: 10, s: 1.2 },
      { x: -7, z: 8, s: 0.95 }
    ];

    deciduous.forEach(t => this.buildDeciduousTree(t.x, t.z, t.s));
  }

  buildFallenLogs() {
    const woodBark = 0x3d2b1f;
    const mossCol = 0x3a5426;

    const makeLog = (x, z, len, rotY) => {
      const log = new THREE.Group();
      log.position.set(x, 0.22, z);
      log.rotation.y = rotY;

      // Fallen cylinder trunk
      voxel.addBlock(log, 0.42, 0.42, len, woodBark, 0, 0, 0, { roughness: 0.95 });
      // Moss growth on top surface
      voxel.addBlock(log, 0.44, 0.08, len * 0.65, mossCol, 0, 0.22, 0, { roughness: 0.9 });
      // Hollow shattered end
      voxel.addBlock(log, 0.24, 0.24, 0.1, 0x15100c, 0, 0, len / 2 + 0.02);

      this.group.add(log);
    };

    makeLog(-6.5, 0.5, 3.2, 0.6);
    makeLog(7.2, 1.8, 3.8, -0.4);
    makeLog(0.5, -6.5, 2.8, 1.3);
  }

  buildBoulders() {
    const rockCol1 = 0x4e4944;
    const rockCol2 = 0x3d3a36;
    const lichenCol = 0x5a6344;

    const makeBoulderCluster = (x, z, s = 1.0) => {
      const bGrp = new THREE.Group();
      bGrp.position.set(x, 0, z);
      bGrp.scale.set(s, s, s);

      // Main boulder
      voxel.addBlock(bGrp, 1.4, 0.9, 1.3, rockCol1, 0, 0.45, 0, {
        rotation: { y: Math.random() * 2 },
        roughness: 0.96
      });
      // Top cap with lichen
      voxel.addBlock(bGrp, 0.9, 0.4, 0.8, lichenCol, 0.2, 0.9, 0.1, { roughness: 0.92 });
      // Flanking smaller rock
      voxel.addBlock(bGrp, 0.8, 0.5, 0.7, rockCol2, -0.7, 0.25, 0.4, { roughness: 0.95 });

      this.group.add(bGrp);
    };

    makeBoulderCluster(-8.5, -3.2, 1.2);
    makeBoulderCluster(6.8, -7.5, 1.4);
    makeBoulderCluster(9.5, 5.0, 1.1);
    makeBoulderCluster(-2.5, 7.5, 0.9);
  }

  buildBushes() {
    const bushColors = [0x324724, 0x293d1e, 0x3d542c];
    for (let i = 0; i < 28; i++) {
      const rx = (Math.random() - 0.5) * 34;
      const rz = (Math.random() - 0.5) * 34;
      // Don't spawn on road or fire
      if (rx > 14 && rx < 22) continue;
      if (Math.abs(rx) < 2.5 && Math.abs(rz) < 2.5) continue;

      const col = bushColors[i % bushColors.length];
      const w = 0.7 + Math.random() * 0.6;
      const h = 0.5 + Math.random() * 0.4;
      const d = 0.7 + Math.random() * 0.6;

      const bush = voxel.addBlock(this.group, w, h, d, col, rx, h / 2 + 0.1, rz, {
        rotation: { y: Math.random() * 3.14 },
        roughness: 0.9
      });
    }
  }

  buildMushrooms() {
    // Bioluminescent & wild mushrooms near damp fallen logs and tree roots
    const spots = [
      { x: -6.8, z: 0.9, bio: true },
      { x: -6.2, z: 0.2, bio: false },
      { x: 7.5, z: 2.1, bio: true },
      { x: 0.2, z: -6.8, bio: false },
      { x: 0.8, z: -6.2, bio: true }
    ];

    spots.forEach(s => {
      const stem = voxel.addBlock(this.group, 0.08, 0.24, 0.08, 0xded8cc, s.x, 0.22, s.z);
      if (s.bio) {
        // Glowing cyan/green bioluminescent mushroom cap
        voxel.addBlock(this.group, 0.22, 0.1, 0.22, 0x44ffaa, s.x, 0.38, s.z, {
          emissive: 0x22cc77,
          emissiveIntensity: 0.9
        });
      } else {
        // Red spotted fly agaric
        voxel.addBlock(this.group, 0.24, 0.1, 0.24, 0xc72c21, s.x, 0.38, s.z);
        voxel.addBlock(this.group, 0.06, 0.04, 0.06, 0xffffff, s.x + 0.05, 0.44, s.z);
      }
    });
  }

  buildHighwayProps() {
    const roadX = 18;

    // 1. Steel Crash Guardrail along West edge of highway
    const railCol = 0x6e757d;
    const rustCol = 0x8a452c;
    for (let i = -16; i <= 16; i += 4) {
      // Post
      voxel.addBlock(this.group, 0.16, 0.85, 0.16, railCol, roadX - 3.4, 0.45, i, { metalness: 0.7 });
      // W-beam rail segment
      const isRusted = Math.abs(i) === 8;
      voxel.addBlock(
        this.group,
        0.08,
        0.35,
        4.0,
        isRusted ? rustCol : railCol,
        roadX - 3.4,
        0.65,
        i + 2,
        {
          metalness: 0.7,
          roughness: 0.5
        }
      );
    }

    // 2. Abandoned Highway Evacuation Sign
    const signGroup = new THREE.Group();
    signGroup.position.set(roadX + 2.8, 0, -4);
    signGroup.rotation.y = -0.3;

    // Dual steel support poles
    voxel.addBlock(signGroup, 0.12, 3.2, 0.12, 0x4a4f54, -0.9, 1.6, 0, { metalness: 0.8 });
    voxel.addBlock(signGroup, 0.12, 3.2, 0.12, 0x4a4f54, 0.9, 1.6, 0, { metalness: 0.8 });
    // Sign board (highway green with white border)
    voxel.addBlock(signGroup, 2.4, 1.3, 0.08, 0x1f5c36, 0, 2.8, 0.05, { roughness: 0.6 });
    voxel.addBlock(signGroup, 2.2, 1.1, 0.02, 0x277243, 0, 2.8, 0.1);
    // Red spray-paint cross over sign: "EVACUATION FAILED"
    voxel.addBlock(signGroup, 1.8, 0.18, 0.04, 0xaa2218, 0, 2.8, 0.12, { rotation: { z: 0.3 } });
    voxel.addBlock(signGroup, 1.8, 0.18, 0.04, 0xaa2218, 0, 2.8, 0.12, { rotation: { z: -0.3 } });

    this.group.add(signGroup);

    // 3. Yellow/Black Hazard Striped Traffic Barrier on road
    const barrier = new THREE.Group();
    barrier.position.set(roadX - 0.5, 0, 6);
    barrier.rotation.y = 0.25;

    voxel.addBlock(barrier, 2.8, 0.3, 0.1, 0xded32c, 0, 0.8, 0); // Yellow board
    // Black stripes
    for (let s = -1.0; s <= 1.0; s += 0.5) {
      voxel.addBlock(barrier, 0.22, 0.32, 0.12, 0x1a1a1c, s, 0.8, 0, { rotation: { z: 0.4 } });
    }
    // A-frame legs
    voxel.addBlock(barrier, 0.12, 0.95, 0.12, 0x4a4f54, -1.2, 0.45, 0, { rotation: { x: 0.25 } });
    voxel.addBlock(barrier, 0.12, 0.95, 0.12, 0x4a4f54, -1.2, 0.45, 0, { rotation: { x: -0.25 } });
    voxel.addBlock(barrier, 0.12, 0.95, 0.12, 0x4a4f54, 1.2, 0.45, 0, { rotation: { x: 0.25 } });
    voxel.addBlock(barrier, 0.12, 0.95, 0.12, 0x4a4f54, 1.2, 0.45, 0, { rotation: { x: -0.25 } });

    this.group.add(barrier);
  }
}
