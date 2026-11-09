import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

export class AbandonedBuilding {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned on the North-West elevation
    this.group.position.set(-16, 1.3, -14);
    
    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.buildFoundationAndFloors();
    this.buildWalls();
    this.buildCollapsedZone();
    this.buildRooftopAndBeams();
    this.buildInteriorDetails();
    this.buildOvergrowthAndVines();

    // Merge static outpost architecture into minimal draw calls
    voxel.mergeStaticGroup(this.group, { castShadow: true, receiveShadow: true });
  }

  buildFoundationAndFloors() {
    const concrete = 0x484c50;
    // Ground floor slab (8x8)
    voxel.addBlock(this.group, 8.4, 0.35, 8.4, concrete, 0, 0.18, 0, { roughness: 0.95 });

    // Second floor observation mezzanine (partially collapsed)
    // Front half remains, back-left is destroyed
    voxel.addBlock(this.group, 4.5, 0.28, 7.8, concrete, 1.8, 3.4, 0, { roughness: 0.95 });
    voxel.addBlock(this.group, 3.2, 0.28, 3.8, concrete, -2.2, 3.4, 1.8, { roughness: 0.95 });
  }

  buildWalls() {
    const brickCol = 0x663c32; // Weathered red brick
    const concreteCol = 0x555a60;
    const woodBoard = 0x4e3a29;

    // 1. East Wall (mostly intact, facing the camp)
    // Lower wall
    voxel.addBlock(this.group, 0.45, 3.2, 8.0, brickCol, 4.0, 1.6, 0);
    // Upper wall with broken window opening
    voxel.addBlock(this.group, 0.45, 2.0, 2.8, brickCol, 4.0, 4.4, -2.4);
    voxel.addBlock(this.group, 0.45, 2.0, 2.8, brickCol, 4.0, 4.4, 2.4);
    voxel.addBlock(this.group, 0.45, 0.5, 2.4, concreteCol, 4.0, 3.65, 0); // window sill
    voxel.addBlock(this.group, 0.45, 0.5, 2.4, concreteCol, 4.0, 5.15, 0); // window lintel
    
    // Nailed wooden barricade planks across window
    voxel.addBlock(this.group, 0.1, 0.22, 2.6, woodBoard, 4.25, 4.1, 0, { rotation: { x: 0.12 } });
    voxel.addBlock(this.group, 0.1, 0.22, 2.6, woodBoard, 4.25, 4.5, 0, { rotation: { x: -0.15 } });
    voxel.addBlock(this.group, 0.1, 0.22, 2.6, woodBoard, 4.25, 4.85, 0, { rotation: { x: 0.05 } });

    // 2. South Wall (front entrance facing camera)
    // Left column
    voxel.addBlock(this.group, 2.4, 3.2, 0.45, brickCol, -2.8, 1.6, 4.0);
    // Right column
    voxel.addBlock(this.group, 2.4, 3.2, 0.45, brickCol, 2.8, 1.6, 4.0);
    // Doorway lintel
    voxel.addBlock(this.group, 3.2, 0.6, 0.45, concreteCol, 0, 3.0, 4.0);

    // Upper front wall
    voxel.addBlock(this.group, 8.0, 1.8, 0.45, brickCol, 0, 4.4, 4.0);

    // 3. North Wall (rear)
    voxel.addBlock(this.group, 8.0, 5.2, 0.45, brickCol, 0, 2.6, -4.0);
  }

  buildCollapsedZone() {
    // West Wall is collapsed and shattered!
    const concreteCol = 0x52565c;
    const rebarCol = 0x7a3e2e; // Rusted red rebar
    const rubbleCol = 0x5a5550;

    // Remaining jagged wall stump on West side
    voxel.addBlock(this.group, 0.45, 1.8, 3.5, 0x663c32, -4.0, 0.9, 2.2);
    // Jagged stepped concrete fracture
    voxel.addBlock(this.group, 0.45, 0.9, 1.2, concreteCol, -4.0, 2.2, 2.8);

    // Rebar rods sticking out like menacing metal spikes
    for (let i = 0; i < 5; i++) {
      const rebar = voxel.addBlock(this.group, 0.05, 1.2, 0.05, rebarCol, -4.0, 2.2 + i * 0.2, 1.2 + i * 0.35, {
        rotation: {
          x: (Math.random() - 0.5) * 0.6,
          z: -0.4 - Math.random() * 0.3
        },
        metalness: 0.85,
        roughness: 0.5
      });
    }

    // Concrete Rubble Heap spilling out onto the dirt
    const rubbleCount = 22;
    for (let i = 0; i < rubbleCount; i++) {
      const rx = -4.5 - Math.random() * 2.8;
      const rz = -1.5 + (Math.random() - 0.5) * 4.5;
      const ry = 0.2 + Math.random() * 0.7;
      const rw = 0.35 + Math.random() * 0.6;
      const rh = 0.2 + Math.random() * 0.4;
      const rd = 0.35 + Math.random() * 0.6;

      voxel.addBlock(this.group, rw, rh, rd, rubbleCol, rx, ry, rz, {
        rotation: {
          x: Math.random() * 1.5,
          y: Math.random() * 3.14,
          z: Math.random() * 1.5
        },
        roughness: 0.98
      });
    }

    // Brick debris pieces (red accents in rubble)
    for (let i = 0; i < 14; i++) {
      const rx = -3.8 - Math.random() * 2.5;
      const rz = -2.0 + (Math.random() - 0.5) * 5.0;
      voxel.addBlock(this.group, 0.28, 0.14, 0.16, 0x733f34, rx, 0.2 + Math.random() * 0.4, rz, {
        rotation: { y: Math.random() * 3.14 }
      });
    }
  }

  buildRooftopAndBeams() {
    const beamCol = 0x6e3828; // Heavy rusted iron
    const concreteCol = 0x484c50;

    // Rusted steel I-beam dangling from cracked roof
    const beam1 = voxel.addBlock(this.group, 0.2, 0.35, 5.5, beamCol, 1.5, 5.3, 0, {
      metalness: 0.8,
      roughness: 0.6
    });
    // Cross beam sagging downward into the rubble
    const sagBeam = voxel.addBlock(this.group, 4.2, 0.25, 0.2, beamCol, -1.8, 4.6, -1.2, {
      rotation: { z: 0.22 },
      metalness: 0.8,
      roughness: 0.6
    });

    // Rooftop parapet on remaining intact sections
    voxel.addBlock(this.group, 0.3, 0.8, 8.0, concreteCol, 4.0, 5.7, 0);
    voxel.addBlock(this.group, 8.0, 0.8, 0.3, concreteCol, 0, 5.7, 4.0);

    // Weathered radio antenna mast mounted on roof
    voxel.addBlock(this.group, 0.12, 3.2, 0.12, 0x33373b, 3.6, 7.0, 3.4, { metalness: 0.85 });
    voxel.addBlock(this.group, 1.4, 0.08, 0.08, 0x33373b, 3.6, 8.0, 3.4, { metalness: 0.85 });
  }

  buildInteriorDetails() {
    // Overturned rusted filing cabinet inside ground floor
    voxel.addBlock(this.group, 0.6, 1.1, 0.5, 0x3d4a46, 2.2, 0.3, -2.0, {
      rotation: { z: 1.4, y: 0.3 },
      metalness: 0.6
    });

    // Broken wooden table
    voxel.addBlock(this.group, 1.6, 0.1, 0.9, 0x4d3725, 1.0, 0.55, 1.2, {
      rotation: { z: -0.2 }
    });
    voxel.addBlock(this.group, 0.12, 0.8, 0.12, 0x3d2b1d, 1.6, 0.4, 1.5);

    // Ominous warning graffiti / biohazard stencil painted on South Wall
    // White/yellow faded paint voxels
    voxel.addBlock(this.group, 2.6, 0.35, 0.04, 0xd0c8a8, 0, 2.4, 4.24, {
      roughness: 0.8
    });
    // Blood / rust splatter marks
    voxel.addBlock(this.group, 0.45, 0.8, 0.04, 0x661814, -1.8, 1.8, 4.24);
  }

  buildOvergrowthAndVines() {
    // Post-apocalyptic creeping ivy vines scaling the exterior concrete & brick
    const vineColors = [0x2f4625, 0x3d582e, 0x24391c];

    for (let i = 0; i < 18; i++) {
      const vCol = vineColors[i % vineColors.length];
      const y = 0.5 + Math.random() * 3.5;
      const z = -3.5 + Math.random() * 7.0;
      
      // East wall vines
      voxel.addBlock(
        this.group,
        0.06,
        0.5 + Math.random() * 0.8,
        0.4 + Math.random() * 0.5,
        vCol,
        4.24,
        y,
        z,
        {
          rotation: { x: (Math.random() - 0.5) * 0.4 },
          roughness: 0.9
        }
      );
    }
  }
}
