# AFTERFALL — THE LAST EMBER
### 3D Stylized Voxel Apocalypse World Showcase | Prototype 0.1

An interactive, browser-based 3D spectator experience portraying an atmospheric survivor settlement in an abandoned wilderness after a zombie outbreak. Built with **Three.js** and **Vite**, featuring original voxel-aligned aesthetic design, smooth cinematic director camera controls, dynamic Day/Night lighting transitions, animated characters, custom weapons, and organized collectibles.

---

## 🎮 Key Features & Systems

### 1. The Survivor Camp (Central Hub)
- **Animated Campfire**: Tiered voxel flame geometry dynamically dancing with procedural sine/noise oscillation, glowing hot coal bed, rising semi-transparent smoke puffs, and floating glowing ember particle points.
- **Shelters**: Weathered canvas A-frame survival tent with sleeping roll and flashlight; makeshift corrugated tin lean-to with wood frame and emergency radio receiver.
- **Camp Defenses & Seating**: Sharpened wooden spike barriers, sandbag breastwork bunker, split-log benches, tree stump stools, and stacked supply crates.
- **Illumination**: Timber lantern posts with hanging oil lamps casting dynamic warm light.

### 2. Characters & Articulated Skeletal Animation
- **The Survivor (Jack)**:
  - Custom voxel anatomy: tactical olive plate carrier vest, shoulder radio with antenna, cargo pants, bugout backpack with rolled bedroll, tactical gloves, combat boots, sidearm holster, and survival headband.
  - Animations:
    - `IDLE (BREATHE)`: Natural chest breathing heave, subtle weight shifting, and random head scanning.
    - `WALK IN PLACE`: Natural leg swinging with knee bend, arm counter-swing, torso double bounce, and backpack inertia.
    - `COMBAT READY`: Braced shooting stance holding the custom rifle, focused scanning.
    - `SIGNAL / WAVE`: Friendly survivor wave gesture.
- **The Infected (Shambler)**:
  - Terrifying voxel zombie anatomy: necrotic green flesh, exposed ribcage bones on side, hunched twisted spine, asymmetrical wounds, extended reaching claw arms, snarling jaw with crooked teeth, and glowing yellow infected eyes.
  - Animations:
    - `IDLE (TWITCH)`: Raspy necrotic breathing, sickly torso swaying, reaching arm micro-tremors, and sudden erratic head twitches.
    - `INFECTED WALK`: Shuffling limp gait dragging the left foot with hip dip, swaying spine, and lunging claw reaching.
    - `LUNGE ATTACK`: Aggressive forward leap with vicious two-handed claw swipe and snapping open jaw.
    - `STAGGER RECOIL`: Violent backward recoil from projectile impact before recovering balance.

### 3. Firearms Showcase (Armory Workbench)
- **Vanguard AR-74 Tactical Assault Rifle**: Curved 30-round magazine, holographic red-dot optic, ribbed handguard, flash suppressor, and crane stock.
- **Breaker 12G Pump-Action Shotgun**: Twin-barrel layout with heat shield, walnut wood stock, ribbed pump, and receiver side-saddle holding 4 crimson 12-gauge shells.
- **Sidekick 9mm Pistol**: Milled serrated slide, textured frame, underbarrel weapon light, and tritium luminescent night sights.
- **Gunsmith Workbench Accessories**: Open military ammo tin with brass cartridges, aerosol gun oil, and wooden peg mounts.

### 4. Collectibles & Supply Cache
- Dedicated organized military staging pallet with 7 distinct collectibles resting on individual glowing neon pedestals:
  1. **Field Trauma Medkit**: Waterproof white hardcase with raised red cross emblem and metal latches.
  2. **Military 5.56 Ammo Can**: Olive steel tin with yellow stencil lettering and wire carry handle.
  3. **Combat Rations**: Tan sealed MRE foil pouch and tin can with peeled open lid exposing beans.
  4. **Purified Water Canteen**: High-density tactical blue/grey polymer canteen with retention strap.
  5. **Crimson 20L Fuel Jerry Can**: Heavy steel fuel can with welded triple handle and yellow spout cap.
  6. **Salvaged Tech Electronics**: Bronze gear cog, green PCB circuit board with glowing microchip, and copper wire spool.
  7. **Survival Tools**: Red firefighter axe with polished razor blade edge and tactical forged steel crowbar.

### 5. Abandoned Outpost & Forest Biome
- **Abandoned Outpost**: Two-story weathered brick/concrete structure on an elevated plateau with collapsed masonry, protruding rusted rebar spikes, rubble heaps, boarded-up windows, and rooftop radio antenna.
- **Cracked Forest Highway**: 2-lane asphalt highway with double yellow dividing lines, weeds pushing through cracks, steel guardrails, and highway evacuation hazard sign.
- **Atmospheric Forest**: Tiered conifer pine trees, eerie charred dead snags, autumn decay trees, mossy fallen logs, boulders, fern clusters, and bioluminescent wild mushrooms.

