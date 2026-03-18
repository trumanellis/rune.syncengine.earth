import { RUNES } from './runes';
import { addRune, getState, subscribe, setRuneStyle, RUNE_STYLES } from './state';
import type { RuneStyleId } from './state';

export function initSidebarLeft(container: HTMLElement): void {
  const heading = document.createElement('h2');
  heading.className = 'sidebar-heading';
  heading.textContent = 'Rune Palette';
  container.appendChild(heading);

  // Font selector
  const fontRow = document.createElement('div');
  fontRow.className = 'font-selector';

  const fontLabel = document.createElement('label');
  fontLabel.textContent = 'Style: ';
  fontLabel.className = 'font-selector-label';

  const fontSelect = document.createElement('select');
  fontSelect.className = 'font-selector-select';
  for (const style of RUNE_STYLES) {
    const opt = document.createElement('option');
    opt.value = style.id;
    opt.textContent = style.label;
    fontSelect.appendChild(opt);
  }
  fontSelect.addEventListener('change', () => {
    setRuneStyle(fontSelect.value as RuneStyleId);
  });

  fontRow.appendChild(fontLabel);
  fontRow.appendChild(fontSelect);
  container.appendChild(fontRow);

  // Rune list
  const list = document.createElement('div');
  list.className = 'rune-list';
  container.appendChild(list);

  function render() {
    list.innerHTML = '';
    const state = getState();
    const styleDef = RUNE_STYLES.find(s => s.id === state.runeStyle) ?? RUNE_STYLES[0];

    // Keep select in sync
    fontSelect.value = state.runeStyle;

    for (const rune of RUNES) {
      const entry = document.createElement('div');
      entry.className = 'rune-entry';
      entry.addEventListener('click', () => addRune(rune.id));

      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', '40');
      svg.setAttribute('height', '80');
      svg.setAttribute('viewBox', '0 0 80 160');

      if (styleDef.mode === 'path') {
        const pathEl = document.createElementNS(svgNS, 'path');
        pathEl.setAttribute('d', rune.path);
        pathEl.style.stroke = 'var(--gold)';
        pathEl.setAttribute('stroke-width', styleDef.strokeWidth);
        pathEl.setAttribute('stroke-linecap', 'round');
        pathEl.setAttribute('stroke-linejoin', 'round');
        pathEl.setAttribute('fill', 'none');
        svg.appendChild(pathEl);
      } else {
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

      const info = document.createElement('div');
      info.className = 'rune-info';

      const name = document.createElement('span');
      name.className = 'rune-name';
      name.textContent = `${rune.name} ${rune.letter}`;

      const meaning = document.createElement('span');
      meaning.className = 'rune-meaning';
      meaning.textContent = rune.meaning;

      info.appendChild(name);
      info.appendChild(meaning);

      entry.appendChild(svg);
      entry.appendChild(info);
      list.appendChild(entry);
    }
  }

  render();
  subscribe(render);
}
