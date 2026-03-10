export function exportPNG(svgElement: SVGSVGElement): void {
  try {
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

    // 4. Set explicit width/height attributes on the clone
    let width: number;
    let height: number;

    const viewBox = clone.getAttribute('viewBox');
    if (viewBox) {
      const viewBoxParts = viewBox.split(/\s+/).map(Number);
      width = viewBoxParts[2];
      height = viewBoxParts[3];
    } else {
      const rect = svgElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
    }

    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));

    // 5. Serialize the clone to string
    const svgString = new XMLSerializer().serializeToString(clone);

    // 6. Create a Blob from the SVG string
    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8',
    });

    // 7. Create an object URL from the blob
    const svgUrl = URL.createObjectURL(svgBlob);

    // 8. Create a new Image and set src
    const image = new Image();
    image.src = svgUrl;

    image.onload = () => {
      // 9. On image load: create offscreen canvas with 2x retina resolution
      const canvasWidth = width * 2;
      const canvasHeight = height * 2;

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        URL.revokeObjectURL(svgUrl);
        return;
      }

      // Draw image to canvas
      ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

      // Convert to PNG via canvas.toBlob()
      canvas.toBlob(
        (pngBlob) => {
          if (!pngBlob) {
            console.error('Failed to create PNG blob');
            URL.revokeObjectURL(svgUrl);
            return;
          }

          // Create download link
          const pngUrl = URL.createObjectURL(pngBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = 'bindrune.png';

          // Click programmatically
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          // Clean up: revoke URLs
          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(svgUrl);
        },
        'image/png'
      );
    };

    image.onerror = () => {
      console.error('Failed to load SVG image for export');
      URL.revokeObjectURL(svgUrl);
    };
  } catch (error) {
    console.error('SVG to PNG export failed:', error);
  }
}
