import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

export class Survivor {
  constructor(scene, position = new THREE.Vector3(-2.2, 0.1, 1.2)) {
    this.scene = scene;
    this.position = position;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = 0.8; // Facing toward camp center and viewer

    // Hierarchical body parts for articulation
    this.parts = {};
    
    // Animation state
    this.currentAnimation = 'idle'; // 'idle', 'walk', 'combat', 'wave'
    this.animTime = 0;
    this.headLookAngle = 0;
    this.headLookTarget = 0;
    this.nextLookChange = 2.0;

    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.buildSurvivorModel();
  }

  buildSurvivorModel() {
    // Proportions: total height approx 1.82m
    const skinCol = 0xd4a373; // Weathered skin
    const hairCol = 0x2b1d14; // Dark brown hair
    const bandanaCol = 0xb91c1c; // Deep red survivor bandana
    const shirtCol = 0x3d433b; // Slate dark undershirt
    const vestCol = 0x4a5d3d; // Olive tactical plate carrier
    const pantsCol = 0x2b333a; // Dark combat cargo
    const bootCol = 0x1f1915; // Leather combat boots
    const leatherCol = 0x5a3e26; // Belts and holster
    const gloveCol = 0x282c30; // Fingerless gloves

    // 1. Pelvis / Hips (Root anchor)
    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.78, 0);
    this.parts.pelvis = pelvis;
    this.group.add(pelvis);

    voxel.addBlock(pelvis, 0.46, 0.2, 0.28, pantsCol, 0, 0, 0);
    // Leather utility belt
    voxel.addBlock(pelvis, 0.48, 0.08, 0.3, leatherCol, 0, 0.06, 0, { castShadow: false });
    // Silver belt buckle
    voxel.addBlock(pelvis, 0.12, 0.09, 0.32, 0x99a2ad, 0, 0.06, 0, { metalness: 0.8, castShadow: false });
    // Sidearm holster on right hip
    voxel.addBlock(pelvis, 0.1, 0.22, 0.14, leatherCol, 0.28, -0.05, 0, { castShadow: false });
    // Pistol grip sticking out of holster
    voxel.addBlock(pelvis, 0.06, 0.1, 0.08, 0x1a1a1a, 0.28, 0.1, -0.02, { metalness: 0.7, castShadow: false });

    // 2. Torso
    const torso = new THREE.Group();
    torso.position.set(0, 0.1, 0);
    pelvis.add(torso);
    this.parts.torso = torso;

    // Inner shirt body
    voxel.addBlock(torso, 0.5, 0.5, 0.3, shirtCol, 0, 0.25, 0);
    // Tactical plate carrier vest (front & back armor)
    voxel.addBlock(torso, 0.52, 0.42, 0.34, vestCol, 0, 0.27, 0, { roughness: 0.85 });
    // Mag pouches on chest
    voxel.addBlock(torso, 0.12, 0.16, 0.08, 0x3b4a30, -0.14, 0.2, 0.2, { castShadow: false });
    voxel.addBlock(torso, 0.12, 0.16, 0.08, 0x3b4a30, 0, 0.2, 0.2, { castShadow: false });
    voxel.addBlock(torso, 0.12, 0.16, 0.08, 0x3b4a30, 0.14, 0.2, 0.2, { castShadow: false });
    // Shoulder tactical radio with antenna
    voxel.addBlock(torso, 0.09, 0.14, 0.08, 0x1a1a1a, -0.22, 0.48, 0.05, { castShadow: false });
    voxel.addBlock(torso, 0.02, 0.32, 0.02, 0x777777, -0.22, 0.68, 0.05, { metalness: 0.9, castShadow: false });

    // Tactical Bug-out Backpack attached to torso back
    const backpack = new THREE.Group();
    backpack.position.set(0, 0.26, -0.25);
    // Main pack
    voxel.addBlock(backpack, 0.42, 0.48, 0.22, 0x4f4738, 0, 0, 0, { roughness: 0.9 });
    // Top rolled bedroll / sleeping pad
    voxel.addBlock(backpack, 0.46, 0.14, 0.14, 0x2d4356, 0, 0.3, 0);
    // Side canteen
    voxel.addBlock(backpack, 0.1, 0.2, 0.1, 0x222222, 0.25, 0, 0);
    torso.add(backpack);
    this.parts.backpack = backpack;

    // 3. Head & Neck
    const neck = new THREE.Group();
    neck.position.set(0, 0.5, 0);
    torso.add(neck);

    voxel.addBlock(neck, 0.18, 0.1, 0.18, skinCol, 0, 0.05, 0);

