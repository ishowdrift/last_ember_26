import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';
import { audioManager } from '../core/AudioManager.js';

/**
 * Individual Zombie Entity for THE LAST EMBER
 * Features:
 * - 9-state AI Finite State Machine: IDLE, WANDER, DETECT, CHASE, ATTACK, STAGGER, DYING, DEAD
 * - 3 Distinct Variants: 'runner' (zombie-1.jpg), 'walker' (zombie-2.jpg), 'brute' (brute.jpg)
 * - Articulated procedural limbs with animated walk, run, swipe, roar, and death collapse
 * - Headshot vs Body hitboxes for tactical combat
 * - Collision-aware ground snapping and obstacle steering
 */
export class ZombieEntity {
  constructor(scene, collisionSystem, config = {}) {
    this.scene = scene;
    this.collision = collisionSystem;

    // Config parameters
    this.type = config.type || 'runner'; // 'runner', 'walker', 'brute'
    this.spawnPos = config.position || new THREE.Vector3(0, 0, 0);

    this.group = new THREE.Group();
    this.group.name = `Zombie_${this.type}_${Math.floor(Math.random() * 10000)}`;
    this.group.position.copy(this.spawnPos);

    this.parts = {};
    this.state = 'idle'; // 'idle', 'wander', 'detect', 'chase', 'attack', 'stagger', 'dying', 'dead'
    this.stateTimer = 0;
    this.animTime = 0;

    // Variant-specific stats
    if (this.type === 'brute') {
      this.maxHp = 420;
      this.speed = 2.8;
      this.attackRange = 2.5;
      this.attackDamage = 38;
      this.attackCooldown = 1.6;
      this.detectRange = 24.0;
      this.scale = 1.0;
      this.soundPitch = 0.55; // deep guttural roar
    } else if (this.type === 'walker') {
      this.maxHp = 110;
      this.speed = 2.2;
      this.attackRange = 1.8;
      this.attackDamage = 18;
      this.attackCooldown = 1.3;
      this.detectRange = 18.0;
      this.scale = 1.0;
      this.soundPitch = 0.85;
    } else {
      // Runner
      this.maxHp = 80;
      this.speed = 3.9;
      this.attackRange = 1.7;
      this.attackDamage = 14;
      this.attackCooldown = 1.0;
      this.detectRange = 22.0;
      this.scale = 0.98;
      this.soundPitch = 1.15; // high screeching shriek
    }

    this.hp = this.maxHp;
    this.attackTimer = 0.0;
    this.staggerTimer = 0.0;
    this.wanderTarget = new THREE.Vector3().copy(this.spawnPos);
    this.wanderTimer = 0;

    // Hitbox dimensions
    this.radius = this.type === 'brute' ? 0.85 : 0.42;
    this.height = this.type === 'brute' ? 2.65 : 1.82;
    this.headRadius = this.type === 'brute' ? 0.35 : 0.22;

    this.init();
    this.scene.add(this.group);
  }

  init() {
    if (this.type === 'brute') {
      this.buildBruteModel();
    } else if (this.type === 'walker') {
      this.buildWalkerModel();
    } else {
      this.buildRunnerModel();
    }

    // Snap to floor
    this.group.position.y = this.collision.getFloorHeight(this.group.position.x, this.group.position.z);
  }

  buildRunnerModel() {
    // Reference: zombie-1.jpg (Infected Runner)
    const skinRot = 0x566d51; // Mossy necrotic green flesh
    const skinPale = 0x6e8469;
    const bloodCol = 0x661814; // Dried crimson
    const boneCol = 0xdad3c1; // Exposed ribcage
    const shirtCol = 0x3d3835;
    const pantsCol = 0x222a30;
    const eyeGlow = 0xffd23f; // Infected yellow luminescence

    // Pelvis
    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.75, 0);
    this.group.add(pelvis);
    this.parts.pelvis = pelvis;
    voxel.addBlock(pelvis, 0.44, 0.22, 0.26, pantsCol, 0, 0, 0);

    // Torso (Hunched spine)
    const torso = new THREE.Group();
    torso.position.set(0, 0.1, 0);
    torso.rotation.x = 0.30;
    pelvis.add(torso);
    this.parts.torso = torso;

