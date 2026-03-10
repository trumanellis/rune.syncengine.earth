export interface RuneLayer {
  id: string;
  runeId: string;       // references RuneDefinition.id
  x: number;            // grid-snapped position
  y: number;
  scale: number;        // 0.5, 1.0, 1.5, 2.0 etc
  rotation: number;     // degrees, snapped to 0/45/90/135/180/225/270/315
  mirrorX: boolean;
  mirrorY: boolean;
}

export const RUNE_STYLES = [
  { id: 'geometric', label: 'Geometric', mode: 'text' as const, font: "'Noto Sans Runic', sans-serif", fill: '#d4af37', stroke: 'none', strokeWidth: '0' },
  { id: 'geometric-outline', label: 'Geometric Outline', mode: 'text' as const, font: "'Noto Sans Runic', sans-serif", fill: 'none', stroke: '#d4af37', strokeWidth: '3' },
  { id: 'geometric-bold', label: 'Geometric Bold', mode: 'text' as const, font: "'Noto Sans Runic', sans-serif", fill: '#d4af37', stroke: '#d4af37', strokeWidth: '2' },
  { id: 'stave', label: 'Stave', mode: 'path' as const, strokeWidth: '6' },
  { id: 'stave-thin', label: 'Stave Thin', mode: 'path' as const, strokeWidth: '3' },
  { id: 'stave-bold', label: 'Stave Bold', mode: 'path' as const, strokeWidth: '10' },
  { id: 'classic', label: 'Classic', mode: 'text' as const, font: 'Segoe UI Historic, serif', fill: '#d4af37', stroke: 'none', strokeWidth: '0' },
] as const;

export type RuneStyleId = typeof RUNE_STYLES[number]['id'];

export interface AppState {
  layers: RuneLayer[];
  activeLayerId: string | null;
  gridVisible: boolean;
  gridSize: number;
  runeStyle: RuneStyleId;
}

// --- Singleton state ---

let state: AppState = {
  layers: [],
  activeLayerId: null,
  gridVisible: true,
  gridSize: 10,
  runeStyle: 'geometric',
};

// --- Pub/sub ---

const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

// --- Actions ---

export function addRune(runeId: string): void {
  const layer: RuneLayer = {
    id: crypto.randomUUID(),
    runeId,
    x: 250,
    y: 300,
    scale: 1,
    rotation: 0,
    mirrorX: false,
    mirrorY: false,
  };
  state = { ...state, layers: [...state.layers, layer], activeLayerId: layer.id };
  notify();
}

export function selectLayer(id: string | null): void {
  state = { ...state, activeLayerId: id };
  notify();
}

export function removeLayer(id: string): void {
  const layers = state.layers.filter((l) => l.id !== id);
  const activeLayerId = state.activeLayerId === id ? null : state.activeLayerId;
  state = { ...state, layers, activeLayerId };
  notify();
}

export function moveLayer(id: string, x: number, y: number): void {
  const layers = state.layers.map((l) => (l.id === id ? { ...l, x, y } : l));
  state = { ...state, layers };
  notify();
}

export function updateTransform(
  id: string,
  updates: Partial<Pick<RuneLayer, "scale" | "rotation" | "mirrorX" | "mirrorY">>
): void {
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
    [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
  } else if (direction === "down" && index > 0) {
    [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
  } else {
    return; // already at boundary, no change
  }

  state = { ...state, layers };
  notify();
}

export function duplicateLayer(id: string): void {
  const source = state.layers.find((l) => l.id === id);
  if (!source) return;
  const newLayer: RuneLayer = {
    ...source,
    id: crypto.randomUUID(),
    x: source.x + 20,
    y: source.y + 20,
  };
  state = { ...state, layers: [...state.layers, newLayer], activeLayerId: newLayer.id };
  notify();
}

export function setRuneStyle(styleId: RuneStyleId): void {
  state = { ...state, runeStyle: styleId };
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
