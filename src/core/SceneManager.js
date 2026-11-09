import * as THREE from 'three';
import { Renderer } from './Renderer.js';
import { CameraController } from './CameraController.js';
import { LightingManager } from './LightingManager.js';
import { audioManager } from './AudioManager.js';

import { Terrain } from '../world/Terrain.js';
import { Camp } from '../world/Camp.js';
import { AbandonedBuilding } from '../world/AbandonedBuilding.js';
import { ForestBiome } from '../world/ForestBiome.js';

import { Survivor } from '../characters/Survivor.js';
import { Zombie } from '../characters/Zombie.js';

import { Weapons } from '../objects/Weapons.js';
import { Collectibles } from '../objects/Collectibles.js';

import { Atmosphere } from '../effects/Atmosphere.js';

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    
    // Core Three.js components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      200
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

    // High precision timing and FPS
    this.lastTime = performance.now();
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();

    // World Entities
    this.terrain = null;
    this.camp = null;
    this.building = null;
    this.forest = null;

    // Characters
    this.survivor = null;
    this.zombie = null;

    // Objects
    this.weapons = null;
    this.collectibles = null;

    // State
    this.fogEnabled = true;
    this.particlesEnabled = true;

    this.init();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  init() {
    // 1. World building
    this.terrain = new Terrain(this.scene);
    this.camp = new Camp(this.scene, this.lightingManager);
    this.building = new AbandonedBuilding(this.scene);
    this.forest = new ForestBiome(this.scene);

    // 2. Characters
    this.survivor = new Survivor(this.scene, new THREE.Vector3(-2.2, 0.1, 1.2));
    this.zombie = new Zombie(this.scene, new THREE.Vector3(10.5, 0.1, -4.5));

    // 3. Firearms and Collectibles
    this.weapons = new Weapons(this.scene);
    this.collectibles = new Collectibles(this.scene);

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
    const isPerf = this.rendererManager.setPerformanceMode(!this.rendererManager.performanceMode);
    return isPerf;
  }

  animate() {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) * 0.001, 0.1);
    this.lastTime = now;

    // FPS calculation
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      if (this.onFpsUpdate) {
        this.onFpsUpdate(this.fps);
      }
    }

    // Update sub-managers
    this.lightingManager.update(delta);
    this.cameraController.update(delta);
    this.atmosphere.update(delta, this.lightingManager.isNightTime());

    if (this.camp) this.camp.update(delta);
    if (this.survivor) this.survivor.update(delta);
    if (this.zombie) this.zombie.update(delta);
    if (this.collectibles) this.collectibles.update(delta);

    // Audio night/day sync
    if (this.audioManager.initialized) {
      this.audioManager.setTimeOfDay(this.lightingManager.isNightTime());
    }

    // Render frame
    this.rendererManager.render(this.scene, this.camera);
  }
}
