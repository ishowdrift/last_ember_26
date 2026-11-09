import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';
import { audioManager } from '../core/AudioManager.js';

/**
 * Interactive Survival Supply Pickup Manager for THE LAST EMBER
 * Spawns Trauma Medkits and Tactical Ammo Crates with proximity collection,
 * floating visual animation, and respawn cycles.
 */
export class PickupManager {
  constructor(scene, collisionSystem) {
    this.scene = scene;
    this.collision = collisionSystem;
    this.pickups = [];

    // Callback on collection: (type, amount, label)
    this.onCollect = null;

    this.initPickups();
  }

  initPickups() {
    const configs = [
      // Medical Camp
      { type: 'medkit', amount: 40, pos: new THREE.Vector3(-6.2, 0.2, -1.2), label: '+40 HP [MEDKIT]' },
      { type: 'medkit', amount: 40, pos: new THREE.Vector3(6.5, 0.2, -2.2), label: '+40 HP [MEDKIT]' },
      { type: 'ammo', wepType: 'rifle', amount: 60, pos: new THREE.Vector3(3.2, 0.85, 0.5), label: '+60 RIFLE AMMO' },

      // Abandoned City & Gas Station
      { type: 'medkit', amount: 40, pos: new THREE.Vector3(14.0, 0.3, -41.0), label: '+40 HP [MEDKIT]' },
      { type: 'ammo', wepType: 'shotgun', amount: 16, pos: new THREE.Vector3(11.5, 0.3, -33.5), label: '+16 SHOTGUN SHELLS' },
      { type: 'ammo', wepType: 'pistol', amount: 30, pos: new THREE.Vector3(-14.0, 0.3, -26.0), label: '+30 9MM AMMO' },

      // Outpost Ruins
      { type: 'medkit', amount: 40, pos: new THREE.Vector3(-15.5, 1.8, -13.5), label: '+40 HP [MEDKIT]' },
      { type: 'ammo', wepType: 'rifle', amount: 60, pos: new THREE.Vector3(-13.0, 0.9, -11.0), label: '+60 RIFLE AMMO' },

      // Jungle Civilian Rescue Point (Cruiser)
      { type: 'medkit', amount: 50, pos: new THREE.Vector3(-7.5, 0.3, 44.5), label: '+50 HP [EMERGENCY KIT]' },
      { type: 'ammo', wepType: 'rifle', amount: 90, pos: new THREE.Vector3(-9.0, 0.3, 47.0), label: '+90 MILITARY AMMO' }
    ];

    configs.forEach(cfg => {
      this.createPickup(cfg);
    });
  }

  createPickup(cfg) {
    const group = new THREE.Group();
    const floorY = this.collision.getFloorHeight(cfg.pos.x, cfg.pos.z);
    group.position.set(cfg.pos.x, Math.max(cfg.pos.y, floorY + 0.35), cfg.pos.z);

    if (cfg.type === 'medkit') {
      // White trauma case with glowing emerald cross
      voxel.addBlock(group, 0.36, 0.26, 0.16, 0xededed, 0, 0, 0, { roughness: 0.8 });
      // Red clasp
      voxel.addBlock(group, 0.38, 0.05, 0.18, 0xbb2222, 0, 0, 0);
      // Glowing green cross
      const crossCol = 0x22ff66;
      voxel.addBlock(group, 0.14, 0.04, 0.02, crossCol, 0, 0, 0.09, { emissive: crossCol, emissiveIntensity: 2.2 });
      voxel.addBlock(group, 0.04, 0.14, 0.02, crossCol, 0, 0, 0.09, { emissive: crossCol, emissiveIntensity: 2.2 });
    } else {
      // Olive drab tactical military ammo can
      const olive = 0x3d4a30;
      voxel.addBlock(group, 0.38, 0.24, 0.20, olive, 0, 0, 0, { metalness: 0.6, roughness: 0.6 });
      // Yellow stencil lettering strip
      voxel.addBlock(group, 0.28, 0.05, 0.22, 0xffd23f, 0, 0.04, 0, { emissive: 0xffaa00, emissiveIntensity: 1.2 });
      // Metal carry handle
      voxel.addBlock(group, 0.22, 0.06, 0.06, 0x222222, 0, 0.14, 0);
    }

    this.scene.add(group);

    this.pickups.push({
      group,
      config: cfg,
      baseY: group.position.y,
      available: true,
      respawnTimer: 0
    });
  }

  reset() {
    this.pickups.forEach(p => {
      p.available = true;
      p.respawnTimer = 0;
      p.group.visible = true;
    });
  }

  update(delta, playerPos, onCollectItem) {
    if (!playerPos) return;

    const time = performance.now() * 0.0025;

    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];

      if (!p.available) {
        p.respawnTimer -= delta;
        if (p.respawnTimer <= 0) {
          p.available = true;
          p.group.visible = true;
        }
        continue;
      }

      // Gentle floating & rotation animation
      p.group.rotation.y += delta * 1.6;
      p.group.position.y = p.baseY + Math.sin(time + i) * 0.06;

      // Proximity check with player (collection distance: 1.6m)
      const dist = p.group.position.distanceTo(playerPos);
      if (dist <= 1.6) {
        p.available = false;
        p.group.visible = false;
        p.respawnTimer = 25.0; // 25s respawn timer

        audioManager.playPickup();

        if (onCollectItem) {
          onCollectItem(p.config);
        }
      }
    }
  }
}
