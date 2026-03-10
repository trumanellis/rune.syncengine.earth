import { getState, subscribe, selectLayer, moveLayer, RUNE_STYLES } from './state';
import { RUNES } from './runes';
import type { RuneDefinition } from './runes';
import { buildTransform, snapToGrid } from './transforms';

const SVG_NS = 'http://www.w3.org/2000/svg';

function createEl(tag: string): SVGElement {
  return document.createElementNS(SVG_NS, tag) as SVGElement;
}

export function initCanvas(container: HTMLElement): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.setAttribute('viewBox', '0 0 500 600');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.id = 'canvas-svg';

  // Defs with grid pattern
  const defs = createEl('defs') as SVGDefsElement;
  const pattern = createEl('pattern') as SVGPatternElement;
  pattern.id = 'grid-pattern';

  const state0 = getState();
  const gridSize = state0.gridSize;
  pattern.setAttribute('width', String(gridSize));
  pattern.setAttribute('height', String(gridSize));
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');

  const hLine = createEl('line') as SVGLineElement;
  hLine.setAttribute('x1', '0');
  hLine.setAttribute('y1', '0');
  hLine.setAttribute('x2', String(gridSize));
  hLine.setAttribute('y2', '0');
  hLine.setAttribute('stroke', '#2a2a3e');
  hLine.setAttribute('stroke-width', '0.5');

  const vLine = createEl('line') as SVGLineElement;
  vLine.setAttribute('x1', '0');
  vLine.setAttribute('y1', '0');
  vLine.setAttribute('x2', '0');
  vLine.setAttribute('y2', String(gridSize));
  vLine.setAttribute('stroke', '#2a2a3e');
  vLine.setAttribute('stroke-width', '0.5');

  pattern.appendChild(hLine);
  pattern.appendChild(vLine);
  defs.appendChild(pattern);
  svg.appendChild(defs);

  // Grid rect
  const gridRect = createEl('rect') as SVGRectElement;
  gridRect.setAttribute('width', '500');
  gridRect.setAttribute('height', '600');
  gridRect.setAttribute('fill', 'url(#grid-pattern)');
  gridRect.classList.add('grid-line');
  svg.appendChild(gridRect);

  // Rune layers group
  const runeLayersGroup = createEl('g') as SVGGElement;
  runeLayersGroup.id = 'rune-layers';
  svg.appendChild(runeLayersGroup);

  // Click on empty canvas to deselect
  svg.addEventListener('click', (e) => {
    if (e.target === svg || e.target === gridRect) {
      selectLayer(null);
    }
  });

  // Render function
  function render() {
    const state = getState();

    // Toggle grid visibility
    gridRect.style.display = state.gridVisible ? '' : 'none';

    // Clear rune layers
    while (runeLayersGroup.firstChild) {
      runeLayersGroup.removeChild(runeLayersGroup.firstChild);
    }

    // Build rune lookup
    const runeMap = new Map<string, RuneDefinition>();
    for (const r of RUNES) {
      runeMap.set(r.id, r);
    }

    for (const layer of state.layers) {
      const rune = runeMap.get(layer.runeId);
      if (!rune) continue;

      const g = createEl('g') as SVGGElement;
      g.classList.add('rune-layer');
      g.setAttribute('data-layer-id', layer.id);
      g.setAttribute('transform', buildTransform(layer.x, layer.y, layer.scale, layer.rotation, layer.mirrorX, layer.mirrorY));

      const styleDef = RUNE_STYLES.find(s => s.id === state.runeStyle) ?? RUNE_STYLES[0];
      if (styleDef.mode === 'path') {
        const pathEl = createEl('path') as SVGPathElement;
        pathEl.setAttribute('d', rune.path);
        pathEl.setAttribute('stroke', '#d4af37');
        pathEl.setAttribute('stroke-width', styleDef.strokeWidth);
        pathEl.setAttribute('stroke-linecap', 'round');
        pathEl.setAttribute('stroke-linejoin', 'round');
        pathEl.setAttribute('fill', 'none');
        g.appendChild(pathEl);
      } else {
        const text = createEl('text') as SVGTextElement;
        text.setAttribute('x', '40');
        text.setAttribute('y', '128');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '144');
        text.setAttribute('font-family', 'font' in styleDef ? styleDef.font : "'Noto Sans Runic', sans-serif");
        text.setAttribute('fill', styleDef.fill);
        text.setAttribute('stroke', styleDef.stroke);
        text.setAttribute('stroke-width', styleDef.strokeWidth);
        text.textContent = rune.letter;
        g.appendChild(text);
      }

      if (layer.id === state.activeLayerId) {
        const sel = createEl('rect') as SVGRectElement;
        sel.classList.add('selection-indicator');
        sel.setAttribute('x', '-5');
        sel.setAttribute('y', '-5');
        sel.setAttribute('width', '90');
        sel.setAttribute('height', '170');
        sel.setAttribute('stroke', '#00d4ff');
        sel.setAttribute('stroke-width', '1');
        sel.setAttribute('fill', 'none');
        sel.setAttribute('stroke-dasharray', '4 3');
        g.appendChild(sel);
      }

      // Click to select (guarded by didDrag)
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!(g as any).__didDrag) {
          selectLayer(layer.id);
        }
      });

      // Drag interaction
      g.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        (g as any).__didDrag = false;

        const startScreenX = e.clientX;
        const startScreenY = e.clientY;
        const startLayerX = layer.x;
        const startLayerY = layer.y;

        function toSVGCoords(screenX: number, screenY: number): { x: number; y: number } {
          const ctm = svg.getScreenCTM();
          if (!ctm) return { x: screenX, y: screenY };
          const inv = ctm.inverse();
          const pt = svg.createSVGPoint();
          pt.x = screenX;
          pt.y = screenY;
          const svgPt = pt.matrixTransform(inv);
          return { x: svgPt.x, y: svgPt.y };
        }

        const startSVG = toSVGCoords(startScreenX, startScreenY);

        function onMouseMove(me: MouseEvent) {
          const curSVG = toSVGCoords(me.clientX, me.clientY);
          const dx = curSVG.x - startSVG.x;
          const dy = curSVG.y - startSVG.y;

          if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            (g as any).__didDrag = true;
          }

          const newX = snapToGrid(startLayerX + dx, state.gridSize);
          const newY = snapToGrid(startLayerY + dy, state.gridSize);
          g.setAttribute('transform', buildTransform(newX, newY, layer.scale, layer.rotation, layer.mirrorX, layer.mirrorY));
        }

        function onMouseUp(me: MouseEvent) {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          const curSVG = toSVGCoords(me.clientX, me.clientY);
          const dx = curSVG.x - startSVG.x;
          const dy = curSVG.y - startSVG.y;
          const newX = snapToGrid(startLayerX + dx, state.gridSize);
          const newY = snapToGrid(startLayerY + dy, state.gridSize);

          if ((g as any).__didDrag) {
            moveLayer(layer.id, newX, newY);
          }
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      runeLayersGroup.appendChild(g);
    }
  }

  subscribe(render);
  render();

  container.appendChild(svg);
  return svg;
}
