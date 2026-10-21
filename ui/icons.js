const paths = {
  logo: '<path d="m3 4 9 17 9-17-9 5Z"/><path d="M3 4h18M7 11l5-3 5 3M12 9v12"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chat: '<path d="M3 4h18v13H9l-6 4Z"/><path d="M7 9h10M7 12h6"/>',
  calculator:
    '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h1m5 0h2M8 15h1m5 0h2M8 19h1m5 0h2"/>',
  orbit:
    '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-40 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(40 12 12)"/><circle cx="12" cy="12" r="2"/>',
  notes: '<path d="M5 3h14v18H5ZM8 7h8M8 11h8M8 15h5"/>',
  settings:
    '<path d="M3 7h6m6 0h6M3 17h10m6 0h2"/><circle cx="12" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  scan: '<path d="M3 8V3h5m8 0h5v5M3 16v5h5m8 0h5v-5M3 12h18M8 8h8v8H8"/>',
  shield: '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>',
  arrow: '<path d="M6 18 18 6M6 6h12v12"/>',
  right: '<path d="M3 12h18m-7-7 7 7-7 7"/>',
  attach: '<path d="m9 15 7-7a3 3 0 0 0-4-4L4 12a5 5 0 0 0 7 7l9-9M8 12l7-7"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
  speaker: '<path d="m12 4-6 5H2v6h4l6 5ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M3 17v4h18v-4"/>',
  minus: '<path d="M5 12h14"/>',
  square: '<rect x="5" y="5" width="14" height="14" rx="1"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
};
function icon(name) {
  const span = document.createElement('span');
  span.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (paths[name] || paths.logo) +
    '</svg>';
  return span;
}
document
  .querySelectorAll('[data-icon]')
  .forEach((node) => node.replaceChildren(icon(node.dataset.icon).firstChild));
