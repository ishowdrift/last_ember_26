import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';
import { Campfire } from '../effects/Campfire.js';

export class Camp {
  constructor(scene, lightingManager) {
    this.scene = scene;
    this.lightingManager = lightingManager;
    this.group = new THREE.Group();
    
    this.campfire = null;
    this.lanterns = [];
    
    this.init();
    this.scene.add(this.group);
  }

  init() {
    // 1. Central Campfire
    this.campfire = new Campfire(this.group, new THREE.Vector3(0, 0, 0));

    // 2. Seating around campfire
    this.buildSeating();

    // 3. Survival Tents and Shelters
    this.buildCanvasTent();
    this.buildLeanToShelter();

    // 4. Perimeter Barricades and Defenses
    this.buildBarricades();

    // 5. Lantern Posts
    this.buildLanternPosts();

    // 6. Crates and Supply Stacks
    this.buildSupplyCrates();

    // 7. Barrels and Containers
    this.buildBarrels();

    // 8. Worktable / Bench
    this.buildWorkbench();

    // Merge static camp props into minimal high-performance draw calls
    // (Campfire flames & coals are marked with userData.isDynamic = true and remain unmerged)
    voxel.mergeStaticGroup(this.group, { castShadow: true, receiveShadow: true });
  }

  buildSeating() {
    const woodBark = 0x3d2b1f;
    const woodCore = 0x6e5239;

    // Log Bench North of campfire
    const bench1 = new THREE.Group();
    bench1.position.set(0, 0, -2.2);
    // Main log
    voxel.addBlock(bench1, 2.4, 0.35, 0.5, woodCore, 0, 0.35, 0, { roughness: 0.9 });
    // Bark trim
    voxel.addBlock(bench1, 2.42, 0.1, 0.52, woodBark, 0, 0.2, 0, { roughness: 0.95 });
    // Support stumps
    voxel.addBlock(bench1, 0.35, 0.25, 0.4, woodBark, -0.85, 0.12, 0);
    voxel.addBlock(bench1, 0.35, 0.25, 0.4, woodBark, 0.85, 0.12, 0);
    this.group.add(bench1);

    // Tree Stump Stool East
    const stool1 = new THREE.Group();
    stool1.position.set(2.0, 0, 0.8);
    voxel.addBlock(stool1, 0.6, 0.45, 0.6, woodBark, 0, 0.22, 0);
    voxel.addBlock(stool1, 0.52, 0.05, 0.52, woodCore, 0, 0.45, 0);
    // Tin mug resting on stool
    voxel.addBlock(stool1, 0.14, 0.16, 0.14, 0x8a929a, 0.1, 0.55, 0.1, { metalness: 0.7, roughness: 0.4 });
    this.group.add(stool1);

    // Tree Stump Stool West
    const stool2 = new THREE.Group();
    stool2.position.set(-1.9, 0, 1.0);
    voxel.addBlock(stool2, 0.55, 0.4, 0.55, woodBark, 0, 0.2, 0);
    voxel.addBlock(stool2, 0.48, 0.05, 0.48, woodCore, 0, 0.42, 0);
    this.group.add(stool2);
  }

  buildCanvasTent() {
    // A-frame survival tent located at (-3.8, 0, 2.8)
    const tent = new THREE.Group();
    tent.position.set(-4.0, 0, 2.8);
    tent.rotation.y = 0.4;

    const tarpCol = 0x3d4e38; // Military weathered green canvas
    const timberCol = 0x4a3627;
    const floorCol = 0x2e3526;

    // Ground groundsheet
    voxel.addBlock(tent, 2.6, 0.08, 3.2, floorCol, 0, 0.04, 0, { roughness: 0.95 });

    // Wooden A-frame ridge pole
    voxel.addBlock(tent, 0.12, 0.12, 3.4, timberCol, 0, 1.85, 0);
    // Front A poles
    voxel.addBlock(tent, 0.1, 2.1, 0.1, timberCol, -0.65, 0.95, 1.6, { rotation: { z: -0.36 } });
    voxel.addBlock(tent, 0.1, 2.1, 0.1, timberCol, 0.65, 0.95, 1.6, { rotation: { z: 0.36 } });
    // Back A poles
    voxel.addBlock(tent, 0.1, 2.1, 0.1, timberCol, -0.65, 0.95, -1.6, { rotation: { z: -0.36 } });
    voxel.addBlock(tent, 0.1, 2.1, 0.1, timberCol, 0.65, 0.95, -1.6, { rotation: { z: 0.36 } });

    // Slanted canvas roof panels (stepped voxels)
    const roofSteps = 7;
    for (let i = 0; i < roofSteps; i++) {
      const frac = i / roofSteps;
      const y = 0.2 + frac * 1.6;
      const x = (1.0 - frac) * 1.25;
      const thickness = 0.1;
      const stepH = 1.7 / roofSteps;

      // Left roof slope
      voxel.addBlock(tent, 0.28, stepH, 3.2, tarpCol, -x, y, 0, { roughness: 0.9 });
      // Right roof slope
      voxel.addBlock(tent, 0.28, stepH, 3.2, tarpCol, x, y, 0, { roughness: 0.9 });
    }

    // Inside items: sleeping bag and roll mat
    voxel.addBlock(tent, 0.75, 0.15, 1.8, 0x1f3a52, -0.4, 0.15, 0, { roughness: 0.85 }); // blue sleeping bag
    voxel.addBlock(tent, 0.3, 0.2, 0.6, 0xd47a37, -0.4, 0.25, -0.7); // orange pillow/jacket
    // Flashlight on floor
    voxel.addBlock(tent, 0.1, 0.1, 0.3, 0x111111, 0.4, 0.12, 0.2, {
      emissive: 0xfffaaa,
      emissiveIntensity: 0.5
    });

    this.group.add(tent);
  }

