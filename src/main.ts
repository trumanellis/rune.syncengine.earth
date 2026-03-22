import './styles.css';
import { initCanvas } from './canvas';
import { initSidebarLeft } from './sidebar-left';
import { initSidebarRight } from './sidebar-right';
import { exportHTML, exportSVG } from './export';
import { getActiveLayer, toggleGrid, updateTransform, removeLayer, duplicateLayer, nudgeRuneOffset, undo, redo, setIntentionQuiet, pushUndo, getState, moveLayer, subscribe, resetAll, exportProject, importProject, setRuneColor } from './state';
import { snapRotation, snapScale } from './transforms';

// Initialize components
const sidebarLeftEl = document.getElementById('sidebar-left') as HTMLElement;
const canvasContainerEl = document.getElementById('canvas-container') as HTMLElement;
const sidebarRightEl = document.getElementById('sidebar-right') as HTMLElement;
const toolbarEl = document.getElementById('toolbar') as HTMLElement;

// Intention bar with debounced undo
const intentionInput = document.getElementById('intention-input') as HTMLTextAreaElement;
intentionInput.value = getState().intention;
function autoResizeIntention() {
  intentionInput.style.height = 'auto';
  intentionInput.style.height = intentionInput.scrollHeight + 'px';
}
let intentionUndoTimer: ReturnType<typeof setTimeout> | null = null;
let intentionUndoPushed = false;
function commitIntentionUndo() {
  if (!intentionUndoPushed) {
    pushUndo();
    intentionUndoPushed = true;
  }
}
intentionInput.addEventListener('input', () => {
  if (!intentionUndoPushed) {
    // Push undo snapshot before the first keystroke of this editing session
    commitIntentionUndo();
  }
  setIntentionQuiet(intentionInput.value);
  autoResizeIntention();
  // Reset idle timer
  if (intentionUndoTimer) clearTimeout(intentionUndoTimer);
  intentionUndoTimer = setTimeout(() => {
    intentionUndoPushed = false;
  }, 1000);
});
intentionInput.addEventListener('blur', () => {
  if (intentionUndoTimer) clearTimeout(intentionUndoTimer);
  intentionUndoPushed = false;
});
autoResizeIntention();

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
    label: '💾 Save',
    title: 'Save project to file',
    action: () => {
      exportProject();
    },
  },
  {
    label: '📂 Load',
    title: 'Load project from file',
    action: () => {
      importProject();
    },
  },
  {
    label: '↗ Export',
    title: 'Export as HTML page',
    action: () => {
      void exportHTML(svgElement);
    },
  },
  {
    label: '◇ SVG',
    title: 'Export as SVG file',
    action: () => {
      void exportSVG(svgElement);
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
  {
    label: '🔄 Reset',
    title: 'Clear all layers and start fresh',
    action: () => {
      if (confirm('Clear all layers and start from scratch?')) {
        resetAll();
      }
    },
  },
];

// Indices of buttons that require an active layer
const requiresLayer = [0, 1, 2, 3, 4, 9]; // Rotate, Mirror X, Mirror Y, Scale Up, Scale Down, Delete

// Brand element with back-link to parent site
const brand = document.createElement('div');
brand.className = 'toolbar-brand';

const logoLink = document.createElement('a');
logoLink.href = 'https://rune.syncengine.earth';
logoLink.className = 'brand-link brand-link-home';
logoLink.title = 'BindRune Editor';
const logoImg = document.createElement('img');
logoImg.src = '/Logo.svg';
logoImg.alt = '';
logoImg.className = 'brand-logo';
logoLink.appendChild(logoImg);
brand.appendChild(logoLink);

const brandText = document.createElement('div');
brandText.className = 'brand-text';

const nameLink = document.createElement('a');
nameLink.href = 'https://rune.syncengine.earth';
nameLink.className = 'brand-link brand-link-home';
nameLink.title = 'BindRune Editor';
const nameSpan = document.createElement('span');
nameSpan.className = 'brand-name';
nameSpan.textContent = 'ᛒindᚱune';
nameLink.appendChild(nameSpan);
brandText.appendChild(nameLink);

const parentLink = document.createElement('a');
parentLink.href = 'https://syncengine.earth';
parentLink.className = 'brand-link brand-link-parent';
parentLink.title = 'Back to Synchronicity Engine';
const subtitleSpan = document.createElement('span');
subtitleSpan.className = 'brand-subtitle';
subtitleSpan.textContent = 'Synchronicity Engine';
parentLink.appendChild(subtitleSpan);
brandText.appendChild(parentLink);

brand.appendChild(brandText);
toolbarEl.appendChild(brand);

// Build toolbar
const toolbarButtons: HTMLButtonElement[] = [];
for (let i = 0; i < buttons.length; i++) {
  const { label, title, action } = buttons[i];
  const btn = document.createElement('button');
  btn.className = 'toolbar-btn';
  btn.title = title;
  btn.textContent = label;
  btn.addEventListener('click', action);
  toolbarEl.appendChild(btn);
  toolbarButtons.push(btn);
}

// --- Responsive sidebar toggles ---
const toggleLeft = document.createElement('button');
toggleLeft.className = 'sidebar-toggle';
toggleLeft.id = 'toggle-sidebar-left';
toggleLeft.title = 'Toggle rune palette';
toggleLeft.textContent = '☰';
toggleLeft.addEventListener('click', () => {
  const app = document.getElementById('app')!;
  const isOpen = app.classList.toggle('sidebar-left-open');
  app.classList.remove('sidebar-right-open');
  toggleLeft.classList.toggle('is-active', isOpen);
  toggleRight.classList.remove('is-active');
});

const toggleRight = document.createElement('button');
toggleRight.className = 'sidebar-toggle';
toggleRight.id = 'toggle-sidebar-right';
toggleRight.title = 'Toggle layers panel';
toggleRight.textContent = '☷';
toggleRight.addEventListener('click', () => {
  const app = document.getElementById('app')!;
  const isOpen = app.classList.toggle('sidebar-right-open');
  app.classList.remove('sidebar-left-open');
  toggleRight.classList.toggle('is-active', isOpen);
  toggleLeft.classList.remove('is-active');
});

// Insert toggle buttons at the start and end of toolbar
toolbarEl.insertBefore(toggleLeft, toolbarEl.firstChild);
toolbarEl.appendChild(toggleRight);

// Backdrop click closes sidebars
const backdrop = document.getElementById('sidebar-backdrop');
if (backdrop) {
  backdrop.addEventListener('click', () => {
    const app = document.getElementById('app')!;
    app.classList.remove('sidebar-left-open', 'sidebar-right-open');
    toggleLeft.classList.remove('is-active');
    toggleRight.classList.remove('is-active');
  });
}

// Update disabled states on state change
subscribe(() => {
  const hasActive = !!getActiveLayer();
  for (const idx of requiresLayer) {
    const btn = toolbarButtons[idx];
    if (!btn) continue;
    if (hasActive) {
      btn.disabled = false;
    } else {
      btn.disabled = true;
    }
  }
  // Keep intention input in sync (e.g. after undo/redo)
  const currentIntention = getState().intention;
  if (intentionInput.value !== currentIntention) {
    intentionInput.value = currentIntention;
    autoResizeIntention();
  }
});

// Keyboard shortcuts
function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA';
}

