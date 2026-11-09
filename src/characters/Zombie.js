import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

export class Zombie {
  constructor(scene, position = new THREE.Vector3(10.5, 0.1, -4.5)) {
    this.scene = scene;
    this.position = position;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = -1.8; // Facing toward the camp

    this.parts = {};
    this.currentAnimation = 'idle'; // 'idle', 'walk', 'attack', 'stagger'
    this.animTime = 0;
    
    // Erratic twitch timer
    this.twitchTime = 0;
    this.nextTwitch = 1.0;
    this.twitchOffset = 0;

    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.buildZombieModel();
  }

  buildZombieModel() {
    const skinRot = 0x566d51; // Mossy necrotic green flesh
    const skinPale = 0x6e8469; // Desaturated decayed patches
    const bloodCol = 0x661814; // Dried crimson gore
    const boneCol = 0xdad3c1; // Exposed ivory rib bone
    const shirtCol = 0x3d3835; // Tattered charcoal/grey shirt
    const pantsCol = 0x222a30; // Torn denim
    const eyeGlow = 0xffd23f; // Infected yellow luminescence

    // 1. Pelvis
    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.75, 0);
    this.group.add(pelvis);
    this.parts.pelvis = pelvis;

    voxel.addBlock(pelvis, 0.46, 0.22, 0.28, pantsCol, 0, 0, 0);
    // Bloodstain on hip
    voxel.addBlock(pelvis, 0.18, 0.18, 0.05, bloodCol, -0.16, 0, 0.14);

    // 2. Spine & Hunched Torso
    const torso = new THREE.Group();
    torso.position.set(0, 0.1, 0);
    // Hunched forward spine
    torso.rotation.x = 0.28;
    torso.rotation.y = 0.08;
    pelvis.add(torso);
    this.parts.torso = torso;

    // Torso body
    voxel.addBlock(torso, 0.52, 0.52, 0.32, shirtCol, 0, 0.26, 0);
    
    // Asymmetrical Torn Rags revealing decayed flesh and ribs on left side
    voxel.addBlock(torso, 0.22, 0.35, 0.1, skinRot, -0.15, 0.24, 0.14, { castShadow: false });
    voxel.addBlock(torso, 0.2, 0.3, 0.05, bloodCol, -0.15, 0.24, 0.17, { castShadow: false });
    // Exposed Ribcage Bones (ivory voxels)
    voxel.addBlock(torso, 0.14, 0.05, 0.06, boneCol, -0.15, 0.32, 0.18, { castShadow: false });
    voxel.addBlock(torso, 0.14, 0.05, 0.06, boneCol, -0.15, 0.22, 0.18, { castShadow: false });
    voxel.addBlock(torso, 0.12, 0.05, 0.06, boneCol, -0.15, 0.12, 0.18, { castShadow: false });

    // Hunched spine vertebra protrusion on back
    voxel.addBlock(torso, 0.08, 0.35, 0.08, skinRot, 0, 0.3, -0.18);

    // 3. Head & Snarling Neck
    const neck = new THREE.Group();
    neck.position.set(0, 0.52, 0.08);
    neck.rotation.x = -0.1;
    torso.add(neck);

    voxel.addBlock(neck, 0.18, 0.12, 0.18, skinRot, 0, 0.06, 0);

    const head = new THREE.Group();
    head.position.set(0, 0.1, 0);
    neck.add(head);
    this.parts.head = head;

    // Head base (asymmetrical decay)
    voxel.addBlock(head, 0.36, 0.38, 0.36, skinRot, 0, 0.19, 0);
    // Pale necrotic patch on one side of face
    voxel.addBlock(head, 0.16, 0.22, 0.1, skinPale, 0.11, 0.24, 0.14);

    // Matted decayed hair
    voxel.addBlock(head, 0.38, 0.1, 0.38, 0x181512, 0, 0.38, -0.02);
    voxel.addBlock(head, 0.38, 0.2, 0.12, 0x181512, 0, 0.28, -0.15);

