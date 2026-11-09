import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

/**
 * Lightweight spatial chunk and region coordinator for THE LAST EMBER
 * Manages 18 chunks (20m x 20m each) spanning a 120m x 60m connected world.
 */
export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // World geometry parameters
    this.chunkSize = 20; // meters
    this.gridWidth = 3;  // X: -30m to +30m
    this.gridDepth = 6;  // Z: -60m to +60m
    this.halfWidth = (this.gridWidth * this.chunkSize) / 2; // 30m
    this.halfDepth = (this.gridDepth * this.chunkSize) / 2; // 60m

    // Map: 'cx_cz' -> Chunk Object
    this.chunks = new Map();
    this.activeRegion = 'camp'; // 'city', 'camp', 'jungle'

    // Frustum for spatial culling
    this.frustum = new THREE.Frustum();
    this.projScreenMatrix = new THREE.Matrix4();
    this.cullDistance = 95.0; // meters

    // Region Z boundaries
    // City: Z < -15
    // Medical Camp: -15 <= Z <= 15
    // Jungle: Z > 15
  }

  getChunkKey(cx, cz) {
    return `${cx}_${cz}`;
  }

  getChunkAt(worldX, worldZ) {
    const cx = Math.floor((worldX + this.halfWidth) / this.chunkSize) - 1;
    const cz = Math.floor((worldZ + this.halfDepth) / this.chunkSize) - 3;
    return this.chunks.get(this.getChunkKey(cx, cz));
  }

  getRegionName(worldZ) {
    if (worldZ < -15) return 'city';
    if (worldZ > 15) return 'jungle';
    return 'camp';
  }

  registerChunk(cx, cz, chunkGroup, regionName = 'general') {
    const key = this.getChunkKey(cx, cz);
    const centerX = cx * this.chunkSize;
    const centerZ = cz * this.chunkSize;

    // Calculate bounding box for frustum culling
    const box = new THREE.Box3(
      new THREE.Vector3(centerX - this.chunkSize / 2, -2, centerZ - this.chunkSize / 2),
      new THREE.Vector3(centerX + this.chunkSize / 2, 20, centerZ + this.chunkSize / 2)
    );

    const chunkData = {
      cx,
      cz,
      key,
      group: chunkGroup,
      region: regionName,
      center: new THREE.Vector3(centerX, 0, centerZ),
      boundingBox: box,
      visible: true
    };

    this.group.add(chunkGroup);
    this.chunks.set(key, chunkData);
    return chunkData;
  }

  update(camera) {
    if (!camera) return;

    // Update camera frustum
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

    const camPos = camera.position;
    let visibleCount = 0;

    this.chunks.forEach((chunk) => {
      // Distance culling check
      const dist = camPos.distanceTo(chunk.center);
      const inRange = dist < this.cullDistance;

      // Frustum intersection check
      const inFrustum = this.frustum.intersectsBox(chunk.boundingBox);

      const shouldBeVisible = inRange && inFrustum;
      if (chunk.group.visible !== shouldBeVisible) {
        chunk.group.visible = shouldBeVisible;
      }
      if (shouldBeVisible) visibleCount++;
    });

    // Detect active region from camera target
    const currentRegion = this.getRegionName(camPos.z);
    if (currentRegion !== this.activeRegion) {
      this.activeRegion = currentRegion;
      if (this.onRegionChange) {
        this.onRegionChange(currentRegion);
      }
    }
  }

  dispose() {
    this.chunks.forEach((chunk) => {
      chunk.group.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });
      this.group.remove(chunk.group);
    });
    this.chunks.clear();
    this.scene.remove(this.group);
  }
}
