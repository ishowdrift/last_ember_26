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
    // Locked to 1.0 by default to ensure rock-solid 60+ FPS on all devices (including integrated GPUs)
    this.maxPixelRatio = 1.0;
    this.performanceMode = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.maxPixelRatio));
    
    // Modern high-end color and shadow pipelines
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  setPerformanceMode(enabled) {
    this.performanceMode = enabled;
    const ratio = enabled ? 1.0 : Math.min(window.devicePixelRatio, this.maxPixelRatio);
    this.renderer.setPixelRatio(ratio);
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
    const ratio = this.performanceMode ? 1.0 : Math.min(window.devicePixelRatio, this.maxPixelRatio);
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