    // Glowing Infected Yellow Eyes (emissive luminescence)
    // Left eye (sunken, glaring)
    voxel.addBlock(head, 0.07, 0.07, 0.03, eyeGlow, -0.09, 0.22, 0.19, {
      emissive: eyeGlow,
      emissiveIntensity: 1.8
    });
    // Right eye (infected milky yellow)
    voxel.addBlock(head, 0.08, 0.08, 0.03, eyeGlow, 0.09, 0.24, 0.19, {
      emissive: eyeGlow,
      emissiveIntensity: 2.2
    });

    // Snarling Jaw & Teeth
    const jaw = new THREE.Group();
    jaw.position.set(0, 0.08, 0.12);
    head.add(jaw);
    this.parts.jaw = jaw;

    // Jawbone
    voxel.addBlock(jaw, 0.3, 0.12, 0.16, skinRot, 0, 0, 0);
    // Crooked sharp teeth
    voxel.addBlock(jaw, 0.04, 0.06, 0.04, boneCol, -0.08, 0.08, 0.07);
    voxel.addBlock(jaw, 0.04, 0.05, 0.04, boneCol, -0.02, 0.08, 0.07);
    voxel.addBlock(jaw, 0.04, 0.07, 0.04, boneCol, 0.05, 0.08, 0.07);
    // Blood on chin
    voxel.addBlock(jaw, 0.2, 0.08, 0.02, bloodCol, 0, -0.02, 0.08);

    // 4. Left Arm (Extended forward in reaching grip)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.33, 0.44, 0.05);
    torso.add(leftArm);
    this.parts.leftArm = leftArm;

