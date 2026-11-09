import * as THREE from 'three';

export class Atmosphere {
  constructor(scene) {
    this.scene = scene;
    this.enabled = true;
    this.dustParticles = null;
    this.dustCount = 120;
    this.dustData = [];
    
    this.mistPlanes = [];
    this.group = new THREE.Group();
    
    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.buildFloatingDust();
    this.buildGroundMist();
  }

  buildFloatingDust() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.dustCount * 3);
    const colors = new Float32Array(this.dustCount * 3);

    const cDay = new THREE.Color(0xdde3ea);
    const cNight = new THREE.Color(0x99dd66); // Bio-luminescent spores / fireflies!

    for (let i = 0; i < this.dustCount; i++) {
      // Spread across a 35x35 zone
      const x = (Math.random() - 0.5) * 40;
      const y = 0.5 + Math.random() * 6.5;
      const z = (Math.random() - 0.5) * 40;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3] = cDay.r;
      colors[i * 3 + 1] = cDay.g;
      colors[i * 3 + 2] = cDay.b;

      this.dustData.push({
        baseY: y,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.1,
        vz: (Math.random() - 0.5) * 0.2,
        wobble: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.2
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Crisp pixelated square particle map
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, 1, 6, 6);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      color: 0xdde3ea,
      map: tex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.group.add(this.dustParticles);
  }

  buildGroundMist() {
    // 3 layered low-lying voxel mist sheets
    const mistGeo = new THREE.PlaneGeometry(36, 36);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0x6e828f,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 3; i++) {
      const plane = new THREE.Mesh(mistGeo, mistMat.clone());
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(
        (i - 1) * 3,
        0.18 + i * 0.12,
        (i - 1) * 3
      );
      this.group.add(plane);
      this.mistPlanes.push({
        mesh: plane,
        rotSpeed: 0.015 * (i % 2 === 0 ? 1 : -1),
        baseY: plane.position.y
      });
    }
  }

  update(delta, isNight = false) {
    if (!this.enabled) return;
    const time = performance.now() * 0.001;

    // Zero-overhead GPU transform & color transition (0 CPU buffer uploads!)
    if (this.dustParticles) {
      this.dustParticles.rotation.y += delta * 0.03;
      this.dustParticles.position.y = Math.sin(time * 0.5) * 0.2;

      const targetCol = isNight ? 0x99dd66 : 0xdde3ea;
      this.dustParticles.material.color.lerp(new THREE.Color(targetCol), Math.min(1, delta * 3.0));
    }

    // Animate mist planes
    this.mistPlanes.forEach((mist, idx) => {
      mist.mesh.rotation.z += mist.rotSpeed * delta;
      mist.mesh.position.y = mist.baseY + Math.sin(time * 0.8 + idx) * 0.04;
      mist.mesh.material.opacity = isNight ? 0.18 : 0.09;
    });
  }

  setEnabled(val) {
    this.enabled = val;
    this.group.visible = val;
  }
}
