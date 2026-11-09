import './styles/main.css';
import { SceneManager } from './core/SceneManager.js';
import { FPSInterface } from './ui/FPSInterface.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Canvas container not found');
    return;
  }

  // Initialize 3D Engine & Scene
  const sceneManager = new SceneManager(container);

  // Initialize Playable FPS 0.2 Tactical Survival HUD & Menus
  const fpsInterface = new FPSInterface(sceneManager);
  sceneManager.fpsInterface = fpsInterface;

  // Wire Weapon & Combat Events to HUD
  if (sceneManager.weaponManager) {
    sceneManager.weaponManager.onAmmoChange = (currentMag, reserve, wepId) => {
      fpsInterface.updateAmmo(currentMag, reserve, wepId);
    };

    sceneManager.weaponManager.onHitMarker = (isKill) => {
      fpsInterface.showHitMarker(isKill);
      if (isKill) fpsInterface.onZombieKill();
    };

    sceneManager.weaponManager.onWeaponSwitch = (wep) => {
      const nameEl = document.getElementById('weapon-name');
      if (nameEl) nameEl.textContent = wep.name.toUpperCase();
    };
  }

  if (sceneManager.zombieManager) {
    sceneManager.zombieManager.onPlayerAttack = (damage) => {
      fpsInterface.onPlayerDamage(damage);
    };
  }

  // Expose to window for developer inspection and automated test suites
  window.AFTERFALL = {
    sceneManager,
    fpsInterface
  };

  console.log('AFTERFALL — THE LAST EMBER [Playable FPS 0.2] initialized successfully.');
});