let clipboard: string | null = null;

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (isInputFocused()) return;

  // Shift+Arrow: nudge per-rune pixel offset
  if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    const layer = getActiveLayer();
    if (!layer) return;
    e.preventDefault();
    const step = 0.2;
    switch (e.key) {
      case 'ArrowLeft':  nudgeRuneOffset(layer.runeId, -step, 0); break;
      case 'ArrowRight': nudgeRuneOffset(layer.runeId, step, 0); break;
      case 'ArrowUp':    nudgeRuneOffset(layer.runeId, 0, -step); break;
      case 'ArrowDown':  nudgeRuneOffset(layer.runeId, 0, step); break;
    }
    return;
  }

  // Plain Arrow keys: move selected layer by grid unit
  if (!e.shiftKey && !e.ctrlKey && !e.metaKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    const layer = getActiveLayer();
    if (!layer) return;
    e.preventDefault();
    const gridSize = getState().gridSize;
    switch (e.key) {
      case 'ArrowLeft':  moveLayer(layer.id, layer.x - gridSize, layer.y); break;
      case 'ArrowRight': moveLayer(layer.id, layer.x + gridSize, layer.y); break;
      case 'ArrowUp':    moveLayer(layer.id, layer.x, layer.y - gridSize); break;
      case 'ArrowDown':  moveLayer(layer.id, layer.x, layer.y + gridSize); break;
    }
    return;
  }

  // Undo/Redo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undo();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' && e.shiftKey || e.key === 'y')) {
    e.preventDefault();
    redo();
    return;
  }

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

  // Shift+C: center rune horizontally
  if (e.shiftKey && e.key === 'C') {
    const layer = getActiveLayer();
    if (!layer) return;
    moveLayer(layer.id, 0, layer.y);
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
    case '0': {
      // Reset zoom
      const resetView = (canvasContainerEl as any).__resetView;
      if (resetView) resetView();
      break;
    }
    case '?': {
      toggleShortcutHelp();
      break;
    }
  }
});

