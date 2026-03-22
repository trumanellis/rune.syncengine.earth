import { showToast } from './toast';

export interface RuneLayer {
  id: string;
  runeId: string;       // references RuneDefinition.id
  x: number;            // grid-snapped position
  y: number;
  scale: number;        // 0.5, 1.0, 1.5, 2.0 etc
  rotation: number;     // degrees, snapped to 0/45/90/135/180/225/270/315
  mirrorX: boolean;
  mirrorY: boolean;
  visible: boolean;
}

export const RUNE_STYLES = [
  { id: 'geometric-filled', label: 'Filled', font: "'Noto Sans Runic', sans-serif", fill: 'var(--gold)', stroke: 'none', strokeWidth: '0' },
  { id: 'geometric', label: 'Outline', font: "'Noto Sans Runic', sans-serif", fill: 'none', stroke: 'var(--gold)', strokeWidth: '3' },
  { id: 'geometric-bold', label: 'Bold', font: "'Noto Sans Runic', sans-serif", fill: 'var(--gold)', stroke: 'var(--gold)', strokeWidth: '6' },
  { id: 'classic', label: 'Classic', font: 'Segoe UI Historic, serif', fill: 'var(--gold)', stroke: 'none', strokeWidth: '0' },
] as const;

export type RuneStyleId = typeof RUNE_STYLES[number]['id'];

export interface RuneOffset {
  dx: number;
  dy: number;
}

export interface AppState {
  layers: RuneLayer[];
  activeLayerId: string | null;
  gridVisible: boolean;
  gridSize: number;
  runeStyle: RuneStyleId;
  runeOffsets: Record<string, RuneOffset>;  // keyed by runeId
  intention: string;
  runeColor: string;
}

// --- Persistence ---

const STATE_KEY = 'bindrune-state';
const OFFSETS_KEY = 'bindrune-rune-offsets';

const DEFAULT_OFFSETS: Record<string, RuneOffset> = {
  fehu: { dx: -12.6, dy: -43.6 },
  uruz: { dx: -12.4, dy: -43.6 },
  thurisaz: { dx: -21.2, dy: -43.6 },
  ansuz: { dx: -28.6, dy: -43.6 },
  raidho: { dx: -22.8, dy: -43.6 },
  gebo: { dx: -9.2, dy: -43.4 },
  wunjo: { dx: -26.2, dy: -43.6 },
  hagalaz: { dx: -9.8, dy: -43.6 },
  nauthiz: { dx: -34.8, dy: -43.6 },
  isa: { dx: -34.9, dy: -43.5 },
  eihwaz: { dx: -34.8, dy: -43.4 },
  perthro: { dx: -25.2, dy: -43.6 },
  algiz: { dx: -34.8, dy: -43.4 },
  sowilo: { dx: -22.6, dy: -43.6 },
  tiwaz: { dx: -35, dy: -43.6 },
  berkano: { dx: -22.2, dy: -43.4 },
  ehwaz: { dx: -9.4, dy: -43.4 },
  mannaz: { dx: -8.4, dy: -43.4 },
  laguz: { dx: -28.6, dy: -43.4 },
  dagaz: { dx: -9.8, dy: -43.4 },
  othala: { dx: -11.6, dy: -43.6 },
  ingwaz: { dx: -11, dy: -62.8 },
  kenaz: { dx: -27, dy: -60.6 },
  jera: { dx: -12.2, dy: -42.2 },
};

function loadOffsets(): Record<string, RuneOffset> {
  try {
    const raw = localStorage.getItem(OFFSETS_KEY);
    if (raw) return { ...DEFAULT_OFFSETS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_OFFSETS };
}

function saveOffsets(offsets: Record<string, RuneOffset>): void {
  try {
    localStorage.setItem(OFFSETS_KEY, JSON.stringify(offsets));
  } catch { /* ignore */ }
}

interface PersistedState {
  layers: RuneLayer[];
  activeLayerId: string | null;
  runeStyle: RuneStyleId;
  intention: string;
  runeColor: string;
}

function loadPersistedState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed.layers && Array.isArray(parsed.layers)) {
        parsed.layers = parsed.layers
          .map((l: any) => validateImportedLayer(l))
          .filter((l): l is RuneLayer => l !== null);
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return {};
}

function saveState(): void {
  try {
    const persisted: PersistedState = {
      layers: state.layers,
      activeLayerId: state.activeLayerId,
      runeStyle: state.runeStyle,
      intention: state.intention,
      runeColor: state.runeColor,
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(persisted));
  } catch { /* ignore */ }
}

// --- Singleton state ---

const persisted = loadPersistedState();

let state: AppState = {
  layers: persisted.layers ?? [],
  activeLayerId: persisted.activeLayerId ?? null,
  gridVisible: true,
  gridSize: 5,
  runeStyle: persisted.runeStyle ?? 'geometric-filled',
  runeOffsets: loadOffsets(),
  intention: persisted.intention ?? '',
  runeColor: persisted.runeColor ?? '#8aad6e',
};