### 6. Cinematic Spectator Camera System
- Smooth OrbitControls with inertia damping, zoom limits, and pitch bounds.
- 8 One-Click Cinematic Focal Points:
  1. `Cinematic Overview` (Isometric aerial surveillance)
  2. `Survivor Camp` (Campfire & shelters)
  3. `The Survivor` (Close inspection of Jack and equipment)
  4. `The Infected` (Close inspection of the mutated zombie)
  5. `Weapons Workbench` (Tactical firearms display)
  6. `Survival Supplies` (7-item collectibles cache)
  7. `Abandoned Outpost` (Ruins and structural collapse)
  8. `Forest Highway` (Perimeter evacuation route)
- Auto-Orbit mode (360° slow cinematic rotation) and camera reset.

### 7. Day & Night System & Audio
- Smooth time-of-day slider (0–24h) + quick presets: `DAWN` (6.5h), `NOON` (13h), `DUSK` (18.5h), `NIGHT` (23h) + optional Auto-Cycle.
- Dynamic sun/moon angle, directional light shadows, ambient hemisphere balance, and atmospheric fog density.
- Campfire and lantern point lights dynamically intensify and flicker with organic light variation at dusk and night.
- **Web Audio API Synthesizer**: Procedural audio without external audio file dependencies — campfire wood crackle with random pop impulses, low-pass filtered wind gusts with LFO modulation, night crickets, and tactile UI clicks.

---

## 🛠️ Architecture & Tech Stack

```
afterfall-the-last-ember/
├── index.html                  # Main HTML entry with canvas and HUD overlay
├── package.json                # Project dependencies and npm scripts
├── vite.config.js              # Vite dev & build configuration
├── src/
│   ├── main.js                 # Application bootstrap
│   ├── core/
│   │   ├── SceneManager.js     # Master scene lifecycle, animation loop, entity coordination
│   │   ├── Renderer.js         # WebGLRenderer, shadow map, ACES tone mapping, resize handler
│   │   ├── CameraController.js # Orbit controls, smooth cubic focus transitions, presets
│   │   ├── LightingManager.js  # Day/night sun, hemisphere, campfire & lantern flickers
│   │   └── AudioManager.js     # Web Audio API procedural sound synthesizer
│   ├── world/
│   │   ├── Terrain.js          # Tiered voxel landscape, dirt trails, asphalt highway
│   │   ├── Camp.js             # Survivor camp, tents, seating, barricades, barrels, bench
│   │   ├── AbandonedBuilding.js# Fortified 2-story outpost with rubble and rebar
│   │   └── ForestBiome.js      # Pine trees, snags, fallen logs, rocks, mushrooms, signs
│   ├── characters/
│   │   ├── Survivor.js         # Articulated survivor model, gear, and procedural animations
│   │   └── Zombie.js           # Mutated zombie model, ribs, glowing eyes, animations
│   ├── objects/
│   │   ├── Weapons.js          # AR-74, Breaker 12G, Sidekick 9mm, ammo box, oil can
│   │   └── Collectibles.js     # 7 survival items on glowing neon pedestals
│   ├── effects/
│   │   ├── Campfire.js         # Dancing voxel flames, rising smoke, glowing embers
│   │   └── Atmosphere.js       # Ground mist planes and floating dust / fireflies
│   ├── ui/
│   │   └── Interface.js        # Tactical spectator HUD controller and event binders
│   ├── utils/
│   │   └── VoxelBuilder.js     # Cached geometries and materials for 60fps performance
│   └── styles/
│       └── main.css            # Dark glassmorphism tactical theme styling
```

---

## 🚀 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000/` in any modern web browser.

3. **Build for Production**:
   ```bash
   npm run build
   ```
   Production assets are bundled cleanly into the `dist/` directory.

---

## ⌨️ Controls Guide

- **Left Mouse Button + Drag**: Smooth orbit rotation with pointer capture (never drops drag over UI)
- **Right Mouse Button + Drag (or Shift + Left Drag)**: Smooth horizontal ground-plane pan
- **Scroll Wheel**: Window-wide smooth exponential zoom with proportional distance scaling
- **`+ ZOOM IN` / `− ZOOM OUT` Buttons**: Instant step zoom directly from the bottom bar
- **`W`, `A`, `S`, `D` / Arrow Keys**: Drone flight navigation gliding camera and target across the ground
- **`Q` / `E` (or Space / C)**: Adjust camera flight elevation (ascend / descend)
- **`Shift`**: 2.5x Sprint / Fast camera flight speed
- **Double Click (Any Point in World)**: Raycast focus glide — smoothly centers and looks at clicked point
- **Left Dock Buttons**: Jump directly to any of the 8 focus zones
- **Character Animator**: Switch between Survivor and Zombie; trigger animations
- **Atmosphere & Lighting**: Scrub time of day, toggle Day/Night, toggle fog, particles, and auto-cycle
- **Top Actions**: Toggle synthesized Web Audio, quick Day/Night cycle, toggle HUD visibility, and view Intel manual
