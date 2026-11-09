import { audioManager } from '../core/AudioManager.js';

/**
 * Tactical First-Person Survival HUD & Menu System for THE LAST EMBER
 * Features:
 * - Dynamic health bar with low-health pulse and damage vignette
 * - Weapon ammo counter and active gun label
 * - Crosshair with dynamic spread and hit marker blips (kill vs hit)
 * - Click-to-play pointer lock start screen
 * - Pause menu with sensitivity, graphics, volume, and restart options
 * - Death game-over screen with stats and instant restart
 */
export class FPSInterface {
  constructor(sceneManager) {
    this.sm = sceneManager;
    this.root = document.getElementById('spectator-ui');

    this.playerHealth = 100;
    this.maxHealth = 100;
    this.isDead = false;
    this.isPaused = false;
    this.hasStarted = false;
    this.zombiesKilled = 0;
    this.gameStartTime = performance.now();

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.setupFpsListener();
  }

  render() {
    this.root.innerHTML = `
      <!-- FULL-SCREEN DAMAGE VIGNETTE -->
      <div id="damage-vignette" class="damage-vignette"></div>

      <!-- HIT MARKER -->
      <div id="hit-marker" class="hit-marker">
        <div class="hm-line hm-tl"></div>
        <div class="hm-line hm-tr"></div>
        <div class="hm-line hm-bl"></div>
        <div class="hm-line hm-br"></div>
      </div>

      <!-- CENTER CROSSHAIR -->
      <div id="fps-crosshair" class="fps-crosshair">
        <div class="ch-bar ch-top"></div>
        <div class="ch-bar ch-bottom"></div>
        <div class="ch-bar ch-left"></div>
        <div class="ch-bar ch-right"></div>
        <div class="ch-dot"></div>
      </div>

      <!-- TOP BAR STATUS -->
      <header class="hud-panel top-bar interactive">
        <div class="brand-section">
          <div class="brand-logo">
            <div class="ember-badge"></div>
            <div class="brand-title">AFTERFALL <span class="brand-sub">// THE LAST EMBER</span></div>
          </div>
          <span class="version-tag">FPS 0.2 [PLAYABLE]</span>
        </div>

        <div class="top-center-stats">
          <div class="stat-item">
            <span class="stat-dot" style="background:#22c55e;"></span>
            <span class="stat-label">MODE:</span>
            <span class="stat-value" id="game-mode-label">FREE-ROAM SURVIVAL</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">REGION:</span>
            <span class="stat-value" id="current-region-label">REGION B: MEDICAL CAMP</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">ENGINE:</span>
            <span class="stat-value" id="fps-display">60 FPS</span>
          </div>
        </div>

        <div class="top-actions">
          <button id="btn-pause-menu" class="btn-tactical" title="Open Game Menu (Esc)">
            <span>⚙️</span> <span>MENU [ESC]</span>
          </button>
          <button id="btn-mode-toggle" class="btn-tactical" title="Switch between FPS and Spectator Mode">
            <span>🎥</span> <span>SPECTATOR</span>
          </button>
        </div>
      </header>

      <!-- PICKUP NOTIFICATION BANNER -->
      <div id="pickup-banner" class="pickup-banner"></div>

      <!-- BOTTOM HUD: HEALTH & WEAPON STATUS -->
      <div class="bottom-hud-container">
        <!-- HEALTH PANEL (LEFT) -->
        <div class="hud-panel survival-panel health-panel interactive">
          <div class="panel-header-mini">
            <span>SURVIVOR VITALS</span>
            <span id="health-num" class="health-num">100%</span>
          </div>
          <div class="health-bar-track">
            <div id="health-bar-fill" class="health-bar-fill" style="width: 100%;"></div>
          </div>
          <div class="vital-subtext">STATUS: NORMAL // BIO-SIGNALS STABLE</div>
        </div>

        <!-- WEAPON STATUS (RIGHT) -->
        <div class="hud-panel survival-panel weapon-panel interactive">
          <div class="panel-header-mini">
            <span id="weapon-name">VANGUARD AR-74</span>
            <span class="weapon-slot-tag">[1] RIFLE</span>
          </div>
          <div class="ammo-counter-container">
            <span id="ammo-mag" class="ammo-mag">30</span>
            <span class="ammo-slash">/</span>
            <span id="ammo-reserve" class="ammo-reserve">120</span>
          </div>
          <div class="weapon-slots-row">
            <span id="slot-1" class="slot-pill active">[1] AR-74</span>
            <span id="slot-2" class="slot-pill">[2] 12G SHOTGUN</span>
            <span id="slot-3" class="slot-pill">[3] 9MM PISTOL</span>
          </div>
        </div>
      </div>

      <!-- CLICK TO PLAY OVERLAY -->
      <div id="start-overlay" class="modal-backdrop interactive">
        <div class="start-modal hud-panel">
          <div class="modal-badge">PLAYABLE FPS 0.2</div>
          <h1 class="modal-title">AFTERFALL // THE LAST EMBER</h1>
          <p class="modal-subtitle">First-person zombie apocalypse survival prototype running in real-time WebGL.</p>
          
          <div class="controls-grid">
            <div class="ctrl-col">
              <div><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> Move</div>
              <div><kbd>Shift</kbd> Sprint</div>
              <div><kbd>Space</kbd> Jump</div>
              <div><kbd>Ctrl</kbd> Crouch</div>
            </div>
            <div class="ctrl-col">
              <div><kbd>Left Click</kbd> Shoot</div>
              <div><kbd>Right Click</kbd> Aim Down Sights</div>
              <div><kbd>R</kbd> Reload</div>
              <div><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> Weapons</div>
            </div>
          </div>

          <button id="btn-start-game" class="btn-play-primary">
            <span>ENTER THE APOCALYPSE</span>
            <span style="font-size: 11px; opacity: 0.85;">[ CLICK TO LOCK MOUSE & PLAY ]</span>
          </button>
        </div>
      </div>

      <!-- PAUSE MENU OVERLAY -->
      <div id="pause-menu" class="modal-backdrop interactive" style="display: none;">
        <div class="pause-modal hud-panel">
          <h2 class="pause-title">GAME PAUSED</h2>
          
          <div class="menu-actions">
            <button id="btn-resume" class="btn-menu-action primary">▶ RESUME GAME</button>
            <button id="btn-menu-restart" class="btn-menu-action">🔄 RESTART SURVIVAL</button>
            
            <div class="menu-setting-row">
              <span>MOUSE SENSITIVITY:</span>
              <input type="range" id="slider-sens" min="1" max="10" value="5" />
            </div>

            <div class="menu-setting-row">
              <span>QUALITY PRESET:</span>
              <button id="btn-menu-quality" class="btn-tactical-small">LOW (60 FPS LOCK)</button>
            </div>

            <div class="menu-setting-row">
              <span>AUDIO VOLUME:</span>
              <button id="btn-menu-audio" class="btn-tactical-small">🔊 SOUND ON</button>
            </div>

            <button id="btn-switch-spectator" class="btn-menu-action secondary">🎥 SWITCH TO SPECTATOR SHOWCASE</button>
          </div>
        </div>
      </div>

      <!-- DEATH / GAME OVER OVERLAY -->
      <div id="death-overlay" class="modal-backdrop interactive" style="display: none;">
        <div class="death-modal hud-panel">
          <div class="death-skull">💀</div>
          <h1 class="death-title">YOU WERE OVERRUN</h1>
          <p class="death-desc">Your bio-signals have ceased. The infected horde consumed the last ember.</p>

          <div class="death-stats-box">
            <div>SURVIVED TIME: <span id="death-time">0:00</span></div>
            <div>INFECTED DEFEATED: <span id="death-kills">0</span></div>
          </div>

          <button id="btn-death-restart" class="btn-play-primary" style="background: #b91c1c; margin-top: 18px;">
            <span>RESPAWN & SURVIVE AGAIN</span>
          </button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Start Game Button
    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.startGame();
      });
    }

    // Canvas click locks mouse if game has started
    const container = document.getElementById('canvas-container');
    if (container) {
      container.addEventListener('click', () => {
        if (this.hasStarted && !this.isDead && !this.isPaused) {
          this.sm.fpsController?.requestLock();
        }
      });
    }

    // Pause Menu Buttons
    const btnPause = document.getElementById('btn-pause-menu');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        this.openPauseMenu();
      });
    }

    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        this.resumeGame();
      });
    }

    const btnRestart = document.getElementById('btn-menu-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        this.restartGame();
      });
    }

    const btnDeathRestart = document.getElementById('btn-death-restart');
    if (btnDeathRestart) {
      btnDeathRestart.addEventListener('click', () => {
        this.restartGame();
      });
    }

    // Audio toggle
    const btnAudio = document.getElementById('btn-menu-audio');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const unmuted = audioManager.toggleMute();
        btnAudio.textContent = unmuted ? '🔊 SOUND ON' : '🔇 SOUND MUTED';
      });
    }

    // Quality toggle
    const btnQuality = document.getElementById('btn-menu-quality');
    if (btnQuality) {
      btnQuality.addEventListener('click', () => {
        const presets = ['low', 'medium', 'high'];
        const curIdx = presets.indexOf(this.sm.rendererManager.currentPreset);
        const next = presets[(curIdx + 1) % presets.length];
        this.sm.setQualityPreset(next);
        btnQuality.textContent = next.toUpperCase() + (next === 'low' ? ' (60 FPS LOCK)' : '');
      });
    }

    // Sensitivity
    const sensSlider = document.getElementById('slider-sens');
    if (sensSlider) {
      sensSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.sm.fpsController) {
          this.sm.fpsController.mouseSensitivity = 0.0008 + val * 0.0004;
        }
      });
    }

    // Mode Toggle (FPS <-> Spectator)
    const btnModeToggle = document.getElementById('btn-mode-toggle');
    const btnSwitchSpec = document.getElementById('btn-switch-spectator');
    const toggleFunc = () => {
      this.sm.toggleGameMode();
      const isFps = (this.sm.gameMode === 'fps');
      if (btnModeToggle) {
        btnModeToggle.innerHTML = isFps ? '<span>🎥</span> <span>SPECTATOR</span>' : '<span>🎯</span> <span>PLAY FPS</span>';
      }
      if (!isFps) {
        this.closePauseMenu();
        const startModal = document.getElementById('start-overlay');
        if (startModal) startModal.style.display = 'none';
      }
    };

    if (btnModeToggle) btnModeToggle.addEventListener('click', toggleFunc);
    if (btnSwitchSpec) btnSwitchSpec.addEventListener('click', toggleFunc);
  }

  startGame() {
    this.hasStarted = true;
    this.isPaused = false;
    this.isDead = false;
    this.gameStartTime = performance.now();
    this.zombiesKilled = 0;

    const overlay = document.getElementById('start-overlay');
    if (overlay) overlay.style.display = 'none';

    audioManager.init();
    audioManager.resume();

    this.sm.fpsController?.requestLock();
  }

  openPauseMenu() {
    this.isPaused = true;
    this.sm.fpsController?.exitLock();
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) pauseMenu.style.display = 'flex';
  }

  closePauseMenu() {
    this.isPaused = false;
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) pauseMenu.style.display = 'none';
  }

  resumeGame() {
    this.closePauseMenu();
    this.sm.fpsController?.requestLock();
  }

  restartGame() {
    this.isDead = false;
    this.isPaused = false;
    this.playerHealth = 100;
    this.zombiesKilled = 0;
    this.gameStartTime = performance.now();

    const death = document.getElementById('death-overlay');
    if (death) death.style.display = 'none';

    this.closePauseMenu();

    // Reset Engine State
    this.sm.restartSurvivalGame();
    this.updateHealth(100);

    this.sm.fpsController?.requestLock();
  }

  onPlayerDamage(damage) {
    if (this.isDead) return;

    this.playerHealth = Math.max(0, this.playerHealth - damage);
    this.updateHealth(this.playerHealth);

    // Directional damage screen flash
    const vig = document.getElementById('damage-vignette');
    if (vig) {
      vig.classList.add('flash');
      setTimeout(() => vig.classList.remove('flash'), 220);
    }

    audioManager.playPlayerHurt();

    if (this.playerHealth <= 0) {
      this.triggerDeath();
    }
  }

  updateHealth(hp) {
    this.playerHealth = hp;
    const fill = document.getElementById('health-bar-fill');
    const num = document.getElementById('health-num');

    if (fill) {
      fill.style.width = `${hp}%`;
      if (hp > 50) fill.style.background = '#22c55e';
      else if (hp > 25) fill.style.background = '#eab308';
      else fill.style.background = '#ef4444';
    }

    if (num) {
      num.textContent = `${Math.ceil(hp)}%`;
      num.style.color = hp > 25 ? '#f3f4f6' : '#ef4444';
    }
  }

  triggerDeath() {
    this.isDead = true;
    this.sm.fpsController?.exitLock();

    const death = document.getElementById('death-overlay');
    if (death) {
      death.style.display = 'flex';
      const elapsed = Math.floor((performance.now() - this.gameStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = (elapsed % 60).toString().padStart(2, '0');

      const timeEl = document.getElementById('death-time');
      if (timeEl) timeEl.textContent = `${mins}:${secs}`;

      const killsEl = document.getElementById('death-kills');
      if (killsEl) killsEl.textContent = this.zombiesKilled;
    }
  }

  onZombieKill() {
    this.zombiesKilled++;
  }

  showHitMarker(isKill = false) {
    const hm = document.getElementById('hit-marker');
    if (hm) {
      hm.className = 'hit-marker active' + (isKill ? ' kill' : '');
      setTimeout(() => {
        hm.className = 'hit-marker';
      }, 90);
    }
  }

  showPickupNotice(text) {
    const banner = document.getElementById('pickup-banner');
    if (banner) {
      banner.textContent = text;
      banner.className = 'pickup-banner show';
      setTimeout(() => {
        banner.className = 'pickup-banner';
      }, 2000);
    }
  }

  updateAmmo(currentMag, reserve, wepId) {
    const magEl = document.getElementById('ammo-mag');
    const resEl = document.getElementById('ammo-reserve');
    if (magEl) magEl.textContent = currentMag;
    if (resEl) resEl.textContent = reserve;

    // Highlight active slot
    const slots = { rifle: 'slot-1', shotgun: 'slot-2', pistol: 'slot-3' };
    for (const [id, elId] of Object.entries(slots)) {
      const el = document.getElementById(elId);
      if (el) {
        if (id === wepId) el.classList.add('active');
        else el.classList.remove('active');
      }
    }
  }

  setupFpsListener() {
    if (this.sm) {
      this.sm.onFpsUpdate = (fps) => {
        const el = document.getElementById('fps-display');
        if (el) el.textContent = `${fps} FPS`;
      };
    }
  }
}
