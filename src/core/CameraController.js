import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraController {
  constructor(camera, domElement, scene = null) {
    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;

    // 1. Orbit Controls Setup with Tuned Damping
    this.controls = new OrbitControls(this.camera, this.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12; // Snappy, responsive damping
    this.controls.rotateSpeed = 0.85;
    this.controls.panSpeed = 1.0;
    this.controls.screenSpacePanning = false; // Pan parallel to ground plane
    this.controls.enableZoom = false; // Custom smooth zoom handles all zoom physics cleanly
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 60.0;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03; // Keep above terrain floor
    this.controls.minPolarAngle = 0.08; // Prevent gimbal flip at zenith
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.6;

    // Mouse button mappings:
    // Left: Orbit, Middle: Pan/Dolly, Right: Ground-plane Pan
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };

    // Touch mappings: 1-finger rotate, 2-finger pinch zoom & pan
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    // Default initial viewpoint (Isometric overview)
    this.defaultPosition = new THREE.Vector3(14, 12, 16);
    this.defaultTarget = new THREE.Vector3(0, 1.0, 0);

    this.camera.position.copy(this.defaultPosition);
    this.controls.target.copy(this.defaultTarget);

    // 2. High-Precision Damped Exponential Zoom System
    this.targetDistance = null;
    this.setupSmoothZoom();

    // 3. Pointer Capture & Cursor Visual State
    this.isDragging = false;
    this.setupPointerCapture();

    // 4. Keyboard Navigation (WASD / QE / Arrows)
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      shift: false
    };
    this.moveVelocity = new THREE.Vector3();
    this.setupKeyboardControls();

    // 5. Double Click to Focus Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouseCoords = new THREE.Vector2();
    this.setupDoubleClickFocus();

    // 6. Smooth Cinematic Focus Transition State
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.transitionDuration = 1.3; // seconds
    this.startCamPos = new THREE.Vector3();
    this.targetCamPos = new THREE.Vector3();
    this.startLookAt = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();

    // 8 Focus Target Definitions
    this.focusTargets = {
      overview: {
        position: new THREE.Vector3(14, 12, 16),
        target: new THREE.Vector3(0, 1.0, 0),
        label: 'Cinematic Overview',
        tag: 'SURVEILLANCE',
        desc: 'Broad aerial surveillance of the survivor camp, cracked highway, and surrounding pine forest.'
      },
      camp: {
        position: new THREE.Vector3(4.2, 3.2, 4.8),
        target: new THREE.Vector3(0, 0.8, 0),
        label: 'Survivor Camp',
        tag: 'MAIN BASE',
        desc: 'Central survival camp with active animated campfire, canvas tent, supply crates, and wooden defenses.'
      },
      survivor: {
        position: new THREE.Vector3(-0.6, 1.35, 2.8),
        target: new THREE.Vector3(-2.2, 1.05, 1.2),
        label: 'The Survivor',
        tag: 'OPERATOR',
        desc: 'Scavenger survivor equipped with tactical vest, bugout bag, combat knife, and field radio.'
      },
      zombie: {
        position: new THREE.Vector3(7.2, 1.35, -4.5),
        target: new THREE.Vector3(10.5, 1.1, -4.5),
        label: 'The Infected',
        tag: 'BIOHAZARD',
        desc: 'Mutated infected runner with necrotic flesh, exposed ribcage, reaching claws, and luminescent yellow eyes.'
      },
      weapons: {
        position: new THREE.Vector3(1.4, 1.35, 0.5),
        target: new THREE.Vector3(3.2, 1.35, 0.5),
        label: 'Weapons Workbench',
        tag: 'ARMORY',
        desc: 'Precision weapon rack with Vanguard AR-74, Breaker 12G shotgun, and Sidekick 9mm pistol.'
      },
      collectibles: {
        position: new THREE.Vector3(-2.3, 1.45, -0.6),
        target: new THREE.Vector3(-3.6, 0.5, -1.8),
        label: 'Survival Supplies',
        tag: 'LOGISTICS',
        desc: 'Organized supply pallet displaying trauma medkit, military ammo cans, rations, fuel, and tools.'
      },
      outpost: {
        position: new THREE.Vector3(-10.0, 8.5, -4.5),
        target: new THREE.Vector3(-16.0, 2.8, -14.0),
        label: 'Abandoned Outpost',
        tag: 'RUINS',
        desc: 'Partially destroyed checkpoint structure with collapsed masonry, rebar spikes, and rubble heap.'
      },
      highway: {
        position: new THREE.Vector3(11.5, 3.2, 6.0),
        target: new THREE.Vector3(18, 1.0, 3.5),
        label: 'Forest Highway',
        tag: 'PERIMETER',
        desc: 'Cracked 2-lane evacuation route blocked with hazard barriers, steel guardrails, and highway signs.'
      }
    };

    this.currentFocus = 'overview';
    this.onFocusChange = null;
  }

  setupSmoothZoom() {
    // Intercept wheel events for a buttery smooth exponential zoom
    const onWheel = (e) => {
      // Allow standard scroll inside modal content or input fields
      if (e.target && e.target.closest && (e.target.closest('.modal-content') || e.target.closest('input') || e.target.closest('.card-body'))) {
        return;
      }

      e.preventDefault();

      if (this.isTransitioning) {
        this.isTransitioning = false;
      }

      // Normalize wheel delta across physical notches and trackpads
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 20; // lines
      if (e.deltaMode === 2) delta *= 200; // pages
      delta = THREE.MathUtils.clamp(delta, -100, 100);

      // Continuous exponential scaling:
      // Trackpad micro-scrolls: delicate, precise, silky (~1.003 - 1.01)
      // Mouse wheel detent notches: tactile, satisfying step (~1.17)
      const factor = Math.pow(1.0016, delta);

      const currentDist = this.camera.position.distanceTo(this.controls.target);
      if (this.targetDistance === null || Math.abs(this.targetDistance - currentDist) > 10) {
        this.targetDistance = currentDist;
      }

      this.targetDistance = THREE.MathUtils.clamp(
        this.targetDistance * factor,
        this.controls.minDistance,
        this.controls.maxDistance
      );
    };

    window.addEventListener('wheel', onWheel, { passive: false });
  }

  setupPointerCapture() {
    const el = this.domElement;
    el.style.cursor = 'grab';

    // Prevent default contextmenu so right-drag panning never pops up a browser menu
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('contextmenu', (e) => {
      if (!e.target.closest('input') && !e.target.closest('textarea')) {
        e.preventDefault();
      }
    });

    el.addEventListener('pointerdown', (e) => {
      if (this.isTransitioning) {
        this.isTransitioning = false;
      }
      this.isDragging = true;
      el.style.cursor = e.button === 2 || e.shiftKey ? 'move' : 'grabbing';
      document.body.classList.add('viewport-dragging');
      try {
        el.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift' && !this.isDragging) {
        el.style.cursor = 'move';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift' && !this.isDragging) {
        el.style.cursor = 'grab';
      }
    });

    const onPointerEnd = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      el.style.cursor = 'grab';
      document.body.classList.remove('viewport-dragging');
      try {
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    };

    el.addEventListener('pointerup', onPointerEnd);
    el.addEventListener('pointercancel', onPointerEnd);
    window.addEventListener('pointerup', onPointerEnd);
  }

  setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger when typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.forward = true;
      if (k === 's' || e.key === 'ArrowDown') this.keys.backward = true;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = true;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = true;
      if (k === 'e' || k === ' ') this.keys.up = true;
      if (k === 'q' || k === 'c') this.keys.down = true;
      if (e.shiftKey) this.keys.shift = true;

      // Cancel ongoing transition on flight input
      if (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right || this.keys.up || this.keys.down) {
        if (this.isTransitioning) this.isTransitioning = false;
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.forward = false;
      if (k === 's' || e.key === 'ArrowDown') this.keys.backward = false;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = false;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = false;
      if (k === 'e' || k === ' ') this.keys.up = false;
      if (k === 'q' || k === 'c') this.keys.down = false;
      if (!e.shiftKey) this.keys.shift = false;
    });
  }

  setupDoubleClickFocus() {
    this.domElement.addEventListener('dblclick', (e) => {
      if (!this.scene) return;

      const rect = this.domElement.getBoundingClientRect();
      this.mouseCoords.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseCoords.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouseCoords, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      // Find first valid mesh hit (ignore helper/lights/particles)
      const hit = intersects.find(i => i.object.isMesh && i.object.visible);
      if (hit && hit.point) {
        this.glideTargetTo(hit.point);
      }
    });
  }

  glideTargetTo(newTargetPoint) {
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.targetDistance = null;
    this.startCamPos.copy(this.camera.position);
    this.startLookAt.copy(this.controls.target);

    // Maintain current offset vector from target
    const offset = this.camera.position.clone().sub(this.controls.target);
    this.targetLookAt.copy(newTargetPoint);
    this.targetCamPos.copy(newTargetPoint).add(offset);
  }

  zoomBy(factor) {
    if (this.isTransitioning) this.isTransitioning = false;
    // factor < 1 zooms in, factor > 1 zooms out
    const currentDist = this.camera.position.distanceTo(this.controls.target);
    const base = this.targetDistance !== null ? this.targetDistance : currentDist;
    this.targetDistance = THREE.MathUtils.clamp(
      base * factor,
      this.controls.minDistance,
      this.controls.maxDistance
    );
  }

  setFocus(targetKey, smooth = true) {
    const config = this.focusTargets[targetKey];
    if (!config) return;

    this.currentFocus = targetKey;
    this.targetDistance = null;

    if (!smooth) {
      this.isTransitioning = false;
      this.camera.position.copy(config.position);
      this.controls.target.copy(config.target);
      this.controls.update();
      if (this.onFocusChange) this.onFocusChange(config, targetKey);
      return;
    }

    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.startCamPos.copy(this.camera.position);
    this.targetCamPos.copy(config.position);
    this.startLookAt.copy(this.controls.target);
    this.targetLookAt.copy(config.target);

    if (this.onFocusChange) this.onFocusChange(config, targetKey);
  }

  resetView() {
    this.setFocus('overview', true);
  }

  toggleAutoRotate() {
    this.controls.autoRotate = !this.controls.autoRotate;
    return this.controls.autoRotate;
  }

  setAutoRotateSpeed(speed) {
    this.controls.autoRotateSpeed = speed;
  }

  update(delta) {
    // 1. Handle Smooth Cinematic Focus Transitions
    if (this.isTransitioning) {
      this.transitionProgress += delta / this.transitionDuration;
      if (this.transitionProgress >= 1.0) {
        this.transitionProgress = 1.0;
        this.isTransitioning = false;
        this.camera.position.copy(this.targetCamPos);
        this.controls.target.copy(this.targetLookAt);
      } else {
        const t = this.transitionProgress;
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        this.camera.position.lerpVectors(this.startCamPos, this.targetCamPos, ease);
        this.controls.target.lerpVectors(this.startLookAt, this.targetLookAt, ease);
      }
    }

    // 2. Handle Continuous Damped Exponential Zoom
    if (this.targetDistance !== null) {
      const offset = this.camera.position.clone().sub(this.controls.target);
      const currentDist = offset.length();
      if (Math.abs(currentDist - this.targetDistance) > 0.005) {
        const newDist = THREE.MathUtils.damp(currentDist, this.targetDistance, 14, delta);
        offset.setLength(newDist);
        this.camera.position.copy(this.controls.target).add(offset);
      } else {
        offset.setLength(this.targetDistance);
        this.camera.position.copy(this.controls.target).add(offset);
        this.targetDistance = null;
      }
    }

    // 3. Handle Keyboard Flight / Glide Panning
    const hasMoveInput =
      this.keys.forward || this.keys.backward ||
      this.keys.left || this.keys.right ||
      this.keys.up || this.keys.down;

    if (hasMoveInput) {
      const speedMultiplier = this.keys.shift ? 16.0 : 7.0;

      // Calculate camera horizontal forward and right directions
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, this.camera.up).normalize();

      const moveDir = new THREE.Vector3();
      if (this.keys.forward) moveDir.add(forward);
      if (this.keys.backward) moveDir.sub(forward);
      if (this.keys.right) moveDir.add(right);
      if (this.keys.left) moveDir.sub(right);
      if (this.keys.up) moveDir.y += 1.0;
      if (this.keys.down) moveDir.y -= 1.0;

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        const targetVel = moveDir.multiplyScalar(speedMultiplier);
        this.moveVelocity.lerp(targetVel, Math.min(1, delta * 9.0));
      }
    } else {
      // Natural deceleration friction
      this.moveVelocity.lerp(new THREE.Vector3(), Math.min(1, delta * 8.0));
    }

    if (this.moveVelocity.lengthSq() > 0.0001) {
      const moveStep = this.moveVelocity.clone().multiplyScalar(delta);
      this.camera.position.add(moveStep);
      this.controls.target.add(moveStep);

      // Clamp target to world boundaries [-24, 24]
      this.controls.target.x = THREE.MathUtils.clamp(this.controls.target.x, -24, 24);
      this.controls.target.z = THREE.MathUtils.clamp(this.controls.target.z, -24, 24);
      this.controls.target.y = THREE.MathUtils.clamp(this.controls.target.y, 0.4, 12);
    }

    // 4. Ground Collision Clamp (Prevent camera clipping into terrain)
    this.camera.position.y = Math.max(0.4, this.camera.position.y);

    this.controls.update();
  }
}
