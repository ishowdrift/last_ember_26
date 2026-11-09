import * as THREE from 'three';
import { voxel } from '../utils/VoxelBuilder.js';

/**
 * REGION A: THE ABANDONED CITY
 * Featuring:
 * - Gas Station with rusted cantilever canopy, pumps, c-store (gas-1.jpg, gas-2.jpg)
 * - 3-Story Concrete & Ivy Tenement Apartment Block (apartment-1.jpg)
 * - 3-Story Red-Brick Apartment Block with cracks & fire escape (apartment-2.jpg)
 * - 2 Abandoned Voxel Vehicles (Sedan with open door, Pickup truck)
 * - Commercial street props, sidewalks, flickering street lamp, rubble
 */
export class CityRegion {
  constructor(scene, lightingManager = null) {
    this.scene = scene;
    this.lightingManager = lightingManager;
    this.group = new THREE.Group();
    this.group.name = 'Region_City';

    this.flickerLight = null;

    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.buildGasStation();
    this.buildApartment1();
    this.buildApartment2();
    this.buildAbandonedVehicles();
    this.buildStreetProps();

    // Consolidate static city geometry into unified high-performance draw calls
    voxel.mergeStaticGroup(this.group, { castShadow: true, receiveShadow: true });
  }

  /* ============================================================
     1. GAS STATION (Based on gas-1.jpg & gas-2.jpg)
     ============================================================ */
  buildGasStation() {
    const station = new THREE.Group();
    // Positioned at East side of city street
    station.position.set(10, 0, -42);
    station.rotation.y = -0.15;

    const mintWall = 0x769b74;    // Light mint green plaster
    const brickTrim = 0x7d3527;   // Dark red brick base & quoining
    const concrete = 0x5a5f66;    // Forecourt & trims
    const rustedMetal = 0x8a4b2b; // Rusted canopy & barrels
    const glassCol = 0x558899;    // Broken window tint
    const darkWood = 0x483424;

    // --- A. Forecourt Raised Island ---
    voxel.addBlock(station, 18, 0.18, 14, concrete, 0, 0.09, 2, { roughness: 0.9 });

    // --- B. Store Building (8m x 6m x 3.8m) ---
    const storeX = -3.5;
    const storeZ = -2.5;

    // Foundation plinth
    voxel.addBlock(station, 8.4, 0.45, 6.4, brickTrim, storeX, 0.35, storeZ);
    // Mint green main walls
    voxel.addBlock(station, 8.2, 2.8, 6.2, mintWall, storeX, 1.8, storeZ, { roughness: 0.88 });
    // Roof cornice trim
    voxel.addBlock(station, 8.6, 0.35, 6.6, concrete, storeX, 3.35, storeZ);
    // Roof gravel bed
    voxel.addBlock(station, 8.0, 0.1, 6.0, 0x42464c, storeX, 3.5, storeZ);

    // Rooftop HVAC Unit
    voxel.addBlock(station, 1.4, 0.8, 1.2, 0x5a6068, storeX - 1.5, 3.9, storeZ - 0.5, { metalness: 0.6 });
    voxel.addBlock(station, 1.2, 0.15, 1.0, 0x33363b, storeX - 1.5, 4.35, storeZ - 0.5);

    // Front Store Display Windows (Broken with jagged voxels)
    voxel.addBlock(station, 2.2, 1.6, 0.12, glassCol, storeX - 2.2, 1.8, storeZ + 3.12, {
      transparent: true,
      opacity: 0.55
    });
    voxel.addBlock(station, 2.2, 1.6, 0.12, glassCol, storeX + 2.2, 1.8, storeZ + 3.12, {
      transparent: true,
      opacity: 0.55
    });

    // Boarded double entry doors
    voxel.addBlock(station, 1.4, 2.2, 0.15, 0x2e353b, storeX, 1.45, storeZ + 3.12);
    voxel.addBlock(station, 1.6, 0.22, 0.2, darkWood, storeX, 1.4, storeZ + 3.22, { rotation: { z: 0.1 } });
    voxel.addBlock(station, 1.6, 0.22, 0.2, darkWood, storeX, 1.9, storeZ + 3.22, { rotation: { z: -0.08 } });

    // Storefront Billboard Frame (from gas-2.jpg)
    voxel.addBlock(station, 4.2, 0.9, 0.18, 0xd4cfc5, storeX, 2.9, storeZ + 3.22, { roughness: 0.9 });
    voxel.addBlock(station, 4.4, 0.08, 0.22, brickTrim, storeX, 3.35, storeZ + 3.22);

    // --- C. Cantilevered Fuel Canopy ---
    const canopyX = 4.0;
    const canopyZ = 3.5;

    // 2 Heavy Support Columns
    voxel.addBlock(station, 0.45, 4.2, 0.45, 0x6e806d, canopyX - 2.5, 2.1, canopyZ);
    voxel.addBlock(station, 0.45, 4.2, 0.45, 0x6e806d, canopyX + 2.5, 2.1, canopyZ);

    // Canopy Roof Deck (10m x 7.5m)
    voxel.addBlock(station, 10.2, 0.45, 7.8, rustedMetal, canopyX, 4.2, canopyZ, { roughness: 0.9 });
    // Canopy fascia rim
    voxel.addBlock(station, 10.6, 0.65, 8.2, 0x7a3e22, canopyX, 4.2, canopyZ, { roughness: 0.92 });
    // Canopy puncture damage / exposed rebar hole (from gas-2.jpg)
    voxel.addBlock(station, 2.2, 0.15, 2.2, 0x221a14, canopyX + 1.8, 4.3, canopyZ + 1.2);
    voxel.addBlock(station, 0.08, 0.08, 2.4, 0x1a1a1a, canopyX + 1.8, 4.4, canopyZ + 1.2);
    voxel.addBlock(station, 2.4, 0.08, 0.08, 0x1a1a1a, canopyX + 1.8, 4.4, canopyZ + 1.2);

    // Hanging electrical wire loops
    voxel.addBlock(station, 0.06, 0.8, 0.06, 0x1a1a1a, canopyX - 1.2, 3.6, canopyZ + 3.8);
    voxel.addBlock(station, 0.06, 0.6, 0.06, 0x1a1a1a, canopyX + 0.8, 3.7, canopyZ + 3.8);

    // --- D. 3 Gas Dispensers on Elevated Island ---
    const pumpIslandZ = canopyZ;
    voxel.addBlock(station, 7.5, 0.22, 1.4, 0x4d5258, canopyX, 0.22, pumpIslandZ);

    const pumpXs = [canopyX - 2.4, canopyX, canopyX + 2.4];
    pumpXs.forEach((px, idx) => {
      // Pump body (rusted red/grey)
      voxel.addBlock(station, 0.72, 1.6, 0.55, 0x82442b, px, 1.1, pumpIslandZ, { roughness: 0.85 });
      // Indicator dial glass
      voxel.addBlock(station, 0.5, 0.35, 0.08, 0xd0d5db, px, 1.5, pumpIslandZ + 0.28);
      // Red nozzle handle
      voxel.addBlock(station, 0.12, 0.25, 0.12, 0xd42a22, px + 0.38, 1.0, pumpIslandZ, { emissive: 0x440000 });
      // Black flexible rubber hose loop
      voxel.addBlock(station, 0.06, 0.75, 0.06, 0x181818, px + 0.38, 0.6, pumpIslandZ + 0.2);
      voxel.addBlock(station, 0.35, 0.06, 0.35, 0x181818, px + 0.2, 0.24, pumpIslandZ + 0.3);
    });

    // --- E. Rusted Oil Drums on Forecourt (gas-2.jpg) ---
    // Upright barrel
    voxel.addBlock(station, 0.65, 0.95, 0.65, rustedMetal, canopyX - 3.8, 0.6, canopyZ + 3.2);
    // Overturned barrel on its side
    voxel.addBlock(station, 0.95, 0.65, 0.65, 0x6e3820, canopyX - 4.6, 0.45, canopyZ + 3.5, {
      rotation: { z: 1.57 }
    });

    this.group.add(station);
  }

