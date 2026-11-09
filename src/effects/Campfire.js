import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

export class Campfire {
  constructor(scene, position = new THREE.Vector3(0, 0, 0)) {
    this.scene = scene;
    this.position = position;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    
    this.flameBlocks = [];
    this.embers = null;
    this.emberData = [];
    this.smokePuffs = [];
    this.active = true;

    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.buildFirePit();
    this.buildWoodLogs();
    this.buildVoxelFlames();
    this.buildEmberParticles();
    this.buildSmokeParticles();
  }

  buildFirePit() {
    const staticBase = new THREE.Group();
    this.group.add(staticBase);

    // 1. Ash and charcoal base
    voxel.addBlock(staticBase, 1.4, 0.12, 1.4, 0x181514, 0, 0.05, 0, {
      roughness: 0.95,
      metalness: 0.05
    });

    // Glowing hot coals (merged into single static base with emissive glow)
    const coalCol = 0x3a1005;
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 0.2 + Math.random() * 0.35;
      voxel.addBlock(
        staticBase,
        0.2 + Math.random() * 0.15,
        0.1 + Math.random() * 0.08,
        0.2 + Math.random() * 0.15,
        coalCol,
        Math.cos(angle) * dist,
        0.12,
        Math.sin(angle) * dist,
        {
          roughness: 0.8,
          emissive: 0xff3300,
          emissiveIntensity: 0.8,
          castShadow: false,
          receiveShadow: false
        }
      );
    }

    // 2. Stone perimeter ring
    const stoneCount = 10;
    const stoneRadius = 0.95;
    for (let i = 0; i < stoneCount; i++) {
      const angle = (i / stoneCount) * Math.PI * 2;
      const x = Math.cos(angle) * stoneRadius + (Math.random() - 0.5) * 0.12;
      const z = Math.sin(angle) * stoneRadius + (Math.random() - 0.5) * 0.12;
      const stoneColors = [0x504e4c, 0x625d57, 0x413e3b, 0x5a5651];
      const col = stoneColors[i % stoneColors.length];

      voxel.addBlock(
        staticBase,
        0.42 + Math.random() * 0.18,
        0.28 + Math.random() * 0.12,
        0.36 + Math.random() * 0.15,
        col,
        x,
        0.14,
        z,
        {
          rotation: { y: angle + Math.random() * 0.4, x: (Math.random() - 0.5) * 0.15 },
          roughness: 0.92
        }
      );
    }

