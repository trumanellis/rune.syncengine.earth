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

    const padding = 4;
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

    // 9. Grab skin state and embedded theme CSS
    const currentSkin = document.documentElement.getAttribute('data-skin') || 'jewels';
    const skinStyleEl = document.getElementById('te-skins');
    const sharedStyleEl = document.getElementById('te-shared');
    const skinCSS = skinStyleEl ? skinStyleEl.textContent || '' : '';
    const sharedCSS = sharedStyleEl ? sharedStyleEl.textContent || '' : '';

    // 10. Build the self-contained HTML string
    const html = `<!DOCTYPE html>
<html lang="en" data-skin="${currentSkin}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bind Rune Export</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400&family=Instrument+Sans:wght@400;500;600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Raleway:ital,wght@0,200;0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet">
<style>${sharedCSS}</style>
<style>${skinCSS}</style>
<style>
  /* Bridge: BindRune CSS vars → theme engine tokens */
  :root {
    --gold: var(--t-ac);
    --gold-dim: var(--t-a2);
    --gold-bright: var(--t-ac);
    --cyan: var(--t-a2);
    --text-primary: var(--t-tx);
    --text-secondary: var(--t-t2);
    --text-muted: var(--t-mt);
    --bg-deepest: var(--t-bg);
    --bg-dark: var(--t-sf);
    --bg-panel: var(--t-cd);
    --border-default: var(--t-bd);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    height: 100%;
    overflow: hidden;
  }
  body {
    background: var(--t-bg);
    color: var(--t-tx);
    font-family: var(--s-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    padding: 32px 77px;
  }
  .intention {
    color: var(--t-ac);
    font-family: var(--s-display, inherit);
    font-style: italic;
    font-size: 24px;
    text-align: center;
    line-height: 1.4;
    white-space: pre-line;
    flex-shrink: 0;
    margin-bottom: 16px;
  }
  .rune-svg {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .rune-svg svg {
    height: 100%;
    width: auto;
    max-width: 100%;
    display: block;
  }
  .rune-list {
    text-align: center;
    flex-shrink: 0;
    margin-top: 16px;
  }
  .rune-list h2 {
    font-size: 16px;
    font-weight: 600;
    color: var(--t-t2);
    margin-bottom: 12px;
  }
  .rune-entry {
    font-size: 14px;
    color: var(--t-tx);
    margin-bottom: 6px;
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
  <button id="save-png" style="
    position: fixed; bottom: 16px; right: 16px;
    background: var(--t-hv); color: var(--t-tx); border: 1px solid var(--t-bd);
    padding: 8px 16px; border-radius: var(--s-radius, 14px); cursor: pointer;
    font-size: 14px; font-family: inherit; z-index: 100;
  " onmouseover="this.style.background='var(--t-cd)'" onmouseout="this.style.background='var(--t-hv)'">
    Save PNG
  </button>
  <script>
  document.getElementById('save-png').addEventListener('click', async function() {
    const btn = this;
    btn.style.display = 'none';

    const W = document.documentElement.clientWidth;
    const H = document.documentElement.clientHeight;
    const scale = 2; // retina
    const canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Draw background
    const bodyStyle = getComputedStyle(document.body);
    ctx.fillStyle = bodyStyle.backgroundColor;
    ctx.fillRect(0, 0, W, H);

    // Draw intention text
    const intentionEl = document.querySelector('.intention');
    if (intentionEl) {
      const style = getComputedStyle(intentionEl);
      const rect = intentionEl.getBoundingClientRect();
      ctx.fillStyle = style.color;
      ctx.font = style.fontStyle + ' ' + style.fontSize + ' ' + style.fontFamily;
      ctx.textAlign = 'center';

      // Wrap text matching the rendered line breaks
      const range = document.createRange();
      const lines = [];
      let lastTop = -1;
      let currentLine = '';
      for (const node of intentionEl.childNodes) {
        if (node.nodeType === 3) {
          const text = node.textContent;
          for (let i = 0; i < text.length; i++) {
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const charRect = range.getBoundingClientRect();
            if (lastTop !== -1 && charRect.top > lastTop + 2) {
              lines.push(currentLine);
              currentLine = '';
            }
            if (text[i] !== ' ' || currentLine.length > 0) {
              currentLine += text[i];
            }
            lastTop = charRect.top;
          }
        }
      }
      if (currentLine.trim()) lines.push(currentLine);

      const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4;
      const textTop = rect.top;
      const centerX = rect.left + rect.width / 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), centerX, textTop + (i + 0.85) * lineHeight);
      }
    }

    // Draw SVG as image
    const svgEl = document.querySelector('.rune-svg svg');
    if (svgEl) {
      const svgRect = svgEl.getBoundingClientRect();
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgUrl;
      });
      ctx.drawImage(img, svgRect.left, svgRect.top, svgRect.width, svgRect.height);
      URL.revokeObjectURL(svgUrl);
    }

    // Draw rune list
    const runeListEl = document.querySelector('.rune-list');
    if (runeListEl) {
      const h2 = runeListEl.querySelector('h2');
      if (h2) {
        const h2Style = getComputedStyle(h2);
        const h2Rect = h2.getBoundingClientRect();
        ctx.fillStyle = h2Style.color;
        ctx.font = h2Style.fontWeight + ' ' + h2Style.fontSize + ' ' + h2Style.fontFamily;
        ctx.textAlign = 'center';
        ctx.fillText(h2.textContent, h2Rect.left + h2Rect.width / 2, h2Rect.top + parseFloat(h2Style.fontSize) * 0.85);
      }
      const entries = runeListEl.querySelectorAll('.rune-entry');
      entries.forEach(function(entry) {
        const eStyle = getComputedStyle(entry);
        const eRect = entry.getBoundingClientRect();
        ctx.fillStyle = eStyle.color;
        ctx.font = eStyle.fontSize + ' ' + eStyle.fontFamily;
        ctx.textAlign = 'center';
        ctx.fillText(entry.textContent, eRect.left + eRect.width / 2, eRect.top + parseFloat(eStyle.fontSize) * 0.85);
      });
    }

    // Download
    canvas.toBlob(function(blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'bindrune.png';
      a.click();
      URL.revokeObjectURL(a.href);
      btn.style.display = '';
    }, 'image/png');
  });
  </script>
</body>
</html>`;

    // 11. Open in new tab
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    showToast('Opened export in new tab', 'success');
  } catch (error) {
    console.error('HTML export failed:', error);
  }
}