  /* ============================================================
     2. 3-STORY APARTMENT BLOCK A (Concrete, Ivy & Fire Escape)
     (Based on apartment-1.jpg)
     ============================================================ */
  buildApartment1() {
    const bldg = new THREE.Group();
    // Positioned on West side of City Street
    bldg.position.set(-14, 0, -48);

    const concrete = 0x62666d;    // Weathered grey concrete facade
    const brickQuoin = 0x783526;  // Exposed red brick corners
    const darkWood = 0x422f20;    // Window frames & door
    const ivyGreen = 0x2e4f2b;    // Climbing ivy foliage
    const fireEscapeCol = 0x523626; // Rusted iron stairs

    const w = 9.0;
    const h = 10.5; // 3 stories
    const d = 8.5;

    // --- Main Concrete Shell ---
    voxel.addBlock(bldg, w, h, d, concrete, 0, h / 2, 0, { roughness: 0.92 });

    // --- Brick Corner Quoining (4 corners) ---
    const corners = [
      { x: -w / 2, z: -d / 2 },
      { x: w / 2, z: -d / 2 },
      { x: -w / 2, z: d / 2 },
      { x: w / 2, z: d / 2 }
    ];
    corners.forEach(c => {
      voxel.addBlock(bldg, 0.9, h, 0.9, brickQuoin, c.x, h / 2, c.z, { roughness: 0.95 });
    });

    // --- Storey Belt Courses (Dividing floors 1, 2, 3) ---
    voxel.addBlock(bldg, w + 0.3, 0.3, d + 0.3, 0x50545a, 0, 3.5, 0);
    voxel.addBlock(bldg, w + 0.3, 0.3, d + 0.3, 0x50545a, 0, 7.0, 0);
    voxel.addBlock(bldg, w + 0.4, 0.45, d + 0.4, 0x484c52, 0, h + 0.2, 0); // Roof parapet

    // --- Ground Floor Barricaded Entrance ---
    voxel.addBlock(bldg, 1.5, 2.4, 0.3, darkWood, 0, 1.25, d / 2 + 0.05);
    // Timber barricade plank across door
    voxel.addBlock(bldg, 2.0, 0.25, 0.15, 0x5a412c, 0, 1.4, d / 2 + 0.2, { rotation: { z: 0.06 } });
    // Stone entrance steps
    voxel.addBlock(bldg, 2.4, 0.18, 1.2, 0x484c52, 0, 0.09, d / 2 + 0.7);
    voxel.addBlock(bldg, 2.0, 0.18, 0.8, 0x484c52, 0, 0.22, d / 2 + 0.5);

    // --- Windows (3 floors, 3 per floor on facade) ---
    const winXs = [-2.4, 0, 2.4];
    const floorYs = [1.8, 5.2, 8.6];

    floorYs.forEach((fy, fIdx) => {
      winXs.forEach((wx) => {
        if (fIdx === 0 && wx === 0) return; // Entrance door

        // Window recess & dark glass
        voxel.addBlock(bldg, 1.2, 1.6, 0.15, 0x1f262d, wx, fy, d / 2 + 0.05);

        // Concrete sills
        voxel.addBlock(bldg, 1.4, 0.15, 0.3, 0x454950, wx, fy - 0.85, d / 2 + 0.1);

        if (fIdx === 0) {
          // Boarded window on ground floor
          voxel.addBlock(bldg, 1.4, 0.22, 0.12, 0x503b29, wx, fy - 0.2, d / 2 + 0.15, { rotation: { z: 0.1 } });
          voxel.addBlock(bldg, 1.4, 0.22, 0.12, 0x503b29, wx, fy + 0.3, d / 2 + 0.15, { rotation: { z: -0.15 } });
        } else {
          // Broken glass shard voxels
          voxel.addBlock(bldg, 0.4, 0.6, 0.08, 0x7fa2b0, wx - 0.3, fy - 0.2, d / 2 + 0.1, { transparent: true, opacity: 0.6 });
        }
      });
    });

    // --- External Metal Fire Escape (Right Wall: X = w/2) ---
    const feX = w / 2 + 0.6;
    [5.0, 8.4].forEach((platY) => {
      // Platform grate
      voxel.addBlock(bldg, 1.2, 0.12, 2.4, fireEscapeCol, feX, platY, 0.8, { metalness: 0.8 });
      // Safety railings
      voxel.addBlock(bldg, 0.08, 0.9, 2.4, fireEscapeCol, feX + 0.55, platY + 0.45, 0.8);
      voxel.addBlock(bldg, 1.2, 0.9, 0.08, fireEscapeCol, feX, platY + 0.45, 1.95);
    });
    // Angled ladder between platforms
    voxel.addBlock(bldg, 0.4, 3.6, 0.12, fireEscapeCol, feX, 6.7, -0.2, {
      rotation: { x: 0.45 },
      metalness: 0.8
    });
    // Drop ladder down to ground
    voxel.addBlock(bldg, 0.35, 2.8, 0.1, fireEscapeCol, feX, 2.6, 1.8, { metalness: 0.8 });

    // --- Climbing Ivy Voxels on Ground Floor (apartment-1.jpg) ---
    for (let i = 0; i < 28; i++) {
      const ix = (Math.random() - 0.5) * 8.0;
      const iy = 0.3 + Math.random() * 3.2;
      voxel.addBlock(bldg, 0.45 + Math.random() * 0.3, 0.4 + Math.random() * 0.3, 0.15, ivyGreen, ix, iy, d / 2 + 0.1, {
        roughness: 0.95
      });
    }

    // --- Collapsed Roof Corner (apartment-1.jpg) ---
    voxel.addBlock(bldg, 2.4, 0.8, 2.4, 0x1f1d1b, w / 2 - 1.2, h + 0.2, d / 2 - 1.2);
    // Exposed structural rafters
    voxel.addBlock(bldg, 0.15, 0.15, 2.6, darkWood, w / 2 - 1.0, h + 0.1, d / 2 - 1.2);
    voxel.addBlock(bldg, 0.15, 0.15, 2.6, darkWood, w / 2 - 1.6, h + 0.1, d / 2 - 1.2);

    this.group.add(bldg);
  }