  buildLeanToShelter() {
    // Improvised corrugated roof lean-to at (3.5, 0, -2.8)
    const shelter = new THREE.Group();
    shelter.position.set(3.5, 0, -2.8);
    shelter.rotation.y = -0.5;

    const postCol = 0x483626;
    const roofCol = 0x5a6368; // Rusted corrugated tin
    const rustCol = 0x7c4931;

    // 4 corner support posts
    voxel.addBlock(shelter, 0.2, 2.4, 0.2, postCol, -1.4, 1.2, -1.0);
    voxel.addBlock(shelter, 0.2, 2.4, 0.2, postCol, 1.4, 1.2, -1.0);
    voxel.addBlock(shelter, 0.2, 1.6, 0.2, postCol, -1.4, 0.8, 1.0);
    voxel.addBlock(shelter, 0.2, 1.6, 0.2, postCol, 1.4, 0.8, 1.0);

    // Cross beams
    voxel.addBlock(shelter, 3.0, 0.16, 0.16, postCol, 0, 2.35, -1.0);
    voxel.addBlock(shelter, 3.0, 0.16, 0.16, postCol, 0, 1.55, 1.0);
    voxel.addBlock(shelter, 0.16, 0.16, 2.2, postCol, -1.4, 1.95, 0, { rotation: { x: 0.38 } });
    voxel.addBlock(shelter, 0.16, 0.16, 2.2, postCol, 1.4, 1.95, 0, { rotation: { x: 0.38 } });

    // Slanted tin roof
    const roof = voxel.addBlock(shelter, 3.3, 0.08, 2.4, roofCol, 0, 2.0, 0, {
      rotation: { x: 0.38 },
      metalness: 0.6,
      roughness: 0.5
    });
    // Rust patch on tin roof
    voxel.addBlock(shelter, 1.4, 0.1, 1.0, rustCol, 0.6, 2.1, -0.2, {
      rotation: { x: 0.38 },
      roughness: 0.95
    });

    // Shelter back wall (stacked planks)
    for (let i = 0; i < 5; i++) {
      voxel.addBlock(shelter, 2.8, 0.38, 0.08, 0x3d2d1e, 0, 0.3 + i * 0.42, -1.0, {
        rotation: { y: (Math.random() - 0.5) * 0.03 }
      });
    }

    // Inside shelter: Old metal ham radio receiver on crate
    voxel.addBlock(shelter, 0.7, 0.6, 0.7, 0x5a432e, -0.6, 0.3, 0); // crate table
    voxel.addBlock(shelter, 0.45, 0.25, 0.35, 0x38413e, -0.6, 0.72, 0, { metalness: 0.5 }); // radio body
    voxel.addBlock(shelter, 0.04, 0.8, 0.04, 0x8a9296, -0.75, 1.1, -0.1, { metalness: 0.8 }); // whip antenna
    // Glowing green power LED
    voxel.addBlock(shelter, 0.05, 0.05, 0.05, 0x22ff44, -0.45, 0.75, 0.18, {
      emissive: 0x22ff44,
      emissiveIntensity: 1.0
    });

    this.group.add(shelter);
  }

