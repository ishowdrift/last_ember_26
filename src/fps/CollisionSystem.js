import * as THREE from 'three';

/**
 * High-performance, lightweight collision & physics system for THE LAST EMBER
 * Handles:
 * 1. Stepped voxel terrain height querying
 * 2. Solid obstacle AABB collision with wall sliding
 * 3. Step-climbing over low curbs and voxel ledges
 * 4. Fast line-of-sight & hitscan raycasting
 */
export class CollisionSystem {
  constructor() {
    // Array of static obstacle AABBs: { min: Vector3, max: Vector3, tag: string }
    this.obstacles = [];
    
    // Array of terrain elevation steps for accurate floor height
    this.terrainSteps = [];

    // World boundaries
    this.worldBounds = {
      minX: -31.0,
      maxX: 31.0,
      minZ: -61.0,
      maxZ: 61.0
    };

    this.initTerrainSteps();
  }

  initTerrainSteps() {
    // Register terrain terraces matching Terrain.js
    // Default base floor
    this.terrainSteps.push({
      minX: -34, maxX: 34,
      minZ: -63, maxZ: 63,
      topY: 0.0
    });

    // Central Camp Plateau
    this.terrainSteps.push({
      minX: -11, maxX: 11,
      minZ: -11, maxZ: 11,
      topY: 0.15
    });

    // North City Foundations
    this.terrainSteps.push({
      minX: -25, maxX: -3,
      minZ: -52, maxZ: -32,
      topY: 0.25
    });
    this.terrainSteps.push({
      minX: 3, maxX: 25,
      minZ: -52, maxZ: -32,
      topY: 0.25
    });

    // Outpost Ridge Terraces
    this.terrainSteps.push({
      minX: -25, maxX: -7,
      minZ: -23, maxZ: -5,
      topY: 0.6
    });
    this.terrainSteps.push({
      minX: -23, maxX: -9,
      minZ: -21, maxZ: -7,
      topY: 1.1
    });
    this.terrainSteps.push({
      minX: -21, maxX: -11,
      minZ: -19, maxZ: -9,
      topY: 1.6
    });

    // South Jungle Terraces
    this.terrainSteps.push({
      minX: -26, maxX: -6,
      minZ: 30, maxZ: 46,
      topY: 0.8
    });
    this.terrainSteps.push({
      minX: -24, maxX: -10,
      minZ: 34, maxZ: 46,
      topY: 1.4
    });
    this.terrainSteps.push({
      minX: 4, maxX: 26,
      minZ: 27, maxZ: 45,
      topY: 0.7
    });
    this.terrainSteps.push({
      minX: 8, maxX: 24,
      minZ: 35, maxZ: 49,
      topY: 1.4
    });
  }

  /**
   * Register a solid obstacle box
   */
  addBox(minX, minY, minZ, maxX, maxY, maxZ, tag = 'obstacle') {
    this.obstacles.push({
      min: new THREE.Vector3(Math.min(minX, maxX), Math.min(minY, maxY), Math.min(minZ, maxZ)),
      max: new THREE.Vector3(Math.max(minX, maxX), Math.max(minY, maxY), Math.max(minZ, maxZ)),
      tag
    });
  }

  /**
   * Helper to register box by center and dimensions
   */
  addBoxCenter(x, y, z, width, height, depth, tag = 'obstacle') {
    const hw = width / 2;
    const hh = height / 2;
    const hd = depth / 2;
    this.addBox(x - hw, y - hh, z - hd, x + hw, y + hh, z + hd, tag);
  }

  /**
   * Returns highest terrain height at world coordinates (x, z)
   */
  getFloorHeight(x, z) {
    let maxHeight = 0.0;
    for (let i = 0; i < this.terrainSteps.length; i++) {
      const step = this.terrainSteps[i];
      if (x >= step.minX && x <= step.maxX && z >= step.minZ && z <= step.maxZ) {
        if (step.topY > maxHeight) {
          maxHeight = step.topY;
        }
      }
    }
    return maxHeight;
  }

  /**
   * Resolves player horizontal movement with continuous collision & sliding against walls
   * @param {THREE.Vector3} currentPos - Player feet position
   * @param {THREE.Vector3} displacement - Intended movement vector (dx, 0, dz)
   * @param {number} radius - Player collision cylinder radius (e.g. 0.35m)
   * @param {number} height - Player height (e.g. 1.8m)
   * @param {number} stepHeight - Max height player can step up automatically (e.g. 0.45m)
   * @returns {THREE.Vector3} - Corrected safe new position
   */
  resolveMovement(currentPos, displacement, radius = 0.35, height = 1.8, stepHeight = 0.45) {
    const newPos = currentPos.clone();
    
    // Test X displacement
    if (displacement.x !== 0) {
      const targetX = newPos.x + displacement.x;
      if (!this.checkPlayerCollision(targetX, newPos.y, newPos.z, radius, height, stepHeight)) {
        newPos.x = targetX;
      }
    }

    // Test Z displacement
    if (displacement.z !== 0) {
      const targetZ = newPos.z + displacement.z;
      if (!this.checkPlayerCollision(newPos.x, newPos.y, targetZ, radius, height, stepHeight)) {
        newPos.z = targetZ;
      }
    }

    // World boundary clamp
    newPos.x = Math.max(this.worldBounds.minX + radius, Math.min(this.worldBounds.maxX - radius, newPos.x));
    newPos.z = Math.max(this.worldBounds.minZ + radius, Math.min(this.worldBounds.maxZ - radius, newPos.z));

    return newPos;
  }