    // Merge static fire pit stones and base
    voxel.mergeStaticGroup(staticBase, { castShadow: true, receiveShadow: true });
  }

  buildWoodLogs() {
    const staticLogs = new THREE.Group();
    this.group.add(staticLogs);

    const logColors = [0x3c2718, 0x2e1d12, 0x483222];
    
    // Cross logs leaning into fire
    const angles = [0.2, 1.8, 3.4, 4.9];
    angles.forEach((angle, idx) => {
      const logGroup = new THREE.Group();
      logGroup.position.set(Math.cos(angle) * 0.45, 0.18, Math.sin(angle) * 0.45);
      logGroup.rotation.y = angle + Math.PI;
      logGroup.rotation.z = -0.38; // Lean inward
      
      // Main log
      voxel.addBlock(logGroup, 0.22, 0.95, 0.22, logColors[idx % logColors.length], 0, 0, 0, {
        roughness: 0.9
      });
      // Charred tip
      voxel.addBlock(logGroup, 0.21, 0.25, 0.21, 0x120c09, 0, 0.45, 0, {
        roughness: 0.95,
        emissive: 0x441100,
        emissiveIntensity: 0.4
      });

      staticLogs.add(logGroup);
    });

    // Merge static logs into single draw call
    voxel.mergeStaticGroup(staticLogs, { castShadow: true, receiveShadow: true });
  }

  buildVoxelFlames() {
    // Hierarchical stylized voxel flames:
    // Core (bright yellow/white), Mid (fiery orange), Outer (deep amber/red tips)
    const flameConfigs = [
      { w: 0.32, h: 0.75, d: 0.32, col: 0xffea42, em: 0xffaa00, emInt: 1.2, x: 0, y: 0.45, z: 0, speed: 7 },
      { w: 0.26, h: 0.65, d: 0.26, col: 0xff8811, em: 0xff4400, emInt: 1.0, x: 0.15, y: 0.4, z: -0.1, speed: 8.5 },
      { w: 0.24, h: 0.60, d: 0.24, col: 0xff6600, em: 0xee2200, emInt: 1.0, x: -0.12, y: 0.38, z: 0.12, speed: 6.8 },
      { w: 0.20, h: 0.50, d: 0.20, col: 0xffaa22, em: 0xff6600, emInt: 1.1, x: -0.08, y: 0.5, z: -0.15, speed: 9 },
      { w: 0.18, h: 0.45, d: 0.18, col: 0xff3300, em: 0x990000, emInt: 0.8, x: 0.18, y: 0.35, z: 0.15, speed: 7.4 },
      // Upper flickering tips
      { w: 0.14, h: 0.35, d: 0.14, col: 0xfffa70, em: 0xffbb00, emInt: 1.3, x: 0.02, y: 0.85, z: 0.02, speed: 11 },
      { w: 0.12, h: 0.30, d: 0.12, col: 0xff9900, em: 0xdd3300, emInt: 1.0, x: -0.05, y: 0.75, z: 0.08, speed: 10 }
    ];

    flameConfigs.forEach((cfg) => {
      const mesh = voxel.addBlock(this.group, cfg.w, cfg.h, cfg.d, cfg.col, cfg.x, cfg.y, cfg.z, {
        roughness: 0.3,
        emissive: cfg.em,
        emissiveIntensity: cfg.emInt,
        transparent: false,
        castShadow: false,
        receiveShadow: false
      });
      mesh.userData.isDynamic = true;
      this.flameBlocks.push({
        mesh,
        type: 'flame',
        baseY: cfg.y,
        baseScale: mesh.scale.clone(),
        speed: cfg.speed,
        phase: Math.random() * Math.PI * 2
      });
    });
  }

  buildEmberParticles() {
    const emberCount = 55;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    const colors = new Float32Array(emberCount * 3);
    const sizes = new Float32Array(emberCount);

    const c1 = new THREE.Color(0xfff066); // bright spark
    const c2 = new THREE.Color(0xff5511); // deep orange ember

    for (let i = 0; i < emberCount; i++) {
      const x = (Math.random() - 0.5) * 0.6;
      const y = 0.2 + Math.random() * 2.2;
      const z = (Math.random() - 0.5) * 0.6;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixed = c1.clone().lerp(c2, Math.random());
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;

      sizes[i] = 4.0 + Math.random() * 5.0;

      this.emberData.push({
        vx: (Math.random() - 0.5) * 0.15,
        vy: 0.7 + Math.random() * 1.0,
        vz: (Math.random() - 0.5) * 0.15,
        wobble: Math.random() * Math.PI * 2,
        maxHeight: 2.8 + Math.random() * 2.5,
        life: Math.random()
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Simple procedural square/point texture
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 2, 12, 12); // Crisp square voxel particle!
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;

    const material = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.embers = new THREE.Points(geometry, material);
    this.group.add(this.embers);
  }

  buildSmokeParticles() {
    // 4 rising voxel smoke cubes that loop
    const smokeCount = 4;
    for (let i = 0; i < smokeCount; i++) {
      const mesh = voxel.addBlock(this.group, 0.28, 0.28, 0.28, 0x4a4745, 0, 1.2, 0, {
        roughness: 0.9,
        transparent: true,
        opacity: 0.35,
        castShadow: false,
        receiveShadow: false
      });
      mesh.visible = false;
      mesh.userData.isDynamic = true;
      this.smokePuffs.push({
        mesh,
        life: i / smokeCount,
        maxLife: 2.8,
        speedY: 0.8 + Math.random() * 0.4,
        driftX: (Math.random() - 0.5) * 0.25,
        driftZ: (Math.random() - 0.5) * 0.25,
        rotSpeed: (Math.random() - 0.5) * 1.5
      });
    }
  }

  update(delta) {
    if (!this.active) return;
    const time = performance.now() * 0.001;

    // 1. Animate voxel flames
    this.flameBlocks.forEach((item) => {
      if (item.type === 'flame') {
        const sine = Math.sin(time * item.speed + item.phase);
        const cos = Math.cos(time * item.speed * 0.7 + item.phase);
        item.mesh.scale.y = Math.max(0.3, item.baseScale.y * (1.0 + sine * 0.35));
        item.mesh.scale.x = item.baseScale.x * (1.0 + cos * 0.15);
        item.mesh.scale.z = item.baseScale.z * (1.0 - cos * 0.15);
        item.mesh.position.y = item.baseY + sine * 0.04;
      }
    });

    // 2. Animate Embers
    if (this.embers) {
      const posAttr = this.embers.geometry.attributes.position;
      const positions = posAttr.array;

      for (let i = 0; i < this.emberData.length; i++) {
        const data = this.emberData[i];
        data.wobble += delta * 4;

        // Move upward with gentle wind wobble
        positions[i * 3] += (data.vx + Math.sin(data.wobble) * 0.02) * delta * 4;
        positions[i * 3 + 1] += data.vy * delta;
        positions[i * 3 + 2] += (data.vz + Math.cos(data.wobble) * 0.02) * delta * 4;

        // Reset if reached max height
        if (positions[i * 3 + 1] > data.maxHeight) {
          positions[i * 3] = (Math.random() - 0.5) * 0.5;
          positions[i * 3 + 1] = 0.2 + Math.random() * 0.2;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
          data.maxHeight = 2.4 + Math.random() * 2.4;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 3. Animate Smoke Puffs
    this.smokePuffs.forEach((smoke) => {
      smoke.life += delta;
      if (smoke.life >= smoke.maxLife) {
        smoke.life = 0;
        smoke.mesh.position.set(
          (Math.random() - 0.5) * 0.2,
          0.8,
          (Math.random() - 0.5) * 0.2
        );
        smoke.mesh.scale.set(0.2, 0.2, 0.2);
        smoke.mesh.visible = true;
      }

      const progress = smoke.life / smoke.maxLife; // 0 to 1
      smoke.mesh.position.y += smoke.speedY * delta;
      smoke.mesh.position.x += smoke.driftX * delta;
      smoke.mesh.position.z += smoke.driftZ * delta;
      smoke.mesh.rotation.y += smoke.rotSpeed * delta;

      // Expand and fade out
      const s = 0.3 + progress * 0.9;
      smoke.mesh.scale.set(s, s, s);
      smoke.mesh.material.opacity = Math.max(0, (1 - progress) * 0.38);
    });
  }

  setVisible(visible) {
    this.active = visible;
    this.group.visible = visible;
  }
}