  buildBarricades() {
    // Spiked timber barricades guarding the camp perimeter
    const woodBark = 0x3b2a1c;

    // Barricade 1: South entrance barrier
    const makeSpikeBarrier = (x, z, rotY) => {
      const bar = new THREE.Group();
      bar.position.set(x, 0, z);
      bar.rotation.y = rotY;

      // Horizontal support log
      voxel.addBlock(bar, 3.2, 0.24, 0.24, woodBark, 0, 0.55, 0);

      // Angled sharpened spikes
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Group();
        spike.position.set(-1.2 + i * 0.6, 0.55, 0);
        spike.rotation.x = 0.55; // Pointing outward
        // Main log
        voxel.addBlock(spike, 0.18, 1.4, 0.18, woodBark, 0, 0, 0);
        // Sharpened cone tip (stepped voxel)
        voxel.addBlock(spike, 0.12, 0.25, 0.12, 0x6e5239, 0, 0.8, 0);
        voxel.addBlock(spike, 0.06, 0.15, 0.06, 0x8a6a4a, 0, 0.98, 0);
        bar.add(spike);
      }

      // Crossed support legs
      voxel.addBlock(bar, 0.18, 1.1, 0.18, woodBark, -1.2, 0.5, 0, { rotation: { z: 0.5 } });
      voxel.addBlock(bar, 0.18, 1.1, 0.18, woodBark, -1.2, 0.5, 0, { rotation: { z: -0.5 } });
      voxel.addBlock(bar, 0.18, 1.1, 0.18, woodBark, 1.2, 0.5, 0, { rotation: { z: 0.5 } });
      voxel.addBlock(bar, 0.18, 1.1, 0.18, woodBark, 1.2, 0.5, 0, { rotation: { z: -0.5 } });

      return bar;
    };

    this.group.add(makeSpikeBarrier(-1.5, 5.0, 0.1));
    this.group.add(makeSpikeBarrier(3.5, 4.2, -0.4));
    this.group.add(makeSpikeBarrier(-5.2, -1.2, 1.4));

    // Sandbag bunker section North-East
    const sandbagCol = 0x8c7c5b;
    const sandGroup = new THREE.Group();
    sandGroup.position.set(4.8, 0, 1.5);
    sandGroup.rotation.y = -0.7;

