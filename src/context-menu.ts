import { duplicateLayer, removeLayer, centerLayer, bringToFront, sendToBack } from './state';
import { showToast } from './toast';

let activeMenu: HTMLElement | null = null;

function closeMenu(): void {
  if (activeMenu) {
    activeMenu.remove();
    activeMenu = null;
  }
}

export function showContextMenu(x: number, y: number, layerId: string): void {
  closeMenu();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  const items: { label: string; shortcut?: string; danger?: boolean; action: () => void }[] = [
    { label: 'Duplicate', shortcut: 'Ctrl+D', action: () => duplicateLayer(layerId) },
    { label: 'Center', shortcut: 'Shift+C', action: () => centerLayer(layerId) },
    { label: 'Bring to Front', action: () => bringToFront(layerId) },
    { label: 'Send to Back', action: () => sendToBack(layerId) },
    { label: '---', action: () => {} },
    { label: 'Delete', shortcut: 'Del', danger: true, action: () => { removeLayer(layerId); showToast('Layer deleted'); } },
  ];

  for (const item of items) {
    if (item.label === '---') {
      const sep = document.createElement('div');
      sep.className = 'context-menu-separator';
      menu.appendChild(sep);
      continue;
    }

    const el = document.createElement('div');
    el.className = 'context-menu-item' + (item.danger ? ' danger' : '');

    const label = document.createElement('span');
    label.textContent = item.label;
    el.appendChild(label);

    if (item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'shortcut';
      shortcut.textContent = item.shortcut;
      el.appendChild(shortcut);
    }

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      item.action();
      closeMenu();
    });

    menu.appendChild(el);
  }

  document.body.appendChild(menu);
  activeMenu = menu;

  // Ensure menu stays within viewport
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = `${x - rect.width}px`;
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${y - rect.height}px`;
  }

  // Close on next click anywhere
  setTimeout(() => {
    document.addEventListener('click', closeMenu, { once: true });
    document.addEventListener('contextmenu', closeMenu, { once: true });
  }, 0);
}
