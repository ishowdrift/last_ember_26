export class Interface {
  constructor(sceneManager) {
    this.sm = sceneManager;
    this.activeCharacterTab = 'survivor'; // 'survivor' or 'zombie'
    this.survivorAnim = 'idle';
    this.zombieAnim = 'idle';
    this.hudVisible = true;
    
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.setupFpsListener();
    this.setupFocusListener();
  }

  render() {
    const root = document.getElementById('spectator-ui');
    root.innerHTML = `
      <!-- TOP BAR -->
      <header class="hud-panel top-bar interactive">
        <div class="brand-section">
          <div class="brand-logo">
            <div class="ember-badge"></div>
            <div class="brand-title">AFTERFALL <span class="brand-sub">// THE LAST EMBER</span></div>
          </div>
          <span class="version-tag">PROTOTYPE 0.1</span>
        </div>

        <div class="top-center-stats">
          <div class="stat-item">
            <span class="stat-dot"></span>
            <span class="stat-label">STATUS:</span>
            <span class="stat-value" id="system-status">SURVEILLANCE ACTIVE</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">TIME:</span>
            <span class="stat-value" id="time-display">14:00 [AFTERNOON]</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">ENGINE:</span>
            <span class="stat-value" id="fps-display">60 FPS</span>
          </div>
        </div>

        <div class="top-actions">
          <button id="btn-perf-mode" class="btn-tactical active" title="Toggle 60 FPS Target Lock">
            <span>⚡</span> <span id="perf-label">60 FPS LOCK</span>
          </button>
          <button id="btn-audio" class="btn-tactical" title="Toggle Synthesized Audio Ambience">
            <span id="audio-icon">🔇</span> <span id="audio-label">AUDIO OFF</span>
          </button>
          <button id="btn-quick-dn" class="btn-tactical" title="Quick Day/Night Switch">
            <span>☀️/🌙</span> <span>CYCLE</span>
          </button>
          <button id="btn-toggle-hud" class="btn-tactical" title="Toggle HUD visibility for cinematic view">
            <span>👁️</span> <span>HUD</span>
          </button>
          <button id="btn-intel" class="btn-tactical" title="Field Manual">
            <span>ℹ️</span> <span>INTEL</span>
          </button>
        </div>
      </header>

      <!-- MIDDLE WORKSPACE -->
      <div class="middle-layer">
        <!-- LEFT NAVIGATION DOCK -->
        <nav id="nav-dock" class="hud-panel nav-dock interactive">
          <div class="dock-header">
            <span>SECTOR NAVIGATION</span>
            <span style="font-size: 8.5px; color: var(--amber-glow);">[8 TARGETS]</span>
          </div>
          <button class="nav-item-btn active" data-target="overview">
            <span>CINEMATIC OVERVIEW</span>
            <span class="nav-tag">CAM 01</span>
          </button>
          <button class="nav-item-btn" data-target="camp">
            <span>SURVIVOR CAMP</span>
            <span class="nav-tag">BASE</span>
          </button>
          <button class="nav-item-btn" data-target="survivor">
            <span>THE SURVIVOR</span>
            <span class="nav-tag">JACK</span>
          </button>
          <button class="nav-item-btn" data-target="zombie">
            <span>THE INFECTED</span>
            <span class="nav-tag">MUTANT</span>
          </button>
          <button class="nav-item-btn" data-target="weapons">
            <span>WEAPON WORKBENCH</span>
            <span class="nav-tag">ARMORY</span>
          </button>
          <button class="nav-item-btn" data-target="collectibles">
            <span>SURVIVAL SUPPLIES</span>
            <span class="nav-tag">CACHE</span>
          </button>
          <button class="nav-item-btn" data-target="outpost">
            <span>ABANDONED OUTPOST</span>
            <span class="nav-tag">RUINS</span>
          </button>
          <button class="nav-item-btn" data-target="highway">
            <span>FOREST HIGHWAY</span>
            <span class="nav-tag">PERIM</span>
          </button>
        </nav>

        <!-- TARGET INTEL DOSSIER (Center-left) -->
        <div id="intel-card" class="hud-panel intel-card interactive">
          <div class="intel-header">
            <span id="intel-title" class="intel-title">CINEMATIC OVERVIEW</span>
            <span id="intel-tag" class="intel-tag">SURVEILLANCE</span>
          </div>
          <div id="intel-desc" class="intel-desc">
            Broad aerial surveillance of the survivor camp, cracked highway, and surrounding pine forest.
          </div>
        </div>

        <!-- RIGHT CONTROL DOCK -->
        <aside id="control-dock" class="control-dock interactive">
          <!-- Character Animation Controller -->
          <div class="hud-panel deck-section">
            <div class="section-title">
              <span>CHARACTER ANIMATOR</span>
              <span id="character-status" style="font-size: 8.5px; color: var(--olive-tactical);">CONNECTED</span>
            </div>
            
            <div class="tab-group">
              <button id="tab-survivor" class="tab-btn active">SURVIVOR</button>
              <button id="tab-zombie" class="tab-btn">THE INFECTED</button>
            </div>

            <!-- Survivor Animations -->
            <div id="anim-deck-survivor" class="anim-grid">
              <button class="anim-btn active" data-char="survivor" data-anim="idle">IDLE (BREATHE)</button>
              <button class="anim-btn" data-char="survivor" data-anim="walk">WALK IN PLACE</button>
              <button class="anim-btn" data-char="survivor" data-anim="combat">COMBAT READY</button>
              <button class="anim-btn" data-char="survivor" data-anim="wave">SIGNAL / WAVE</button>
            </div>

            <!-- Zombie Animations -->
            <div id="anim-deck-zombie" class="anim-grid" style="display: none;">
              <button class="anim-btn active" data-char="zombie" data-anim="idle">IDLE (TWITCH)</button>
              <button class="anim-btn" data-char="zombie" data-anim="walk">INFECTED WALK</button>
              <button class="anim-btn" data-char="zombie" data-anim="attack">LUNGE ATTACK</button>
              <button class="anim-btn" data-char="zombie" data-anim="stagger">STAGGER RECOIL</button>
            </div>
          </div>

          <!-- Environment Lighting & Atmosphere Deck -->
          <div class="hud-panel deck-section">
            <div class="section-title">
              <span>ATMOSPHERE & LIGHTING</span>
              <span id="light-mode-badge" style="font-size: 8.5px; color: var(--amber-glow);">DAYLIGHT</span>
            </div>

            <div class="slider-group">
              <div class="slider-label-row">
                <span>TIME OF DAY (24H)</span>
                <span id="slider-time-val">14:00</span>
              </div>
              <input id="time-slider" type="range" class="custom-slider" min="0" max="24" step="0.1" value="14" />
            </div>

            <div class="preset-buttons">
              <button class="preset-btn" data-hour="6.5">DAWN</button>
              <button class="preset-btn active" data-hour="13.0">NOON</button>
              <button class="preset-btn" data-hour="18.5">DUSK</button>
              <button class="preset-btn" data-hour="23.0">NIGHT</button>
            </div>

            <div style="display: flex; gap: 4px; margin-top: 3px;">
              <button id="btn-autocycle" class="btn-tactical" style="flex: 1; justify-content: center;">
                <span>⏱️</span> <span>AUTO CYCLE</span>
              </button>
            </div>

            <div style="display: flex; gap: 4px;">
              <button id="btn-fog" class="btn-tactical active" style="flex: 1; justify-content: center;">
                <span>🌫️</span> <span>FOG ON</span>
              </button>
              <button id="btn-particles" class="btn-tactical active" style="flex: 1; justify-content: center;">
                <span>✨</span> <span>PARTICLES</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      <!-- BOTTOM BAR -->
      <footer class="hud-panel bottom-bar interactive">
        <div class="nav-instructions">
          <div><span class="key-badge">L-DRAG</span> Orbit</div>
          <div><span class="key-badge">R-DRAG / SHIFT</span> Pan</div>
          <div><span class="key-badge">SCROLL / + −</span> Zoom</div>
          <div><span class="key-badge">W A S D</span> Fly</div>
          <div><span class="key-badge">DBL-CLICK</span> Focus Point</div>
        </div>

        <div class="bottom-actions">
          <div style="display: flex; gap: 4px;">
            <button id="btn-zoom-in" class="btn-tactical" title="Zoom In (+)">
              <span>➕</span> <span>ZOOM IN</span>
            </button>
            <button id="btn-zoom-out" class="btn-tactical" title="Zoom Out (−)">
              <span>➖</span> <span>ZOOM OUT</span>
            </button>
          </div>
          <button id="btn-autorotate" class="btn-tactical" title="Slow 360 Cinematic Orbit">
            <span>🔄</span> <span>AUTO ORBIT</span>
          </button>
          <button id="btn-reset-cam" class="btn-tactical" title="Reset Camera to Overview">
            <span>⌖</span> <span>RESET CAMERA</span>
          </button>
        </div>
      </footer>

      <!-- FIELD INTEL MODAL -->
      <div id="intel-modal" class="modal-overlay">
        <div class="hud-panel modal-content interactive">
          <div class="modal-header">
            <div class="brand-title">AFTERFALL <span class="brand-sub">// FIELD DOSSIER</span></div>
            <button id="modal-close-btn" class="close-btn">✕</button>
          </div>
          <div class="modal-body">
            <div>
              <div class="modal-section-title">THE SITUATION</div>
              <p>One hundred and eighty days after the initial outbreak, civilization has collapsed into isolated wilderness shelters. The Last Ember survivor outpost serves as a fortified bastion along Highway 14.</p>
            </div>
            <div>
              <div class="modal-section-title">SPECTATOR CAPABILITIES</div>
              <p>• <strong>Sector Navigation:</strong> Inspect 8 distinct zones (Camp, Survivor Jack, Mutated Zombie, Gunsmith Workbench, Survival Collectibles, Destroyed Outpost, Highway, Overview).<br/>
              • <strong>Day/Night Simulation:</strong> Test dynamic illumination shifts from warm daylight to deep atmospheric night with glowing campfire and lanterns.<br/>
              • <strong>Articulated Animations:</strong> Trigger survivor walk cycles, combat ready stance, infected limp walk, aggressive claw lunge, and staggers.<br/>
              • <strong>Web Audio Synthesizer:</strong> Toggle procedural crackling campfire sound and gusting atmospheric wind.</p>
            </div>
            <div>
              <div class="modal-section-title">TECHNICAL ARCHITECTURE</div>
              <p>Built with Three.js, Vite, and high-performance voxel-aligned procedural geometry. Low draw calls, shared material caches, and organic particle dynamics tailored for integrated graphics.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 1. Navigation Buttons
    const navButtons = document.querySelectorAll('.nav-item-btn');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        navButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.getAttribute('data-target');
        this.sm.setFocus(target);

        // Auto-switch character tab if survivor or zombie is clicked
        if (target === 'survivor') {
          this.switchCharTab('survivor');
        } else if (target === 'zombie') {
          this.switchCharTab('zombie');
        }
      });
    });

    // 2. Character Tabs
    const tabSurvivor = document.getElementById('tab-survivor');
    const tabZombie = document.getElementById('tab-zombie');
    tabSurvivor.addEventListener('click', () => this.switchCharTab('survivor'));
    tabZombie.addEventListener('click', () => this.switchCharTab('zombie'));

    // 3. Animation Selector Buttons
    const animBtns = document.querySelectorAll('.anim-btn');
    animBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const char = btn.getAttribute('data-char');
        const anim = btn.getAttribute('data-anim');
        
        document.querySelectorAll(`.anim-btn[data-char="${char}"]`).forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (char === 'survivor') {
          this.survivorAnim = anim;
          this.sm.setSurvivorAnimation(anim);
        } else {
          this.zombieAnim = anim;
          this.sm.setZombieAnimation(anim);
        }
        this.sm.audioManager.playUiClick();
      });
    });

    // 4. Time Slider
    const timeSlider = document.getElementById('time-slider');
    timeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.sm.setTime(val, false);
      this.updateTimeDisplay(val);
      document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
    });

    // 5. Preset Time Buttons
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        presetBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const hour = parseFloat(btn.getAttribute('data-hour'));
        timeSlider.value = hour;
        this.sm.setTime(hour, true);
        this.updateTimeDisplay(hour);
        this.sm.audioManager.playUiClick();
      });
    });

    // 6. Performance Mode Toggle
    const btnPerf = document.getElementById('btn-perf-mode');
    const perfLabel = document.getElementById('perf-label');
    if (btnPerf) {
      btnPerf.addEventListener('click', () => {
        const isPerf = this.sm.togglePerformanceMode();
        btnPerf.classList.toggle('active', isPerf);
        if (perfLabel) {
          perfLabel.textContent = isPerf ? '60 FPS LOCK' : 'HIGH RES';
        }
        this.sm.audioManager.playUiClick();
      });
    }

    // 7. Quick Day/Night Toggle
    const btnQuickDn = document.getElementById('btn-quick-dn');
    btnQuickDn.addEventListener('click', () => {
      const isNight = this.sm.lightingManager.isNightTime();
      const targetHour = isNight ? 13.0 : 23.0;
      timeSlider.value = targetHour;
      this.sm.setTime(targetHour, true);
      this.updateTimeDisplay(targetHour);
      this.sm.audioManager.playUiClick();
    });

    // 7. Auto Cycle Button
    const btnAutoCycle = document.getElementById('btn-autocycle');
    btnAutoCycle.addEventListener('click', () => {
      const active = this.sm.toggleAutoCycle();
      btnAutoCycle.classList.toggle('active', active);
    });

    // 8. Fog & Particles Toggles
    const btnFog = document.getElementById('btn-fog');
    btnFog.addEventListener('click', () => {
      const enabled = this.sm.toggleFog();
      btnFog.classList.toggle('active', enabled);
      btnFog.innerHTML = enabled ? '<span>🌫️</span> <span>FOG ON</span>' : '<span>🌫️</span> <span>FOG OFF</span>';
    });

    const btnParticles = document.getElementById('btn-particles');
    btnParticles.addEventListener('click', () => {
      const enabled = this.sm.toggleParticles();
      btnParticles.classList.toggle('active', enabled);
      btnParticles.innerHTML = enabled ? '<span>✨</span> <span>PARTICLES</span>' : '<span>✨</span> <span>PARTICLES OFF</span>';
    });

    // 9. Camera Controls (Auto-rotate & Reset & Zoom)
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    if (btnZoomIn) btnZoomIn.addEventListener('click', () => this.sm.zoomIn());
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => this.sm.zoomOut());

    const btnAutoRotate = document.getElementById('btn-autorotate');
    btnAutoRotate.addEventListener('click', () => {
      const active = this.sm.toggleAutoRotate();
      btnAutoRotate.classList.toggle('active', active);
    });

    const btnResetCam = document.getElementById('btn-reset-cam');
    btnResetCam.addEventListener('click', () => {
      this.sm.resetCamera();
      document.querySelectorAll('.nav-item-btn').forEach((b) => b.classList.remove('active'));
      const ov = document.querySelector('.nav-item-btn[data-target="overview"]');
      if (ov) ov.classList.add('active');
    });

    // 10. Audio Mute Button
    const btnAudio = document.getElementById('btn-audio');
    btnAudio.addEventListener('click', () => {
      const unmuted = this.sm.toggleAudio();
      const icon = document.getElementById('audio-icon');
      const label = document.getElementById('audio-label');
      if (unmuted) {
        btnAudio.classList.add('active');
        icon.textContent = '🔊';
        label.textContent = 'AUDIO ON';
      } else {
        btnAudio.classList.remove('active');
        icon.textContent = '🔇';
        label.textContent = 'AUDIO OFF';
      }
    });

    // 11. Toggle HUD
    const btnToggleHud = document.getElementById('btn-toggle-hud');
    const navDock = document.getElementById('nav-dock');
    const controlDock = document.getElementById('control-dock');
    const intelCard = document.getElementById('intel-card');
    btnToggleHud.addEventListener('click', () => {
      this.hudVisible = !this.hudVisible;
      navDock.classList.toggle('collapsed', !this.hudVisible);
      controlDock.classList.toggle('collapsed', !this.hudVisible);
      if (intelCard) intelCard.style.display = this.hudVisible ? 'flex' : 'none';
      btnToggleHud.classList.toggle('active', !this.hudVisible);
      this.sm.audioManager.playUiClick();
    });

    // 12. Modal Controls
    const btnIntel = document.getElementById('btn-intel');
    const modal = document.getElementById('intel-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    btnIntel.addEventListener('click', () => {
      modal.classList.add('open');
      this.sm.audioManager.playUiClick();
    });

    modalCloseBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      this.sm.audioManager.playUiClick();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  }

  switchCharTab(char) {
    this.activeCharacterTab = char;
    const tabSurvivor = document.getElementById('tab-survivor');
    const tabZombie = document.getElementById('tab-zombie');
    const deckSurvivor = document.getElementById('anim-deck-survivor');
    const deckZombie = document.getElementById('anim-deck-zombie');

    if (char === 'survivor') {
      tabSurvivor.classList.add('active');
      tabZombie.classList.remove('active');
      deckSurvivor.style.display = 'grid';
      deckZombie.style.display = 'none';
    } else {
      tabSurvivor.classList.remove('active');
      tabZombie.classList.add('active');
      deckSurvivor.style.display = 'none';
      deckZombie.style.display = 'grid';
    }
    this.sm.audioManager.playUiClick();
  }

  updateTimeDisplay(hour) {
    const timeDisplay = document.getElementById('time-display');
    const sliderTimeVal = document.getElementById('slider-time-val');
    const lightBadge = document.getElementById('light-mode-badge');

    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    const pad = (n) => (n < 10 ? '0' + n : n);
    const formatted = `${pad(h)}:${pad(m)}`;

    let period = 'DAYLIGHT';
    if (hour >= 5.5 && hour < 8.0) period = 'DAWN';
    else if (hour >= 8.0 && hour < 17.5) period = 'AFTERNOON';
    else if (hour >= 17.5 && hour < 20.0) period = 'DUSK';
    else period = 'NIGHT';

    if (timeDisplay) timeDisplay.textContent = `${formatted} [${period}]`;
    if (sliderTimeVal) sliderTimeVal.textContent = formatted;
    if (lightBadge) {
      lightBadge.textContent = period;
      lightBadge.style.color = period === 'NIGHT' ? 'var(--cyan-accent)' : 'var(--amber-glow)';
    }
  }

  setupFpsListener() {
    this.sm.onFpsUpdate = (fps) => {
      const fpsEl = document.getElementById('fps-display');
      if (fpsEl) fpsEl.textContent = `${fps} FPS`;

      if (this.sm.lightingManager.autoCycle) {
        const hour = this.sm.lightingManager.timeOfDay;
        const timeSlider = document.getElementById('time-slider');
        if (timeSlider) timeSlider.value = hour.toFixed(1);
        this.updateTimeDisplay(hour);
      }
    };
  }

  setupFocusListener() {
    this.sm.cameraController.onFocusChange = (config, key) => {
      const titleEl = document.getElementById('intel-title');
      const tagEl = document.getElementById('intel-tag');
      const descEl = document.getElementById('intel-desc');

      if (titleEl) titleEl.textContent = config.label.toUpperCase();
      if (tagEl) tagEl.textContent = config.tag || 'TARGET';
      if (descEl) descEl.textContent = config.desc;

      document.querySelectorAll('.nav-item-btn').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-target') === key);
      });
    };
  }
}
