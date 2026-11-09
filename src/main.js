import './styles/main.css';
import { SceneManager } from './core/SceneManager.js';
import { Interface } from './ui/Interface.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Canvas container not found');
    return;
  }

  // Initialize 3D Engine & Scene
  const sceneManager = new SceneManager(container);

  // Initialize Spectator HUD Interface
  const ui = new Interface(sceneManager);

  // Expose to window for easy developer inspection / testing
  window.AFTERFALL = {
    sceneManager,
    ui
  };

  console.log('AFTERFALL — THE LAST EMBER [Prototype 0.1] initialized successfully.');
});