    const head = new THREE.Group();
    head.position.set(0, 0.1, 0);
    neck.add(head);
    this.parts.head = head;

    // Head base
    voxel.addBlock(head, 0.36, 0.38, 0.34, skinCol, 0, 0.19, 0);
    // Hair on top & back
    voxel.addBlock(head, 0.38, 0.12, 0.36, hairCol, 0, 0.38, -0.02);
    voxel.addBlock(head, 0.38, 0.28, 0.12, hairCol, 0, 0.25, -0.16);
    // Red bandana wrapped around forehead
    voxel.addBlock(head, 0.39, 0.09, 0.37, bandanaCol, 0, 0.3, 0);
    // Bandana knot knot tails at back
    voxel.addBlock(head, 0.1, 0.18, 0.08, bandanaCol, 0, 0.25, -0.22, { rotation: { x: 0.2 } });

    // Facial features: Determined eyes, nose, rugged stubble
    // Stubble beard on lower jaw
    voxel.addBlock(head, 0.34, 0.14, 0.04, 0x3d291e, 0, 0.08, 0.18);
    // Nose bridge
    voxel.addBlock(head, 0.07, 0.09, 0.06, 0xc49163, 0, 0.18, 0.19);
    // Left eye (white + dark pupil)
    voxel.addBlock(head, 0.08, 0.06, 0.02, 0xf0f0f0, -0.09, 0.23, 0.18);
    voxel.addBlock(head, 0.04, 0.05, 0.03, 0x1f2937, -0.09, 0.23, 0.185);
    // Right eye
    voxel.addBlock(head, 0.08, 0.06, 0.02, 0xf0f0f0, 0.09, 0.23, 0.18);
    voxel.addBlock(head, 0.04, 0.05, 0.03, 0x1f2937, 0.09, 0.23, 0.185);
    // Eyebrows
    voxel.addBlock(head, 0.1, 0.03, 0.03, hairCol, -0.09, 0.28, 0.185);
    voxel.addBlock(head, 0.1, 0.03, 0.03, hairCol, 0.09, 0.28, 0.185);

    // 4. Left Arm (shoulder pivot)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.32, 0.42, 0);
    torso.add(leftArm);
    this.parts.leftArm = leftArm;

    voxel.addBlock(leftArm, 0.15, 0.24, 0.16, shirtCol, 0, -0.12, 0); // Upper arm
    voxel.addBlock(leftArm, 0.14, 0.1, 0.15, skinCol, 0, -0.26, 0); // Bare forearm skin
    
