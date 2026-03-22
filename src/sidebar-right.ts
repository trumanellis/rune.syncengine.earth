import { getState, subscribe, selectLayer, removeLayer, reorderLayer, toggleLayerVisibility, moveLayer, updateTransform, RUNE_STYLES } from './state';
import type { RuneLayer } from './state';
import { RUNES } from './runes';

function buildInlineProps(layer: RuneLayer): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'layer-props-inline';

  const props: { label: string; value: number | boolean; onChange: (v: string) => void; type?: 'number' | 'checkbox' }[] = [
    { label: 'X', value: layer.x, onChange: (v) => moveLayer(layer.id, parseFloat(v) || 0, layer.y) },
    { label: 'Y', value: layer.y, onChange: (v) => moveLayer(layer.id, layer.x, parseFloat(v) || 0) },
    { label: 'Scale', value: layer.scale, onChange: (v) => updateTransform(layer.id, { scale: Math.max(0.25, Math.min(4, parseFloat(v) || 1)) }) },
    { label: 'Rot', value: layer.rotation, onChange: (v) => updateTransform(layer.id, { rotation: parseFloat(v) || 0 }) },
    { label: 'Flip X', value: layer.mirrorX, type: 'checkbox', onChange: () => updateTransform(layer.id, { mirrorX: !layer.mirrorX }) },
    { label: 'Flip Y', value: layer.mirrorY, type: 'checkbox', onChange: () => updateTransform(layer.id, { mirrorY: !layer.mirrorY }) },
  ];

  for (const prop of props) {
    const row = document.createElement('div');
    row.className = 'prop-row';

    const label = document.createElement('span');
    label.className = 'prop-label';
    label.textContent = prop.label;
    row.appendChild(label);

    if (prop.type === 'checkbox') {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = prop.value as boolean;
      input.addEventListener('change', () => prop.onChange(''));
      input.addEventListener('click', (e) => e.stopPropagation());
      row.appendChild(input);
    } else {
      const input = document.createElement('input');
      input.className = 'prop-input';
      input.type = 'number';
      input.step = prop.label === 'Scale' ? '0.25' : prop.label === 'Rot' ? '45' : '5';
      input.value = String(prop.value);
      input.addEventListener('change', () => prop.onChange(input.value));
      input.addEventListener('click', (e) => e.stopPropagation());
      row.appendChild(input);
    }

    wrapper.appendChild(row);
  }

  return wrapper;
}

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
      const isActive = layer.id === state.activeLayerId;

      const wrapper = document.createElement('div');
      wrapper.className = 'layer-wrapper' + (isActive ? ' is-expanded' : '');

      const entry = document.createElement('div');
      entry.className = 'layer-entry';
      if (isActive) {
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
        const textEl = document.createElementNS(svgNS, 'text');
        textEl.setAttribute('x', '40');
        textEl.setAttribute('y', '80');
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('dominant-baseline', 'central');
        textEl.setAttribute('font-size', '90');
        textEl.setAttribute('font-family', 'font' in styleDef ? styleDef.font : "'Noto Sans Runic', sans-serif");
        textEl.style.fill = styleDef.fill;
        textEl.style.stroke = styleDef.stroke;
        textEl.setAttribute('stroke-width', styleDef.strokeWidth);
        textEl.textContent = rune.letter;
        svg.appendChild(textEl);
      }

      // Layer name
      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = rune ? rune.name : layer.runeId;

      // Visibility toggle
      const visBtn = document.createElement('div');
      visBtn.className = 'layer-visibility' + (layer.visible ? '' : ' is-hidden');
      visBtn.textContent = layer.visible ? '👁' : '🚫';
      visBtn.title = layer.visible ? 'Hide layer' : 'Show layer';
      visBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLayerVisibility(layer.id);
      });

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

      entry.appendChild(visBtn);
      entry.appendChild(svg);
      entry.appendChild(name);
      entry.appendChild(actions);

      entry.addEventListener('click', () => {
        selectLayer(isActive ? null : layer.id);
      });

      wrapper.appendChild(entry);

      // Inline transform props — only for selected layer
      if (isActive) {
        wrapper.appendChild(buildInlineProps(layer));
      }

      layerList.appendChild(wrapper);
    }
  }

  render();
  subscribe(render);
}
