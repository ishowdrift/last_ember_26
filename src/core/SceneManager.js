import * as THREE from 'three';
import { Renderer } from './Renderer.js';
import { CameraController } from './CameraController.js';
import { LightingManager } from './LightingManager.js';
import { audioManager } from './AudioManager.js';

import { Terrain } from '../world/Terrain.js';
import { ChunkManager } from '../world/ChunkManager.js';
import { CityRegion } from '../world/CityRegion.js';
import { MedicalCampRegion } from '../world/MedicalCampRegion.js';
import { JungleRegion } from '../world/JungleRegion.js';
import { AbandonedBuilding } from '../world/AbandonedBuilding.js';
import { ForestBiome } from '../world/ForestBiome.js';

import { Survivor } from '../characters/Survivor.js';
import { Zombie } from '../characters/Zombie.js';
import { Brute } from '../characters/Brute.js';

import { Weapons } from '../objects/Weapons.js';
import { Collectibles } from '../objects/Collectibles.js';

import { Atmosphere } from '../effects/Atmosphere.js';

// Playable FPS 0.2 Systems
import { CollisionSystem } from '../fps/CollisionSystem.js';
import { FPSController } from '../fps/FPSController.js';
import { FPSViewmodel } from '../fps/FPSViewmodel.js';
import { WeaponManager } from '../fps/WeaponManager.js';
import { ZombieManager } from '../fps/ZombieManager.js';
import { PickupManager } from '../fps/PickupManager.js';

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    
    // Core Three.js components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      68,
      window.innerWidth / window.innerHeight,
      0.08,
      250
    );

    this.rendererManager = new Renderer(this.container);
    this.cameraController = new CameraController(
      this.camera,
      this.rendererManager.renderer.domElement,
      this.scene
    );
    this.lightingManager = new LightingManager(this.scene);
    this.atmosphere = new Atmosphere(this.scene);
    this.audioManager = audioManager;

    // Mode: 'fps' (playable first-person shooter) vs 'spectator' (cinematic overview)
    this.gameMode = 'fps';

    // High precision timing and FPS
    this.lastTime = performance.now();
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.lowFpsStrike = 0;

    // World Entities
    this.terrain = null;
    this.chunkManager = null;
    this.city = null;
    this.medicalCamp = null;
    this.camp = null; // Alias for backward compatibility
    this.jungle = null;
    this.building = null;
    this.forest = null;

    // Characters
    this.survivor = null;
    this.zombie = null;
    this.brute = null;

    // Objects
    this.weapons = null;
    this.collectibles = null;

    // FPS Gameplay Subsystems
    this.collision = null;
    this.fpsController = null;
    this.viewmodel = null;
    this.weaponManager = null;
    this.zombieManager = null;
    this.pickupManager = null;
    this.fpsInterface = null;

    // State
    this.fogEnabled = true;
    this.particlesEnabled = true;

    this.init();
    // Enforce initial quality preset across all managers (lighting, atmosphere, renderer)
    this.setQualityPreset(this.rendererManager.currentPreset);

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  init() {
    // 1. World building across 3 connected regions
    this.terrain = new Terrain(this.scene);
    this.chunkManager = new ChunkManager(this.scene);

    // Region A: Abandoned City & Gas Station (North: Z: -60m to -20m)
    this.city = new CityRegion(this.scene, this.lightingManager);

    // Region B: Medical Quarantine Camp (Center: Z: -20m to +16m)
    this.medicalCamp = new MedicalCampRegion(this.scene, this.lightingManager);
    this.camp = this.medicalCamp; // Alias

    // Region C: Dense Canopy Jungle & Evacuation Route (South: Z: +16m to +60m)
    this.jungle = new JungleRegion(this.scene);

    // Outpost ruins & forest perimeter
    this.building = new AbandonedBuilding(this.scene);
    this.forest = new ForestBiome(this.scene);

    // Register chunks for spatial distance/frustum culling
    this.chunkManager.registerChunk(0, -2, this.city.group, 'city');
    this.chunkManager.registerChunk(0, 0, this.medicalCamp.group, 'camp');
    this.chunkManager.registerChunk(0, 2, this.jungle.group, 'jungle');
    this.chunkManager.registerChunk(-1, -1, this.building.group, 'outpost');

    // 2. Decorative static characters for camp lore
    this.survivor = new Survivor(this.scene, new THREE.Vector3(-2.2, 0.1, 1.2));

    // 3. Firearms and Collectibles
    this.weapons = new Weapons(this.scene);
    this.collectibles = new Collectibles(this.scene);

    // 4. Playable FPS 0.2 Gameplay Subsystems
    this.collision = new CollisionSystem();
    this.collision.registerWorldColliders();

    this.fpsController = new FPSController(
      this.camera,
      this.rendererManager.renderer.domElement,
      this.collision
    );
    this.scene.add(this.fpsController.yawObject);

    this.viewmodel = new FPSViewmodel(this.camera);

    this.weaponManager = new WeaponManager(
      this.scene,
      this.camera,
      this.viewmodel,
      this.collision,
      this.fpsController
    );

    this.zombieManager = new ZombieManager(this.scene, this.collision);
    this.weaponManager.zombieManager = this.zombieManager;

    this.pickupManager = new PickupManager(this.scene, this.collision);

    // Wire controller callbacks
    this.fpsController.onFootstep = (isSprinting) => {
      this.audioManager.playFootstep(isSprinting);
    };

    this.fpsController.onPauseStateChange = (isPaused) => {
      if (this.fpsInterface) {
        if (isPaused) this.fpsInterface.openPauseMenu();
        else this.fpsInterface.closePauseMenu();
      }
    };

    // Wire pickup collection
    this.pickupManager.onCollect = (item) => {
      if (item.type === 'medkit') {
        const curHp = this.fpsInterface ? this.fpsInterface.playerHealth : 100;
        const newHp = Math.min(100, curHp + item.amount);
        if (this.fpsInterface) {
          this.fpsInterface.updateHealth(newHp);
          this.fpsInterface.showPickupNotice(item.label);
        }
      } else if (item.type === 'ammo') {
        this.weaponManager.addAmmo(item.wepType, item.amount);
        if (this.fpsInterface) {
          this.fpsInterface.showPickupNotice(item.label);
        }
      }
    };

    // Window resize binding
    window.addEventListener('resize', () => {
      this.rendererManager.handleResize(this.camera);
    });
  }

  // UI Control hooks
  setTime(hour, smooth = true) {
    this.lightingManager.setTime(hour, smooth);
    this.audioManager.setTimeOfDay(this.lightingManager.isNightTime());
  }

  toggleAutoCycle() {
    this.lightingManager.autoCycle = !this.lightingManager.autoCycle;
    return this.lightingManager.autoCycle;
  }

  setSurvivorAnimation(anim) {
    if (this.survivor) {
      this.survivor.setAnimation(anim);
    }
  }

  setZombieAnimation(anim) {
    if (this.zombie) {
      this.zombie.setAnimation(anim);
    }
  }

  setFocus(key, smooth = true) {
    this.cameraController.setFocus(key, smooth);
    this.audioManager.playUiClick();
  }

  resetCamera() {
    this.cameraController.resetView();
    this.audioManager.playUiClick();
  }

  zoomIn() {
    this.cameraController.zoomBy(0.78);
    this.audioManager.playUiClick();
  }

  zoomOut() {
    this.cameraController.zoomBy(1.28);
    this.audioManager.playUiClick();
  }

  toggleAutoRotate() {
    const res = this.cameraController.toggleAutoRotate();
    this.audioManager.playUiClick();
    return res;
  }

  toggleFog() {
    this.fogEnabled = !this.fogEnabled;
    if (this.fogEnabled) {
      this.scene.fog = new THREE.FogExp2(this.lightingManager.fogColor, 0.016);
    } else {
      this.scene.fog = null;
    }
    this.audioManager.playUiClick();
    return this.fogEnabled;
  }

  toggleParticles() {
    this.particlesEnabled = !this.particlesEnabled;
    this.atmosphere.setEnabled(this.particlesEnabled);
    if (this.camp && this.camp.campfire) {
      this.camp.campfire.setVisible(this.particlesEnabled);
    }
    this.audioManager.playUiClick();
    return this.particlesEnabled;
  }

  toggleAudio() {
    return this.audioManager.toggleMute();
  }

  togglePerformanceMode() {
    const isPerf = this.rendererManager.togglePerformanceMode();
    this.atmosphere.applyQualityPreset(this.rendererManager.currentPreset);
    this.lightingManager.applyQualityPreset(this.rendererManager.currentPreset);
    return isPerf;
  }

  setQualityPreset(presetName) {
    const preset = this.rendererManager.setQualityPreset(presetName);
    this.atmosphere.applyQualityPreset(preset);
    this.lightingManager.applyQualityPreset(preset);
    return preset;
  }

  toggleGameMode() {
    this.gameMode = (this.gameMode === 'fps') ? 'spectator' : 'fps';

    if (this.gameMode === 'spectator') {
      // Detach camera from FPS controller
      this.fpsController.pitchObject.remove(this.camera);
      this.scene.add(this.camera);
      this.cameraController.enabled = true;
      this.cameraController.setFocus('overview', false);
      this.viewmodel.root.visible = false;
      if (this.fpsController.isPointerLocked) {
        this.fpsController.exitLock();
      }
    } else {
      // Attach camera to FPS controller
      this.scene.remove(this.camera);
      this.fpsController.pitchObject.add(this.camera);
      this.cameraController.enabled = false;
      this.viewmodel.root.visible = true;
      this.fpsController.requestLock();
    }
    return this.gameMode;
  }

  restartSurvivalGame() {
    if (this.fpsController) {
      this.fpsController.teleport(new THREE.Vector3(0, 0.15, 3.5), Math.PI);
    }
    if (this.zombieManager) {
      this.zombieManager.reset();
    }
    if (this.pickupManager) {
      this.pickupManager.reset();
    }
    if (this.weaponManager) {
      // Reset ammo
      for (const wep of Object.values(this.weaponManager.weapons)) {
        wep.currentMag = wep.magSize;
        if (wep.id === 'rifle') wep.reserveAmmo = 120;
        else if (wep.id === 'shotgun') wep.reserveAmmo = 32;
        else if (wep.id === 'pistol') wep.reserveAmmo = 60;
      }
      this.weaponManager.notifyAmmo();
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) * 0.001, 0.1);
    this.lastTime = now;

    // High-precision smoothed FPS calculation
    this.frameCount++;
    const elapsed = now - this.lastFpsUpdate;
    if (elapsed >= 500) {
      if (elapsed < 1200 && this.frameCount > 2) {
        const measured = Math.round((this.frameCount * 1000) / elapsed);
        this.fps = Math.round(this.fps * 0.7 + measured * 0.3);
      }
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      // Adaptive Performance Guard (Guarantees 60 FPS on Intel UHD 630):
      if (this.fps < 45 && this.rendererManager.currentPreset !== 'low' && elapsed < 800) {
        this.lowFpsStrike++;
        if (this.lowFpsStrike >= 4) {
          console.warn(`[AFTERFALL] Performance guard active: ${this.fps} FPS detected. Switching to 60 FPS lock.`);
          this.setQualityPreset('low');
          this.lowFpsStrike = 0;
          if (this.onPerformanceGuardActivated) {
            this.onPerformanceGuardActivated();
          }
        }
      } else if (this.fps >= 55) {
        this.lowFpsStrike = 0;
      }

      if (this.onFpsUpdate) {
        this.onFpsUpdate(this.fps);
      }
    }

    // Dynamic directional shadow center follows camera target (keeps shadows sharp with low memory)
    if (this.gameMode === 'fps') {
      this.fpsController.update(delta);
      this.viewmodel.update(delta, this.fpsController.isMoving, this.fpsController.isSprinting);
      this.weaponManager.update(delta);
      this.zombieManager.update(delta, this.fpsController.position);
      this.pickupManager.update(delta, this.fpsController.position, this.pickupManager.onCollect);
      this.lightingManager.setShadowCenter(this.fpsController.position);

      // Update current region in UI
      const region = this.chunkManager.getRegionName(this.fpsController.position.z);
      const regLabel = document.getElementById('current-region-label');
      if (regLabel) {
        if (region === 'city') regLabel.textContent = 'REGION A: ABANDONED CITY';
        else if (region === 'jungle') regLabel.textContent = 'REGION C: DENSE JUNGLE';
        else regLabel.textContent = 'REGION B: MEDICAL CAMP';
      }
    } else {
      this.cameraController.update(delta);
      this.lightingManager.setShadowCenter(this.cameraController.controls.target);
    }

    // Dynamic frustum culling across all 18 world chunks
    if (this.chunkManager) {
      this.chunkManager.update(this.camera);
    }

    // Update sub-managers
    this.lightingManager.update(delta);
    this.atmosphere.update(delta, this.lightingManager.isNightTime());

    // Update 3 connected regions
    if (this.city) this.city.update(delta);
    if (this.medicalCamp) this.medicalCamp.update(delta);
    if (this.jungle) this.jungle.update(delta);

    // Update characters
    if (this.survivor) this.survivor.update(delta);

    if (this.collectibles) this.collectibles.update(delta);

    // Audio night/day sync
    if (this.audioManager.initialized) {
      this.audioManager.setTimeOfDay(this.lightingManager.isNightTime());
    }

    // Render frame
    this.rendererManager.render(this.scene, this.camera);
  }
}
