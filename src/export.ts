import { showToast } from './toast';
import { getState } from './state';
import { RUNES } from './runes';

// Pre-cache font as base64 for embedding in exported SVGs
let cachedFontDataUri: string | null = null;

async function ensureFontCached(): Promise<string | null> {
  if (cachedFontDataUri) return cachedFontDataUri;
  try {
    // Fetch Google Fonts CSS (with woff2 user-agent to get woff2 URLs)
    const cssRes = await fetch(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+Runic&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );
    const cssText = await cssRes.text();

    // Extract font URL from CSS
    const urlMatch = cssText.match(/url\(([^)]+)\)/);
    if (!urlMatch) return null;

    const fontUrl = urlMatch[1].replace(/['"]/g, '');
    const fontRes = await fetch(fontUrl);
    const fontBlob = await fontRes.blob();

    // Convert to data URI
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedFontDataUri = reader.result as string;
        resolve(cachedFontDataUri);
      };
      reader.readAsDataURL(fontBlob);
    });
  } catch {
    return null;
  }
}

// Start pre-caching immediately
ensureFontCached();

function embedFontInSvg(clone: SVGSVGElement, fontDataUri: string): void {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let defs = clone.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(SVG_NS, 'defs');
    clone.prepend(defs);
  }

  const style = document.createElementNS(SVG_NS, 'style');
  style.textContent = `
    @font-face {
      font-family: 'Noto Sans Runic';
      src: url('${fontDataUri}') format('woff2');
      font-weight: 400;
      font-style: normal;
    }
  `;
  defs.appendChild(style);
}

export async function exportHTML(svgElement: SVGSVGElement): Promise<void> {
  try {
    const fontDataUri = await ensureFontCached();

    // 1. Deep clone the SVG element
    const clone = svgElement.cloneNode(true) as SVGSVGElement;

    // 2. Remove editor-only visual elements from the clone
    const elementsToRemove = clone.querySelectorAll(
      '.grid-line, .selection-indicator, .grid-pattern'
    );
    elementsToRemove.forEach((el) => el.remove());

    // 3. Remove any <defs> that contain grid patterns
    const defsList = clone.querySelectorAll('defs');
    defsList.forEach((defs) => {
      const hasGridPattern = defs.querySelector('.grid-pattern') !== null;
      if (hasGridPattern) {
        defs.remove();
      }
    });

    // 4. Embed font if available
    if (fontDataUri) {
      embedFontInSvg(clone, fontDataUri);
    }

    // 5. Compute tight viewBox from #rune-layers group
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    document.body.appendChild(clone);
    const runeGroup = clone.querySelector('#rune-layers') as SVGGElement;
    const bbox = runeGroup?.getBBox();
    document.body.removeChild(clone);
    clone.style.position = '';
    clone.style.visibility = '';

    const padding = 40;
    let vbX: number, vbY: number, vbW: number, vbH: number;
    if (bbox && bbox.width > 0 && bbox.height > 0) {
      vbX = bbox.x - padding;
      vbY = bbox.y - padding;
      vbW = bbox.width + padding * 2;
      vbH = bbox.height + padding * 2;
    } else {
      vbX = -padding;
      vbY = -padding;
      vbW = padding * 2;
      vbH = padding * 2;
    }

    // 6. Set tight viewBox, remove fixed width/height
    clone.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
    clone.removeAttribute('width');
    clone.removeAttribute('height');

    // 7. Serialize the cleaned SVG to string
    const svgString = new XMLSerializer().serializeToString(clone);

    // 8. Get state for intention and rune list
    const state = getState();
    const intentionText = state.intention.trim();
    const usedRuneIds = [...new Set(state.layers.map(l => l.runeId))];
    const usedRunes = usedRuneIds
      .map(id => RUNES.find(r => r.id === id))
      .filter(Boolean) as typeof RUNES[number][];

    // Build HTML sections
    const intentionSection = intentionText.length > 0
      ? `<div class="intention">${intentionText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
      : '';

    const runeListSection = usedRunes.length > 0
      ? `<div class="rune-list">
  <h2>Runes Used</h2>
  ${usedRunes.map(r => `<div class="rune-entry">${r.letter} ${r.name} — ${r.meaning}</div>`).join('\n  ')}
</div>`
      : '';

    // 9. Build the self-contained HTML string
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bind Rune Export</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0d0d1a;
    color: #e8e8f0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    padding: 48px 24px;
  }
  .intention {
    color: #d4af37;
    font-style: italic;
    font-size: 24px;
    text-align: center;
    max-width: 600px;
    line-height: 1.4;
    margin-bottom: 32px;
  }
  .rune-svg {
    width: 100%;
    max-width: 512px;
    margin: 0 auto 48px;
  }
  .rune-svg svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .rune-list {
    text-align: center;
    max-width: 600px;
  }
  .rune-list h2 {
    font-size: 16px;
    font-weight: 600;
    color: #9098b8;
    margin-bottom: 16px;
  }
  .rune-entry {
    font-size: 14px;
    color: #e8e8f0;
    margin-bottom: 8px;
    line-height: 1.4;
  }
</style>
</head>
<body>
  ${intentionSection}
  <div class="rune-svg">
    ${svgString}
  </div>
  ${runeListSection}
</body>
</html>`;

    // 10. Open in new tab
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    showToast('Opened export in new tab', 'success');
  } catch (error) {
    console.error('HTML export failed:', error);
  }
}
