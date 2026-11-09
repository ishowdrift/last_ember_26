import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * High-performance shared material, geometry cache, and geometry merging system
 */
class VoxelBuilder {
  constructor() {
    this.materialCache = new Map();
    this.geometryCache = new Map();
    this.defaultRoughness = 0.85;
    this.defaultMetalness = 0.1;
  }

  /**
   * Get or create a cached BoxGeometry with given dimensions
   */
  getGeometry(width, height, depth) {
    const key = `${width.toFixed(3)}_${height.toFixed(3)}_${depth.toFixed(3)}`;
    if (!this.geometryCache.has(key)) {
      this.geometryCache.set(key, new THREE.BoxGeometry(width, height, depth));
    }
    return this.geometryCache.get(key);
  }

  /**
   * Get or create a cached MeshStandardMaterial with color and properties
   */
  getMaterial(colorHex, options = {}) {
    const roughness = options.roughness !== undefined ? options.roughness : this.defaultRoughness;
    const metalness = options.metalness !== undefined ? options.metalness : this.defaultMetalness;
    const emissive = options.emissive || 0x000000;
    const emissiveIntensity = options.emissiveIntensity || 1.0;
    const transparent = !!options.transparent;
    const opacity = options.opacity !== undefined ? options.opacity : 1.0;
    const wireframe = !!options.wireframe;

    const key = `${colorHex}_${roughness}_${metalness}_${emissive}_${emissiveIntensity}_${transparent}_${opacity}_${wireframe}`;
    if (!this.materialCache.has(key)) {
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness,
        metalness,
        emissive,
        emissiveIntensity,
        transparent,
        opacity,
        wireframe,
        flatShading: true // Crisp voxel facets
      });
      this.materialCache.set(key, mat);
    }
    return this.materialCache.get(key);
  }

  /**
   * Create a single voxel cube/block
   */
  createBlock(width, height, depth, colorHex, options = {}) {
    const geo = this.getGeometry(width, height, depth);
    const mat = this.getMaterial(colorHex, options);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = options.castShadow !== undefined ? options.castShadow : true;
    mesh.receiveShadow = options.receiveShadow !== undefined ? options.receiveShadow : true;
    return mesh;
  }

  /**
   * Helper to add a block to a parent group at [x, y, z]
   */
  addBlock(parent, width, height, depth, colorHex, x = 0, y = 0, z = 0, options = {}) {
    const block = this.createBlock(width, height, depth, colorHex, options);
    block.position.set(x, y, z);
    if (options.rotation) {
      block.rotation.set(options.rotation.x || 0, options.rotation.y || 0, options.rotation.z || 0);
    }
    parent.add(block);
    return block;
  }

  /**
   * Get or create a cached vertex-color MeshStandardMaterial for unified batching
   */
  getVertexColorMaterial(options = {}) {
    const roughness = options.roughness !== undefined ? options.roughness : this.defaultRoughness;
    const metalness = options.metalness !== undefined ? options.metalness : this.defaultMetalness;
    const key = `vertex_colors_${roughness}_${metalness}`;
    if (!this.materialCache.has(key)) {
      this.materialCache.set(key, new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness,
        metalness,
        flatShading: true
      }));
    }
    return this.materialCache.get(key);
  }

  /**
   * Merge all static meshes in a group into minimal unified draw calls.
   * Standard opaque voxels are baked into a single vertex-color mesh (1 draw call!).
   * Transparent and emissive materials are grouped cleanly into single respective meshes.
   */
  mergeStaticGroup(rootGroup, options = {}) {
    rootGroup.updateMatrixWorld(true);
    const invRootMatrix = rootGroup.matrixWorld.clone().invert();

    const opaqueGeometries = [];
    const specialBuckets = new Map(); // for transparent & emissive materials
    const meshesToRemove = [];

    rootGroup.traverse((child) => {
      // Only merge standard meshes that aren't animated/dynamic
      if (child.isMesh && child.geometry && child.material && !child.userData.isDynamic) {
        child.updateMatrixWorld(true);
        const relMatrix = invRootMatrix.clone().multiply(child.matrixWorld);

        const clonedGeo = child.geometry.clone();
        clonedGeo.applyMatrix4(relMatrix);

        if (!clonedGeo.attributes.normal) {
          clonedGeo.computeVertexNormals();
        }

        const isSpecial = child.material.transparent || 
          (child.material.emissive && child.material.emissive.getHex() > 0) ||
          child.material.wireframe;

        if (isSpecial) {
          const matKey = child.material.uuid;
          if (!specialBuckets.has(matKey)) {
            specialBuckets.set(matKey, {
              material: child.material,
              geometries: []
            });
          }
          specialBuckets.get(matKey).geometries.push(clonedGeo);
        } else {
          // Standard opaque voxel: bake color into vertex attributes
          const col = child.material.color || new THREE.Color(0xffffff);
          const vCount = clonedGeo.attributes.position.count;
          const colArray = new Float32Array(vCount * 3);
          for (let i = 0; i < vCount; i++) {
            colArray[i * 3] = col.r;
            colArray[i * 3 + 1] = col.g;
            colArray[i * 3 + 2] = col.b;
          }
          clonedGeo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
          opaqueGeometries.push(clonedGeo);
        }

        meshesToRemove.push(child);
      }
    });

    if (opaqueGeometries.length === 0 && specialBuckets.size === 0) return rootGroup;

    // Remove old individual unmerged child meshes
    meshesToRemove.forEach((mesh) => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
    });

    // 1. Create single unified vertex-color mesh for all standard opaque blocks
    if (opaqueGeometries.length > 0) {
      let mergedOpaque;
      if (opaqueGeometries.length === 1) {
        mergedOpaque = opaqueGeometries[0];
      } else {
        mergedOpaque = BufferGeometryUtils.mergeGeometries(opaqueGeometries, false);
      }

      if (mergedOpaque) {
        const opaqueMesh = new THREE.Mesh(mergedOpaque, this.getVertexColorMaterial());
        opaqueMesh.castShadow = options.castShadow !== undefined ? options.castShadow : true;
        opaqueMesh.receiveShadow = options.receiveShadow !== undefined ? options.receiveShadow : true;
        rootGroup.add(opaqueMesh);
      }
    }

    // 2. Create single unified mesh for each special material (transparent / emissive)
    specialBuckets.forEach(({ material, geometries }) => {
      if (geometries.length === 0) return;
      let mergedGeo;
      if (geometries.length === 1) {
        mergedGeo = geometries[0];
      } else {
        mergedGeo = BufferGeometryUtils.mergeGeometries(geometries, false);
      }
      if (mergedGeo) {
        const specialMesh = new THREE.Mesh(mergedGeo, material);
        specialMesh.castShadow = options.castShadow !== undefined ? options.castShadow : true;
        specialMesh.receiveShadow = options.receiveShadow !== undefined ? options.receiveShadow : true;
        rootGroup.add(specialMesh);
      }
    });

    return rootGroup;
  }
}

export const voxel = new VoxelBuilder();
export default voxel;