    voxel.addBlock(torso, 0.50, 0.50, 0.30, shirtCol, 0, 0.25, 0);
    // Exposed ribcage & gore on left chest
    voxel.addBlock(torso, 0.20, 0.32, 0.08, bloodCol, -0.14, 0.24, 0.14, { castShadow: false });
    voxel.addBlock(torso, 0.14, 0.04, 0.05, boneCol, -0.14, 0.30, 0.17, { castShadow: false });
    voxel.addBlock(torso, 0.14, 0.04, 0.05, boneCol, -0.14, 0.22, 0.17, { castShadow: false });

    // Head
    const head = new THREE.Group();
    head.position.set(0, 0.55, 0.08);
    torso.add(head);
    this.parts.head = head;

    voxel.addBlock(head, 0.34, 0.36, 0.34, skinRot, 0, 0.18, 0);
    // Glowing yellow eyes
    voxel.addBlock(head, 0.07, 0.07, 0.02, eyeGlow, -0.08, 0.20, 0.18, {
      emissive: eyeGlow,
      emissiveIntensity: 2.2
    });
    voxel.addBlock(head, 0.07, 0.07, 0.02, eyeGlow, 0.08, 0.20, 0.18, {
      emissive: eyeGlow,
      emissiveIntensity: 2.2
    });

