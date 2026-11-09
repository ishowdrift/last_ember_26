import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

export class Collectibles {
  constructor(scene, position = new THREE.Vector3(-3.6, 0.1, -1.8)) {
    this.scene = scene;
    this.position = position;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = 0.5;

    this.items = [];
    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.buildDisplayPallet();
    this.buildCollectibles();
    // Merge static pallet and pedestals (items are marked isDynamic and remain separate)
    voxel.mergeStaticGroup(this.group, { castShadow: true, receiveShadow: true });
  }

  buildDisplayPallet() {
    const woodCol = 0x54402a;
    const rimCol = 0x3d3020;

    // Heavy duty wooden supply pallet (3.6m wide, 1.8m deep)
    voxel.addBlock(this.group, 3.8, 0.16, 2.0, woodCol, 0, 0.08, 0, { roughness: 0.9 });
    // Support runners underneath
    voxel.addBlock(this.group, 0.18, 0.16, 2.0, rimCol, -1.7, 0.08, 0);
    voxel.addBlock(this.group, 0.18, 0.16, 2.0, rimCol, 0, 0.08, 0);
    voxel.addBlock(this.group, 0.18, 0.16, 2.0, rimCol, 1.7, 0.08, 0);

    // Stenciled white border markings on pallet surface
    voxel.addBlock(this.group, 3.6, 0.02, 0.08, 0xcccccc, 0, 0.17, -0.9);
    voxel.addBlock(this.group, 3.6, 0.02, 0.08, 0xcccccc, 0, 0.17, 0.9);
  }

  registerItem(group, name, basePos) {
    // Merge internal blocks of the item into minimal draw calls (small items don't need shadow map passes)
    voxel.mergeStaticGroup(group, { castShadow: false, receiveShadow: true });
    // Mark item dynamic so it is excluded from pallet merge and animated smoothly
    group.userData.isDynamic = true;
    group.traverse(o => { o.userData.isDynamic = true; });

    this.group.add(group);
    this.items.push({
      group,
      name,
      baseY: basePos.y,
      phase: Math.random() * Math.PI * 2
    });
  }

  buildPedestal(x, z, labelColor = 0xffaa22) {
    // Pedestal display block with glowing status ring
    const ped = new THREE.Group();
    ped.position.set(x, 0.16, z);

    voxel.addBlock(ped, 0.72, 0.14, 0.72, 0x22252a, 0, 0.07, 0, { metalness: 0.6 });
    // Glowing neon indicator edge
    voxel.addBlock(ped, 0.74, 0.03, 0.74, labelColor, 0, 0.13, 0, {
      emissive: labelColor,
      emissiveIntensity: 0.8
    });

    this.group.add(ped);
  }

