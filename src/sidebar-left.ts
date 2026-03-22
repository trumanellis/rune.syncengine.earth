import { RUNES } from './runes';
import { addRune, getState, subscribe, setRuneStyle, setRuneColor, RUNE_STYLES } from './state';
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

  // Color selector row
  const colorRow = document.createElement('div');
  colorRow.className = 'font-selector';
  colorRow.style.gap = '8px';

  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Color:';
  colorLabel.className = 'font-selector-label';
  colorRow.appendChild(colorLabel);

  const swatchContainer = document.createElement('div');
  swatchContainer.style.cssText = 'display:flex;align-items:center;gap:6px;flex:1;';

  function createSwatch(color: string, title: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.title = title;
    btn.style.cssText = `
      width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
      border: 2px solid var(--border-default); background: ${color};
      transition: border-color 120ms ease, box-shadow 120ms ease;
      flex-shrink: 0;
    `;
    btn.addEventListener('mouseenter', () => { btn.style.borderColor = 'var(--border-strong)'; });
    btn.addEventListener('mouseleave', () => { btn.style.borderColor = getState().runeColor === color ? 'var(--gold)' : 'var(--border-default)'; });
    btn.addEventListener('click', () => { setRuneColor(color); });
    return btn;
  }

  const whiteSwatch = createSwatch('#ffffff', 'White');
  const blackSwatch = createSwatch('#000000', 'Black');

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = getState().runeColor;
  colorInput.title = 'Custom color';
  colorInput.style.cssText = `
    width: 28px; height: 28px; border: none; padding: 0;
    background: none; cursor: pointer; border-radius: 50%;
    flex-shrink: 0;
  `;
  colorInput.addEventListener('input', () => { setRuneColor(colorInput.value); });

  swatchContainer.appendChild(whiteSwatch);
  swatchContainer.appendChild(blackSwatch);
  swatchContainer.appendChild(colorInput);
  colorRow.appendChild(swatchContainer);

  container.insertBefore(colorRow, fontRow.nextSibling);

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

    // Keep color UI in sync
    colorInput.value = state.runeColor;
    whiteSwatch.style.borderColor = state.runeColor === '#ffffff' ? 'var(--gold)' : 'var(--border-default)';
    blackSwatch.style.borderColor = state.runeColor === '#000000' ? 'var(--gold)' : 'var(--border-default)';

    for (const rune of RUNES) {
      const entry = document.createElement('div');
      entry.className = 'rune-entry';
      entry.addEventListener('click', () => addRune(rune.id));

      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', '40');
      svg.setAttribute('height', '80');
      svg.setAttribute('viewBox', '0 0 80 160');

      const textEl = document.createElementNS(svgNS, 'text');
      textEl.setAttribute('x', '40');
      textEl.setAttribute('y', '80');
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('dominant-baseline', 'central');
      textEl.setAttribute('font-size', '90');
      textEl.setAttribute('font-family', 'font' in styleDef ? styleDef.font : "'Noto Sans Runic', sans-serif");
      textEl.style.fill = styleDef.fill === 'none' ? 'none' : state.runeColor;
      textEl.style.stroke = styleDef.stroke === 'none' ? 'none' : state.runeColor;
      textEl.setAttribute('stroke-width', styleDef.strokeWidth);
      textEl.textContent = rune.letter;
      svg.appendChild(textEl);

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

  let prevStyle = getState().runeStyle;
  let prevColor = getState().runeColor;
  subscribe(() => {
    const s = getState();
    if (s.runeStyle !== prevStyle || s.runeColor !== prevColor) {
      prevStyle = s.runeStyle;
      prevColor = s.runeColor;
      render();
    }
  });
}
