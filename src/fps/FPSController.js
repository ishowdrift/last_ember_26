import * as THREE from 'three';

/**
 * FPS Player Controller for THE LAST EMBER
 * Features:
 * - HTML5 Pointer Lock API with click-to-play & Esc pause
 * - Pitch/Yaw camera control with strict vertical angle clamping
 * - Physics: Gravity, ground snapping, jump, crouch, sprint
 * - Collision with static world obstacles via CollisionSystem
 * - Smooth head bobbing & procedural footstep cadence
 */
export class FPSController {
  constructor(camera, domElement, collisionSystem) {
    this.camera = camera;
    this.domElement = domElement;
    this.collision = collisionSystem;

    // Camera rig hierarchy:
    // yawObject (horizontal rotation) -> pitchObject (vertical rotation) -> camera
    this.yawObject = new THREE.Group();
    this.yawObject.name = 'PlayerYaw';
    
    this.pitchObject = new THREE.Group();
    this.pitchObject.name = 'PlayerPitch';
    
    this.yawObject.add(this.pitchObject);
    this.pitchObject.add(this.camera);

    // Player physical dimensions
    this.radius = 0.38; // collision cylinder radius
    this.standingHeight = 1.80; // meters
    this.standingEyeHeight = 1.65; // camera height from feet
    this.crouchHeight = 1.15;
    this.crouchEyeHeight = 1.00;
    this.currentEyeHeight = this.standingEyeHeight;

    // Spawn location (Safe survivor camp near campfire)
    this.position = new THREE.Vector3(0, 0.15, 3.5);
    this.velocity = new THREE.Vector3();

    // Locomotion parameters
    this.walkSpeed = 4.4; // m/s
    this.sprintSpeed = 7.4; // m/s
    this.crouchSpeed = 2.2; // m/s
    this.jumpForce = 6.2; // m/s (~0.95m vertical clearance)
    this.gravity = 18.5; // m/s^2

    // State flags
    this.isGrounded = true;
    this.isSprinting = false;
    this.isCrouching = false;
    this.isMoving = false;
    this.isPointerLocked = false;
    this.isPaused = false;

    // Look controls & mouse sensitivity
    this.mouseSensitivity = 0.0022;
    this.pitch = 0.0;
    this.yaw = 0.0;
    this.minPitch = -1.48; // -85 degrees
    this.maxPitch = 1.48;  // +85 degrees

    // Head bobbing
    this.bobTimer = 0;
    this.bobAmountY = 0.045;
    this.bobAmountX = 0.025;
    this.stepCadence = 0;

    // Input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      shift: false,
      space: false,
      ctrl: false
    };

    // Callback hooks
    this.onFootstep = null;
    this.onPauseStateChange = null;