    // Forearm & Hand
    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -0.3, 0);
    leftArm.add(leftForearm);
    this.parts.leftForearm = leftForearm;

    voxel.addBlock(leftForearm, 0.13, 0.22, 0.14, skinCol, 0, -0.11, 0);
    // Glove & watch
    voxel.addBlock(leftForearm, 0.14, 0.05, 0.15, 0x111111, 0, -0.06, 0); // Watch
    voxel.addBlock(leftForearm, 0.13, 0.12, 0.13, gloveCol, 0, -0.22, 0); // Glove hand

    // 5. Right Arm
    const rightArm = new THREE.Group();
    rightArm.position.set(0.32, 0.42, 0);
    torso.add(rightArm);
    this.parts.rightArm = rightArm;

    voxel.addBlock(rightArm, 0.15, 0.24, 0.16, shirtCol, 0, -0.12, 0);
    voxel.addBlock(rightArm, 0.14, 0.1, 0.15, skinCol, 0, -0.26, 0);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.3, 0);
    rightArm.add(rightForearm);
    this.parts.rightForearm = rightForearm;

    voxel.addBlock(rightForearm, 0.13, 0.22, 0.14, skinCol, 0, -0.11, 0);
    voxel.addBlock(rightForearm, 0.13, 0.12, 0.13, gloveCol, 0, -0.22, 0);

    // Combat weapon (Carbine) attached to survivor hands in combat stance
    const rifle = this.buildHeldRifle();
    rifle.position.set(0, -0.22, 0.2);
    rifle.visible = false;
    rightForearm.add(rifle);
    this.parts.heldWeapon = rifle;

    // 6. Left Leg (Hip pivot)
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.14, 0, 0);
    pelvis.add(leftLeg);
    this.parts.leftLeg = leftLeg;

    voxel.addBlock(leftLeg, 0.18, 0.38, 0.2, pantsCol, 0, -0.19, 0);
    // Knee joint & shin
    const leftShin = new THREE.Group();
    leftShin.position.set(0, -0.38, 0);
    leftLeg.add(leftShin);
    this.parts.leftShin = leftShin;

    voxel.addBlock(leftShin, 0.17, 0.35, 0.19, pantsCol, 0, -0.17, 0);
    // Tactical knee pad
    voxel.addBlock(leftShin, 0.19, 0.14, 0.08, 0x1f2326, 0, -0.06, 0.11);
    // Boot
    voxel.addBlock(leftShin, 0.18, 0.2, 0.26, bootCol, 0, -0.36, 0.03);

    // 7. Right Leg (Hip pivot)
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.14, 0, 0);
    pelvis.add(rightLeg);
    this.parts.rightLeg = rightLeg;

    voxel.addBlock(rightLeg, 0.18, 0.38, 0.2, pantsCol, 0, -0.19, 0);
    
    const rightShin = new THREE.Group();
    rightShin.position.set(0, -0.38, 0);
    rightLeg.add(rightShin);
    this.parts.rightShin = rightShin;

    voxel.addBlock(rightShin, 0.17, 0.35, 0.19, pantsCol, 0, -0.17, 0);
    voxel.addBlock(rightShin, 0.19, 0.14, 0.08, 0x1f2326, 0, -0.06, 0.11);
    voxel.addBlock(rightShin, 0.18, 0.2, 0.26, bootCol, 0, -0.36, 0.03);

    // Merge internal geometries of static sub-parts for high frame rate
    voxel.mergeStaticGroup(head, { castShadow: true, receiveShadow: true });
    voxel.mergeStaticGroup(backpack, { castShadow: true, receiveShadow: true });
    voxel.mergeStaticGroup(rifle, { castShadow: true, receiveShadow: true });
    voxel.mergeStaticGroup(leftShin, { castShadow: true, receiveShadow: true });
    voxel.mergeStaticGroup(rightShin, { castShadow: true, receiveShadow: true });
  }

  buildHeldRifle() {
    const rGroup = new THREE.Group();
    const gunMetal = 0x25282a;
    const stockWood = 0x422f20;

    // Receiver & Barrel
    voxel.addBlock(rGroup, 0.08, 0.12, 0.75, gunMetal, 0, 0, 0, { metalness: 0.85 });
    // Flash hider
    voxel.addBlock(rGroup, 0.06, 0.08, 0.12, gunMetal, 0, 0, 0.42, { metalness: 0.85 });
    // Wooden Stock
    voxel.addBlock(rGroup, 0.07, 0.14, 0.28, stockWood, 0, -0.04, -0.38);
    // Curved magazine
    voxel.addBlock(rGroup, 0.06, 0.22, 0.12, gunMetal, 0, -0.14, 0.08, { rotation: { x: -0.2 } });
    // Holographic sight
    voxel.addBlock(rGroup, 0.06, 0.07, 0.12, 0x111111, 0, 0.09, 0.05);
    voxel.addBlock(rGroup, 0.04, 0.04, 0.02, 0xff2222, 0, 0.09, 0.05, { emissive: 0xff0000, emissiveIntensity: 1.5 });

    return rGroup;
  }

  setAnimation(animName) {
    if (this.currentAnimation === animName) return;
    this.currentAnimation = animName;
    this.animTime = 0;

    // Reset default pose
    if (this.parts.heldWeapon) {
      this.parts.heldWeapon.visible = animName === 'combat';
    }
  }

  update(delta) {
    this.animTime += delta;
    const t = this.animTime;

    // Random head looking around in idle
    this.nextLookChange -= delta;
    if (this.nextLookChange <= 0) {
      this.headLookTarget = (Math.random() - 0.5) * 0.8;
      this.nextLookChange = 1.5 + Math.random() * 3.0;
    }
    this.headLookAngle += (this.headLookTarget - this.headLookAngle) * Math.min(1, delta * 3.5);

    if (this.currentAnimation === 'idle') {
      this.animateIdle(t);
    } else if (this.currentAnimation === 'walk') {
      this.animateWalk(t);
    } else if (this.currentAnimation === 'combat') {
      this.animateCombat(t);
    } else if (this.currentAnimation === 'wave') {
      this.animateWave(t);
    }
  }

  animateIdle(t) {
    // 1. Natural chest breathing expansion (breathing sin wave)
    const breath = Math.sin(t * 2.2);
    this.parts.torso.position.y = 0.1 + breath * 0.012;
    this.parts.torso.scale.set(1.0 + breath * 0.015, 1.0, 1.0 + breath * 0.015);
    this.parts.torso.rotation.x = breath * 0.015;

    // 2. Weight shifting between feet
    const sway = Math.sin(t * 1.1) * 0.025;
    this.parts.pelvis.position.x = sway;
    this.parts.pelvis.rotation.z = sway * 0.5;

    // 3. Head subtle look around
    this.parts.head.rotation.y = this.headLookAngle;
    this.parts.head.rotation.x = Math.sin(t * 1.8) * 0.04;

    // 4. Arms hanging relaxed
    this.parts.leftArm.rotation.x = Math.sin(t * 1.5) * 0.04;
    this.parts.leftArm.rotation.z = 0.05;
    this.parts.leftForearm.rotation.x = -0.15;

    this.parts.rightArm.rotation.x = -Math.sin(t * 1.5) * 0.04;
    this.parts.rightArm.rotation.z = -0.05;
    this.parts.rightForearm.rotation.x = -0.15;

    // Legs standing
    this.parts.leftLeg.rotation.x = 0;
    this.parts.rightLeg.rotation.x = 0;
    this.parts.leftShin.rotation.x = 0;
    this.parts.rightShin.rotation.x = 0;
  }

  animateWalk(t) {
    // Walking-in-place animation without translating position
    const speed = 6.2;
    const stride = 0.65;
    const legPhase = t * speed;

    // Torso double-frequency vertical bounce
    const bounce = Math.abs(Math.sin(legPhase)) * 0.06;
    this.parts.pelvis.position.y = 0.78 + bounce;
    this.parts.pelvis.rotation.y = Math.sin(legPhase) * 0.08;

    // Alternating leg swing
    const leftSwing = Math.sin(legPhase);
    const rightSwing = -leftSwing;

    this.parts.leftLeg.rotation.x = leftSwing * stride;
    this.parts.rightLeg.rotation.x = rightSwing * stride;

    // Knee bending during backswing
    this.parts.leftShin.rotation.x = leftSwing > 0 ? leftSwing * 0.5 : 0;
    this.parts.rightShin.rotation.x = rightSwing > 0 ? rightSwing * 0.5 : 0;

    // Arms swinging opposite to legs
    this.parts.leftArm.rotation.x = -leftSwing * stride * 0.8;
    this.parts.leftArm.rotation.z = 0.08;
    this.parts.leftForearm.rotation.x = -0.3;

    this.parts.rightArm.rotation.x = leftSwing * stride * 0.8;
    this.parts.rightArm.rotation.z = -0.08;
    this.parts.rightForearm.rotation.x = -0.3;

    // Head counter bob
    this.parts.head.rotation.y = this.headLookAngle * 0.5;
    this.parts.head.rotation.x = Math.sin(legPhase * 2) * 0.03;
  }

  animateCombat(t) {
    // Combat ready stance: raised rifle, locked posture, focused scanning
    const breath = Math.sin(t * 3.5) * 0.015;

    this.parts.pelvis.position.y = 0.74; // Crouched slightly
    this.parts.torso.rotation.x = 0.12; // Leaning forward into stock
    this.parts.torso.rotation.y = -0.25;

    // Raised arms aiming rifle
    this.parts.rightArm.rotation.x = -1.35;
    this.parts.rightArm.rotation.y = -0.3;
    this.parts.rightArm.rotation.z = 0.15;
    this.parts.rightForearm.rotation.x = -0.5;

    this.parts.leftArm.rotation.x = -1.2;
    this.parts.leftArm.rotation.y = 0.45;
    this.parts.leftForearm.rotation.x = -0.7;

    // Weapon micro-sway
    if (this.parts.heldWeapon) {
      this.parts.heldWeapon.rotation.y = Math.sin(t * 2.0) * 0.03;
      this.parts.heldWeapon.rotation.x = breath;
    }

    // Legs in braced stance
    this.parts.leftLeg.rotation.x = -0.2;
    this.parts.leftShin.rotation.x = 0.25;
    this.parts.rightLeg.rotation.x = 0.25;
    this.parts.rightShin.rotation.x = 0.15;

    // Sharp scanning head
    this.parts.head.rotation.y = Math.sin(t * 1.5) * 0.25;
    this.parts.head.rotation.x = -0.05;
  }

  animateWave(t) {
    this.animateIdle(t);
    // Right arm waving
    this.parts.rightArm.rotation.x = -2.6;
    this.parts.rightArm.rotation.z = -0.3;
    this.parts.rightForearm.rotation.x = 0;
    this.parts.rightForearm.rotation.z = Math.sin(t * 8.0) * 0.5;
  }
}