  /* ============================================================
     3. 3-STORY APARTMENT BLOCK B (Red Brick & Wall Cracks)
     (Based on apartment-2.jpg)
     ============================================================ */
  buildApartment2() {
    const bldg = new THREE.Group();
    // Positioned south of Apartment A on West street flank
    bldg.position.set(-14, 0, -28);

    const brickRed = 0x823b2e;   // Weathered textured red brick
    const stuccoGrey = 0x585d63; // Ground floor cracked stucco
    const concreteTrim = 0x6e737a;
    const crackCol = 0x1f1715;

    const w = 9.0;
    const h = 10.5;
    const d = 8.5;

    // --- Ground Floor (Stucco with exposed brick patches) ---
    voxel.addBlock(bldg, w, 3.5, d, stuccoGrey, 0, 1.75, 0, { roughness: 0.95 });
    // Exposed red brick patch on front wall
    voxel.addBlock(bldg, 2.2, 1.8, 0.08, brickRed, 2.6, 1.4, d / 2 + 0.05);

    // --- 2nd & 3rd Floors (Red Brick) ---
    voxel.addBlock(bldg, w, 7.0, d, brickRed, 0, 7.0, 0, { roughness: 0.9 });

    // --- Concrete Belt Courses ---
    voxel.addBlock(bldg, w + 0.25, 0.35, d + 0.25, concreteTrim, 0, 3.5, 0);
    voxel.addBlock(bldg, w + 0.25, 0.35, d + 0.25, concreteTrim, 0, 7.0, 0);
    voxel.addBlock(bldg, w + 0.4, 0.5, d + 0.4, concreteTrim, 0, h + 0.25, 0); // Roof capping

    // --- Deep Structural Cracks (apartment-2.jpg) ---
    const cracks = [
      { x: 1.2, y: 5.5, z: d / 2 + 0.06, w: 0.15, h: 2.2, rot: 0.25 },
      { x: 1.6, y: 7.2, z: d / 2 + 0.06, w: 0.15, h: 2.0, rot: -0.2 },
      { x: -1.8, y: 8.5, z: d / 2 + 0.06, w: 0.15, h: 1.8, rot: 0.3 }
    ];
    cracks.forEach(c => {
      voxel.addBlock(bldg, c.w, c.h, 0.08, crackCol, c.x, c.y, c.z, { rotation: { z: c.rot } });
    });

    // --- Windows with Concrete Sills & Lintels ---
    const winXs = [-2.4, 0, 2.4];
    const floorYs = [1.8, 5.2, 8.6];

    floorYs.forEach((fy, fIdx) => {
      winXs.forEach((wx) => {
        if (fIdx === 0 && wx === 0) return; // Door

        // Window opening
        voxel.addBlock(bldg, 1.2, 1.6, 0.15, 0x1a2128, wx, fy, d / 2 + 0.05);
        // Concrete sill & lintel
        voxel.addBlock(bldg, 1.4, 0.16, 0.25, concreteTrim, wx, fy - 0.85, d / 2 + 0.08);
        voxel.addBlock(bldg, 1.4, 0.16, 0.25, concreteTrim, wx, fy + 0.85, d / 2 + 0.08);
      });
    });

    // --- Entrance Door ---
    voxel.addBlock(bldg, 1.5, 2.4, 0.2, 0x4d3826, 0, 1.25, d / 2 + 0.05);
    voxel.addBlock(bldg, 2.2, 0.18, 1.0, concreteTrim, 0, 0.09, d / 2 + 0.6);

    // --- Roof Garden Weeds (apartment-2.jpg) ---
    for (let i = 0; i < 12; i++) {
      const rx = (Math.random() - 0.5) * 6.5;
      const rz = (Math.random() - 0.5) * 6.5;
      voxel.addBlock(bldg, 0.3, 0.4, 0.3, 0x475e2f, rx, h + 0.25, rz);
    }

    this.group.add(bldg);
  }

