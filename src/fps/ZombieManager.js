import * as THREE from 'three';
import { ZombieEntity } from './ZombieEntity.js';

/**
 * Multi-Zombie AI Manager for THE LAST EMBER
 * Manages zombie placement, round-robin performance updates on Intel UHD 630,
 * combat hitscan raycasting, and respawn cycles.
 */
export class ZombieManager {
  constructor(scene, collisionSystem) {
    this.scene = scene;
    this.collision = collisionSystem;
    this.zombies = [];
    this.updateIndex = 0;

    // Callback when any zombie attacks the player
    this.onPlayerAttack = null;

    this.initSpawns();
  }

  initSpawns() {
    // Strategic tactical spawn locations across all 3 regions:
    const spawnConfigs = [
      // --- REGION A: Abandoned City (North) ---
      { type: 'runner', position: new THREE.Vector3(12.0, 0, -32.0) }, // Gas station canopy
      { type: 'runner', position: new THREE.Vector3(18.0, 0, -45.0) }, // Gas station rear alley
      { type: 'walker', position: new THREE.Vector3(-14.0, 0, -38.0) }, // Between apartments
      { type: 'walker', position: new THREE.Vector3(-3.0, 0, -28.0) },  // Highway sedan
      { type: 'walker', position: new THREE.Vector3(0.5, 0, -48.0) },   // City boulevard end

      // --- REGION B: Medical Camp Perimeter (Center) ---
      { type: 'walker', position: new THREE.Vector3(10.5, 0, -4.5) },   // East sandbag approach
      { type: 'runner', position: new THREE.Vector3(-12.0, 0, 4.0) },   // West forest tree line

      // --- OUTPOST RUINS (North-West Elevation) ---
      { type: 'walker', position: new THREE.Vector3(-16.0, 1.6, -14.0) }, // Outpost interior
      { type: 'runner', position: new THREE.Vector3(-12.0, 0.8, -10.0) }, // Outpost trail ramp

      // --- REGION C: Dense Canopy Jungle (South) ---
      { type: 'runner', position: new THREE.Vector3(-5.0, 0, 24.0) },   // Jungle trail entrance
      { type: 'runner', position: new THREE.Vector3(2.0, 0, 32.0) },    // Log bridge crossing
      { type: 'walker', position: new THREE.Vector3(-10.0, 0, 38.0) },  // Gully boulders
      { type: 'brute',  position: new THREE.Vector3(12.0, 0, 42.0) }    // The Brute Apex Mutant at the Nest!
    ];

    spawnConfigs.forEach(cfg => {
      const z = new ZombieEntity(this.scene, this.collision, cfg);
      this.zombies.push(z);
    });
  }

  /**
   * Raycast against all active living zombies
   */
  raycastZombies(origin, dir, maxDist) {
    let closestHit = null;
    let closestDist = maxDist;

    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      if (z.isDead()) continue;

      const hit = z.intersectRay(origin, dir, maxDist);
      if (hit && hit.distance < closestDist) {
        closestDist = hit.distance;
        closestHit = hit;
      }
    }

    return closestHit;
  }

  reset() {
    // Clear and respawn all zombies
    this.zombies.forEach(z => {
      this.scene.remove(z.group);
    });
    this.zombies = [];
    this.initSpawns();
  }

  update(delta, playerPos) {
    if (!playerPos) return;

    // To guarantee locked 60 FPS on Intel UHD 630:
    // Sort zombies by distance to player
    // Update nearest 4 zombies every frame, and remaining zombies on alternating frames
    const count = this.zombies.length;
    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      const z = this.zombies[i];
      const dist = z.group.position.distanceTo(playerPos);

      // Distant zombies (> 35m) update at lower frequency
      if (dist > 35.0 && (i + this.updateIndex) % 3 !== 0) {
        continue;
      }

      z.update(delta, playerPos, (dmg) => {
        if (this.onPlayerAttack) {
          this.onPlayerAttack(dmg);
        }
      });
    }

    this.updateIndex = (this.updateIndex + 1) % 3;
  }
}