    // Arms (reaching out forward in predatory lunge)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.32, 0.42, 0);
    leftArm.rotation.x = -0.7; // reaching forward
    torso.add(leftArm);
    this.parts.leftArm = leftArm;
    voxel.addBlock(leftArm, 0.14, 0.55, 0.14, skinRot, 0, -0.22, 0);
    // Talons/claws
    voxel.addBlock(leftArm, 0.12, 0.12, 0.08, bloodCol, 0, -0.52, 0.04);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.32, 0.42, 0);
    rightArm.rotation.x = -0.65;
    torso.add(rightArm);
    this.parts.rightArm = rightArm;
    voxel.addBlock(rightArm, 0.14, 0.55, 0.14, skinRot, 0, -0.22, 0);
    voxel.addBlock(rightArm, 0.12, 0.12, 0.08, bloodCol, 0, -0.52, 0.04);

    // Legs
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.14, -0.1, 0);
    pelvis.add(leftLeg);
    this.parts.leftLeg = leftLeg;
    voxel.addBlock(leftLeg, 0.18, 0.65, 0.18, pantsCol, 0, -0.32, 0);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.14, -0.1, 0);
    pelvis.add(rightLeg);
    this.parts.rightLeg = rightLeg;
    voxel.addBlock(rightLeg, 0.18, 0.65, 0.18, pantsCol, 0, -0.32, 0);
  }

  buildWalkerModel() {
    // Reference: zombie-2.jpg (Infected Walker)
    const skinRot = 0x63775c;
    const bloodCol = 0x5a1815;
    const shirtCol = 0x48423d;
    const pantsCol = 0x2e353b; // Torn denim
    const eyeGlow = 0xffe066;

    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.74, 0);
    this.group.add(pelvis);
    this.parts.pelvis = pelvis;
    voxel.addBlock(pelvis, 0.46, 0.22, 0.28, pantsCol, 0, 0, 0);

    const torso = new THREE.Group();
    torso.position.set(0, 0.1, 0);
    torso.rotation.x = 0.18; // slight slump
    pelvis.add(torso);
    this.parts.torso = torso;

    voxel.addBlock(torso, 0.52, 0.52, 0.32, shirtCol, 0, 0.26, 0);
    voxel.addBlock(torso, 0.22, 0.25, 0.06, bloodCol, 0.10, 0.20, 0.17);

    const head = new THREE.Group();
    head.position.set(0, 0.55, 0.05);
    torso.add(head);
    this.parts.head = head;

    voxel.addBlock(head, 0.36, 0.38, 0.36, skinRot, 0, 0.19, 0);
    voxel.addBlock(head, 0.07, 0.07, 0.02, eyeGlow, -0.09, 0.22, 0.19, { emissive: eyeGlow, emissiveIntensity: 1.8 });
    voxel.addBlock(head, 0.07, 0.07, 0.02, eyeGlow, 0.09, 0.22, 0.19, { emissive: eyeGlow, emissiveIntensity: 1.8 });

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.34, 0.44, 0);
    leftArm.rotation.x = -0.4;
    torso.add(leftArm);
    this.parts.leftArm = leftArm;
    voxel.addBlock(leftArm, 0.15, 0.58, 0.15, skinRot, 0, -0.25, 0);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.34, 0.44, 0);
    rightArm.rotation.x = -0.45;
    torso.add(rightArm);
    this.parts.rightArm = rightArm;
    voxel.addBlock(rightArm, 0.15, 0.58, 0.15, skinRot, 0, -0.25, 0);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.15, -0.1, 0);
    pelvis.add(leftLeg);
    this.parts.leftLeg = leftLeg;
    voxel.addBlock(leftLeg, 0.20, 0.65, 0.20, pantsCol, 0, -0.32, 0);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.15, -0.1, 0);
    pelvis.add(rightLeg);
    this.parts.rightLeg = rightLeg;
    voxel.addBlock(rightLeg, 0.20, 0.65, 0.20, pantsCol, 0, -0.32, 0);
  }

  buildBruteModel() {
    // Reference: brute.jpg (Apex Mutant Titan)
    const hideGrey = 0x42464d;
    const hideDark = 0x2e3238;
    const magmaGlow = 0xff4400; // Glowing magma veins
    const boneSpike = 0xded4c5;
    const eyeYellow = 0xffcc00;

    // Pelvis
    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.95, 0);
    this.group.add(pelvis);
    this.parts.pelvis = pelvis;
    voxel.addBlock(pelvis, 0.85, 0.35, 0.55, hideDark, 0, 0, 0);

    // Torso (Massive barrel chest)
    const torso = new THREE.Group();
    torso.position.set(0, 0.15, 0);
    pelvis.add(torso);
    this.parts.torso = torso;

    voxel.addBlock(torso, 1.4, 0.85, 0.85, hideGrey, 0, 0.85, 0.05);
    // Hunched back hump
    voxel.addBlock(torso, 1.1, 0.7, 0.5, hideDark, 0, 1.1, -0.3, { rotation: { x: 0.2 } });

    // Glowing magma fissure veins
    voxel.addBlock(torso, 0.15, 0.8, 0.1, magmaGlow, 0, 0.95, -0.46, {
      emissive: magmaGlow,
      emissiveIntensity: 2.2
    });
    voxel.addBlock(torso, 0.45, 0.12, 0.1, magmaGlow, 0, 1.25, -0.46, {
      emissive: magmaGlow,
      emissiveIntensity: 2.2
    });

    // Bone shoulder spikes
    voxel.addBlock(torso, 0.18, 0.45, 0.18, boneSpike, -0.55, 1.35, -0.2, { rotation: { z: 0.4, x: -0.2 } });
    voxel.addBlock(torso, 0.18, 0.45, 0.18, boneSpike, 0.55, 1.35, -0.2, { rotation: { z: -0.4, x: -0.2 } });

    // Head
    const head = new THREE.Group();
    head.position.set(0, 1.15, 0.38);
    torso.add(head);
    this.parts.head = head;

    voxel.addBlock(head, 0.52, 0.48, 0.55, hideGrey, 0, 0, 0);
    voxel.addBlock(head, 0.1, 0.1, 0.04, eyeYellow, -0.16, 0.08, 0.30, { emissive: eyeYellow, emissiveIntensity: 2.5 });
    voxel.addBlock(head, 0.1, 0.1, 0.04, eyeYellow, 0.16, 0.08, 0.30, { emissive: eyeYellow, emissiveIntensity: 2.5 });

    // Massive Crushing Club Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.85, 1.1, 0);
    torso.add(leftArm);
    this.parts.leftArm = leftArm;
    voxel.addBlock(leftArm, 0.38, 0.75, 0.38, hideGrey, 0, -0.35, 0);
    // Crushing Stone Fist
    voxel.addBlock(leftArm, 0.48, 0.45, 0.48, hideDark, 0, -0.85, 0);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.85, 1.1, 0);
    torso.add(rightArm);
    this.parts.rightArm = rightArm;
    voxel.addBlock(rightArm, 0.38, 0.75, 0.38, hideGrey, 0, -0.35, 0);
    voxel.addBlock(rightArm, 0.48, 0.45, 0.48, hideDark, 0, -0.85, 0);

    // Thick Pillars Legs
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.32, -0.15, 0);
    pelvis.add(leftLeg);
    this.parts.leftLeg = leftLeg;
    voxel.addBlock(leftLeg, 0.38, 0.85, 0.38, hideDark, 0, -0.42, 0);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.32, -0.15, 0);
    pelvis.add(rightLeg);
    this.parts.rightLeg = rightLeg;
    voxel.addBlock(rightLeg, 0.38, 0.85, 0.38, hideDark, 0, -0.42, 0);
  }

  takeDamage(amount, isHeadshot = false) {
    if (this.state === 'dying' || this.state === 'dead') return false;

    const damageMult = isHeadshot ? 2.5 : 1.0;
    const finalDamage = amount * damageMult;
    this.hp -= finalDamage;

    // Flinch / Stagger
    this.state = 'stagger';
    this.staggerTimer = 0.22;
    if (this.parts.torso) {
      this.parts.torso.rotation.x = -0.25; // recoil back
    }

    if (this.hp <= 0) {
      this.die();
      return true; // was a kill
    }

    return false;
  }

  die() {
    this.hp = 0;
    this.state = 'dying';
    this.stateTimer = 0.0;
  }

  isDead() {
    return this.state === 'dead';
  }

  /**
   * Raycast intersection test against zombie body and head hitboxes
   */
  intersectRay(rayOrigin, rayDir, maxDist) {
    if (this.state === 'dying' || this.state === 'dead') return null;

    const zPos = this.group.position;
    // Bounding box for entire zombie
    const min = new THREE.Vector3(zPos.x - this.radius, zPos.y, zPos.z - this.radius);
    const max = new THREE.Vector3(zPos.x + this.radius, zPos.y + this.height, zPos.z + this.radius);

    const hit = this.collision.intersectRayAABB(rayOrigin, rayDir, min, max);
    if (!hit || hit.distance > maxDist) return null;

    // Check if hit was in head zone (top 25% of height)
    const headCutoffY = zPos.y + this.height * 0.75;
    const isHeadshot = hit.point.y >= headCutoffY;

    return {
      distance: hit.distance,
      point: hit.point,
      normal: hit.normal,
      isHeadshot,
      zombie: this
    };
  }

  update(delta, playerPos, onPlayerAttack) {
    if (this.state === 'dead') return;

    this.animTime += delta;
    if (this.attackTimer > 0) this.attackTimer -= delta;

    // 1. DYING ANIMATION
    if (this.state === 'dying') {
      this.stateTimer += delta * 3.5;
      // Fall backward & tilt onto ground
      this.group.rotation.x = Math.min(Math.PI / 2, this.group.rotation.x + delta * 4.0);
      this.group.position.y = Math.max(0.1, this.group.position.y - delta * 1.5);
      if (this.stateTimer >= 1.0) {
        this.state = 'dead';
      }
      return;
    }

    // 2. STAGGER RECOVERY
    if (this.state === 'stagger') {
      this.staggerTimer -= delta;
      if (this.staggerTimer <= 0) {
        this.state = 'chase';
        if (this.parts.torso) this.parts.torso.rotation.x = 0.25;
      }
      return;
    }

    const distToPlayer = this.group.position.distanceTo(playerPos);

    // 3. AI STATE TRANSITIONS
    if (this.state === 'idle' || this.state === 'wander') {
      if (distToPlayer <= this.detectRange) {
        this.state = 'detect';
        this.stateTimer = 0.4;
        audioManager.playZombieGrowl(this.soundPitch);
      } else {
        // Wandering logic
        this.wanderTimer -= delta;
        if (this.wanderTimer <= 0) {
          this.state = Math.random() > 0.5 ? 'wander' : 'idle';
          this.wanderTimer = 3.0 + Math.random() * 4.0;
          if (this.state === 'wander') {
            this.wanderTarget.set(
              this.spawnPos.x + (Math.random() - 0.5) * 16,
              0,
              this.spawnPos.z + (Math.random() - 0.5) * 16
            );
          }
        }
      }
    } else if (this.state === 'detect') {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) {
        this.state = 'chase';
      }
    } else if (this.state === 'chase') {
      if (distToPlayer <= this.attackRange) {
        this.state = 'attack';
        this.stateTimer = 0.6; // attack animation duration
      }
    } else if (this.state === 'attack') {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) {
        if (distToPlayer <= this.attackRange + 0.5 && this.attackTimer <= 0) {
          // Deliver damage to player!
          if (onPlayerAttack) {
            onPlayerAttack(this.attackDamage);
          }
          this.attackTimer = this.attackCooldown;
        }
        this.state = 'chase';
      }
    }

    // 4. MOVEMENT & STEERING
    let moveTarget = null;
    let targetSpeed = 0;

    if (this.state === 'chase' || this.state === 'attack') {
      moveTarget = playerPos;
      targetSpeed = this.state === 'chase' ? this.speed : 0;
    } else if (this.state === 'wander') {
      moveTarget = this.wanderTarget;
      targetSpeed = this.speed * 0.45;
    }

    if (moveTarget && targetSpeed > 0) {
      // Calculate horizontal move direction
      const dir = new THREE.Vector3(
        moveTarget.x - this.group.position.x,
        0,
        moveTarget.z - this.group.position.z
      );
      const dist = dir.length();

      if (dist > 0.4) {
        dir.normalize();

        // Turn smoothly toward target
        const targetAngle = Math.atan2(dir.x, dir.z);
        this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, Math.min(1, delta * 8.0));

        // Horizontal displacement with collision avoidance
        const displacement = dir.clone().multiplyScalar(targetSpeed * delta);
        const safePos = this.collision.resolveMovement(
          this.group.position,
          displacement,
          this.radius,
          this.height,
          0.45
        );

        this.group.position.x = safePos.x;
        this.group.position.z = safePos.z;
      }
    }

    // Snap to terrain surface
    const floorY = this.collision.getFloorHeight(this.group.position.x, this.group.position.z);
    this.group.position.y = floorY;

    // 5. ANIMATIONS
    this.animateLimbs(delta, targetSpeed > 0);
  }

  animateLimbs(delta, isWalking) {
    if (this.state === 'dead' || this.state === 'dying') return;

    if (this.state === 'attack') {
      // Violent claw/fist swipe attack
      const swipePhase = Math.sin((0.6 - this.stateTimer) * Math.PI * 3.5);
      if (this.parts.rightArm) {
        this.parts.rightArm.rotation.x = -1.2 + swipePhase * 1.4;
      }
      if (this.parts.leftArm) {
        this.parts.leftArm.rotation.x = -1.2 - swipePhase * 0.8;
      }
      if (this.parts.head) {
        this.parts.head.rotation.x = 0.2 - swipePhase * 0.4;
      }
    } else if (isWalking) {
      // Walk / Chase cycle
      const cycleSpeed = this.type === 'brute' ? 6.5 : (this.type === 'runner' ? 12.0 : 7.0);
      const swing = Math.sin(this.animTime * cycleSpeed);

      if (this.parts.leftLeg) this.parts.leftLeg.rotation.x = swing * 0.6;
      if (this.parts.rightLeg) this.parts.rightLeg.rotation.x = -swing * 0.6;

      if (this.parts.leftArm) this.parts.leftArm.rotation.x = -0.5 - swing * 0.5;
      if (this.parts.rightArm) this.parts.rightArm.rotation.x = -0.5 + swing * 0.5;

      if (this.parts.torso) this.parts.torso.rotation.y = swing * 0.12;
    } else {
      // Idle twitching breathing
      const idleSpeed = 2.4;
      const breathe = Math.sin(this.animTime * idleSpeed) * 0.05;
      if (this.parts.torso) this.parts.torso.rotation.x = 0.22 + breathe;
      if (this.parts.head) this.parts.head.rotation.y = Math.sin(this.animTime * 1.2) * 0.15;
    }
  }
}