  buildCollectibles() {
    // 7 items positioned in two clean rows:
    // Front Row: 4 items at Z = 0.45 (X: -1.2, -0.4, 0.4, 1.2)
    // Back Row: 3 items at Z = -0.45 (X: -0.8, 0.0, 0.8)

    // --- ITEM 1: Trauma Medical Kit ---
    this.buildPedestal(-1.2, 0.45, 0x22ff88);
    const medkit = new THREE.Group();
    medkit.position.set(-1.2, 0.36, 0.45);
    
    // White hardcase
    voxel.addBlock(medkit, 0.44, 0.22, 0.32, 0xeeeeee, 0, 0, 0, { roughness: 0.4 });
    // Red Cross on lid
    voxel.addBlock(medkit, 0.18, 0.03, 0.06, 0xcc2222, 0, 0.115, 0, { emissive: 0xaa1111, emissiveIntensity: 0.4 });
    voxel.addBlock(medkit, 0.06, 0.03, 0.18, 0xcc2222, 0, 0.115, 0, { emissive: 0xaa1111, emissiveIntensity: 0.4 });
    // Black latches & handle
    voxel.addBlock(medkit, 0.08, 0.06, 0.04, 0x111111, -0.12, 0, 0.17);
    voxel.addBlock(medkit, 0.08, 0.06, 0.04, 0x111111, 0.12, 0, 0.17);
    voxel.addBlock(medkit, 0.18, 0.04, 0.08, 0x111111, 0, 0.06, 0.18);
    this.registerItem(medkit, 'Medkit', medkit.position);

    // --- ITEM 2: Military Ammo Can ---
    this.buildPedestal(-0.4, 0.45, 0xffbb22);
    const ammoCan = new THREE.Group();
    ammoCan.position.set(-0.4, 0.36, 0.45);

    // Olive green tin
    voxel.addBlock(ammoCan, 0.24, 0.26, 0.44, 0x3d4b32, 0, 0, 0, { metalness: 0.6 });
    // Stamped yellow text band
    voxel.addBlock(ammoCan, 0.25, 0.06, 0.36, 0xd4a017, 0, 0.02, 0);
    // Wire carry handle
    voxel.addBlock(ammoCan, 0.08, 0.08, 0.22, 0x1f241a, 0, 0.16, 0);
    this.registerItem(ammoCan, 'Ammo Can', ammoCan.position);

    // --- ITEM 3: MRE Food Rations & Peeling Can ---
    this.buildPedestal(0.4, 0.45, 0xff8833);
    const rations = new THREE.Group();
    rations.position.set(0.4, 0.36, 0.45);

    // Tan MRE sealed foil pouch
    voxel.addBlock(rations, 0.26, 0.06, 0.38, 0x8a7a58, -0.1, 0, 0, {
      rotation: { y: 0.2 },
      roughness: 0.5
    });
    // Open tin can with peeled metal lid
    const can = new THREE.Group();
    can.position.set(0.12, 0.02, 0);
    voxel.addBlock(can, 0.16, 0.18, 0.16, 0x8c949c, 0, 0, 0, { metalness: 0.85, roughness: 0.3 });
    // Peeled lid bent upward
    voxel.addBlock(can, 0.14, 0.02, 0.14, 0x8c949c, 0, 0.12, -0.06, {
      rotation: { x: -0.7 },
      metalness: 0.85
    });
    // Brown baked beans inside!
    voxel.addBlock(can, 0.12, 0.04, 0.12, 0x7a4325, 0, 0.07, 0);
    rations.add(can);
    this.registerItem(rations, 'Rations', rations.position);

    // --- ITEM 4: Tactical Water Canteen ---
    this.buildPedestal(1.2, 0.45, 0x33bbee);
    const canteen = new THREE.Group();
    canteen.position.set(1.2, 0.36, 0.45);

    // Blue polymer bottle body
    voxel.addBlock(canteen, 0.22, 0.28, 0.16, 0x2b4b66, 0, 0, 0, { roughness: 0.4 });
    // Neck & black screw cap
    voxel.addBlock(canteen, 0.1, 0.08, 0.1, 0x111111, 0, 0.17, 0);
    // Retention strap
    voxel.addBlock(canteen, 0.24, 0.04, 0.18, 0x1a2633, 0, -0.02, 0);
    this.registerItem(canteen, 'Purified Water', canteen.position);

    // --- ITEM 5: Crimson 20L Fuel Jerry Can ---
    this.buildPedestal(-0.8, -0.45, 0xff3322);
    const jerryCan = new THREE.Group();
    jerryCan.position.set(-0.8, 0.38, -0.45);

    // Red steel body
    voxel.addBlock(jerryCan, 0.22, 0.36, 0.38, 0xb8251e, 0, 0, 0, { metalness: 0.5, roughness: 0.5 });
    // Triple handle on top
    voxel.addBlock(jerryCan, 0.18, 0.06, 0.32, 0x941d18, 0, 0.21, 0);
    // Yellow screw spout cap
    voxel.addBlock(jerryCan, 0.08, 0.08, 0.08, 0xe6b800, 0, 0.21, 0.14);
    this.registerItem(jerryCan, 'Fuel Can', jerryCan.position);

    // --- ITEM 6: Salvage Scrap Electronics ---
    this.buildPedestal(0.0, -0.45, 0x33eebb);
    const scrap = new THREE.Group();
    scrap.position.set(0.0, 0.34, -0.45);

    // Bronze gear wheel
    voxel.addBlock(scrap, 0.28, 0.05, 0.28, 0xb87333, -0.08, 0, -0.05, {
      metalness: 0.9,
      roughness: 0.3
    });
    // Green PCB circuit board
    voxel.addBlock(scrap, 0.22, 0.03, 0.26, 0x185a38, 0.08, 0.03, 0.05, {
      rotation: { y: 0.4 },
      roughness: 0.4
    });
    // Glowing microchip on PCB
    voxel.addBlock(scrap, 0.08, 0.04, 0.08, 0x111111, 0.08, 0.06, 0.05);
    voxel.addBlock(scrap, 0.02, 0.02, 0.02, 0x00ff88, 0.08, 0.085, 0.05, {
      emissive: 0x00ff88,
      emissiveIntensity: 1.5
    });
    // Copper wire coil
    voxel.addBlock(scrap, 0.12, 0.08, 0.12, 0xd47537, -0.05, 0.05, 0.12, { metalness: 0.95 });
    this.registerItem(scrap, 'Salvaged Tech', scrap.position);

    // --- ITEM 7: Survival Tools (Fire Axe & Tactical Crowbar) ---
    this.buildPedestal(0.8, -0.45, 0xff5533);
    const tools = new THREE.Group();
    tools.position.set(0.8, 0.36, -0.45);

    // Firefighter Axe
    const axe = new THREE.Group();
    axe.position.set(-0.08, 0, 0);
    axe.rotation.z = 0.45;
    // Wood shaft
    voxel.addBlock(axe, 0.05, 0.52, 0.06, 0x855835, 0, 0, 0);
    // Red axe head
    voxel.addBlock(axe, 0.16, 0.12, 0.08, 0xcc2922, 0.05, 0.22, 0);
    // Polished steel blade edge
    voxel.addBlock(axe, 0.04, 0.14, 0.02, 0xdfe5eb, 0.14, 0.22, 0, { metalness: 0.95 });
    tools.add(axe);

    // Tactical Crowbar
    const crowbar = new THREE.Group();
    crowbar.position.set(0.12, 0, 0);
    crowbar.rotation.z = -0.35;
    voxel.addBlock(crowbar, 0.05, 0.55, 0.05, 0x282c32, 0, 0, 0, { metalness: 0.9 });
    // Curved hook pry tip
    voxel.addBlock(crowbar, 0.09, 0.05, 0.05, 0x282c32, 0.04, 0.26, 0, { metalness: 0.9 });
    tools.add(crowbar);

    this.registerItem(tools, 'Survival Tools', tools.position);
  }

  update(delta) {
    // Gentle hovering animation for collectibles
    const time = performance.now() * 0.002;
    this.items.forEach((item) => {
      item.group.position.y = item.baseY + Math.sin(time * 2.0 + item.phase) * 0.025;
      item.group.rotation.y = Math.sin(time * 1.2 + item.phase) * 0.1;
    });
  }
}
