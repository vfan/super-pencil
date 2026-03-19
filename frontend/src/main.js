import './style.css';
import { EventsOn } from '../wailsjs/runtime/runtime';

// ---- DOM ----

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const toolbar = document.getElementById('toolbar');
const toast = document.getElementById('toast');
const undoBtn = document.getElementById('undo-btn');
const clearBtn = document.getElementById('clear-btn');
const toolBtns = document.querySelectorAll('.tool-btn');
const colorBtns = document.querySelectorAll('.color-btn');

// ---- State ----

const TOOLS = ['rect', 'arrow', 'draw', 'star', 'circle', 'eraser'];
let currentToolIndex = 0;
let currentColor = '#FF0000';
let drawingMode = true;
let isDrawing = false;
let startPos = null;
let currentPoints = [];
const strokes = [];
let snapshot = null;

// ---- Canvas sizing (Retina) ----

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  redraw();
}

// ---- Snapshot (for shape preview) ----

function saveSnapshot() {
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function restoreSnapshot() {
  if (snapshot) ctx.putImageData(snapshot, 0, 0);
}

// ---- Drawing primitives ----

function applyStroke(color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function drawFreeStroke(points, color) {
  if (points.length < 2) return;
  ctx.beginPath();
  applyStroke(color, 3);
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function drawEraserStroke(points) {
  if (points.length < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(0,0,0,1)';
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawRectShape(start, end, color) {
  ctx.beginPath();
  applyStroke(color, 3);
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const w = Math.abs(end.x - start.x);
  const h = Math.abs(end.y - start.y);
  ctx.strokeRect(x, y, w, h);
}

function drawCircleShape(start, end, color) {
  const cx = (start.x + end.x) / 2;
  const cy = (start.y + end.y) / 2;
  const rx = Math.abs(end.x - start.x) / 2;
  const ry = Math.abs(end.y - start.y) / 2;
  if (rx < 1 && ry < 1) return;
  ctx.beginPath();
  applyStroke(color, 3);
  ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawArrowShape(start, end, color) {
  ctx.beginPath();
  applyStroke(color, 3);
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);

  const headLen = 16;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLen * Math.cos(angle - Math.PI / 6),
    end.y - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLen * Math.cos(angle + Math.PI / 6),
    end.y - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function drawStarStamp(pos, color) {
  const cx = pos.x;
  const cy = pos.y;
  const outerR = 22;
  const innerR = 9;
  const spikes = 5;
  const rot = -Math.PI / 2;

  ctx.beginPath();
  applyStroke(color, 3);
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = rot + (i * Math.PI) / spikes;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

// ---- Render a single stroke item ----

function renderItem(item) {
  switch (item.type) {
    case 'draw':    return drawFreeStroke(item.points, item.color);
    case 'eraser':  return drawEraserStroke(item.points);
    case 'rect':    return drawRectShape(item.start, item.end, item.color);
    case 'circle':  return drawCircleShape(item.start, item.end, item.color);
    case 'arrow':   return drawArrowShape(item.start, item.end, item.color);
    case 'star':    return drawStarStamp(item.pos, item.color);
  }
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of strokes) {
    renderItem(s);
  }
}

// ---- Helpers ----

function getPos(e) {
  return { x: e.clientX, y: e.clientY };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function currentTool() {
  return TOOLS[currentToolIndex];
}

function isFreeformTool() {
  const t = currentTool();
  return t === 'draw' || t === 'eraser';
}

// ---- Mouse events ----

canvas.addEventListener('mousedown', (e) => {
  if (!drawingMode) return;

  if (currentTool() === 'star') {
    const pos = getPos(e);
    strokes.push({ type: 'star', pos, color: currentColor });
    redraw();
    return;
  }

  isDrawing = true;
  startPos = getPos(e);

  if (isFreeformTool()) {
    currentPoints = [startPos];
  } else {
    saveSnapshot();
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const pos = getPos(e);
  const tool = currentTool();

  if (tool === 'draw') {
    currentPoints.push(pos);
    const prev = currentPoints[currentPoints.length - 2];
    ctx.beginPath();
    applyStroke(currentColor, 3);
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  } else if (tool === 'eraser') {
    currentPoints.push(pos);
    const prev = currentPoints[currentPoints.length - 2];
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.restore();
  } else {
    restoreSnapshot();
    if (tool === 'rect')    drawRectShape(startPos, pos, currentColor);
    if (tool === 'circle')  drawCircleShape(startPos, pos, currentColor);
    if (tool === 'arrow')   drawArrowShape(startPos, pos, currentColor);
  }
});

function finishDrawing(pos) {
  if (!isDrawing) return;
  isDrawing = false;
  const tool = currentTool();

  if (tool === 'draw') {
    if (currentPoints.length > 1) {
      strokes.push({ type: 'draw', points: currentPoints, color: currentColor });
    }
  } else if (tool === 'eraser') {
    if (currentPoints.length > 1) {
      strokes.push({ type: 'eraser', points: currentPoints });
    }
  } else {
    if (pos && startPos && dist(startPos, pos) > 3) {
      strokes.push({ type: tool, start: startPos, end: pos, color: currentColor });
    }
    redraw();
  }

  currentPoints = [];
  startPos = null;
  snapshot = null;
}

canvas.addEventListener('mouseup', (e) => finishDrawing(getPos(e)));
canvas.addEventListener('mouseleave', (e) => finishDrawing(getPos(e)));

// ---- Tool switching ----

function updateToolUI() {
  toolBtns.forEach((btn, i) => {
    btn.classList.toggle('active', i === currentToolIndex);
  });
}

toolBtns.forEach((btn, i) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentToolIndex = i;
    updateToolUI();
  });
});

// ---- Color switching ----

colorBtns.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    colorBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentColor = btn.dataset.color;
  });
});

// ---- Undo / Clear ----

function undo() {
  if (strokes.length === 0) return;
  strokes.pop();
  redraw();
}

function clearAll() {
  strokes.length = 0;
  redraw();
}

undoBtn.addEventListener('click', (e) => { e.stopPropagation(); undo(); });
clearBtn.addEventListener('click', (e) => { e.stopPropagation(); clearAll(); });

// ---- Mode switching (from Go backend) ----

let toastTimer = null;

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1200);
}

function setMode(isDrawingMode) {
  drawingMode = isDrawingMode;

  if (drawingMode) {
    toolbar.classList.remove('hidden');
    canvas.style.cursor = 'crosshair';
    showToast('画图模式');
  } else {
    isDrawing = false;
    currentPoints = [];
    startPos = null;
    snapshot = null;
    clearAll();
    toolbar.classList.add('hidden');
    showToast('退出画笔');
  }
}

EventsOn('mode:changed', (isDrawingMode) => {
  setMode(isDrawingMode);
});

EventsOn('clear', () => {
  clearAll();
});

// ---- Keyboard shortcuts ----

document.addEventListener('keydown', (e) => {
  if (!drawingMode) return;

  if (e.metaKey && e.key === 'z') {
    e.preventDefault();
    undo();
  } else if (e.key === 'z' || e.key === 'Z') {
    e.preventDefault();
    currentToolIndex = (currentToolIndex - 1 + TOOLS.length) % TOOLS.length;
    updateToolUI();
  } else if (e.key === 'x' || e.key === 'X') {
    e.preventDefault();
    currentToolIndex = (currentToolIndex + 1) % TOOLS.length;
    updateToolUI();
  }
});

// ---- Init ----

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
