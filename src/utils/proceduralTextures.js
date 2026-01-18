// src/utils/proceduralTextures.js
import * as THREE from 'three';

/**
 * Creates a soft circular particle texture with feathered edges
 * @param {number} size - Texture size in pixels (default 64)
 * @param {string} color - Center color (default white)
 * @returns {THREE.CanvasTexture}
 */
export function createSoftCircleTexture(size = 64, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.3, color + 'cc'); // 80% opacity
  gradient.addColorStop(0.6, color + '66'); // 40% opacity
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a hexagonal bokeh texture for sci-fi lens flares
 * @param {number} size - Texture size in pixels (default 64)
 * @param {string} color - Hex color (default cyan)
 * @returns {THREE.CanvasTexture}
 */
export function createHexBokehTexture(size = 64, color = '#05d9e8') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;

  // Draw hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Gradient fill
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, color + '88');
  gradient.addColorStop(1, color + '00');

  ctx.fillStyle = gradient;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates an elongated streak/wisp texture for speed effects
 * @param {number} width - Texture width (default 128)
 * @param {number} height - Texture height (default 32)
 * @param {string} color - Streak color (default white)
 * @returns {THREE.CanvasTexture}
 */
export function createStreakTexture(width = 128, height = 32, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, height / 2, width, height / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.2, color + '44');
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(0.8, color + '44');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  // Vertical fade
  const vertGradient = ctx.createLinearGradient(0, 0, 0, height);
  vertGradient.addColorStop(0, 'rgba(0,0,0,0)');
  vertGradient.addColorStop(0.5, 'white');
  vertGradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Apply vertical fade as mask
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = vertGradient;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a soft dust mote texture
 * @param {number} size - Texture size (default 32)
 * @returns {THREE.CanvasTexture}
 */
export function createDustTexture(size = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