    for (let layer = 0; layer < 4; layer++) {
      const count = 4;
      const offset = layer % 2 === 1 ? 0.3 : 0;
      for (let i = 0; i < count; i++) {
        voxel.addBlock(
          sandGroup,
          0.68,
          0.22,
          0.38,
          sandbagCol,
          -1.0 + i * 0.65 + offset,
          0.12 + layer * 0.22,
          0,
          { roughness: 0.95 }
        );
      }
    }
    this.group.add(sandGroup);
  }

  buildLanternPosts() {
    const postCol = 0x3b2a1c;
    const ironCol = 0x222225;

    const createLanternPost = (x, z) => {
      const post = new THREE.Group();
      post.position.set(x, 0, z);

      // Main vertical post
      voxel.addBlock(post, 0.22, 3.2, 0.22, postCol, 0, 1.6, 0);
      // Support struts
      voxel.addBlock(post, 0.15, 0.8, 0.15, postCol, 0, 0.4, 0.35, { rotation: { x: 0.6 } });
      // Curved iron hanger arm
      voxel.addBlock(post, 0.1, 0.1, 0.8, ironCol, 0, 3.1, 0.4, { metalness: 0.8 });
      voxel.addBlock(post, 0.08, 0.3, 0.08, ironCol, 0, 2.95, 0.75, { metalness: 0.8 });

      // Lantern body
      const lantern = new THREE.Group();
      lantern.position.set(0, 2.65, 0.75);

      // Metal cap & base
      voxel.addBlock(lantern, 0.3, 0.08, 0.3, ironCol, 0, 0.28, 0, { metalness: 0.8 });
      voxel.addBlock(lantern, 0.26, 0.06, 0.26, ironCol, 0, -0.25, 0, { metalness: 0.8 });
      // Glass chamber
      voxel.addBlock(lantern, 0.22, 0.45, 0.22, 0xffbb44, 0, 0.02, 0, {
        transparent: true,
        opacity: 0.85,
        emissive: 0xff8811,
        emissiveIntensity: 1.2
      });
      // Bright yellow flame wick inside
      voxel.addBlock(lantern, 0.08, 0.16, 0.08, 0xfffa88, 0, 0, 0, {
        emissive: 0xffffaa,
        emissiveIntensity: 2.0
      });

      post.add(lantern);

      // Dynamic warm point light
      if (this.lightingManager) {
        const worldPos = new THREE.Vector3(x, 2.65, z + 0.75);
        this.lightingManager.addLanternLight(worldPos, 0xffaa44, 1.8, 12);
      }

      return post;
    };

    this.group.add(createLanternPost(-2.2, -3.2));
    this.group.add(createLanternPost(3.0, 2.6));
  }

  buildSupplyCrates() {
    const crateCol1 = 0x5a4128;
    const crateCol2 = 0x483420;
    const bandCol = 0x222225;

    const makeCrate = (w, h, d, x, y, z, rotY = 0) => {
      const cr = new THREE.Group();
      cr.position.set(x, y + h / 2, z);
      cr.rotation.y = rotY;

      // Wood body
      voxel.addBlock(cr, w, h, d, Math.random() > 0.5 ? crateCol1 : crateCol2, 0, 0, 0, {
        roughness: 0.88
      });
      // Iron reinforcement corners/straps
      voxel.addBlock(cr, w + 0.02, 0.08, d + 0.02, bandCol, 0, h * 0.35, 0, { metalness: 0.7 });
      voxel.addBlock(cr, w + 0.02, 0.08, d + 0.02, bandCol, 0, -h * 0.35, 0, { metalness: 0.7 });

      return cr;
    };

    // Cluster 1: Tucked neatly beside the tent
    this.group.add(makeCrate(0.9, 0.8, 0.9, -4.6, 0, 1.4, 0.2));
    this.group.add(makeCrate(0.8, 0.7, 0.8, -4.5, 0.8, 1.3, -0.15));
    this.group.add(makeCrate(0.7, 0.6, 0.7, -3.9, 0, 1.8, 0.5));

    // Cluster 2: Near barricade
    this.group.add(makeCrate(1.0, 0.9, 1.0, 2.5, 0, 3.2, -0.3));
    this.group.add(makeCrate(0.85, 0.75, 0.85, 3.4, 0, 2.8, 0.1));
  }

  buildBarrels() {
    const makeBarrel = (x, z, colHex, dented = false) => {
      const b = new THREE.Group();
      b.position.set(x, 0, z);

      // Stepped cylinder barrel via voxels
      voxel.addBlock(b, 0.72, 0.15, 0.72, colHex, 0, 0.1, 0, { metalness: 0.5, roughness: 0.6 });
      voxel.addBlock(b, 0.78, 0.35, 0.78, colHex, 0, 0.35, 0, { metalness: 0.5, roughness: 0.6 });
      voxel.addBlock(b, 0.82, 0.45, 0.82, colHex, 0, 0.75, 0, { metalness: 0.5, roughness: 0.6 });
      voxel.addBlock(b, 0.78, 0.35, 0.78, colHex, 0, 1.15, 0, { metalness: 0.5, roughness: 0.6 });
      voxel.addBlock(b, 0.72, 0.15, 0.72, colHex, 0, 1.4, 0, { metalness: 0.5, roughness: 0.6 });

      // Black metal hoops
      voxel.addBlock(b, 0.83, 0.06, 0.83, 0x1a1a1c, 0, 0.55, 0, { metalness: 0.8 });
      voxel.addBlock(b, 0.83, 0.06, 0.83, 0x1a1a1c, 0, 0.95, 0, { metalness: 0.8 });

      if (dented) {
        b.rotation.z = 0.2;
        b.rotation.x = -0.15;
      }
      return b;
    };

    // Red fuel drum
    this.group.add(makeBarrel(1.8, -1.8, 0x99241e));
    // Olive military drum
    this.group.add(makeBarrel(2.6, -2.1, 0x3d4a2b));
    // Dented rusty blue drum
    this.group.add(makeBarrel(2.2, -2.7, 0x385266, true));
  }

  buildWorkbench() {
    // Survival workbench table at (3.2, 0, 0.5)
    const bench = new THREE.Group();
    bench.position.set(3.2, 0, 0.5);
    bench.rotation.y = -1.57;

    const woodDark = 0x422f20;
    const woodTop = 0x5e432d;

    // Legs
    voxel.addBlock(bench, 0.18, 0.95, 0.18, woodDark, -0.9, 0.48, -0.4);
    voxel.addBlock(bench, 0.18, 0.95, 0.18, woodDark, 0.9, 0.48, -0.4);
    voxel.addBlock(bench, 0.18, 0.95, 0.18, woodDark, -0.9, 0.48, 0.4);
    voxel.addBlock(bench, 0.18, 0.95, 0.18, woodDark, 0.9, 0.48, 0.4);
    // Tabletop
    voxel.addBlock(bench, 2.2, 0.12, 1.1, woodTop, 0, 0.98, 0, { roughness: 0.85 });

    // Back pegboard / tool rack
    voxel.addBlock(bench, 2.2, 1.0, 0.1, 0x38281b, 0, 1.5, -0.5);

    // Workbench items: Gunsmith vise, tool roll, oil bottle
    voxel.addBlock(bench, 0.22, 0.22, 0.22, 0x22252a, -0.8, 1.12, 0.2, { metalness: 0.8 }); // vise
    voxel.addBlock(bench, 0.12, 0.28, 0.12, 0x998822, 0.7, 1.15, -0.2, {
      transparent: true,
      opacity: 0.8
    }); // oil bottle

    this.group.add(bench);
  }

  update(delta) {
    if (this.campfire) {
      this.campfire.update(delta);
    }
  }
}
