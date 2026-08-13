// ============================================================
// HH Goa 2026 — Frame / Builder ID Generator
// Everything runs client-side. No uploads, no backend, no build step.
// ============================================================

const PAPER = '#FFF7DE';
const PAPER_BRIGHT = '#FFFDF3';
const INK = '#06210F';
const GREEN_DEEP = '#026735';
const GREEN_MID = '#045C2E';
const YELLOW = '#FEE101';
const PINK = '#FF0080';

const VIBES = {
  sunset: { a: '#FEE101', b: '#FF0080', label: 'Sunset' },
  jungle: { a: '#0F7A46', b: '#FEE101', label: 'Jungle' },
  tide:   { a: '#3FA968', b: '#FF0080', label: 'Tide' },
  bloom:  { a: '#000000', b: '#FEE101', label: 'Bloom' },
};

const CANVAS_SIZE = 1200;
const STUB_HEIGHT = 260;
const MARGIN = 22;

// ---------------- state ----------------
const state = {
  photos: [],   // array of HTMLImageElement, max 4
  name: '',
  stack: [],    // array of strings
  vibe: 'sunset',
  rerollNonce: 0,
};

// ---------------- dom refs ----------------
const canvas = document.getElementById('frameCanvas');
const ctx = canvas.getContext('2d');
const photoInput = document.getElementById('photoInput');
const thumbsEl = document.getElementById('thumbs');
const nameInput = document.getElementById('nameInput');
const stackInput = document.getElementById('stackInput');
const builderClassOut = document.getElementById('builderClassOut');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const shareHint = document.getElementById('shareHint');
const emptyNote = document.getElementById('emptyNote');
const howtoToggle = document.getElementById('howtoToggle');
const howtoPanel = document.getElementById('howtoPanel');
const rerollBtn = document.getElementById('rerollBtn');
const swatchRow = document.getElementById('swatchRow');
const toast = document.getElementById('toast');

// ============================================================
// Toast helper
// ============================================================
let toastTimer;
function showToast(msg, ms = 2400) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
}

// ============================================================
// Builder class generator
// Deterministic from name + stack (+ an optional reroll nonce
// from the dice button, for when you want a different flavor).
// ============================================================
const ADJECTIVES = [
  'Tidal', 'Monsoon', 'Sunburnt', 'Feral', 'Caffeinated', 'Glitchy',
  'Beachside', 'Relentless', 'Neon', 'Barefoot', 'Unhinged', 'Salt-Crusted',
  'Overclocked', 'Sleep-Deprived', 'Golden-Hour', 'Palm-Shade',
];

const NOUN_MAP = [
  { keys: ['react', 'vue', 'angular', 'frontend', 'ui', 'css'], noun: 'Pixel Wrangler' },
  { keys: ['node', 'express', 'backend', 'api', 'go', 'golang'], noun: 'Stack-Slinger' },
  { keys: ['python', 'django', 'flask'], noun: 'Serpent Charmer' },
  { keys: ['ml', 'ai', 'data', 'pytorch', 'tensorflow'], noun: 'Oracle' },
  { keys: ['java', 'spring', 'kotlin'], noun: 'Terminal Monk' },
  { keys: ['design', 'figma', 'ux'], noun: 'Pixel Wrangler' },
  { keys: ['devops', 'cloud', 'aws', 'docker', 'kubernetes'], noun: 'Deploy-er' },
  { keys: ['flutter', 'android', 'ios', 'mobile', 'swift'], noun: 'Prototyper' },
  { keys: ['blockchain', 'web3', 'solidity'], noun: 'Cracked Dev' },
  { keys: ['unity', 'game', 'unreal'], noun: 'Tinkerer' },
];
const DEFAULT_NOUNS = ['Shipper', 'Debugger', 'Architect', 'Wizard', 'Founder', 'Hacker', 'Closer'];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function generateBuilderClass(name, stackTags, nonce) {
  const seedBase = (name || 'builder') + '|' + stackTags.join(',') + '|' + nonce;
  const h1 = hashStr(seedBase);
  const adjective = ADJECTIVES[h1 % ADJECTIVES.length];

  let noun = null;
  outer:
  for (const tag of stackTags) {
    const t = tag.toLowerCase();
    for (const entry of NOUN_MAP) {
      if (entry.keys.some(k => t.includes(k))) {
        noun = entry.noun;
        break outer;
      }
    }
  }
  if (!noun) {
    const h2 = hashStr(seedBase + '|noun');
    noun = DEFAULT_NOUNS[h2 % DEFAULT_NOUNS.length];
  }
  return `${adjective} ${noun}`;
}