  /**
   * Checks if player cylinder at (x, y, z) intersects any solid obstacle
   */
  checkPlayerCollision(x, y, z, radius, height, stepHeight = 0.45) {
    const pMinX = x - radius;
    const pMaxX = x + radius;
    const pMinY = y + stepHeight; // Ignore obstacles below step climb height
    const pMaxY = y + height;
    const pMinZ = z - radius;
    const pMaxZ = z + radius;

    for (let i = 0; i < this.obstacles.length; i++) {
      const o = this.obstacles[i];
      // AABB overlap test
      if (
        pMaxX > o.min.x && pMinX < o.max.x &&
        pMaxY > o.min.y && pMinY < o.max.y &&
        pMaxZ > o.min.z && pMinZ < o.max.z
      ) {
        return true; // Collision detected
      }
    }
    return false;
  }

  /**
   * Raycast against static obstacles (for line of sight and bullet hitscan)
   * @param {THREE.Vector3} rayOrigin 
   * @param {THREE.Vector3} rayDir (normalized)
   * @param {number} maxDist 
   * @returns {{ hit: boolean, distance: number, point: THREE.Vector3, normal: THREE.Vector3, tag: string } | null}
   */
  raycast(rayOrigin, rayDir, maxDist = 100) {
    let closestHit = null;
    let closestDist = maxDist;

    for (let i = 0; i < this.obstacles.length; i++) {
      const b = this.obstacles[i];
      const hit = this.intersectRayAABB(rayOrigin, rayDir, b.min, b.max);
      if (hit && hit.distance < closestDist) {
        closestDist = hit.distance;
        closestHit = {
          hit: true,
          distance: hit.distance,
          point: hit.point,
          normal: hit.normal,
          tag: b.tag
        };
      }
    }

    return closestHit;
  }

  /**
   * Fast Ray-AABB intersection test
   */
  intersectRayAABB(origin, dir, min, max) {
    let tmin = -Infinity;
    let tmax = Infinity;
    let normalAxis = 0;
    let normalSign = 1;

    for (let i = 0; i < 3; i++) {
      const oVal = i === 0 ? origin.x : i === 1 ? origin.y : origin.z;
      const dVal = i === 0 ? dir.x : i === 1 ? dir.y : dir.z;
      const minVal = i === 0 ? min.x : i === 1 ? min.y : min.z;
      const maxVal = i === 0 ? max.x : i === 1 ? max.y : max.z;

      if (Math.abs(dVal) < 1e-6) {
        if (oVal < minVal || oVal > maxVal) return null;
      } else {
        const invD = 1.0 / dVal;
        let t1 = (minVal - oVal) * invD;
        let t2 = (maxVal - oVal) * invD;
        let sign = -1;

        if (t1 > t2) {
          const tmp = t1; t1 = t2; t2 = tmp;
          sign = 1;
        }

        if (t1 > tmin) {
          tmin = t1;
          normalAxis = i;
          normalSign = sign;
        }
        tmax = Math.min(tmax, t2);

        if (tmin > tmax || tmax < 0) return null;
      }
    }

    if (tmin < 0) return null; // Behind ray

    const hitPoint = origin.clone().addScaledVector(dir, tmin);
    const hitNormal = new THREE.Vector3();
    if (normalAxis === 0) hitNormal.set(normalSign, 0, 0);
    else if (normalAxis === 1) hitNormal.set(0, normalSign, 0);
    else hitNormal.set(0, 0, normalSign);

    return { distance: tmin, point: hitPoint, normal: hitNormal };
  }

