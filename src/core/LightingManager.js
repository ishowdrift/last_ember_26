import * as THREE from 'three';

export class LightingManager {
  constructor(scene) {
    this.scene = scene;
    
    // Time of day: 0.0 to 24.0 (hours)
    // 6.0 = Dawn, 12.0 = Noon, 18.0 = Dusk, 22.0 = Night
    this.timeOfDay = 14.0; // Start at pleasant afternoon
    this.targetTime = 14.0;
    this.autoCycle = false;
    this.cycleSpeed = 0.5; // hours per real-time second
    
    // Light objects
    this.sunLight = null;
    this.hemiLight = null;
    this.ambientLight = null;
    this.campfireLight = null;
    this.lanternLights = [];
    
    // Dynamic flicker state
    this.fireBaseIntensity = 3.5;
    this.fireCurrentIntensity = 3.5;
    
    // Sky and fog colors
    this.skyColor = new THREE.Color();
    this.fogColor = new THREE.Color();
    
    this.init();
  }

  init() {
    // 1. Hemisphere Light (Sky vs Ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0xddeeff, 0x334422, 0.7);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // 2. Ambient light for baseline visibility
    this.ambientLight = new THREE.AmbientLight(0x222233, 0.35);
    this.scene.add(this.ambientLight);

    // 3. Directional Sun/Moon light with shadow mapping
    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 90;
    
    // Tightly focused shadow bounds matching the camp and surroundings
    const d = 26;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // 4. Central Campfire Point Light
    // Note: castShadow is disabled on point lights to maintain 60+ FPS on all hardware
    // PointLight cubemap shadows require 6 render passes every frame, which severely degrades FPS.
    this.campfireLight = new THREE.PointLight(0xff7722, this.fireBaseIntensity, 22, 1.6);
    this.campfireLight.position.set(0, 0.85, 0);
    this.campfireLight.castShadow = false;
    this.scene.add(this.campfireLight);

    // Setup Fog
    this.scene.fog = new THREE.FogExp2(0x99aabb, 0.015);

    this.updateLighting(0);
  }

  addLanternLight(position, color = 0xffaa44, intensity = 1.8, distance = 10) {
    const light = new THREE.PointLight(color, intensity, distance, 1.8);
    light.position.copy(position);
    light.castShadow = false; // Keep draw calls optimized for integrated graphics
    this.scene.add(light);
    this.lanternLights.push({
      light,
      baseIntensity: intensity,
      basePos: position.clone(),
      flickerPhase: Math.random() * Math.PI * 2
    });
    return light;
  }

  setTime(time, smooth = false) {
    this.targetTime = (time % 24 + 24) % 24;
    if (!smooth) {
      this.timeOfDay = this.targetTime;
    }
  }

  isNightTime() {
    return this.timeOfDay < 5.5 || this.timeOfDay > 19.5;
  }

  update(delta) {
    if (this.autoCycle) {
      this.targetTime = (this.targetTime + delta * this.cycleSpeed) % 24;
    }

    // Smooth lerp toward target time
    const diff = this.targetTime - this.timeOfDay;
    // Handle wrap-around
    let step = diff;
    if (step > 12) step -= 24;
    if (step < -12) step += 24;
    this.timeOfDay = (this.timeOfDay + step * Math.min(1, delta * 3.0) + 24) % 24;

    this.updateLighting(delta);
  }

  updateLighting(delta) {
    const t = this.timeOfDay; // 0 to 24
    
    // Sun angle calculation:
    // Noon (12) -> Sun at peak (Y high)
    // Midnight (0) -> Sun under horizon (Moon up)
    const sunAngle = ((t - 6) / 24) * Math.PI * 2;
    const sunDist = 45;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunX = Math.cos(sunAngle) * sunDist;
    const sunZ = Math.cos(sunAngle * 0.5) * 15;

    this.sunLight.position.set(sunX, Math.max(1, sunY), sunZ);
    this.sunLight.target.position.set(0, 0, 0);

    const isDay = t >= 5.5 && t <= 19.5;
    const isDusk = (t >= 17.5 && t <= 19.5) || (t >= 5.5 && t <= 7.5);
    const dayFactor = Math.max(0, Math.min(1, Math.sin(((t - 5.5) / 14) * Math.PI)));

    // Colors:
    // Day Sky: Crisp desaturated slate-cyan #8fa3ad
    // Sunset/Dusk: Burnt rust-amber #b86236
    // Night Sky: Deep atmospheric charcoal-indigo #0a0e14
    if (dayFactor > 0.05) {
      if (isDusk) {
        // Dusk/Dawn
        this.skyColor.setHex(0xb26b42);
        this.fogColor.setHex(0x7a4e38);
        this.sunLight.color.setHex(0xff9944);
        this.sunLight.intensity = 0.9 * dayFactor;
        this.hemiLight.color.setHex(0xffaa77);
        this.hemiLight.groundColor.setHex(0x443322);
        this.hemiLight.intensity = 0.5;
        this.ambientLight.intensity = 0.25;
      } else {
        // Broad daylight
        this.skyColor.setHex(0x8fa3ad);
        this.fogColor.setHex(0x7e909a);
        this.sunLight.color.setHex(0xfff7e8);
        this.sunLight.intensity = 1.35 * dayFactor;
        this.hemiLight.color.setHex(0xbad2e0);
        this.hemiLight.groundColor.setHex(0x495e35);
        this.hemiLight.intensity = 0.65;
        this.ambientLight.intensity = 0.35;
      }
    } else {
      // Midnight
      this.skyColor.setHex(0x0a0e14);
      this.fogColor.setHex(0x0c1118);
      // Moon light: cool cyan/blue
      this.sunLight.color.setHex(0x5a7d9a);
      this.sunLight.intensity = 0.35;
      this.hemiLight.color.setHex(0x1a2638);
      this.hemiLight.groundColor.setHex(0x0d1217);
      this.hemiLight.intensity = 0.2;
      this.ambientLight.intensity = 0.12;
    }

    if (this.scene.background) {
      this.scene.background.copy(this.skyColor);
    } else {
      this.scene.background = this.skyColor.clone();
    }

    if (this.scene.fog) {
      this.scene.fog.color.copy(this.fogColor);
      // Slightly denser fog at night
      this.scene.fog.density = dayFactor > 0.2 ? 0.016 : 0.024;
    }

    // Campfire Flicker Logic:
    const now = performance.now() * 0.005;
    const flicker1 = Math.sin(now * 3.1) * 0.35;
    const flicker2 = Math.sin(now * 7.7) * 0.2;
    const randomPop = (Math.random() - 0.5) * 0.3;
    
    // Fire is prominent at night, visible but softer in day
    const fireNightBoost = dayFactor > 0.5 ? 2.5 : 4.5;
    this.campfireLight.intensity = Math.max(0.8, fireNightBoost + flicker1 + flicker2 + randomPop);
    
    // Micro jitter for realistic flame movement
    this.campfireLight.position.x = Math.sin(now * 4.2) * 0.05;
    this.campfireLight.position.z = Math.cos(now * 5.1) * 0.05;

    // Lantern subtle flicker
    for (const item of this.lanternLights) {
      item.flickerPhase += delta * 4;
      const lFlicker = Math.sin(item.flickerPhase) * 0.12 + (Math.random() - 0.5) * 0.08;
      const lanternDayDamping = dayFactor > 0.5 ? 0.8 : 1.6;
      item.light.intensity = Math.max(0.2, (item.baseIntensity + lFlicker) * lanternDayDamping);
    }
  }
}
