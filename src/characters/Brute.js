import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

/**
 * The Brute — Massive Apex Mutant Tank
 * Visual Reference: public/references/characters/brute.jpg
 * - Towering 2.6m tall gorilla/tank silhouette with broad shoulders and hunched spine
 * - Mutated slate-grey hide with glowing volcanic magma veins running along back and arms
 * - Heavy stone/club fists capable of crushing barricades
 * - Tattered combat tactical vest & reinforced heavy trousers
 * - Animated breathing, lumbering sway, and aggressive roar recoil
 */
export class Brute {
  constructor(scene, position = new THREE.Vector3(12.0, 0.1, 42.0)) {
    this.scene = scene;
    this.position = position;
    this.group = new THREE.Group();
    this.group.name = 'BruteMutant';
    this.group.position.copy(position);
    this.group.rotation.y = -2.2; // Facing toward the jungle path

    this.parts = {};
    this.currentAnimation = 'idle'; // 'idle', 'roar', 'walk'
    this.animTime = 0;

    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.buildBruteModel();
  }

  buildBruteModel() {
    // Proportions: Height ~2.65m, Shoulder Width ~1.7m
    const hideGrey = 0x42464d; // Mutated thick slate-grey flesh
    const hideDark = 0x2e3238;
    const magmaGlow = 0xff4400; // Glowing volcanic fissure veins
    const eyeYellow = 0xffcc00;
    const boneSpike = 0xded4c5;
    const tornVest = 0x24201c;
    const pantsCol = 0x1e2024;

    // 1. Pelvis / Massive Hips
    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.95, 0);
    this.parts.pelvis = pelvis;
    this.group.add(pelvis);

    voxel.addBlock(pelvis, 0.85, 0.35, 0.55, pantsCol, 0, 0, 0, { roughness: 0.9 });

    // 2. Torso (Massive hunched barrel chest)
    const torso = new THREE.Group();
    torso.position.set(0, 0.15, 0);
    pelvis.add(torso);
    this.parts.torso = torso;

    // Abdomen
    voxel.addBlock(torso, 0.95, 0.5, 0.6, hideGrey, 0, 0.25, 0);

    // Upper Barrel Chest (Massive 1.4m wide)
    voxel.addBlock(torso, 1.4, 0.85, 0.85, hideGrey, 0, 0.85, 0.05, { roughness: 0.85 });
    // Tattered Kevlar Vest Remnants across ribs
    voxel.addBlock(torso, 1.44, 0.45, 0.88, tornVest, 0, 0.75, 0.06);

    // Hunched mutated muscular back hump
    voxel.addBlock(torso, 1.1, 0.7, 0.5, hideDark, 0, 1.1, -0.3, { rotation: { x: 0.2 } });

    // Glowing Magma Fissures pulsing along spine and shoulder blades
    voxel.addBlock(torso, 0.15, 0.8, 0.1, magmaGlow, 0, 0.95, -0.46, {
      emissive: magmaGlow,
      emissiveIntensity: 1.8
    });
    voxel.addBlock(torso, 0.45, 0.12, 0.1, magmaGlow, 0, 1.25, -0.46, {
      emissive: magmaGlow,
      emissiveIntensity: 1.8
    });
    voxel.addBlock(torso, 0.1, 0.4, 0.1, magmaGlow, -0.35, 1.05, -0.42, {
      emissive: magmaGlow,
      emissiveIntensity: 1.5
    });
    voxel.addBlock(torso, 0.1, 0.4, 0.1, magmaGlow, 0.35, 1.05, -0.42, {
      emissive: magmaGlow,
      emissiveIntensity: 1.5
    });

    // Calcified bone spikes erupting from shoulders
    voxel.addBlock(torso, 0.18, 0.45, 0.18, boneSpike, -0.55, 1.35, -0.2, { rotation: { z: 0.4, x: -0.2 } });
    voxel.addBlock(torso, 0.18, 0.45, 0.18, boneSpike, 0.55, 1.35, -0.2, { rotation: { z: -0.4, x: -0.2 } });

    // 3. Head (Hunched low between massive shoulders)
    const head = new THREE.Group();
    head.position.set(0, 1.15, 0.38);
    torso.add(head);
    this.parts.head = head;

    // Brutish mutated skull
    voxel.addBlock(head, 0.52, 0.48, 0.55, hideGrey, 0, 0, 0);
    // Heavy protruding brow ridge
    voxel.addBlock(head, 0.54, 0.14, 0.3, hideDark, 0, 0.12, 0.22);
    // Glowing yellow predatory eyes
    voxel.addBlock(head, 0.1, 0.08, 0.06, eyeYellow, -0.16, 0.06, 0.28, { emissive: eyeYellow, emissiveIntensity: 2.0 });
    voxel.addBlock(head, 0.1, 0.08, 0.06, eyeYellow, 0.16, 0.06, 0.28, { emissive: eyeYellow, emissiveIntensity: 2.0 });
    // Massive lower jaw with exposed tusks
    voxel.addBlock(head, 0.48, 0.2, 0.35, hideDark, 0, -0.2, 0.15);
    voxel.addBlock(head, 0.08, 0.18, 0.08, boneSpike, -0.18, -0.08, 0.32);
    voxel.addBlock(head, 0.08, 0.18, 0.08, boneSpike, 0.18, -0.08, 0.32);