  /* ============================================================
     4. ABANDONED VOXEL VEHICLES
     ============================================================ */
  buildAbandonedVehicles() {
    // --- Vehicle 1: Abandoned Sedan (Open driver door, rusted body) ---
    const car = new THREE.Group();
    car.position.set(-3.8, 0.2, -36);
    car.rotation.y = 0.4;

    const carPaint = 0x6e2b26; // Rusted crimson sedan
    const carRust = 0x5a2d1d;
    const tireCol = 0x1c1e21;
    const wheelRim = 0x737982;
    const windowGlass = 0x4d6673;

    // Chassis & Lower Body
    voxel.addBlock(car, 4.2, 0.55, 1.9, carPaint, 0, 0.45, 0, { metalness: 0.6, roughness: 0.5 });
    // Hood & Engine Bay
    voxel.addBlock(car, 1.4, 0.4, 1.85, carRust, 1.3, 0.8, 0, { roughness: 0.85 });
    // Cabin Roof & Pillars
    voxel.addBlock(car, 2.1, 0.65, 1.7, carPaint, -0.3, 1.2, 0);
    // Windshield (Cracked)
    voxel.addBlock(car, 0.8, 0.55, 1.6, windowGlass, 0.6, 1.05, 0, {
      rotation: { z: -0.45 },
      transparent: true,
      opacity: 0.65
    });
    // Rear Windshield
    voxel.addBlock(car, 0.7, 0.55, 1.6, windowGlass, -1.2, 1.05, 0, {
      rotation: { z: 0.45 },
      transparent: true,
      opacity: 0.65
    });

    // Open Driver Door (swung outward)
    voxel.addBlock(car, 1.1, 0.8, 0.12, carPaint, -0.2, 0.8, 1.2, {
      rotation: { y: 0.55 }
    });

    // 4 Wheels
    const wheels = [
      { x: 1.3, z: 0.95 },
      { x: 1.3, z: -0.95 },
      { x: -1.3, z: 0.95 },
      { x: -1.3, z: -0.95 }
    ];
    wheels.forEach(w => {
      voxel.addBlock(car, 0.65, 0.65, 0.35, tireCol, w.x, 0.33, w.z, { roughness: 0.95 });
      voxel.addBlock(car, 0.35, 0.35, 0.37, wheelRim, w.x, 0.33, w.z, { metalness: 0.8 });
    });

    this.group.add(car);

    // --- Vehicle 2: Scavenger Utility Truck on East Lane ---
    const truck = new THREE.Group();
    truck.position.set(7.5, 0.2, -34);
    truck.rotation.y = -0.3;

    const truckBlue = 0x2e485e; // Faded oxidized steel blue
    voxel.addBlock(truck, 2.2, 1.4, 2.1, truckBlue, -1.2, 1.1, 0, { metalness: 0.5 });
    voxel.addBlock(truck, 2.8, 0.6, 2.1, 0x483a2d, 1.3, 0.7, 0); // Flatbed
    // Cargo Crates in truck bed
    voxel.addBlock(truck, 0.9, 0.8, 0.9, 0x5a4128, 1.0, 1.4, -0.4);
    voxel.addBlock(truck, 0.8, 0.7, 0.8, 0x6e5234, 1.8, 1.35, 0.3);

    // 6 Heavy Duty Truck Tires
    const truckTires = [
      { x: -1.3, z: 1.05 },
      { x: -1.3, z: -1.05 },
      { x: 0.8, z: 1.05 },
      { x: 0.8, z: -1.05 },
      { x: 2.0, z: 1.05 },
      { x: 2.0, z: -1.05 }
    ];
    truckTires.forEach(t => {
      voxel.addBlock(truck, 0.75, 0.75, 0.38, tireCol, t.x, 0.38, t.z);
    });

    this.group.add(truck);
  }