    voxel.addBlock(leftArm, 0.15, 0.26, 0.15, shirtCol, 0, -0.13, 0);
    
    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -0.28, 0);
    leftArm.add(leftForearm);
    this.parts.leftForearm = leftForearm;

    voxel.addBlock(leftForearm, 0.13, 0.28, 0.13, skinRot, 0, -0.14, 0);
    // Elongated claw hand
    voxel.addBlock(leftForearm, 0.14, 0.14, 0.18, skinRot, 0, -0.28, 0.04);
    // Dark bloody claws
    voxel.addBlock(leftForearm, 0.04, 0.04, 0.1, 0x1f1a14, -0.04, -0.3, 0.14);
    voxel.addBlock(leftForearm, 0.04, 0.04, 0.1, 0x1f1a14, 0.04, -0.3, 0.14);

    // 5. Right Arm (Twisted, raised menacingly)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.33, 0.44, 0.05);
    torso.add(rightArm);
    this.parts.rightArm = rightArm;

    voxel.addBlock(rightArm, 0.15, 0.26, 0.15, shirtCol, 0, -0.13, 0);
    
    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.28, 0);
    rightArm.add(rightForearm);
    this.parts.rightForearm = rightForearm;

    voxel.addBlock(rightForearm, 0.13, 0.28, 0.13, skinPale, 0, -0.14, 0);
    voxel.addBlock(rightForearm, 0.14, 0.14, 0.18, skinRot, 0, -0.28, 0.04);
    voxel.addBlock(rightForearm, 0.04, 0.04, 0.1, 0x1f1a14, -0.04, -0.3, 0.14);
    voxel.addBlock(rightForearm, 0.04, 0.04, 0.1, 0x1f1a14, 0.04, -0.3, 0.14);

    // 6. Left Leg (Dragging limb)
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.14, 0, 0);
    pelvis.add(leftLeg);
    this.parts.leftLeg = leftLeg;

    voxel.addBlock(leftLeg, 0.18, 0.38, 0.2, pantsCol, 0, -0.19, 0);

    const leftShin = new THREE.Group();
    leftShin.position.set(0, -0.38, 0);
    leftLeg.add(leftShin);
    this.parts.leftShin = leftShin;

    // Torn pant leg revealing decayed bone/skin
    voxel.addBlock(leftShin, 0.17, 0.2, 0.19, pantsCol, 0, -0.1, 0);
    voxel.addBlock(leftShin, 0.14, 0.15, 0.16, skinRot, 0, -0.25, 0);
    voxel.addBlock(leftShin, 0.17, 0.16, 0.24, 0x151515, 0, -0.36, 0.02); // Mismatched worn boot

    // 7. Right Leg
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
    voxel.addBlock(rightShin, 0.17, 0.16, 0.24, 0x221812, 0, -0.36, 0.02);

    // Merge internal geometries of static sub-parts
    voxel.mergeStaticGroup(head, { castShadow: true, receiveShadow: true });
    voxel.mergeStaticGroup(leftShin, { castShadow: true, receiveShadow: true });
    voxel.mergeStaticGroup(rightShin, { castShadow: true, receiveShadow: true });
  }

  setAnimation(animName) {
    if (this.currentAnimation === animName) return;
    this.currentAnimation = animName;
    this.animTime = 0;
  }

  update(delta) {
    this.animTime += delta;
    const t = this.animTime;

    // Sudden erratic zombie twitches
    this.twitchTime += delta;
    if (this.twitchTime >= this.nextTwitch) {
      this.twitchTime = 0;
      this.nextTwitch = 0.8 + Math.random() * 2.2;
      this.twitchOffset = (Math.random() - 0.5) * 0.45;
    } else {
      this.twitchOffset *= 0.85; // fast damp
    }

    if (this.currentAnimation === 'idle') {
      this.animateIdle(t);
    } else if (this.currentAnimation === 'walk') {
      this.animateWalk(t);
    } else if (this.currentAnimation === 'attack') {
      this.animateAttack(t);
    } else if (this.currentAnimation === 'stagger') {
      this.animateStagger(t);
    }
  }

  animateIdle(t) {
    // 1. Slow raspy necrotic breathing + torso heave
    const breath = Math.sin(t * 1.8);
    this.parts.torso.rotation.x = 0.28 + breath * 0.04;
    this.parts.torso.rotation.z = Math.sin(t * 0.9) * 0.06; // sickly swaying

    // 2. Extended reaching arms with micro-tremors
    const tremor = Math.sin(t * 14) * 0.015;
    this.parts.leftArm.rotation.x = -1.1 + breath * 0.08 + tremor;
    this.parts.leftArm.rotation.y = 0.2;
    this.parts.leftArm.rotation.z = 0.1;
    this.parts.leftForearm.rotation.x = -0.4;

    this.parts.rightArm.rotation.x = -1.3 - breath * 0.08 - tremor;
    this.parts.rightArm.rotation.y = -0.15;
    this.parts.rightArm.rotation.z = -0.15;
    this.parts.rightForearm.rotation.x = -0.3;

    // 3. Head spasms & jaw twitch
    this.parts.head.rotation.y = Math.sin(t * 0.8) * 0.2 + this.twitchOffset;
    this.parts.head.rotation.z = 0.15 + Math.sin(t * 1.4) * 0.08;
    this.parts.head.rotation.x = -0.15;
    this.parts.jaw.rotation.x = Math.max(0, Math.sin(t * 2.5) * 0.2); // snapping mouth

    // 4. Subtle leg weight shifting
    this.parts.leftLeg.rotation.x = 0.05;
    this.parts.rightLeg.rotation.x = -0.05;
    this.parts.leftShin.rotation.x = 0.08;
    this.parts.rightShin.rotation.x = 0;
  }

  animateWalk(t) {
    // Groaning, uneven infected limp
    const speed = 3.8;
    const stride = 0.7;
    const legPhase = t * speed;

    // Sickly swaying pelvis with limp drop on left foot
    const limpDrop = Math.sin(legPhase) * 0.08;
    this.parts.pelvis.position.y = 0.75 + (limpDrop > 0 ? limpDrop * 0.6 : limpDrop * 1.2);
    this.parts.pelvis.rotation.z = Math.sin(legPhase) * 0.12;
    this.parts.pelvis.rotation.y = Math.sin(legPhase) * 0.1;

    // Asymmetrical leg movement: right leg steps, left leg drags
    this.parts.rightLeg.rotation.x = Math.sin(legPhase) * stride;
    this.parts.rightShin.rotation.x = Math.max(0, Math.sin(legPhase) * 0.6);

    // Left leg drags behind with stiffness
    this.parts.leftLeg.rotation.x = -Math.sin(legPhase) * (stride * 0.6) - 0.15;
    this.parts.leftShin.rotation.x = 0.1;

    // Reaching zombie arms swaying and grasping forward
    const armSwing = Math.cos(legPhase) * 0.35;
    this.parts.leftArm.rotation.x = -1.4 + armSwing;
    this.parts.leftArm.rotation.y = 0.2;
    this.parts.rightArm.rotation.x = -1.4 - armSwing;
    this.parts.rightArm.rotation.y = -0.2;

    // Snarl and head bobbing
    this.parts.head.rotation.y = Math.sin(legPhase * 0.5) * 0.25 + this.twitchOffset;
    this.parts.head.rotation.x = -0.2 + Math.sin(legPhase) * 0.1;
    this.parts.jaw.rotation.x = 0.15 + Math.sin(legPhase * 2) * 0.15;
  }

  animateAttack(t) {
    // Furious double claw swipe & lunge
    const cycle = (t * 2.2) % 1.0; // 0 to 1

    if (cycle < 0.3) {
      // Wind-up: pull arms back, torso recoils
      const p = cycle / 0.3;
      this.parts.torso.rotation.x = 0.1;
      this.parts.torso.position.z = -0.15 * p;
      this.parts.leftArm.rotation.x = -0.5 - p * 0.8;
      this.parts.rightArm.rotation.x = -0.4 - p * 0.9;
      this.parts.head.rotation.x = -0.3;
      this.parts.jaw.rotation.x = 0.4 * p; // Wide open snarl
    } else if (cycle < 0.6) {
      // Vicious forward lunge & swipe
      const p = (cycle - 0.3) / 0.3;
      this.parts.torso.rotation.x = 0.45;
      this.parts.torso.position.z = 0.25 * p;
      this.parts.leftArm.rotation.x = -1.8 + p * 0.5;
      this.parts.leftArm.rotation.y = -0.4;
      this.parts.rightArm.rotation.x = -1.9 - p * 0.3;
      this.parts.rightArm.rotation.y = 0.3;
      this.parts.head.rotation.x = 0.1;
      this.parts.jaw.rotation.x = 0.45 - p * 0.25;
    } else {
      // Recovery
      const p = (cycle - 0.6) / 0.4;
      this.parts.torso.rotation.x = 0.45 - p * 0.17;
      this.parts.torso.position.z = 0.25 * (1 - p);
      this.parts.leftArm.rotation.x = -1.3;
      this.parts.rightArm.rotation.x = -1.3;
      this.parts.jaw.rotation.x = 0.1;
    }
  }

  animateStagger(t) {
    // Recoil from bullet impact
    const cycle = (t * 1.5) % 1.0;
    if (cycle < 0.25) {
      // Violent jerk backward
      const p = cycle / 0.25;
      this.parts.torso.rotation.x = -0.3 * p;
      this.parts.torso.position.z = -0.2 * p;
      this.parts.leftArm.rotation.x = -2.2 * p;
      this.parts.rightArm.rotation.x = -2.1 * p;
      this.parts.head.rotation.x = -0.5 * p;
    } else {
      // Stumbling back to balance
      const p = (cycle - 0.25) / 0.75;
      this.parts.torso.rotation.x = -0.3 + p * 0.58;
      this.parts.torso.position.z = -0.2 * (1 - p);
      this.parts.leftArm.rotation.x = -2.2 + p * 1.1;
      this.parts.rightArm.rotation.x = -2.1 + p * 0.8;
      this.parts.head.rotation.x = -0.5 + p * 0.35;
    }
  }
}