    this.init();
  }

  init() {
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);

    // Initial position
    this.yawObject.position.copy(this.position);
    this.pitchObject.position.set(0, this.currentEyeHeight, 0);

    // Face North toward city initially
    this.yaw = Math.PI;
    this.yawObject.rotation.y = this.yaw;

    this.bindEvents();
  }

  bindEvents() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onPointerLockError = this.onPointerLockError.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError);
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('pointerlockerror', this.onPointerLockError);
  }

  requestLock() {
    if (!this.isPointerLocked) {
      this.domElement.requestPointerLock();
    }
  }

  exitLock() {
    if (this.isPointerLocked) {
      document.exitPointerLock();
    }
  }

  onPointerLockChange() {
    this.isPointerLocked = (document.pointerLockElement === this.domElement);
    if (!this.isPointerLocked) {
      // Auto pause on pointer unlock
      this.setPaused(true);
    } else {
      this.setPaused(false);
    }
  }

  onPointerLockError(e) {
    console.warn('[FPSController] Pointer lock error:', e);
  }

  setPaused(paused) {
    this.isPaused = paused;
    if (this.onPauseStateChange) {
      this.onPauseStateChange(paused);
    }
  }

  onMouseMove(e) {
    if (!this.isPointerLocked || this.isPaused) return;

    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;

    // Yaw (horizontal look)
    this.yaw -= movementX * this.mouseSensitivity;
    // Keep yaw normalized between 0 and 2*PI
    this.yaw = (this.yaw % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    this.yawObject.rotation.y = this.yaw;

    // Pitch (vertical look)
    this.pitch -= movementY * this.mouseSensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
    this.pitchObject.rotation.x = this.pitch;
  }

  onKeyDown(e) {
    if (e.repeat) return;
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = true;
        break;
      case 'Space':
        this.keys.space = true;
        this.tryJump();
        break;
      case 'ControlLeft':
      case 'ControlRight':
      case 'KeyC':
        this.keys.ctrl = true;
        this.isCrouching = true;
        break;
      case 'Escape':
        if (this.isPointerLocked) {
          this.exitLock();
        }
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = false;
        break;
      case 'Space':
        this.keys.space = false;
        break;
      case 'ControlLeft':
      case 'ControlRight':
      case 'KeyC':
        this.keys.ctrl = false;
        this.isCrouching = false;
        break;
    }
  }

  tryJump() {
    if (this.isGrounded && !this.isPaused && !this.isCrouching) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }
  }

  /**
   * Resets player position (e.g. on respawn)
   */
  teleport(pos, yaw = 0) {
    this.position.set(pos.x, pos.y, pos.z);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = 0;
    this.yawObject.position.copy(this.position);
    this.yawObject.rotation.y = this.yaw;
    this.pitchObject.rotation.x = this.pitch;
    this.isGrounded = true;
  }

  getForwardVector() {
    const fwd = new THREE.Vector3(0, 0, -1);
    fwd.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    return fwd.normalize();
  }

  getRightVector() {
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    return right.normalize();
  }

  getAimRay() {
    const rayDir = new THREE.Vector3(0, 0, -1);
    rayDir.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    const rayOrigin = this.getEyePosition();
    return { origin: rayOrigin, direction: rayDir.normalize() };
  }

  getEyePosition() {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + this.currentEyeHeight,
      this.position.z
    );
  }

  update(delta) {
    if (this.isPaused) return;

    // Smooth crouch transition
    const targetEyeHeight = this.isCrouching ? this.crouchEyeHeight : this.standingEyeHeight;
    this.currentEyeHeight += (targetEyeHeight - this.currentEyeHeight) * Math.min(1, delta * 14.0);
    this.pitchObject.position.y = this.currentEyeHeight;

    // Determine speed
    this.isSprinting = this.keys.shift && this.keys.forward && !this.isCrouching;
    let targetSpeed = this.walkSpeed;
    if (this.isCrouching) targetSpeed = this.crouchSpeed;
    else if (this.isSprinting) targetSpeed = this.sprintSpeed;

    // Direction calculation
    const inputVector = new THREE.Vector3();
    if (this.keys.forward) inputVector.z -= 1;
    if (this.keys.backward) inputVector.z += 1;
    if (this.keys.left) inputVector.x -= 1;
    if (this.keys.right) inputVector.x += 1;

    this.isMoving = inputVector.lengthSq() > 0.01;

    // Normalize diagonal movement to prevent excessive speed
    if (this.isMoving) {
      inputVector.normalize();
    }

    // World relative movement direction
    const forward = this.getForwardVector();
    const right = this.getRightVector();
    const wishDir = new THREE.Vector3()
      .addScaledVector(forward, -inputVector.z)
      .addScaledVector(right, inputVector.x);

    // Horizontal acceleration & damping
    const accelRate = this.isGrounded ? 12.0 : 4.0;
    const targetVelX = wishDir.x * targetSpeed;
    const targetVelZ = wishDir.z * targetSpeed;

    this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1, delta * accelRate);
    this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1, delta * accelRate);

    // Apply gravity
    this.velocity.y -= this.gravity * delta;
    // Terminal velocity clamp
    this.velocity.y = Math.max(-28.0, this.velocity.y);

    // Calculate intended horizontal displacement
    const displacement = new THREE.Vector3(
      this.velocity.x * delta,
      0,
      this.velocity.z * delta
    );

    // Resolve horizontal obstacle collisions & wall sliding
    const playerHeight = this.isCrouching ? this.crouchHeight : this.standingHeight;
    const safePos = this.collision.resolveMovement(
      this.position,
      displacement,
      this.radius,
      playerHeight,
      0.45 // step height
    );

    this.position.x = safePos.x;
    this.position.z = safePos.z;

    // Vertical displacement & floor height detection
    this.position.y += this.velocity.y * delta;
    const floorY = this.collision.getFloorHeight(this.position.x, this.position.z);

    // Ground contact test
    if (this.position.y <= floorY) {
      this.position.y = floorY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Update yawObject position in the scene
    this.yawObject.position.copy(this.position);

    // Head bobbing physics
    this.updateHeadBob(delta);
  }

  updateHeadBob(delta) {
    if (this.isMoving && this.isGrounded) {
      const bobFreq = this.isSprinting ? 12.5 : 8.5;
      this.bobTimer += delta * bobFreq;

      const bobY = Math.sin(this.bobTimer) * this.bobAmountY * (this.isSprinting ? 1.3 : 1.0);
      const bobX = Math.cos(this.bobTimer * 0.5) * this.bobAmountX;

      this.camera.position.y = bobY;
      this.camera.position.x = bobX;

      // Footstep cadence trigger
      if (Math.sin(this.bobTimer) < -0.92 && !this.stepCadence) {
        this.stepCadence = 1;
        if (this.onFootstep) {
          this.onFootstep(this.isSprinting);
        }
      } else if (Math.sin(this.bobTimer) > 0) {
        this.stepCadence = 0;
      }
    } else {
      // Settle smoothly back to center
      this.camera.position.x += (0 - this.camera.position.x) * Math.min(1, delta * 10.0);
      this.camera.position.y += (0 - this.camera.position.y) * Math.min(1, delta * 10.0);
      this.stepCadence = 0;
    }
  }
}