// --- Undo/Redo ---

const MAX_UNDO = 100;
const undoStack: AppState[] = [];
const redoStack: AppState[] = [];

function pushUndo(): void {
  undoStack.push(structuredClone(state));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
}

let moveUndoPushed = false;
let moveUndoTimer: ReturnType<typeof setTimeout> | null = null;

function pushMoveUndo(): void {
  if (!moveUndoPushed) {
    pushUndo();
    moveUndoPushed = true;
  }
  if (moveUndoTimer) clearTimeout(moveUndoTimer);
  moveUndoTimer = setTimeout(() => { moveUndoPushed = false; }, 500);
}

export function undo(): void {
  if (undoStack.length === 0) return;
  redoStack.push(structuredClone(state));
  state = undoStack.pop()!;
  notify();
}

export function redo(): void {
  if (redoStack.length === 0) return;
  undoStack.push(structuredClone(state));
  state = redoStack.pop()!;
  notify();
}

// --- Pub/sub ---

const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  saveState();
  for (const listener of listeners) {
    listener();
  }
}

// --- Validation ---

function validateImportedLayer(l: any): RuneLayer | null {
  if (typeof l.id !== 'string' || typeof l.runeId !== 'string') return null;
  return {
    id: crypto.randomUUID(),
    runeId: l.runeId,
    x: typeof l.x === 'number' && isFinite(l.x) ? l.x : 0,
    y: typeof l.y === 'number' && isFinite(l.y) ? l.y : 0,
    scale: typeof l.scale === 'number' && isFinite(l.scale) ? Math.max(0.25, Math.min(8, l.scale)) : 1,
    rotation: typeof l.rotation === 'number' && isFinite(l.rotation) ? l.rotation : 0,
    mirrorX: l.mirrorX === true,
    mirrorY: l.mirrorY === true,
    visible: l.visible !== false,
  };
}

// --- Actions ---

export function addRune(runeId: string): void {
  pushUndo();
  // Always place at origin — bindrunes are meant to overlap at center
  const layer: RuneLayer = {
    id: crypto.randomUUID(),
    runeId,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    mirrorX: false,
    mirrorY: false,
    visible: true,
  };
  state = { ...state, layers: [...state.layers, layer], activeLayerId: layer.id };
  notify();
}

export function selectLayer(id: string | null): void {
  state = { ...state, activeLayerId: id };
  notify();
}

export function removeLayer(id: string): void {
  pushUndo();
  const layers = state.layers.filter((l) => l.id !== id);
  const activeLayerId = state.activeLayerId === id ? null : state.activeLayerId;
  state = { ...state, layers, activeLayerId };
  notify();
}

export function moveLayer(id: string, x: number, y: number): void {
  pushMoveUndo();
  const layers = state.layers.map((l) => (l.id === id ? { ...l, x, y } : l));
  state = { ...state, layers };
  notify();
}

export function updateTransform(
  id: string,
  updates: Partial<Pick<RuneLayer, "scale" | "rotation" | "mirrorX" | "mirrorY">>
): void {
  pushUndo();
  const layers = state.layers.map((l) =>
    l.id === id ? { ...l, ...updates } : l
  );
  state = { ...state, layers };
  notify();
}

