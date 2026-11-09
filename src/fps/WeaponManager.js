import * as THREE from 'three';
import { audioManager } from '../core/AudioManager.js';

/**
 * FPS Weapon Manager for THE LAST EMBER
 * Manages inventory, firing rate limits, ammo, reload states,
 * raycast hitscan hit detection, recoil, and audio.
 */
export class WeaponManager {
  constructor(scene, camera, viewmodel, collisionSystem, fpsController) {
    this.scene = scene;
    this.camera = camera;
    this.viewmodel = viewmodel;
    this.collision = collisionSystem;
    this.controller = fpsController;
    this.zombieManager = null; // Injected by SceneManager

    // Weapon Definitions
    this.weapons = {
      rifle: {
        id: 'rifle',
        name: 'Vanguard AR-74',
        type: 'automatic',
        fireRate: 0.11, // seconds between shots (~550 RPM)
        magSize: 30,
        currentMag: 30,
        reserveAmmo: 120,
        maxReserve: 180,
        damage: 34,
        range: 85,
        recoilPitch: 0.045,
        recoilKick: 0.04,
        spread: 0.012,
        reloadDuration: 1.6,
        pelletCount: 1
      },
      shotgun: {
        id: 'shotgun',
        name: 'Breaker 12G',
        type: 'semi',
        fireRate: 0.85, // pump action delay
        magSize: 8,
        currentMag: 8,
        reserveAmmo: 32,
        maxReserve: 48,
        damage: 18, // per pellet * 8 pellets = 144 max
        range: 35,
        recoilPitch: 0.12,
        recoilKick: 0.09,
        spread: 0.055,
        reloadDuration: 2.2,
        pelletCount: 8
      },
      pistol: {
        id: 'pistol',
        name: 'Sidekick 9mm',
        type: 'semi',
        fireRate: 0.22,
        magSize: 15,
        currentMag: 15,
        reserveAmmo: 60,
        maxReserve: 90,
        damage: 26,
        range: 55,
        recoilPitch: 0.035,
        recoilKick: 0.025,
        spread: 0.008,
        reloadDuration: 1.2,
        pelletCount: 1
      }
    };

    this.currentKey = 'rifle';
    this.fireTimer = 0.0;
    this.reloadTimer = 0.0;
    this.isReloading = false;
    this.isMouseDown = false;
    this.semiShotConsumed = false;

    // Bullet tracer & impact particle system
    this.tracerGroup = new THREE.Group();
    this.scene.add(this.tracerGroup);
    this.activeTracers = [];
    this.activeSparks = [];

    // Callback events
    this.onAmmoChange = null;
    this.onHitMarker = null;
    this.onWeaponSwitch = null;

    this.bindInputs();
  }

  bindInputs() {
    this.onMouseDownHandler = this.onMouseDownHandler.bind(this);
    this.onMouseUpHandler = this.onMouseUpHandler.bind(this);
    this.onKeyDownHandler = this.onKeyDownHandler.bind(this);

    window.addEventListener('mousedown', this.onMouseDownHandler);
    window.addEventListener('mouseup', this.onMouseUpHandler);
    window.addEventListener('keydown', this.onKeyDownHandler);
  }

  dispose() {
    window.removeEventListener('mousedown', this.onMouseDownHandler);
    window.removeEventListener('mouseup', this.onMouseUpHandler);
    window.removeEventListener('keydown', this.onKeyDownHandler);
  }

  onMouseDownHandler(e) {
    if (!this.controller.isPointerLocked || this.controller.isPaused) return;

    if (e.button === 0) {
      // Left Click: Fire
      this.isMouseDown = true;
      this.semiShotConsumed = false;
      this.tryShoot();
    } else if (e.button === 2) {
      // Right Click: Aim Down Sights (ADS)
      this.viewmodel.setAds(true);
    }
  }

  onMouseUpHandler(e) {
    if (e.button === 0) {
      this.isMouseDown = false;
      this.semiShotConsumed = false;
    } else if (e.button === 2) {
      this.viewmodel.setAds(false);
    }
  }

  onKeyDownHandler(e) {
    if (this.controller.isPaused) return;

    if (e.code === 'KeyR') {
      this.tryReload();
    } else if (e.code === 'Digit1') {
      this.switchWeapon('rifle');
    } else if (e.code === 'Digit2') {
      this.switchWeapon('shotgun');
    } else if (e.code === 'Digit3') {
      this.switchWeapon('pistol');
    }
  }

  switchWeapon(key) {
    if (!this.weapons[key] || this.currentKey === key || this.isReloading) return;
    this.currentKey = key;
    this.fireTimer = 0.2; // brief switch delay
    this.viewmodel.setWeapon(key);
    audioManager.playUiClick();

    if (this.onWeaponSwitch) {
      this.onWeaponSwitch(this.weapons[key]);
    }
    this.notifyAmmo();
  }

  getCurrentWeapon() {
    return this.weapons[this.currentKey];
  }

  notifyAmmo() {
    const wep = this.getCurrentWeapon();
    if (this.onAmmoChange) {
      this.onAmmoChange(wep.currentMag, wep.reserveAmmo, wep.id);
    }
  }

  tryReload() {
    const wep = this.getCurrentWeapon();
    if (this.isReloading || wep.currentMag >= wep.magSize || wep.reserveAmmo <= 0) return;

    this.isReloading = true;
    this.reloadTimer = wep.reloadDuration;
    this.viewmodel.triggerReload();
    audioManager.playReload();
  }

