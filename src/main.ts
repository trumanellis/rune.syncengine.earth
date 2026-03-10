import './styles.css';
import { initCanvas } from './canvas';
import { initSidebarLeft } from './sidebar-left';
import { initSidebarRight } from './sidebar-right';
import { exportPNG } from './export';
import { getActiveLayer, toggleGrid, updateTransform, removeLayer, duplicateLayer } from './state';
import { snapRotation, snapScale } from './transforms';

// Initialize components
const sidebarLeftEl = document.getElementById('sidebar-left') as HTMLElement;
const canvasContainerEl = document.getElementById('canvas-container') as HTMLElement;
const sidebarRightEl = document.getElementById('sidebar-right') as HTMLElement;
const toolbarEl = document.getElementById('toolbar') as HTMLElement;

initSidebarLeft(sidebarLeftEl);
const svgElement = initCanvas(canvasContainerEl);
initSidebarRight(sidebarRightEl);

// Toolbar button definitions
const buttons: { label: string; title: string; action: () => void }[] = [
  {
    label: '⟲ Rotate',
    title: 'Rotate active layer 45°',
    action: () => {
      const layer = getActiveLayer();
      if (!layer) return;
      updateTransform(layer.id, { rotation: snapRotation(layer.rotation + 45) });
    },
  },
  {
    label: '↔ Mirror X',
    title: 'Toggle horizontal mirror',
    action: () => {
      const layer = getActiveLayer();
      if (!layer) return;
      updateTransform(layer.id, { mirrorX: !layer.mirrorX });
    },
  },
  {
    label: '↕ Mirror Y',
    title: 'Toggle vertical mirror',
    action: () => {
      const layer = getActiveLayer();
      if (!layer) return;
      updateTransform(layer.id, { mirrorY: !layer.mirrorY });
    },
  },
  {
    label: '＋ Scale Up',
    title: 'Increase scale by 0.25',
    action: () => {
      const layer = getActiveLayer();
      if (!layer) return;
      updateTransform(layer.id, { scale: snapScale(layer.scale + 0.25) });
    },
  },
  {
    label: '－ Scale Down',
    title: 'Decrease scale by 0.25',
    action: () => {
      const layer = getActiveLayer();
      if (!layer) return;
      updateTransform(layer.id, { scale: snapScale(layer.scale - 0.25) });
    },
  },
  {
    label: '⊞ Grid',
    title: 'Toggle grid visibility',
    action: () => {
      toggleGrid();
    },
  },
  {
    label: '⬇ Export PNG',
    title: 'Export as PNG',
    action: () => {
      exportPNG(svgElement);
    },
  },
  {
    label: '🗑 Delete',
    title: 'Delete active layer',
    action: () => {
      const layer = getActiveLayer();
      if (!layer) return;
      removeLayer(layer.id);
    },
  },
];

// Build toolbar
for (const { label, title, action } of buttons) {
  const btn = document.createElement('button');
  btn.className = 'toolbar-btn';
  btn.title = title;
  btn.textContent = label;
  btn.addEventListener('click', action);
  toolbarEl.appendChild(btn);
}

// Keyboard shortcuts
function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA';
}

let clipboard: string | null = null;

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (isInputFocused()) return;

  // Copy/Paste with Ctrl/Cmd
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    const layer = getActiveLayer();
    if (layer) clipboard = layer.id;
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    if (clipboard) duplicateLayer(clipboard);
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault();
    const layer = getActiveLayer();
    if (layer) duplicateLayer(layer.id);
    return;
  }

  switch (e.key) {
    case 'r': {
      const layer = getActiveLayer();
      if (!layer) return;
      updateTransform(layer.id, { rotation: snapRotation(layer.rotation + 45) });
      break;
    }
    case 'x': {
      const layer = getActiveLayer();
      if (!layer) return;
      updateTransform(layer.id, { mirrorX: !layer.mirrorX });
      break;
    }
    case 'y': {
      const layer = getActiveLayer();
      if (!layer) return;
      updateTransform(layer.id, { mirrorY: !layer.mirrorY });
      break;
    }
    case '+':
    case '=': {
      const layer = getActiveLayer();
      if (!layer) return;
      updateTransform(layer.id, { scale: snapScale(layer.scale + 0.25) });
      break;
    }
    case '-': {
      const layer = getActiveLayer();
      if (!layer) return;
      updateTransform(layer.id, { scale: snapScale(layer.scale - 0.25) });
      break;
    }
    case 'g': {
      toggleGrid();
      break;
    }
    case 'Delete':
    case 'Backspace': {
      const layer = getActiveLayer();
      if (!layer) return;
      removeLayer(layer.id);
      break;
    }
  }
});
