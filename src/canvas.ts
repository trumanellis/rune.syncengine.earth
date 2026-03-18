import { getState, subscribe, selectLayer, moveLayer, RUNE_STYLES, getRuneOffset } from './state';
import { RUNES } from './runes';
import type { RuneDefinition } from './runes';
import { buildTransform, snapToGrid } from './transforms';
import { showContextMenu } from './context-menu';

const SVG_NS = 'http://www.w3.org/2000/svg';

function createEl(tag: string): SVGElement {
  return document.createElementNS(SVG_NS, tag) as SVGElement;
}

export function initCanvas(container: HTMLElement): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.setAttribute('viewBox', '-250 -300 500 600');
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
  gridRect.setAttribute('x', '-750');
  gridRect.setAttribute('y', '-900');
  gridRect.setAttribute('width', '1500');
  gridRect.setAttribute('height', '1800');
  gridRect.setAttribute('fill', 'url(#grid-pattern)');
  gridRect.classList.add('grid-line');
  svg.appendChild(gridRect);

  // Coordinate axes
  const axesGroup = createEl('g') as SVGGElement;
  axesGroup.classList.add('grid-line');

  const xAxis = createEl('line') as SVGLineElement;
  xAxis.setAttribute('x1', '-2000');
  xAxis.setAttribute('y1', '0');
  xAxis.setAttribute('x2', '2000');
  xAxis.setAttribute('y2', '0');
  xAxis.setAttribute('stroke', '#3a4a6e');
  xAxis.setAttribute('stroke-width', '1');

  const yAxis = createEl('line') as SVGLineElement;
  yAxis.setAttribute('x1', '0');
  yAxis.setAttribute('y1', '-2000');
  yAxis.setAttribute('x2', '0');
  yAxis.setAttribute('y2', '2000');
  yAxis.setAttribute('stroke', '#3a4a6e');
  yAxis.setAttribute('stroke-width', '1');

  axesGroup.appendChild(xAxis);
  axesGroup.appendChild(yAxis);
  svg.appendChild(axesGroup);

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
    axesGroup.style.display = state.gridVisible ? '' : 'none';

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
      if (!layer.visible) continue;
      const rune = runeMap.get(layer.runeId);
      if (!rune) continue;

      const g = createEl('g') as SVGGElement;
      g.classList.add('rune-layer');
      g.setAttribute('data-layer-id', layer.id);
      const offset = getRuneOffset(layer.runeId);
      g.setAttribute('transform', buildTransform(layer.x, layer.y, layer.scale, layer.rotation, layer.mirrorX, layer.mirrorY, offset.dx, offset.dy));

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
        text.setAttribute('y', '80');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('font-size', '112');
        text.setAttribute('font-family', 'font' in styleDef ? styleDef.font : "'Noto Sans Runic', sans-serif");
        text.setAttribute('fill', styleDef.fill);
        text.setAttribute('stroke', styleDef.stroke);
        text.setAttribute('stroke-width', styleDef.strokeWidth);
        text.textContent = rune.letter;
        g.appendChild(text);
      }

      // Click to select (guarded by didDrag)
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!(g as any).__didDrag) {
          selectLayer(layer.id);
        }
      });

      // Right-click context menu
      g.addEventListener('contextmenu', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        selectLayer(layer.id);
        showContextMenu(e.clientX, e.clientY, layer.id);
      });

      // Drag interaction
      g.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        (g as any).__didDrag = false;
        // Auto-select on drag start
        selectLayer(layer.id);

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
          g.setAttribute('transform', buildTransform(newX, newY, layer.scale, layer.rotation, layer.mirrorX, layer.mirrorY, offset.dx, offset.dy));
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

      // Append to DOM first so getBBox() works for selection sizing
      runeLayersGroup.appendChild(g);

      if (layer.id === state.activeLayerId) {
        const contentEl = g.firstElementChild as SVGGraphicsElement;
        const bbox = contentEl.getBBox();
        const strokeW = parseFloat(styleDef.strokeWidth) || 0;
        const pad = 5 + strokeW / 2;
        const sel = createEl('rect') as SVGRectElement;
        sel.classList.add('selection-indicator');
        sel.setAttribute('x', String(bbox.x - pad));
        sel.setAttribute('y', String(bbox.y - pad));
        sel.setAttribute('width', String(bbox.width + pad * 2));
        sel.setAttribute('height', String(bbox.height + pad * 2));
        sel.setAttribute('stroke', '#00d4ff');
        sel.setAttribute('stroke-width', '1');
        sel.setAttribute('fill', 'none');
        sel.setAttribute('stroke-dasharray', '4 3');
        g.appendChild(sel);
      }
    }
  }

  // --- Zoom & Pan via viewBox ---
  const DEFAULT_VB = { x: -250, y: -300, w: 500, h: 600 };
  let vbX = DEFAULT_VB.x;
  let vbY = DEFAULT_VB.y;
  let vbW = DEFAULT_VB.w;
  let vbH = DEFAULT_VB.h;

  // Zoom controls UI
  const controls = document.createElement('div');
  controls.className = 'canvas-controls';

  const zoomLabel = document.createElement('span');
  zoomLabel.className = 'canvas-zoom-label';
  zoomLabel.textContent = '100%';

  const fitBtn = document.createElement('button');
  fitBtn.className = 'btn btn-ghost btn-icon';
  fitBtn.textContent = 'Fit';
  fitBtn.title = 'Reset zoom (0)';
  fitBtn.addEventListener('click', resetView);

  controls.appendChild(zoomLabel);
  controls.appendChild(fitBtn);
  container.appendChild(controls);

  function updateZoomLabel() {
    const zoom = Math.round((DEFAULT_VB.w / vbW) * 100);
    zoomLabel.textContent = `${zoom}%`;
  }

  function resetView() {
    vbX = DEFAULT_VB.x;
    vbY = DEFAULT_VB.y;
    vbW = DEFAULT_VB.w;
    vbH = DEFAULT_VB.h;
    updateViewBox();
  }

  // Expose resetView for keyboard shortcut
  (container as any).__resetView = resetView;

  function updateViewBox() {
    svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
    // Update grid rect to cover visible area with margin
    gridRect.setAttribute('x', String(vbX - vbW));
    gridRect.setAttribute('y', String(vbY - vbH));
    gridRect.setAttribute('width', String(vbW * 3));
    gridRect.setAttribute('height', String(vbH * 3));
    updateZoomLabel();
  }

  svg.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Pinch-to-zoom (trackpad) or Ctrl+scroll
      const zoomFactor = 1 - e.deltaY * 0.01;
      const clampedFactor = Math.max(0.9, Math.min(1.1, zoomFactor));

      // Zoom toward cursor position
      const rect = svg.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;

      const newW = Math.max(20, Math.min(4000, vbW / clampedFactor));
      const newH = Math.max(24, Math.min(4800, vbH / clampedFactor));

      vbX += (vbW - newW) * mx;
      vbY += (vbH - newH) * my;
      vbW = newW;
      vbH = newH;
    } else {
      // Two-finger pan
      const panScale = vbW / svg.getBoundingClientRect().width;
      vbX += e.deltaX * panScale;
      vbY += e.deltaY * panScale;
    }

    updateViewBox();
  }, { passive: false });

  subscribe(render);
  render();

  container.appendChild(svg);
  return svg;
}
