import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

/**
 * FPS First-Person Weapon & Arms Viewmodel for THE LAST EMBER
 * Features:
 * - High-detail procedural voxel models for Vanguard AR-74, Breaker 12G, and Sidekick 9mm
 * - First-person survivor tactical gloved hands & forearms
 * - Smooth weapon sway, walk bobbing, and sprint positioning
 * - Aim Down Sights (ADS) centering alignment with camera
 * - Procedural firing recoil impulses and muzzle flash
 * - Reloading dip & rack animation
 */
export class FPSViewmodel {
  constructor(camera) {
    this.camera = camera;
    this.root = new THREE.Group();
    this.root.name = 'FPSViewmodelRoot';
    this.camera.add(this.root);

    // Weapon containers
    this.weaponGroups = {};
    this.currentWeaponKey = 'rifle'; // 'rifle', 'shotgun', 'pistol'

    // Rest positions & ADS targets (relative to camera)
    this.configs = {
      rifle: {
        hipPos: new THREE.Vector3(0.24, -0.22, -0.44),
        adsPos: new THREE.Vector3(0.00, -0.155, -0.36),
        hipRot: new THREE.Euler(0.02, -0.04, 0),
        adsRot: new THREE.Euler(0.0, 0.0, 0),
        fovHip: 68,
        fovAds: 52
      },
      shotgun: {
        hipPos: new THREE.Vector3(0.25, -0.24, -0.48),
        adsPos: new THREE.Vector3(0.00, -0.170, -0.40),
        hipRot: new THREE.Euler(0.03, -0.03, 0),
        adsRot: new THREE.Euler(0.0, 0.0, 0),
        fovHip: 68,
        fovAds: 56
      },
      pistol: {
        hipPos: new THREE.Vector3(0.18, -0.19, -0.38),
        adsPos: new THREE.Vector3(0.00, -0.125, -0.30),
        hipRot: new THREE.Euler(0.02, -0.02, 0),
        adsRot: new THREE.Euler(0.0, 0.0, 0),
        fovHip: 68,
        fovAds: 58
      }
    };

    // State
    this.isAds = false;
    this.adsProgress = 0.0;
    this.recoilOffset = new THREE.Vector3();
    this.recoilRotation = new THREE.Euler();
    this.recoilSpring = 0.0;
    this.reloadProgress = 0.0;
    this.isReloading = false;

    // Sway & Bobbing
    this.swayX = 0;
    this.swayY = 0;
    this.bobTimer = 0;

    // Muzzle flash light & mesh
    this.muzzleFlashGroup = new THREE.Group();
    this.muzzleFlashLight = new THREE.PointLight(0xffaa22, 0, 8);
    this.muzzleFlashMesh = null;
    this.flashTimer = 0;

    this.init();
  }

  init() {
    this.buildMuzzleFlash();
    this.buildRifleModel();
    this.buildShotgunModel();
    this.buildPistolModel();
    this.buildSurvivorArms();

    this.setWeapon('rifle');
  }