  /* ============================================================
     5. STREET PROPS & FLICKERING STREET LIGHT
     ============================================================ */
  buildStreetProps() {
    // Street Lamp 1 (North sidewalk at X = -6, Z = -41)
    const lamp1 = new THREE.Group();
    lamp1.position.set(-6, 0.24, -41);
    const metalDark = 0x24282e;

    voxel.addBlock(lamp1, 0.25, 5.8, 0.25, metalDark, 0, 2.9, 0, { metalness: 0.85 });
    // Overhanging arm extending above road
    voxel.addBlock(lamp1, 0.18, 0.18, 2.2, metalDark, 0, 5.8, 1.0);
    // Fixture head
    voxel.addBlock(lamp1, 0.45, 0.2, 0.7, metalDark, 0, 5.7, 2.0);
    // Amber luminescent bulb
    voxel.addBlock(lamp1, 0.35, 0.12, 0.5, 0xffbb44, 0, 5.58, 2.0, {
      emissive: 0xffaa22,
      emissiveIntensity: 1.6
    });

    this.group.add(lamp1);

    // Add dynamic flickering street light if lightingManager exists
    if (this.lightingManager) {
      const pLight = new THREE.PointLight(0xffaa33, 1.4, 14, 1.8);
      pLight.position.set(-6, 5.4, -39);
      pLight.castShadow = false; // Zero shadow overhead!
      this.scene.add(pLight);
      this.flickerLight = pLight;
    }

    // Concrete road barricades blocking North exit
    [-4, 0, 4].forEach(bx => {
      const bar = new THREE.Group();
      bar.position.set(bx, 0.12, -54);
      voxel.addBlock(bar, 3.2, 0.9, 0.6, 0x5a5f66, 0, 0.45, 0, { roughness: 0.9 });
      // Red/white hazard warning stripes
      voxel.addBlock(bar, 0.6, 0.25, 0.62, 0xcc2222, -0.8, 0.6, 0);
      voxel.addBlock(bar, 0.6, 0.25, 0.62, 0xeeeeee, 0, 0.6, 0);
      voxel.addBlock(bar, 0.6, 0.25, 0.62, 0xcc2222, 0.8, 0.6, 0);
      this.group.add(bar);
    });
  }

  update(delta) {
    // Subtle street light filament flutter
    if (this.flickerLight) {
      const time = performance.now() * 0.008;
      const flutter = Math.sin(time * 11) * 0.2 + (Math.random() < 0.04 ? -0.7 : 0.05);
      this.flickerLight.intensity = Math.max(0.1, 1.4 + flutter);
    }
  }
}