  /**
   * Pre-load colliders from the game's actual world geometry
   */
  registerWorldColliders() {
    // -------------------------------------------------------------
    // REGION A: Abandoned City & Gas Station (Z: -60m to -20m)
    // -------------------------------------------------------------
    // Last Stop Gas Station Store Building (X: 14, Z: -42)
    this.addBoxCenter(14, 2.5, -42, 12.4, 5.0, 8.4, 'building');
    // Gas Station Canopy Pillars
    this.addBoxCenter(9, 2.2, -34, 0.9, 4.4, 0.9, 'pillar');
    this.addBoxCenter(14, 2.2, -34, 0.9, 4.4, 0.9, 'pillar');
    this.addBoxCenter(19, 2.2, -34, 0.9, 4.4, 0.9, 'pillar');
    // Gas Station Fuel Pump Islands
    this.addBoxCenter(11.5, 0.7, -34, 1.4, 1.4, 2.2, 'pump');
    this.addBoxCenter(16.5, 0.7, -34, 1.4, 1.4, 2.2, 'pump');

    // Concrete & Ivy Apartment Block 1 (X: -14, Z: -45)
    this.addBoxCenter(-14, 5.5, -45, 11.5, 11.0, 9.5, 'building');

    // Red Brick Apartment Block 2 (X: -14, Z: -27)
    this.addBoxCenter(-14, 5.5, -27, 11.5, 11.0, 9.5, 'building');

    // Abandoned Utility Truck & Sedan on City Highway
    this.addBoxCenter(0.8, 1.4, -36, 2.6, 2.6, 6.2, 'vehicle');
    this.addBoxCenter(-3.2, 0.9, -24, 2.2, 1.8, 4.4, 'vehicle');

    // Concrete Jersey highway barriers
    this.addBoxCenter(-5.5, 0.5, -31, 0.5, 1.0, 8.0, 'barrier');
    this.addBoxCenter(5.5, 0.5, -31, 0.5, 1.0, 8.0, 'barrier');

    // -------------------------------------------------------------
    // REGION B: Medical Quarantine Camp (Z: -20m to +16m)
    // -------------------------------------------------------------
    // Field Triage Tent (West: X: -7.0, Z: -1.0)
    this.addBoxCenter(-7.0, 1.7, -1.0, 4.6, 3.4, 6.4, 'tent');
    // Medical Supply Tent (East: X: 6.8, Z: -2.5)
    this.addBoxCenter(6.8, 1.6, -2.5, 4.2, 3.2, 5.6, 'tent');

    // Radio Outpost Post (North-East: X: 4.8, Z: -6.2)
    this.addBoxCenter(4.8, 1.4, -6.2, 3.2, 2.8, 2.8, 'outpost');

    // Guard Watchtower (South-East entrance: X: 7.2, Z: 6.8)
    this.addBoxCenter(7.2, 3.0, 6.8, 2.8, 6.0, 2.8, 'watchtower');

    // Campfire Fire Pit (Center: X: 0, Z: 0)
    this.addBoxCenter(0, 0.3, 0, 1.6, 0.6, 1.6, 'campfire');

    // Armory Workbench (X: 3.2, Z: 0.5)
    this.addBoxCenter(3.2, 0.7, 0.5, 1.4, 1.4, 2.6, 'workbench');

    // Supply Display Pallet (X: -3.6, Z: -1.8)
    this.addBoxCenter(-3.6, 0.5, -1.8, 4.0, 1.0, 2.2, 'supplies');

    // Perimeter Sandbag Bunkers & Wooden Barricades
    this.addBoxCenter(-5.5, 0.5, 8.5, 4.4, 1.1, 0.8, 'sandbag');
    this.addBoxCenter(2.5, 0.5, 8.5, 4.4, 1.1, 0.8, 'sandbag');
    this.addBoxCenter(-8.5, 0.5, 3.5, 0.8, 1.1, 4.4, 'sandbag');
    this.addBoxCenter(9.5, 0.5, 1.5, 0.8, 1.1, 4.4, 'sandbag');

    // -------------------------------------------------------------
    // REGION C: Dense Jungle & Rescue Point (Z: +16m to +60m)
    // -------------------------------------------------------------
    // Civilian Rescue Point: Overturned Police Cruiser (X: -8.0, Z: 46.0)
    this.addBoxCenter(-8.0, 1.0, 46.0, 2.6, 2.0, 4.8, 'vehicle');

    // Fallen Log Bridge crossing the gully (X: 0, Z: 30)
    this.addBoxCenter(0, 0.7, 30, 8.0, 0.8, 1.4, 'log');

    // Massive Jungle Boulders
    this.addBoxCenter(-11.0, 1.2, 26.0, 3.2, 2.4, 3.2, 'rock');
    this.addBoxCenter(8.5, 1.0, 24.0, 2.8, 2.0, 2.8, 'rock');
    this.addBoxCenter(11.0, 1.4, 39.0, 3.6, 2.8, 3.4, 'rock');
    this.addBoxCenter(-14.0, 1.5, 42.0, 3.8, 3.0, 3.8, 'rock');

    // Abandoned Hilltop Outpost Ruins (X: -16, Z: -14)
    this.addBoxCenter(-16.0, 2.5, -14.0, 8.8, 5.0, 8.8, 'ruins');
  }
}
