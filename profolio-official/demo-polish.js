(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const en = () => document.documentElement.lang === 'en';
  let previousFocus = null, wasModalOpen = false;
  const pairs = {
    'Todas': 'All',
    'Oportunidad': 'Opportunity',
    'FICHA': 'PROPERTY',
    'Ver en mapa': 'View on map',
    '♡ Guardar': '♡ Save',
    '♥ Guardada': '♥ Saved',
    '✓ En recorrido': '✓ In tour',
    'Tu recorrido aparecerá aquí.': 'Your tour will appear here.',
    'Límite municipal oficial · U.S. Census TIGERweb 2026.': 'Official city boundary · U.S. Census TIGERweb 2026.',
    'Límite censal oficial (CDP) · U.S. Census TIGERweb 2026.': 'Official census boundary (CDP) · U.S. Census TIGERweb 2026.',
    'Sector comercial de referencia · sin polígono inventado.': 'Reference area · no invented boundary.',
    '¿Qué zona debo revisar primero?': 'Which area should I review first?',
    '¿Cómo comparo oportunidades?': 'How do I compare properties?',
    '¿Cómo armo una ruta eficiente?': 'How do I plan a tour?',
    '¿Cómo detecto oportunidades Off-Market?': 'What is planned for Off-Market?',
    'Selecciona una pregunta para ver una respuesta preparada.': 'Choose a question to see a prepared answer.',
    'Análisis de Zona': 'Area overview',
    'Lectura rápida del mercado activo en': 'Sample inventory shown for',
    'Propiedades visibles': 'Sample properties',
    'Sin rendimiento verificado': 'No verified yield',
    'Sin tiempo verificado': 'No verified time',
    'Disponible para priorización': 'Planned feature',
    'Resumen Ejecutivo': 'Demo summary',
    'Inventario en vista': 'Sample inventory shown',
    'Paradas en Open Tour': 'Open Tour stops',
    'Distancia estimada': 'Straight-line distance',
    'Tiempo estimado': 'Approximate time',
    'Este resumen refleja el estado actual de tu espacio de trabajo y se actualiza conforme filtras el mapa y construyes recorridos.': 'This summary reflects the sample homes and tour in this browser.',
    'Combina las delimitaciones del Market Map con Open Tour y Portafolio Turbo para pasar del análisis territorial a una acción comercial concreta.': 'Use the map and Open Tour to explore this sample inventory.',
    'El espacio Pro centraliza Market Map, Open Tour, video por sector, Off-Market, análisis y Portafolio Turbo. La activación comercial puede conectarse a facturación cuando definamos el plan final.': 'ProFolio Pro and billing are planned. No subscription or payment is available in this demo.',
    'Portafolio de prueba': 'Demo portfolio',
    'Borrador de propiedad': 'Property listing draft',
    'Mi cuenta': 'My account',
    'Métricas del mercado': 'Demo market metrics',
    'Distancia y duración son estimaciones geométricas para planificación. La navegación final debe abrirse en un proveedor de mapas.': 'Distances and times are straight-line estimates. Use a map provider for road navigation.',
    'PROFOLIO · RECORRIDOS': 'PROFOLIO · TOURS',
    'Open Tours guardados': 'Saved Open Tours',
    'Todavía no hay recorridos guardados.': 'No tours saved yet.',
    'Abrir': 'Open',
    'Eliminar': 'Delete'
  };
  const reverse = Object.fromEntries(Object.entries(pairs).map(([es, english]) => [english, es]));
  const labels = {
    'Buscar propiedad, zona o ZIP': 'Search property, area or ZIP',
    'Filtrar por sector': 'Filter by area',
    'Mostrar toda la región': 'Show entire region',
    'Agregar dirección manual': 'Add address manually',
    'Añadir parada': 'Add stop',
    'Cerrar Open Tour': 'Close Open Tour',
    'Cerrar sector': 'Close area panel',
    'Abrir perfil': 'Open profile',
    'Navegación principal': 'Main navigation',
    'Navegación secundaria': 'Secondary navigation',
    'Métricas del mercado': 'Demo market metrics'
  };
  const reverseLabels = Object.fromEntries(Object.entries(labels).map(([es, english]) => [english, es]));
  const translate = () => {
    const map = en() ? pairs : reverse;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement && !['SCRIPT', 'STYLE', 'TEXTAREA'].includes(node.parentElement.tagName)
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const value = node.nodeValue, trimmed = value.trim();
      if (map[trimmed]) node.nodeValue = value.replace(trimmed, map[trimmed]);
      else if (en() && /^\d+ seleccionadas$/.test(trimmed)) node.nodeValue = value.replace('seleccionadas', 'selected');
      else if (!en() && /^\d+ selected$/.test(trimmed)) node.nodeValue = value.replace('selected', 'seleccionadas');
      else if (en() && /^\d+ propiedades$/.test(trimmed)) node.nodeValue = value.replace('propiedades', 'sample properties');
      else if (!en() && /^\d+ sample properties$/.test(trimmed)) node.nodeValue = value.replace('sample properties', 'propiedades');
    }
    const labelMap = en() ? labels : reverseLabels;
    document.querySelectorAll('[aria-label]').forEach(element => {
      const current = element.getAttribute('aria-label');
      if (labelMap[current]) element.setAttribute('aria-label', labelMap[current]);
    });
    const dialog = $('#modalCard');
    const modalOpen = $('#modal')?.getAttribute('aria-hidden') === 'false';
    if (dialog && modalOpen) {
      dialog.setAttribute('aria-label', dialog.querySelector('h2')?.textContent || 'ProFolio');
      if (!wasModalOpen && !dialog.contains(document.activeElement)) dialog.focus();
    } else if (wasModalOpen && previousFocus?.isConnected) {
      previousFocus.focus();
    }
    wasModalOpen = modalOpen;
    const empty = $('#propertyCards');
    if (empty && !empty.children.length) {
      const p = document.createElement('p');
      p.className = 'pf-empty-results';
      p.textContent = en() ? 'No sample homes match this area and budget. Adjust the filters.' : 'No hay viviendas de ejemplo para esta zona y presupuesto. Ajusta los filtros.';
      empty.appendChild(p);
    } else if (empty?.querySelector('.pf-empty-results')) {
      const message = en() ? 'No sample homes match this area and budget. Adjust the filters.' : 'No hay viviendas de ejemplo para esta zona y presupuesto. Ajusta los filtros.';
      const result = empty.querySelector('.pf-empty-results');
      if (result.textContent !== message) result.textContent = message;
    }
    const profile = $('#amenProfileOverlay .amen-profile-body');
    if (profile && !profile.querySelector('.pf-local-note')) {
      const note = document.createElement('p');
      note.className = 'pf-local-note';
      note.textContent = en() ? 'Demo profile. Saved only in this browser; this does not create an online account.' : 'Perfil de demostración. Se guarda solo en este navegador; no crea una cuenta en línea.';
      profile.appendChild(note);
    } else if (profile?.querySelector('.pf-local-note')) {
      const message = en() ? 'Demo profile. Saved only in this browser; this does not create an online account.' : 'Perfil de demostración. Se guarda solo en este navegador; no crea una cuenta en línea.';
      const note = profile.querySelector('.pf-local-note');
      if (note.textContent !== message) note.textContent = message;
    }
  };
  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => { pending = false; translate(); });
  };
  new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, characterData: true });
  document.addEventListener('pf:language-changed', schedule);
  $('#navExplore')?.addEventListener('click', () => {
    if (!$('#tourPanel')?.hidden) $('#closeTourBtn')?.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.premium-nav .nav-item').forEach(button => button.classList.toggle('active', button.id === 'navExplore'));
  });
  document.addEventListener('click', event => {
    if ($('#modal')?.getAttribute('aria-hidden') !== 'false') {
      previousFocus = event.target.closest('button,[role="button"],a') || document.activeElement;
    }
  }, true);
  document.addEventListener('click', event => {
    if (event.target === $('#modal') && $('#modal')?.getAttribute('aria-hidden') === 'false') {
      $('#modal').classList.remove('show', 'open', 'visible');
      $('#modal').setAttribute('aria-hidden', 'true');
      $('#modalCard').replaceChildren();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('#modal')?.getAttribute('aria-hidden') === 'false') {
      $('#modalCard .premium-modal-close')?.click();
      return;
    }
    if (event.key !== 'Tab' || $('#modal')?.getAttribute('aria-hidden') !== 'false') return;
    const items = [...$('#modalCard').querySelectorAll('button,input,select,a[href],[tabindex="0"]')]
      .filter(item => !item.disabled && item.getClientRects().length);
    if (!items.length) return;
    if (event.shiftKey && document.activeElement === items[0]) {
      event.preventDefault(); items.at(-1).focus();
    } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
      event.preventDefault(); items[0].focus();
    }
  });
  const style = document.createElement('style');
  style.textContent = '.pf-empty-results{padding:22px;color:#5d4650;font-size:13px;line-height:1.5}.pf-local-note{padding:10px;border-radius:10px;background:#fff5db;color:#6c4b1f;font-size:12px;line-height:1.4}';
  document.head.appendChild(style);
  schedule();
})();