// --- Shortcut Help Overlay ---
let shortcutOverlay: HTMLElement | null = null;

function toggleShortcutHelp(): void {
  if (shortcutOverlay) {
    shortcutOverlay.remove();
    shortcutOverlay = null;
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.addEventListener('click', () => {
    overlay.remove();
    shortcutOverlay = null;
  });

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.addEventListener('click', (e) => e.stopPropagation());

  const title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = 'Keyboard Shortcuts';
  modal.appendChild(title);

  const shortcuts: [string, string][] = [
    ['R', 'Rotate 45\u00B0'],
    ['X', 'Mirror X'],
    ['Y', 'Mirror Y'],
    ['+/=', 'Scale up'],
    ['\u2013', 'Scale down'],
    ['G', 'Toggle grid'],
    ['Del/Bksp', 'Delete layer'],
    ['\u2190\u2191\u2192\u2193', 'Move layer (grid snap)'],
    ['Shift+Arrow', 'Nudge pixel offset'],
    ['Shift+C', 'Center layer'],
    ['Ctrl+D', 'Duplicate layer'],
    ['Ctrl+C/V', 'Copy / Paste layer'],
    ['Ctrl+Z', 'Undo'],
    ['Ctrl+Shift+Z', 'Redo'],
    ['0', 'Reset zoom'],
    ['?', 'This help'],
  ];

  const list = document.createElement('div');
  list.style.cssText = 'display:flex;flex-direction:column;gap:4px;';

  for (const [key, desc] of shortcuts) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;gap:16px;font-size:12px;';

    const k = document.createElement('span');
    k.style.cssText = 'font-family:var(--font-mono);color:var(--gold);min-width:100px;';
    k.textContent = key;

    const d = document.createElement('span');
    d.style.cssText = 'color:var(--text-secondary);';
    d.textContent = desc;

    row.appendChild(k);
    row.appendChild(d);
    list.appendChild(row);
  }

  modal.appendChild(list);

  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-ghost';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => {
    overlay.remove();
    shortcutOverlay = null;
  });
  actions.appendChild(closeBtn);
  modal.appendChild(actions);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  shortcutOverlay = overlay;
}

// Update default rune color when skin changes
const SKIN_RUNE_COLORS: Record<string, string> = {
  jewels:        '#b19cd9',
  organic:       '#8adb6e',
  runestone:     '#c49a3c',
  midnight:      '#e8e8e8',
  contemplative: '#2a2420',
  technical:     '#eeeeee',
};

document.addEventListener('skinchange', (e: Event) => {
  const skin = (e as CustomEvent).detail?.skin;
  const color = SKIN_RUNE_COLORS[skin];
  if (color) setRuneColor(color);
});