export function reorderLayer(id: string, direction: "up" | "down"): void {
  const index = state.layers.findIndex((l) => l.id === id);
  if (index === -1) return;

  const layers = [...state.layers];

  if (direction === "up" && index < layers.length - 1) {
    pushUndo();
    [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
  } else if (direction === "down" && index > 0) {
    pushUndo();
    [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
  } else {
    return; // already at boundary, no change
  }

  state = { ...state, layers };
  notify();
}

export function duplicateLayer(id: string): void {
  pushUndo();
  const source = state.layers.find((l) => l.id === id);
  if (!source) return;
  const newLayer: RuneLayer = {
    ...source,
    id: crypto.randomUUID(),
    x: source.x + 20,
    y: source.y + 20,
    visible: true,
  };
  state = { ...state, layers: [...state.layers, newLayer], activeLayerId: newLayer.id };
  notify();
}

export function nudgeRuneOffset(runeId: string, ddx: number, ddy: number): void {
  pushMoveUndo();
  const existing = state.runeOffsets[runeId] ?? { dx: 0, dy: 0 };
  const updated = { dx: existing.dx + ddx, dy: existing.dy + ddy };
  const runeOffsets = { ...state.runeOffsets, [runeId]: updated };
  state = { ...state, runeOffsets };
  saveOffsets(runeOffsets);
  notify();
}

export function getRuneOffset(runeId: string): RuneOffset {
  return state.runeOffsets[runeId] ?? { dx: 0, dy: 0 };
}

export function setRuneStyle(styleId: RuneStyleId): void {
  pushUndo();
  state = { ...state, runeStyle: styleId };
  notify();
}

export function setRuneColor(color: string): void {
  pushUndo();
  state = { ...state, runeColor: color };
  notify();
}

export function exportProject(): void {
  const data = {
    version: 1,
    layers: state.layers,
    runeStyle: state.runeStyle,
    intention: state.intention,
    runeColor: state.runeColor,
    runeOffsets: state.runeOffsets,
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  if ('showSaveFilePicker' in window) {
    (async () => {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'bindrune.json',
          types: [{ description: 'BindRune Project', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (e: any) {
        if (e.name !== 'AbortError') console.error(e);
      }
    })();
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bindrune.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}

export function importProject(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.layers || !Array.isArray(data.layers)) {
          showToast('Invalid BindRune file.', 'error');
          return;
        }
        const validLayers = data.layers
          .map((l: any) => validateImportedLayer(l))
          .filter((l: RuneLayer | null): l is RuneLayer => l !== null);
        if (validLayers.length === 0 && data.layers.length > 0) {
          showToast('No valid layers found in file', 'error');
          return;
        }
        const validStyle = RUNE_STYLES.some(s => s.id === data.runeStyle) ? data.runeStyle : 'geometric-filled';
        const validColor = typeof data.runeColor === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(data.runeColor) ? data.runeColor : '#b19cd9';
        pushUndo();
        state = {
          ...state,
          layers: validLayers,
          activeLayerId: null,
          runeStyle: validStyle,
          intention: typeof data.intention === 'string' ? data.intention.slice(0, 2000) : '',
          runeColor: validColor,
        };
        if (data.runeOffsets && typeof data.runeOffsets === 'object' && !Array.isArray(data.runeOffsets)) {
          const safeOffsets: Record<string, RuneOffset> = {};
          for (const [key, val] of Object.entries(data.runeOffsets)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
            if (val && typeof val === 'object' && typeof (val as any).dx === 'number' && isFinite((val as any).dx) && typeof (val as any).dy === 'number' && isFinite((val as any).dy)) {
              safeOffsets[key] = { dx: (val as any).dx, dy: (val as any).dy };
            }
          }
          const runeOffsets = { ...state.runeOffsets, ...safeOffsets };
          state = { ...state, runeOffsets };
          saveOffsets(runeOffsets);
        }
        saveState();
        notify();
      } catch {
        showToast('Could not read BindRune file.', 'error');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

export function setIntention(text: string): void {
  pushUndo();
  state = { ...state, intention: text.slice(0, 2000) };
  notify();
}

/** Update intention without pushing undo — used for per-keystroke input */
export function setIntentionQuiet(text: string): void {
  state = { ...state, intention: text.slice(0, 2000) };
  notify();
}

/** Snapshot current state to undo stack (used for debounced intention commits) */
export { pushUndo };

export function toggleLayerVisibility(id: string): void {
  pushUndo();
  const layers = state.layers.map(l =>
    l.id === id ? { ...l, visible: !l.visible } : l
  );
  state = { ...state, layers };
  notify();
}

export function centerLayer(id: string): void {
  pushUndo();
  const layers = state.layers.map(l =>
    l.id === id ? { ...l, x: 0, y: 0 } : l
  );
  state = { ...state, layers };
  notify();
}

export function bringToFront(id: string): void {
  const index = state.layers.findIndex(l => l.id === id);
  if (index === -1 || index === state.layers.length - 1) return;
  pushUndo();
  const layers = [...state.layers];
  const [layer] = layers.splice(index, 1);
  layers.push(layer);
  state = { ...state, layers };
  notify();
}

export function sendToBack(id: string): void {
  const index = state.layers.findIndex(l => l.id === id);
  if (index <= 0) return;
  pushUndo();
  const layers = [...state.layers];
  const [layer] = layers.splice(index, 1);
  layers.unshift(layer);
  state = { ...state, layers };
  notify();
}

export function resetAll(): void {
  pushUndo();
  state = {
    layers: [],
    activeLayerId: null,
    gridVisible: true,
    gridSize: 5,
    runeStyle: 'geometric-filled',
    runeOffsets: { ...DEFAULT_OFFSETS },
    intention: '',
    runeColor: '#b19cd9',
  };
  try {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(OFFSETS_KEY);
  } catch { /* ignore */ }
  notify();
}

export function toggleGrid(): void {
  state = { ...state, gridVisible: !state.gridVisible };
  notify();
}

export function getState(): Readonly<AppState> {
  return state;
}

export function getActiveLayer(): RuneLayer | undefined {
  if (state.activeLayerId === null) return undefined;
  return state.layers.find((l) => l.id === state.activeLayerId);
}
