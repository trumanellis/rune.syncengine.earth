import { getState, subscribe, selectLayer, removeLayer, reorderLayer, RUNE_STYLES } from './state';
import { RUNES } from './runes';

export function initSidebarRight(container: HTMLElement): void {
  const heading = document.createElement('h2');
  heading.className = 'sidebar-heading';
  heading.textContent = 'Layers';
  container.appendChild(heading);

  const layerList = document.createElement('div');
  layerList.className = 'layer-list';
  container.appendChild(layerList);

  function render(): void {
    layerList.innerHTML = '';
    const state = getState();

    if (state.layers.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-message';
      empty.textContent = 'Click a rune to add it';
      layerList.appendChild(empty);
      return;
    }

    const reversed = [...state.layers].reverse();

    for (const layer of reversed) {
      const rune = RUNES.find(r => r.id === layer.runeId);

      const entry = document.createElement('div');
      entry.className = 'layer-entry';
      if (layer.id === state.activeLayerId) {
        entry.classList.add('is-selected');
      }

      // SVG preview
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', '24');
      svg.setAttribute('height', '48');
      svg.setAttribute('viewBox', '0 0 80 160');

      if (rune) {
        const styleDef = RUNE_STYLES.find(s => s.id === state.runeStyle) ?? RUNE_STYLES[0];
        if (styleDef.mode === 'path') {
          const pathEl = document.createElementNS(svgNS, 'path');
          pathEl.setAttribute('d', rune.path);
          pathEl.setAttribute('stroke', '#d4af37');
          pathEl.setAttribute('stroke-width', styleDef.strokeWidth);
          pathEl.setAttribute('stroke-linecap', 'round');
          pathEl.setAttribute('stroke-linejoin', 'round');
          pathEl.setAttribute('fill', 'none');
          svg.appendChild(pathEl);
        } else {
          const textEl = document.createElementNS(svgNS, 'text');
          textEl.setAttribute('x', '40');
          textEl.setAttribute('y', '128');
          textEl.setAttribute('text-anchor', 'middle');
          textEl.setAttribute('font-size', '144');
          textEl.setAttribute('font-family', 'font' in styleDef ? styleDef.font : "'Noto Sans Runic', sans-serif");
          textEl.setAttribute('fill', styleDef.fill);
          textEl.setAttribute('stroke', styleDef.stroke);
          textEl.setAttribute('stroke-width', styleDef.strokeWidth);
          textEl.textContent = rune.letter;
          svg.appendChild(textEl);
        }
      }

      // Layer name
      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = rune ? rune.name : layer.runeId;

      // Actions
      const actions = document.createElement('div');
      actions.className = 'layer-actions';

      const upBtn = document.createElement('button');
      upBtn.className = 'layer-action-btn';
      upBtn.textContent = '▲';
      upBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        reorderLayer(layer.id, 'up');
      });

      const downBtn = document.createElement('button');
      downBtn.className = 'layer-action-btn';
      downBtn.textContent = '▼';
      downBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        reorderLayer(layer.id, 'down');
      });

      const removeBtn = document.createElement('button');
      removeBtn.className = 'layer-action-btn delete';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeLayer(layer.id);
      });

      actions.appendChild(upBtn);
      actions.appendChild(downBtn);
      actions.appendChild(removeBtn);

      entry.appendChild(svg);
      entry.appendChild(name);
      entry.appendChild(actions);

      entry.addEventListener('click', () => {
        selectLayer(layer.id);
      });

      layerList.appendChild(entry);
    }
  }

  render();
  subscribe(render);
}