  buildMuzzleFlash() {
    // Sharp multi-point voxel star flash
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffea55,
      transparent: true,
      opacity: 0.95
    });

    const group = new THREE.Group();
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.16), flashMat);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.12), flashMat);
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.12), flashMat);
    group.add(b1, b2, b3);

    group.visible = false;
    this.muzzleFlashMesh = group;
    this.root.add(this.muzzleFlashMesh);
    this.root.add(this.muzzleFlashLight);
  }

  buildSurvivorArms() {
    // Stylized tactical gloved hands
    this.armsGroup = new THREE.Group();
    this.armsGroup.name = 'SurvivorArms';

    const sleeveCol = 0x3d433b; // Slate dark shirt sleeve
    const gloveCol = 0x22262b;  // Dark tactical glove
    const skinCol = 0xd4a373;   // Exposed finger joints

    // Right Arm (Trigger hand)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.24, -0.32, -0.22);
    // Forearm
    voxel.addBlock(rightArm, 0.09, 0.09, 0.28, sleeveCol, 0, 0, 0.12, { roughness: 0.9 });
    // Glove wrist & hand
    voxel.addBlock(rightArm, 0.08, 0.08, 0.12, gloveCol, 0, 0, -0.06, { roughness: 0.8 });
    // Finger knuckles wrapping grip
    voxel.addBlock(rightArm, 0.06, 0.05, 0.06, gloveCol, -0.03, -0.02, -0.12);
    this.armsGroup.add(rightArm);
    this.rightArm = rightArm;

    // Left Arm (Foregrip support)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.16, -0.30, -0.30);
    // Forearm
    voxel.addBlock(leftArm, 0.09, 0.09, 0.32, sleeveCol, 0, 0, 0.12, { roughness: 0.9 });
    // Glove hand
    voxel.addBlock(leftArm, 0.08, 0.08, 0.12, gloveCol, 0.04, 0.04, -0.08, { roughness: 0.8 });
    this.armsGroup.add(leftArm);
    this.leftArm = leftArm;

    this.root.add(this.armsGroup);
  }

  buildRifleModel() {
    // Vanguard AR-74
    const rifle = new THREE.Group();
    rifle.name = 'ViewmodelRifle';

    const gunMetal = 0x252930;
    const darkPoly = 0x16181b;
    const coyoteTan = 0x6e604d;

    // Main Receiver
    voxel.addBlock(rifle, 0.06, 0.09, 0.42, gunMetal, 0, 0, 0, { metalness: 0.85, roughness: 0.35 });
    // Top Picatinny Rail
    voxel.addBlock(rifle, 0.065, 0.02, 0.38, darkPoly, 0, 0.055, 0);

    // Holographic Red Dot Sight
    const sight = new THREE.Group();
    sight.position.set(0, 0.095, -0.04);
    // Housing
    voxel.addBlock(sight, 0.065, 0.06, 0.12, darkPoly, 0, 0, 0);
    // Sight aperture window
    voxel.addBlock(sight, 0.045, 0.045, 0.13, 0x050505, 0, 0, 0);
    // Glowing red reticle dot
    voxel.addBlock(sight, 0.012, 0.012, 0.01, 0xff2222, 0, 0, 0, {
      emissive: 0xff1111,
      emissiveIntensity: 3.5
    });
    rifle.add(sight);

    // Tactical Handguard
    voxel.addBlock(rifle, 0.065, 0.08, 0.28, coyoteTan, 0, -0.005, -0.32);

    // Barrel & Muzzle Brake
    voxel.addBlock(rifle, 0.035, 0.035, 0.32, gunMetal, 0, 0.01, -0.48, { metalness: 0.9 });
    voxel.addBlock(rifle, 0.045, 0.045, 0.07, darkPoly, 0, 0.01, -0.66);

    // Curved Magazine
    const mag = new THREE.Group();
    mag.position.set(0, -0.12, -0.10);
    mag.rotation.x = 0.22;
    voxel.addBlock(mag, 0.045, 0.18, 0.09, darkPoly, 0, 0, 0);
    rifle.add(mag);
    rifle.userData.mag = mag;

    // Pistol Grip
    voxel.addBlock(rifle, 0.045, 0.14, 0.07, coyoteTan, 0, -0.09, 0.10, { rotation: { x: -0.3 } });

    // Crane Stock
    voxel.addBlock(rifle, 0.055, 0.10, 0.22, coyoteTan, 0, -0.01, 0.28);
    voxel.addBlock(rifle, 0.06, 0.12, 0.04, 0x111111, 0, -0.01, 0.40); // rubber pad

    rifle.userData.muzzleOffset = new THREE.Vector3(0, 0.01, -0.72);

    rifle.visible = false;
    this.weaponGroups.rifle = rifle;
    this.root.add(rifle);
  }

  buildShotgunModel() {
    // Breaker 12G Pump Shotgun
    const sg = new THREE.Group();
    sg.name = 'ViewmodelShotgun';

    const steelCol = 0x2e333a;
    const walnutWood = 0x483222;

    // Heavy Receiver
    voxel.addBlock(sg, 0.07, 0.11, 0.36, steelCol, 0, 0, 0, { metalness: 0.85, roughness: 0.4 });

    // Front Bead Sight
    voxel.addBlock(sg, 0.015, 0.02, 0.015, 0xffbb33, 0, 0.068, -0.78, {
      emissive: 0xff8800,
      emissiveIntensity: 1.5
    });

    // Barrel & Magazine Tube
    voxel.addBlock(sg, 0.042, 0.042, 0.52, steelCol, 0, 0.04, -0.42, { metalness: 0.9 });
    voxel.addBlock(sg, 0.038, 0.038, 0.46, steelCol, 0, -0.02, -0.38, { metalness: 0.9 });

    // Ribbed Wooden Pump Forend
    const pump = new THREE.Group();
    pump.position.set(0, -0.02, -0.32);
    voxel.addBlock(pump, 0.065, 0.065, 0.22, walnutWood, 0, 0, 0, { roughness: 0.85 });
    sg.add(pump);
    sg.userData.pump = pump;

    // Trigger Guard & Grip
    voxel.addBlock(sg, 0.045, 0.12, 0.08, walnutWood, 0, -0.08, 0.12, { rotation: { x: -0.38 } });

    // Solid Walnut Stock
    voxel.addBlock(sg, 0.055, 0.11, 0.28, walnutWood, 0, -0.04, 0.28);
    voxel.addBlock(sg, 0.06, 0.13, 0.03, 0x181818, 0, -0.04, 0.43);

    sg.userData.muzzleOffset = new THREE.Vector3(0, 0.04, -0.80);

    sg.visible = false;
    this.weaponGroups.shotgun = sg;
    this.root.add(sg);
  }

  buildPistolModel() {
    // Sidekick 9mm
    const pistol = new THREE.Group();
    pistol.name = 'ViewmodelPistol';

    const steelSlide = 0x262a30;
    const polymerFrame = 0x181b1f;

    // Slide
    voxel.addBlock(pistol, 0.045, 0.065, 0.24, steelSlide, 0, 0.04, -0.04, { metalness: 0.88, roughness: 0.35 });

    // Front & Rear Sights
    voxel.addBlock(pistol, 0.012, 0.018, 0.012, 0xffffff, 0, 0.08, -0.15); // Front dot
    voxel.addBlock(pistol, 0.042, 0.018, 0.014, 0x181818, 0, 0.08, 0.07);  // Rear notch

    // Polymer Lower Frame
    voxel.addBlock(pistol, 0.042, 0.045, 0.20, polymerFrame, 0, -0.01, -0.03);

    // Ergonomic Textured Grip
    voxel.addBlock(pistol, 0.042, 0.13, 0.07, polymerFrame, 0, -0.09, 0.04, {
      rotation: { x: -0.28 },
      roughness: 0.95
    });

    pistol.userData.muzzleOffset = new THREE.Vector3(0, 0.04, -0.20);

    pistol.visible = false;
    this.weaponGroups.pistol = pistol;
    this.root.add(pistol);
  }

  setWeapon(key) {
    if (!this.weaponGroups[key]) return;
    this.currentWeaponKey = key;

    for (const [k, grp] of Object.entries(this.weaponGroups)) {
      grp.visible = (k === key);
    }

    // Reset ADS & offsets
    this.isAds = false;
    this.adsProgress = 0;
    this.recoilOffset.set(0, 0, 0);
    this.recoilRotation.set(0, 0, 0);
  }

  triggerRecoil(kickBack = 0.05, kickPitch = 0.08) {
    this.recoilSpring = kickPitch;
    this.recoilOffset.z += kickBack;
    this.recoilOffset.y += kickBack * 0.4;
    this.recoilRotation.x += kickPitch;

    // Trigger muzzle flash
    this.flashTimer = 0.045; // seconds
    const curWep = this.weaponGroups[this.currentWeaponKey];
    if (curWep && curWep.userData.muzzleOffset) {
      const mOffset = curWep.userData.muzzleOffset;
      this.muzzleFlashMesh.position.copy(curWep.position).add(mOffset);
      this.muzzleFlashLight.position.copy(this.muzzleFlashMesh.position);
      this.muzzleFlashMesh.visible = true;
      this.muzzleFlashLight.intensity = 2.4;
    }
  }

  triggerReload() {
    this.isReloading = true;
    this.reloadProgress = 0.0;
  }

  setAds(active) {
    this.isAds = active;
  }

  update(delta, isMoving, isSprinting) {
    const config = this.configs[this.currentWeaponKey];
    if (!config) return;

    // 1. ADS transition lerp
    const targetAds = this.isAds && !isSprinting && !this.isReloading ? 1.0 : 0.0;
    this.adsProgress += (targetAds - this.adsProgress) * Math.min(1, delta * 16.0);

    // FOV camera zoom
    const targetFov = THREE.MathUtils.lerp(config.fovHip, config.fovAds, this.adsProgress);
    if (Math.abs(this.camera.fov - targetFov) > 0.01) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }

    // 2. Base position interpolation between Hip and ADS
    const curPos = new THREE.Vector3().lerpVectors(config.hipPos, config.adsPos, this.adsProgress);
    const curRot = new THREE.Euler(
      THREE.MathUtils.lerp(config.hipRot.x, config.adsRot.x, this.adsProgress),
      THREE.MathUtils.lerp(config.hipRot.y, config.adsRot.y, this.adsProgress),
      THREE.MathUtils.lerp(config.hipRot.z, config.adsRot.z, this.adsProgress)
    );

    // 3. Movement bobbing & sprint posture
    if (isSprinting && !this.isAds) {
      // Lower and tuck weapon during sprint
      curPos.y -= 0.06;
      curPos.z += 0.05;
      curRot.x -= 0.28;
      curRot.y += 0.22;
      curRot.z += 0.15;
    } else if (isMoving && !this.isAds) {
      // Natural weapon walk bob
      this.bobTimer += delta * 9.0;
      curPos.x += Math.cos(this.bobTimer * 0.5) * 0.014;
      curPos.y += Math.sin(this.bobTimer) * 0.010;
      curRot.z += Math.cos(this.bobTimer * 0.5) * 0.02;
    } else {
      // Subtle idle breathing
      const idleTime = performance.now() * 0.0018;
      curPos.y += Math.sin(idleTime) * 0.003;
      curPos.x += Math.cos(idleTime * 0.5) * 0.002;
    }

    // 4. Reload animation dip & raise
    if (this.isReloading) {
      this.reloadProgress += delta * 1.6; // ~1.6s reload
      const reloadWave = Math.sin(Math.min(Math.PI, this.reloadProgress * Math.PI));
      curPos.y -= reloadWave * 0.12;
      curPos.z += reloadWave * 0.06;
      curRot.x -= reloadWave * 0.35;
      curRot.z += reloadWave * 0.25;

      if (this.reloadProgress >= 1.0) {
        this.isReloading = false;
        this.reloadProgress = 0.0;
      }
    }

    // 5. Spring recovery from recoil
    this.recoilOffset.lerp(new THREE.Vector3(0, 0, 0), Math.min(1, delta * 18.0));
    this.recoilRotation.x += (0 - this.recoilRotation.x) * Math.min(1, delta * 20.0);

    // Apply combined transform to active weapon
    const activeWep = this.weaponGroups[this.currentWeaponKey];
    if (activeWep) {
      activeWep.position.copy(curPos).add(this.recoilOffset);
      activeWep.rotation.set(
        curRot.x + this.recoilRotation.x,
        curRot.y,
        curRot.z
      );

      // Align arms with weapon
      this.rightArm.position.set(
        activeWep.position.x,
        activeWep.position.y - 0.06,
        activeWep.position.z + 0.16
      );
      this.leftArm.position.set(
        activeWep.position.x - 0.12,
        activeWep.position.y - 0.04,
        activeWep.position.z - 0.14
      );
    }

    // 6. Muzzle flash decay
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.muzzleFlashMesh.visible = false;
        this.muzzleFlashLight.intensity = 0;
      }
    }
  }
}