    // 4. Massive Left Arm & Club Fist
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.85, 1.1, 0.05);
    torso.add(leftShoulder);
    this.parts.leftShoulder = leftShoulder;

    // Muscular Deltoid
    voxel.addBlock(leftShoulder, 0.55, 0.55, 0.55, hideGrey, 0, -0.1, 0);
    // Upper Arm
    voxel.addBlock(leftShoulder, 0.45, 0.65, 0.45, hideGrey, 0, -0.55, 0);

    // Left Forearm
    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -0.85, 0);
    leftShoulder.add(leftForearm);
    this.parts.leftForearm = leftForearm;

    voxel.addBlock(leftForearm, 0.5, 0.75, 0.5, hideDark, 0, -0.3, 0);
    // Massive Crushing Fist
    voxel.addBlock(leftForearm, 0.6, 0.55, 0.6, 0x222428, 0, -0.85, 0, { roughness: 0.95 });

    // 5. Massive Right Arm & Club Fist
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.85, 1.1, 0.05);
    torso.add(rightShoulder);
    this.parts.rightShoulder = rightShoulder;

    voxel.addBlock(rightShoulder, 0.55, 0.55, 0.55, hideGrey, 0, -0.1, 0);
    voxel.addBlock(rightShoulder, 0.45, 0.65, 0.45, hideGrey, 0, -0.55, 0);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.85, 0);
    rightShoulder.add(rightForearm);
    this.parts.rightForearm = rightForearm;

    voxel.addBlock(rightForearm, 0.5, 0.75, 0.5, hideDark, 0, -0.3, 0);
    voxel.addBlock(rightForearm, 0.6, 0.55, 0.6, 0x222428, 0, -0.85, 0, { roughness: 0.95 });

    // 6. Left Heavy Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.35, -0.15, 0);
    pelvis.add(leftLeg);
    this.parts.leftLeg = leftLeg;

    voxel.addBlock(leftLeg, 0.42, 0.65, 0.42, pantsCol, 0, -0.25, 0);
    voxel.addBlock(leftLeg, 0.44, 0.6, 0.44, hideDark, 0, -0.75, 0.05);
    voxel.addBlock(leftLeg, 0.48, 0.35, 0.68, 0x151618, 0, -1.05, 0.1); // Massive foot

    // 7. Right Heavy Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.35, -0.15, 0);
    pelvis.add(rightLeg);
    this.parts.rightLeg = rightLeg;

    voxel.addBlock(rightLeg, 0.42, 0.65, 0.42, pantsCol, 0, -0.25, 0);
    voxel.addBlock(rightLeg, 0.44, 0.6, 0.44, hideDark, 0, -0.75, 0.05);
    voxel.addBlock(rightLeg, 0.48, 0.35, 0.68, 0x151618, 0, -1.05, 0.1);

    // Merge static limb segments for maximum frame rate (60+ FPS)
    voxel.mergeStaticGroup(head, { castShadow: true, receiveShadow: false });
    voxel.mergeStaticGroup(leftForearm, { castShadow: true, receiveShadow: false });
    voxel.mergeStaticGroup(rightForearm, { castShadow: true, receiveShadow: false });
    voxel.mergeStaticGroup(leftLeg, { castShadow: true, receiveShadow: false });
    voxel.mergeStaticGroup(rightLeg, { castShadow: true, receiveShadow: false });

    // Set receiveShadow to false on all brute limbs for 60 FPS performance!
    this.group.traverse(child => {
      if (child.isMesh) {
        child.receiveShadow = false;
        child.castShadow = true;
      }
    });
  }

  setAnimation(anim) {
    this.currentAnimation = anim;
  }

  update(delta) {
    this.animTime += delta;
    const t = this.animTime;

    if (this.currentAnimation === 'idle') {
      // Heavy deep mutant breathing cycle
      const breathe = Math.sin(t * 1.6);
      if (this.parts.torso) {
        this.parts.torso.position.y = 0.15 + breathe * 0.025;
        this.parts.torso.scale.set(1.0 + breathe * 0.02, 1.0 + breathe * 0.015, 1.0 + breathe * 0.03);
      }
      if (this.parts.leftShoulder) {
        this.parts.leftShoulder.rotation.x = Math.sin(t * 1.6) * 0.08;
        this.parts.leftShoulder.rotation.z = -0.15 + Math.cos(t * 1.6) * 0.03;
      }
      if (this.parts.rightShoulder) {
        this.parts.rightShoulder.rotation.x = Math.sin(t * 1.6) * 0.08;
        this.parts.rightShoulder.rotation.z = 0.15 - Math.cos(t * 1.6) * 0.03;
      }
      if (this.parts.head) {
        this.parts.head.rotation.y = Math.sin(t * 0.8) * 0.15;
      }
    } else if (this.currentAnimation === 'roar') {
      // Intimidating roar & ground slam recoil
      const roarCycle = Math.sin(t * 4.0);
      if (this.parts.torso) {
        this.parts.torso.rotation.x = -0.2 + roarCycle * 0.1;
      }
      if (this.parts.head) {
        this.parts.head.rotation.x = 0.35 + roarCycle * 0.15;
      }
      if (this.parts.leftShoulder) {
        this.parts.leftShoulder.rotation.x = -0.6 + roarCycle * 0.4;
      }
      if (this.parts.rightShoulder) {
        this.parts.rightShoulder.rotation.x = -0.6 + roarCycle * 0.4;
      }
    }
  }
}