  tryShoot() {
    if (this.isReloading || this.fireTimer > 0) return;

    const wep = this.getCurrentWeapon();

    // Prevent full-auto holding for semi-automatic guns
    if (wep.type === 'semi' && this.semiShotConsumed) return;

    if (wep.currentMag <= 0) {
      audioManager.playEmptyClick();
      this.fireTimer = 0.25;
      this.semiShotConsumed = true;
      // Auto reload if ammo in reserve
      if (wep.reserveAmmo > 0) {
        this.tryReload();
      }
      return;
    }

    // Deduct ammo & mark shot
    wep.currentMag--;
    this.fireTimer = wep.fireRate;
    this.semiShotConsumed = true;
    this.notifyAmmo();

    // Visual recoil & viewmodel muzzle flash
    this.viewmodel.triggerRecoil(wep.recoilKick, wep.recoilPitch);

    // Camera pitch recoil kick
    this.controller.pitch += wep.recoilPitch * 0.45;
    this.controller.yaw += (Math.random() - 0.5) * wep.recoilPitch * 0.25;

    // Audio SFX
    audioManager.playGunshot(wep.id);

    // Execute Raycast Hitscan
    this.executeRaycast(wep);
  }

  executeRaycast(wep) {
    const aim = this.controller.getAimRay();
    const isAds = this.viewmodel.isAds;
    const spreadFactor = isAds ? wep.spread * 0.4 : wep.spread;

    for (let p = 0; p < wep.pelletCount; p++) {
      // Calculate spread angle
      const spreadX = (Math.random() - 0.5) * spreadFactor;
      const spreadY = (Math.random() - 0.5) * spreadFactor;
      const spreadZ = (Math.random() - 0.5) * spreadFactor;

      const shootDir = aim.direction.clone().add(new THREE.Vector3(spreadX, spreadY, spreadZ)).normalize();

      // 1. Raycast against active zombies first (highest priority)
      let zombieHit = null;
      if (this.zombieManager) {
        zombieHit = this.zombieManager.raycastZombies(aim.origin, shootDir, wep.range);
      }

      // 2. Raycast against world obstacles
      const worldHit = this.collision.raycast(aim.origin, shootDir, wep.range);

      let finalHitPoint = aim.origin.clone().addScaledVector(shootDir, wep.range);

      if (zombieHit && (!worldHit || zombieHit.distance < worldHit.distance)) {
        // Hit Zombie!
        finalHitPoint = zombieHit.point;
        const isKill = zombieHit.zombie.takeDamage(wep.damage, zombieHit.isHeadshot);

        audioManager.playZombieHit();

        // Hit marker UI trigger
        if (this.onHitMarker) {
          this.onHitMarker(isKill);
        }

        // Spawn flesh blood voxel puff
        this.spawnImpactParticles(zombieHit.point, zombieHit.normal, 0x881111);
      } else if (worldHit) {
        // Hit solid environment wall/ground
        finalHitPoint = worldHit.point;
        this.spawnImpactParticles(worldHit.point, worldHit.normal, 0x999999);
      }

      // Spawn visual bullet tracer line
      this.spawnTracer(aim.origin, finalHitPoint);
    }
  }

  spawnTracer(start, end) {
    const geom = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffea77,
      transparent: true,
      opacity: 0.85
    });
    const line = new THREE.Line(geom, mat);
    this.tracerGroup.add(line);

    this.activeTracers.push({
      line,
      life: 0.045
    });
  }

  spawnImpactParticles(point, normal, color = 0xcccccc) {
    const count = 4;
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.06),
        new THREE.MeshBasicMaterial({ color })
      );
      p.position.copy(point);
      const vel = normal.clone()
        .add(new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5
        ))
        .normalize()
        .multiplyScalar(2.0 + Math.random() * 3.0);

      this.tracerGroup.add(p);
      this.activeSparks.push({
        mesh: p,
        vel,
        life: 0.18 + Math.random() * 0.1
      });
    }
  }

  addAmmo(type, count) {
    const wep = this.weapons[type];
    if (!wep) return 0;
    const added = Math.min(count, wep.maxReserve - wep.reserveAmmo);
    wep.reserveAmmo += added;
    this.notifyAmmo();
    return added;
  }

  update(delta) {
    // Fire timer decay
    if (this.fireTimer > 0) {
      this.fireTimer -= delta;
    }

    // Automatic fire continuation when mouse held
    if (this.isMouseDown && this.controller.isPointerLocked && !this.controller.isPaused) {
      const wep = this.getCurrentWeapon();
      if (wep.type === 'automatic' && this.fireTimer <= 0) {
        this.tryShoot();
      }
    }

    // Reload completion
    if (this.isReloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        const wep = this.getCurrentWeapon();
        const needed = wep.magSize - wep.currentMag;
        const taken = Math.min(needed, wep.reserveAmmo);
        wep.currentMag += taken;
        wep.reserveAmmo -= taken;
        this.isReloading = false;
        this.notifyAmmo();
      }
    }

    // Update active tracers
    for (let i = this.activeTracers.length - 1; i >= 0; i--) {
      const tr = this.activeTracers[i];
      tr.life -= delta;
      if (tr.life <= 0) {
        this.tracerGroup.remove(tr.line);
        tr.line.geometry.dispose();
        tr.line.material.dispose();
        this.activeTracers.splice(i, 1);
      }
    }

    // Update active impact sparks
    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const sp = this.activeSparks[i];
      sp.life -= delta;
      sp.mesh.position.addScaledVector(sp.vel, delta);
      sp.vel.y -= 9.8 * delta; // Gravity on sparks
      if (sp.life <= 0) {
        this.tracerGroup.remove(sp.mesh);
        sp.mesh.geometry.dispose();
        sp.mesh.material.dispose();
        this.activeSparks.splice(i, 1);
      }
    }
  }
}
