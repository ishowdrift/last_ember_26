import * as THREE from 'three';

export class Renderer {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Graphics Quality Presets: 'low', 'medium', 'high'
    // Target hardware: Intel Core i5 9th Gen + UHD 630. Default 'low' locks rock-solid 60+ FPS under all angles.
    this.currentPreset = 'low';
    this.performanceMode = true;
    this.qualitySettings = {
      low: { pixelRatio: 0.85, shadowMap: false, shadowSize: 512, antialias: false },
      medium: { pixelRatio: 1.0, shadowMap: true, shadowSize: 1024, antialias: true },
      high: { pixelRatio: 1.25, shadowMap: true, shadowSize: 2048, antialias: true }
    };

    // Modern high-end color and shadow pipelines
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    
    this.renderer.shadowMap.enabled = false;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    this.applyQualityPreset(this.currentPreset);

    this.container.appendChild(this.renderer.domElement);

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  applyQualityPreset(presetName) {
    const config = this.qualitySettings[presetName] || this.qualitySettings.low;
    this.currentPreset = presetName;
    this.performanceMode = (presetName === 'low');

    // Apply pixel ratio clamp
    const ratio = Math.min(window.devicePixelRatio, config.pixelRatio);
    this.renderer.setPixelRatio(ratio);

    // Dynamic shadow toggle
    this.renderer.shadowMap.enabled = config.shadowMap;
    if (config.shadowMap) {
      this.renderer.shadowMap.autoUpdate = (presetName === 'high');
      this.renderer.shadowMap.needsUpdate = true;
    }

    return this.currentPreset;
  }

  setQualityPreset(presetName) {
    const preset = this.applyQualityPreset(presetName);
    if (this.onPresetChange) {
      this.onPresetChange(preset);
    }
    return preset;
  }

  // Toggle between medium (balanced 60fps) and low (ultra 60fps performance)
  togglePerformanceMode() {
    this.performanceMode = !this.performanceMode;
    const targetPreset = this.performanceMode ? 'low' : 'medium';
    this.setQualityPreset(targetPreset);
    return this.performanceMode;
  }

  getRenderInfo() {
    return {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures
    };
  }

  handleResize(camera) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    const config = this.qualitySettings[this.currentPreset] || this.qualitySettings.medium;
    const ratio = Math.min(window.devicePixelRatio, config.pixelRatio);
    this.renderer.setPixelRatio(ratio);
    if (camera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