// ============================================================
// Canvas drawing helpers
// ============================================================
function roundRectPath(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawCoverImage(c, img, x, y, w, h) {
  const ir = img.width / img.height;
  const sr = w / h;
  let sx, sy, sw, sh;
  if (ir > sr) {
    sh = img.height;
    sw = sh * sr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / sr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function getGridSlots(n, x, y, w, h, gap) {
  if (n <= 0) return [];
  if (n === 1) return [{ x, y, w, h }];
  if (n === 2) {
    const cw = (w - gap) / 2;
    return [
      { x, y, w: cw, h },
      { x: x + cw + gap, y, w: cw, h },
    ];
  }
  if (n === 3) {
    const bigW = (w - gap) * 0.58;
    const smallW = w - gap - bigW;
    const smallH = (h - gap) / 2;
    return [
      { x, y, w: bigW, h },
      { x: x + bigW + gap, y, w: smallW, h: smallH },
      { x: x + bigW + gap, y: y + smallH + gap, w: smallW, h: smallH },
    ];
  }
  const cw = (w - gap) / 2;
  const ch = (h - gap) / 2;
  return [
    { x, y, w: cw, h: ch },
    { x: x + cw + gap, y, w: cw, h: ch },
    { x, y: y + ch + gap, w: cw, h: ch },
    { x: x + cw + gap, y: y + ch + gap, w: cw, h: ch },
  ];
}

function drawStamp(c, cx, cy, radius, label, color) {
  c.save();
  c.translate(cx, cy);
  c.rotate(-9 * Math.PI / 180);
  c.strokeStyle = color;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(0, 0, radius, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([3, 4]);
  c.beginPath();
  c.arc(0, 0, radius - 8, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);

  c.fillStyle = color;
  c.font = '700 11px "JetBrains Mono", monospace';
  c.textAlign = 'center';
  c.fillText('OFFICIALLY FRAMED', 0, -radius * 0.4);

  c.fillStyle = INK;
  c.font = '400 18px "Archivo Black", sans-serif';
  wrapCentered(c, label.toUpperCase(), 0, 10, radius * 1.5, 21);

  c.restore();
}

function wrapCentered(c, text, cx, cy, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (c.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => c.fillText(line, cx, startY + i * lineHeight));
}

function drawPills(c, tags, x, y, maxWidth, fontSize, accentColor) {
  c.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
  const gap = 8;
  const padX = 12;
  const pillH = fontSize + 15;
  let cx = x, cy = y;
  for (const tag of tags) {
    const label = tag.trim();
    if (!label) continue;
    const textW = c.measureText(label).width;
    const pillW = textW + padX * 2;
    if (cx + pillW > x + maxWidth) {
      cx = x;
      cy += pillH + gap;
    }
    c.fillStyle = PAPER_BRIGHT;
    c.fillRect(cx, cy, pillW, pillH);
    c.lineWidth = 2;
    c.strokeStyle = INK;
    c.strokeRect(cx, cy, pillW, pillH);
    c.fillStyle = accentColor;
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillText(label.toUpperCase(), cx + padX, cy + pillH / 2 + 1);
    cx += pillW + gap;
  }
  c.textBaseline = 'alphabetic';
}

function drawCrosshair(c, x, y) {
  c.save();
  c.strokeStyle = YELLOW;
  c.globalAlpha = 0.8;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, y - 7); c.lineTo(x, y + 7);
  c.moveTo(x - 7, y); c.lineTo(x + 7, y);
  c.stroke();
  c.restore();
}

function drawDotTexture(c, x, y, w, h, color, alpha, step) {
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = color;
  for (let yy = y; yy < y + h; yy += step) {
    for (let xx = x; xx < x + w; xx += step) {
      c.beginPath();
      c.arc(xx, yy, 1.4, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

// Wavy seam between the photo panel and the cream stub — brought back
// from the very first version, recolored for this palette.
function drawWaveSeam(c, y, w, h, fillColor, strokeColor) {
  c.save();
  c.beginPath();
  c.moveTo(0, y + 40);
  const waves = 6;
  const step = w / waves;
  for (let i = 0; i < waves; i++) {
    const x0 = i * step;
    const cxp = x0 + step / 2;
    const dir = i % 2 === 0 ? -1 : 1;
    c.quadraticCurveTo(cxp, y + 40 + dir * 22, x0 + step, y + 40);
  }
  c.lineTo(w, h);
  c.lineTo(0, h);
  c.closePath();
  c.fillStyle = fillColor;
  c.fill();
  c.restore();

  // trace just the wave line on top for a crisp cut-line look
  c.save();
  c.beginPath();
  c.moveTo(0, y + 40);
  for (let i = 0; i < waves; i++) {
    const x0 = i * step;
    const cxp = x0 + step / 2;
    const dir = i % 2 === 0 ? -1 : 1;
    c.quadraticCurveTo(cxp, y + 40 + dir * 22, x0 + step, y + 40);
  }
  c.lineWidth = 3;
  c.strokeStyle = strokeColor;
  c.stroke();
  c.restore();
}

// Small radiating sun icon, echoing the HH Goa banner's sunrise motif.
function drawSunRays(c, cx, cy, r, color) {
  c.save();
  c.fillStyle = color;
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 3;
  const rays = 8;
  for (let i = 0; i < rays; i++) {
    const ang = (i / rays) * Math.PI * 2;
    const x1 = cx + Math.cos(ang) * (r + 8);
    const y1 = cy + Math.sin(ang) * (r + 8);
    const x2 = cx + Math.cos(ang) * (r + 20);
    const y2 = cy + Math.sin(ang) * (r + 20);
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  }
  c.restore();
}

// Pink "गोवा" badge, echoing the reference banner's tilted pink Devanagari tag.
function drawDevanagariBadge(c, x, y, w, h, rotationDeg) {
  c.save();
  c.translate(x + w / 2, y + h / 2);
  c.rotate(rotationDeg * Math.PI / 180);
  roundRectPath(c, -w / 2, -h / 2, w, h, 10);
  c.fillStyle = PINK;
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = INK;
  c.stroke();
  c.fillStyle = YELLOW;
  c.font = '700 20px "Space Grotesk", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('गोवा', 0, 2);
  c.restore();
}

// ============================================================
// Main render
// ============================================================
function render() {
  const vibe = VIBES[state.vibe];
  const W = CANVAS_SIZE, H = CANVAS_SIZE, STUB = STUB_HEIGHT;
  const PHOTO_AREA_H = H - STUB;

  ctx.clearRect(0, 0, W, H);

  // ---- deep green photo panel with subtle yellow dot texture ----
  ctx.fillStyle = GREEN_DEEP;
  ctx.fillRect(0, 0, W, PHOTO_AREA_H + 40);
  drawDotTexture(ctx, 0, 0, W, PHOTO_AREA_H, YELLOW, 0.07, 20);

  emptyNote.style.display = state.photos.length ? 'none' : 'flex';

  // ---- photo grid ----
  const gridX = MARGIN, gridY = MARGIN + 58, gridW = W - MARGIN * 2, gridH = PHOTO_AREA_H - MARGIN - 88;
  const slots = getGridSlots(state.photos.length, gridX, gridY, gridW, gridH, 10);

  slots.forEach((slot, i) => {
    const img = state.photos[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(slot.x, slot.y, slot.w, slot.h);
    ctx.clip();
    drawCoverImage(ctx, img, slot.x, slot.y, slot.w, slot.h);
    ctx.restore();

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = YELLOW;
    ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
    ctx.restore();
  });

  // ---- vibe duotone wash over photos ----
  if (state.photos.length) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.24;
    const wash = ctx.createLinearGradient(0, 0, W, PHOTO_AREA_H);
    wash.addColorStop(0, vibe.a);
    wash.addColorStop(1, vibe.b);
    ctx.fillStyle = wash;
    ctx.fillRect(gridX, gridY, gridW, gridH);
    ctx.restore();
  }

  // ---- top wordmark strip ----
  ctx.save();
  ctx.fillStyle = YELLOW;
  ctx.font = '400 34px "Archivo Black", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText("HH GOA '26", MARGIN + 4, MARGIN + 40);
  ctx.restore();

  drawDevanagariBadge(ctx, MARGIN + 236, MARGIN - 8, 76, 48, -7);

  ctx.save();
  ctx.fillStyle = vibe.a === '#000000' ? YELLOW : vibe.a;
  ctx.font = '700 15px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('#FrameInGoa', W - MARGIN - 4, MARGIN + 36);
  ctx.restore();

  drawSunRays(ctx, W - 64, PHOTO_AREA_H - 56, 22, YELLOW);

  // ---- wavy seam into the stub (brought back from the first version) ----
  drawWaveSeam(ctx, PHOTO_AREA_H - 40, W, H, PAPER, INK);

  // ---- stub content ----
  const stubY = PHOTO_AREA_H;
  const leftX = MARGIN + 6;
  const rightReserve = 300;

  ctx.fillStyle = INK;
  ctx.font = '400 42px "Archivo Black", sans-serif';
  ctx.textAlign = 'left';
  const displayName = (state.name || 'YOUR NAME HERE').toUpperCase();
  ctx.fillText(displayName, leftX, stubY + 72, W - rightReserve);

  ctx.fillStyle = vibe.a;
  ctx.font = '700 13px "JetBrains Mono", monospace';
  ctx.fillText('GOA · OCT 2026 · BUILDER PASS', leftX, stubY + 95);

  if (state.stack.length) {
    drawPills(ctx, state.stack, leftX, stubY + 111, W - rightReserve, 13, INK);
  } else {
    ctx.fillStyle = 'rgba(6,33,15,0.45)';
    ctx.font = '500 14px "Space Grotesk", sans-serif';
    ctx.fillText('add your stack (e.g. React, Node, Postgres)', leftX, stubY + 132);
  }

  ctx.fillStyle = 'rgba(6,33,15,0.55)';
  ctx.font = '600 12px "JetBrains Mono", monospace';
  ctx.fillText('HH · GOA · INDIA · 2026', leftX, stubY + STUB - 20);

  const builderClass = generateBuilderClass(state.name, state.stack, state.rerollNonce);
  builderClassOut.textContent = builderClass;
  drawStamp(ctx, W - 148, stubY + STUB / 2 + 4, 92, builderClass, vibe.a);

  // ---- outer border + crosshair marks (riso-print finish) ----
  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = YELLOW;
  ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.restore();
  drawCrosshair(ctx, 16, 16);
  drawCrosshair(ctx, W - 16, 16);
  drawCrosshair(ctx, 16, H - 16);
  drawCrosshair(ctx, W - 16, H - 16);
}

// ============================================================
// Event wiring
// ============================================================
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderThumbs() {
  thumbsEl.innerHTML = '';
  state.photos.forEach((img, i) => {
    const div = document.createElement('div');
    div.className = 'thumb';
    const im = document.createElement('img');
    im.src = img.src;
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.type = 'button';
    btn.onclick = () => {
      state.photos.splice(i, 1);
      renderThumbs();
      render();
    };
    div.appendChild(im);
    div.appendChild(btn);
    thumbsEl.appendChild(div);
  });
}

photoInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []).slice(0, 4 - state.photos.length);
  if (!files.length) return;
  showToast('Loading photo…', 1200);
  const imgs = await Promise.all(files.map(fileToImage));
  state.photos = [...state.photos, ...imgs].slice(0, 4);
  renderThumbs();
  render();
  photoInput.value = '';
});

nameInput.addEventListener('input', () => {
  state.name = nameInput.value;
  render();
});

stackInput.addEventListener('input', () => {
  state.stack = stackInput.value.split(',').map(s => s.trim()).filter(Boolean);
  render();
});

rerollBtn.addEventListener('click', () => {
  state.rerollNonce += 1;
  render();
});

swatchRow.querySelectorAll('.swatch').forEach(el => {
  el.addEventListener('click', () => {
    swatchRow.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    state.vibe = el.dataset.vibe;
    render();
  });
});

howtoToggle.addEventListener('click', () => {
  const isHidden = howtoPanel.hasAttribute('hidden');
  if (isHidden) {
    howtoPanel.removeAttribute('hidden');
    howtoToggle.textContent = 'Hide explainer ⌃';
  } else {
    howtoPanel.setAttribute('hidden', '');
    howtoToggle.textContent = 'What do these terms mean? ⌄';
  }
});

downloadBtn.addEventListener('click', () => {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hhgoa2026-frame.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Downloaded ✓');
  }, 'image/png');
});

function buildShareText() {
  const bc = builderClassOut.textContent || 'Builder';
  return `Just generated my HH Goa 2026 frame — building as a ${bc}! 🌴💻\n\nMake yours 👉 #FrameInGoa`;
}

shareBtn.addEventListener('click', async () => {
  if (!state.photos.length) {
    shareHint.textContent = 'Upload at least one photo first.';
    showToast('Upload a photo first');
    return;
  }
  canvas.toBlob(async (blob) => {
    const file = new File([blob], 'hhgoa2026-frame.png', { type: 'image/png' });
    const text = buildShareText();

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
        shareHint.textContent = '';
        return;
      } catch (err) {
        // user cancelled or share failed — fall through to manual flow
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hhgoa2026-frame.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(intent, '_blank');
    shareHint.textContent = 'Image downloaded — attach it in the X post that just opened (X links can\'t auto-attach images from a website).';
    showToast('Downloaded — attach it on X');
  }, 'image/png');
});

// initial paint
render();
