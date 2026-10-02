(()=>{
  const $=(q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const click=id=>document.getElementById(id)?.click();
  const scrollTo=(el)=>el?.scrollIntoView({behavior:'smooth',block:'start'});

  const syncMetrics=()=>{
    const cards=$$('#propertyCards .property');
    const prices=cards.map(card=>{
      const text=card.querySelector('.price')?.textContent||'';
      return Number(text.replace(/[^0-9.]/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,''))||0;
    }).filter(Boolean);
    const count=$('#premiumMetricCount');
    const price=$('#premiumMetricPrice');
    if(count) count.textContent=cards.length ? cards.length.toLocaleString('es-ES') : '—';
    if(price){
      const avg=prices.length?Math.round(prices.reduce((a,b)=>a+b,0)/prices.length):0;
      price.textContent=avg?`$${avg.toLocaleString('en-US')}`:'—';
    }
  };

  const openPremiumModal=(title,kicker,body)=>{
    const modal=$('#modal'), card=$('#modalCard');
    if(!modal||!card) return;
    card.innerHTML=`<div class="premium-modal-head"><div><small>${kicker}</small><h2>${title}</h2></div><button class="premium-modal-close" type="button" data-premium-close>×</button></div>${body}`;
    modal.classList.add('show','open','visible');
    modal.setAttribute('aria-hidden','false');
    card.focus?.();
    $('[data-premium-close]',card)?.addEventListener('click',()=>{
      modal.classList.remove('show','open','visible');modal.setAttribute('aria-hidden','true');card.innerHTML='';
    });
  };

  const marketSummary=()=>{
    const cardCount=$$('#propertyCards .property').length;
    const result=$('#resultCount')?.textContent?.trim()||`${cardCount} oportunidades visibles`;
    return {cardCount,result};
  };

  const assistant=()=>{
    openPremiumModal('Asistente IA','PROFOLIO INTELLIGENCE',`<p class="muted">Usa el contexto visible del Market Map para acelerar tu análisis comercial.</p><div class="premium-assistant-buttons"><button data-ai="zone">¿Qué zona debo revisar primero?</button><button data-ai="compare">¿Cómo comparo oportunidades?</button><button data-ai="tour">¿Cómo armo una ruta eficiente?</button><button data-ai="off">¿Cómo detecto oportunidades Off-Market?</button></div><div class="premium-answer" id="premiumAnswer">Selecciona una pregunta para obtener una recomendación contextual.</div>`);
    $$('.premium-assistant-buttons button',$('#modalCard')).forEach(btn=>btn.addEventListener('click',()=>{
      const answer=$('#premiumAnswer'); const summary=marketSummary();
      const replies={
        zone:`Empieza por el sector que combine inventario visible con cercanía a tus propiedades seleccionadas. Ahora mismo el mapa muestra ${summary.result}. Usa las delimitaciones y luego activa Turbo para priorizar intervención comercial.`,
        compare:`Abre dos o más propiedades y compara precio, sector y atributos. Añádelas al Open Tour para evaluar también la eficiencia territorial del recorrido, no solo el precio de lista.`,
        tour:`Selecciona las propiedades que quieras visitar y pulsa Open Tour. Ordena la ruta y guarda el recorrido. ProFolio mantiene la selección para que puedas iterar sin perder contexto.`,
        off:`Revisa zonas con baja oferta visible y alto interés, y usa “Publicar Propiedad” para registrar FSBO u oportunidades detectadas localmente. Luego puedes marcarlas y sumarlas a Turbo.`
      };
      if(answer) answer.textContent=replies[btn.dataset.ai]||'';
    }));
  };

  const analysis=()=>{
    const selected=$('#areaPanelName')?.textContent?.trim()||$('#sectorSelect')?.selectedOptions?.[0]?.textContent||'Toda la región';
    const summary=marketSummary();
    openPremiumModal('Análisis de Zona','MARKET INTELLIGENCE',`<p class="muted">Lectura rápida del mercado activo en <strong>${selected}</strong>.</p><div class="premium-grid"><div class="premium-kpi"><strong>${summary.cardCount}</strong><small>Propiedades visibles</small></div><div class="premium-kpi"><strong>8.7%</strong><small>Rendimiento de referencia</small></div><div class="premium-kpi"><strong>28 días</strong><small>Tiempo de mercado objetivo</small></div><div class="premium-kpi"><strong>Turbo</strong><small>Disponible para priorización</small></div></div><p class="premium-answer">Combina las delimitaciones del Market Map con Open Tour y Portafolio Turbo para pasar del análisis territorial a una acción comercial concreta.</p>`);
  };

  const reports=()=>{
    const summary=marketSummary();
    openPremiumModal('Resumen Ejecutivo','REPORTES PROFOLIO',`<div class="premium-grid"><div class="premium-kpi"><strong>${summary.cardCount}</strong><small>Inventario en vista</small></div><div class="premium-kpi"><strong>${$('#tourStops')?.textContent||'0'}</strong><small>Paradas en Open Tour</small></div><div class="premium-kpi"><strong>${$('#tourKm')?.textContent||'0 km'}</strong><small>Distancia estimada</small></div><div class="premium-kpi"><strong>${$('#tourTime')?.textContent||'0 min'}</strong><small>Tiempo estimado</small></div></div><p class="premium-answer">Este resumen refleja el estado actual de tu espacio de trabajo y se actualiza conforme filtras el mapa y construyes recorridos.</p>`);
  };

  const actionMap={
    map:()=>{ click('mapViewBtn'); scrollTo($('#market-section')); },
    properties:()=>{ click('listViewBtn'); scrollTo($('#properties-section')); },
    tour:()=>click('navTour'),
    videos:()=>click('navVideos'),
    offmarket:()=>click('publishBtn'),
    assistant,
    analysis,
    favorites:()=>click('favoritesBtn'),
    reports,
    pro:()=>openPremiumModal('ProFolio Pro','PLAN PROFESIONAL',`<p class="premium-answer">El espacio Pro centraliza Market Map, Open Tour, video por sector, Off-Market, análisis y Portafolio Turbo. La activación comercial puede conectarse a facturación cuando definamos el plan final.</p>`)
  };

  $$('[data-premium-action]').forEach(btn=>btn.addEventListener('click',e=>{
    const fn=actionMap[e.currentTarget.dataset.premiumAction]; if(fn) fn();
  }));

  const target=$('#propertyCards');
  if(target){ new MutationObserver(syncMetrics).observe(target,{childList:true,subtree:true,characterData:true}); }
  setTimeout(syncMetrics,100);
  setTimeout(syncMetrics,900);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && $('#modal')?.getAttribute('aria-hidden')==='false'){
      const c=$('[data-premium-close]'); if(c) c.click();
    }
  });
})();


/* PF_SETTINGS_RUNTIME_START */
(()=>{
  const LANG_KEY='pf_language';
  const THEME_KEY='pf_theme';
  let lang=localStorage.getItem(LANG_KEY)||'es';
  let theme=localStorage.getItem(THEME_KEY)||'light';
  let translating=false;

  const addStyles=()=>{
    if(document.getElementById('pfSettingsStyles')) return;
    const style=document.createElement('style');
    style.id='pfSettingsStyles';
    style.textContent=\`
      .pf-settings-nav{margin-top:6px}.profile-chip{cursor:pointer}
      .pf-settings-backdrop{position:fixed;inset:0;z-index:99990;background:rgba(7,10,16,.55);backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;padding:18px}
      .pf-settings-backdrop.open{display:flex}.pf-settings-card{width:min(560px,100%);border-radius:24px;background:#fff;color:#17202d;box-shadow:0 24px 80px rgba(0,0,0,.28);overflow:hidden;border:1px solid rgba(17,25,37,.08)}
      .pf-settings-head{display:flex;align-items:flex-start;justify-content:space-between;padding:24px 24px 18px;border-bottom:1px solid rgba(17,25,37,.08)}
      .pf-settings-head small{display:block;color:#8a6a2c;font-weight:800;letter-spacing:.12em;font-size:11px;margin-bottom:5px}.pf-settings-head h2{margin:0;font-size:26px;line-height:1.1}
      .pf-settings-close{border:0;background:#f1f3f6;color:#17202d;width:38px;height:38px;border-radius:12px;font-size:24px;cursor:pointer}
      .pf-settings-body{padding:20px 24px 24px;display:grid;gap:14px}.pf-setting-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px;border:1px solid rgba(17,25,37,.09);border-radius:18px;background:#fafbfc}
      .pf-setting-copy strong{display:block;font-size:15px}.pf-setting-copy small{display:block;margin-top:4px;color:#6d7682;line-height:1.35}.pf-setting-control{display:flex;gap:6px;background:#eef1f5;padding:4px;border-radius:12px;flex:0 0 auto}
      .pf-setting-control button{border:0;background:transparent;color:#5e6875;padding:9px 12px;border-radius:9px;font-weight:800;cursor:pointer}.pf-setting-control button.active{background:#71152f;color:#fff;box-shadow:0 3px 12px rgba(113,21,47,.22)}
      .pf-settings-note{font-size:12px;color:#7c8590;text-align:center;margin:2px 0 0}
      body.pf-dark{background:#080c12;color:#e7edf5}body.pf-dark #app,body.pf-dark .main-workspace{background:#0b1119!important;color:#e7edf5!important}
      body.pf-dark .sidebar{background:#0b1018!important;border-color:#202b38!important}body.pf-dark .global-topbar{background:rgba(11,17,25,.94)!important;border-color:#202b38!important}
      body.pf-dark .premium-hero{background-color:#101722!important;color:#f3f6fa!important}body.pf-dark .premium-hero p,body.pf-dark .premium-hero small,body.pf-dark .hero-action small{color:#adb8c6!important}
      body.pf-dark .hero-action,body.pf-dark .map-card,body.pf-dark .panel,body.pf-dark .feature-card,body.pf-dark .metric-strip article,body.pf-dark .offmarket-banner,body.pf-dark .quote-card,body.pf-dark .map-toolbar,body.pf-dark .area-panel,body.pf-dark .tour-panel,body.pf-dark .profile-chip,body.pf-dark .workspace-badge{background:#111a25!important;color:#e7edf5!important;border-color:#253243!important;box-shadow:none!important}
      body.pf-dark .nav-item{color:#b9c4d2!important}body.pf-dark .nav-item:hover,body.pf-dark .nav-item.active{background:#172230!important;color:#fff!important}
      body.pf-dark .global-search,body.pf-dark input,body.pf-dark select{background:#0f1721!important;color:#e7edf5!important;border-color:#2a3748!important}body.pf-dark input::placeholder{color:#778596!important}
      body.pf-dark .top-links button,body.pf-dark button.thin,body.pf-dark .view-switch button,body.pf-dark .mini-action,body.pf-dark .coverage-action{color:#c8d2df!important}
      body.pf-dark .muted,body.pf-dark small,body.pf-dark .legal-note,body.pf-dark .results-summary{color:#96a4b5!important}body.pf-dark .map-wrap{background:#0d141d!important}
      body.pf-dark .leaflet-tile-pane{filter:brightness(.62) saturate(.72) contrast(1.05)}body.pf-dark .leaflet-control-zoom a,body.pf-dark .leaflet-control-attribution{background:#101923!important;color:#d8e1ec!important;border-color:#263444!important}
      body.pf-dark .modal-card,body.pf-dark .pf-settings-card{background:#111a25!important;color:#e7edf5!important;border-color:#293649!important}body.pf-dark .pf-settings-head{border-color:#293649}
      body.pf-dark .pf-settings-close{background:#1b2634;color:#e7edf5}body.pf-dark .pf-setting-row{background:#0d151f;border-color:#293649}body.pf-dark .pf-setting-copy small,body.pf-dark .pf-settings-note{color:#96a4b5}
      body.pf-dark .pf-setting-control{background:#1a2532}body.pf-dark .pf-setting-control button{color:#aeb9c7}body.pf-dark .pf-setting-control button.active{color:#fff}
      @media(max-width:760px){.pf-settings-card{border-radius:20px}.pf-settings-head{padding:20px 18px 15px}.pf-settings-body{padding:16px 18px 20px}.pf-setting-row{align-items:flex-start;flex-direction:column}.pf-setting-control{width:100%}.pf-setting-control button{flex:1}}
    \`;
    document.head.appendChild(style);
  };

  const dictionary={
    'Inicio':'Home','Mapa de Mercado':'Market Map','Propiedades':'Properties','Asistente IA':'AI Assistant','Análisis de Zona':'Area Analysis',
    'Mis Favoritos':'My Favorites','Reportes':'Reports','Portafolio Turbo':'Turbo Portfolio','Guía de ProFolio':'ProFolio Guide','Configuración':'Settings',
    'Acceso completo.':'Full access.','Más oportunidades.':'More opportunities.','Mejores decisiones.':'Better decisions.','Actualizar Plan':'Upgrade Plan',
    'Mercado inicial · Estados Unidos':'Initial market · United States','Explorar':'Explore','Mis Propiedades':'My Properties','Analítica':'Analytics','Herramientas':'Tools','Recursos':'Resources',
    'INVIERTE HOY, CONSTRUYE MAÑANA':'INVEST TODAY, BUILD TOMORROW','Más que propiedades,':'More than properties,','creamos libertad.':'we create freedom.',
    'Datos. Oportunidades. Personas. Un mejor futuro.':'Data. Opportunities. People. A better future.','BUENAS PROPIEDADES.':'GREAT PROPERTIES.','MEJORES HISTORIAS.':'BETTER STORIES.',
    'Explora oportunidades':'Explore opportunities','Agenda y recorre':'Plan and tour','Análisis instantáneo':'Instant analysis','Publicar Propiedad':'List Property','Llega a más inversionistas':'Reach more investors',
    'Sector':'Area','Toda la región':'Entire region','↺ Región':'↺ Region','Mapa':'Map','Lista':'List','Mapa base temporalmente no disponible':'Base map temporarily unavailable',
    'Las delimitaciones verificadas, propiedades y Open Tour siguen operativos.':'Verified boundaries, properties, and Open Tour remain available.','Wilmington & costa de Carolina del Norte':'Wilmington & North Carolina coast',
    '⌖ Ver Wilmington':'⌖ View Wilmington','⌖ Mi ubicación':'⌖ My location','VIDEO TOUR · MÁX. 60 S':'VIDEO TOUR · MAX. 60 S','SECTOR · MARKET MAP':'AREA · MARKET MAP',
    'Video pendiente para esta área':'Video pending for this area','Contenido propio del sector':'Area-specific content','Gestionar video':'Manage video','Explorar propiedades':'Explore properties',
    '↝ Iniciar Open Tour':'↝ Start Open Tour','＋ Añadir video':'＋ Add video','Volver a región':'Back to region','Capas del mapa':'Map layers','Leer el mapa':'Read the map',
    'Toca una propiedad para verla o añadirla a tu Open Tour.':'Tap a property to view it or add it to your Open Tour.','Inventario residencial.':'Residential inventory.','Posicionamiento alto.':'Premium positioning.',
    'Oportunidad':'Opportunity','Ventaja o atributo especial.':'Special advantage or attribute.','Intervención comercial prioritaria.':'Priority commercial action.','FSBO o inventario detectado localmente.':'FSBO or locally detected inventory.',
    'Cobertura PROFOLIO':'PROFOLIO coverage','límites municipales/CDP reales':'real municipal/CDP boundaries','sector referencial sin frontera legal':'reference area without legal boundary','Gestionar videos de 60 s':'Manage 60 s videos',
    'Propiedades activas':'Active properties','Precio medio':'Average price','Rendimiento promedio':'Average yield','Tiempo en el mercado':'Time on market','vs. mes anterior':'vs. previous month',
    'Recorre propiedades desde cualquier lugar.':'Tour properties from anywhere.','Explorar Tours →':'Explore Tours →','Tu analista de inversión, 24/7.':'Your investment analyst, 24/7.',
    '¿Cuál es la mejor zona para invertir?':'What is the best area to invest in?','Compara propiedades similares':'Compare similar properties','Estima el retorno potencial':'Estimate potential return','Hablar con IA →':'Talk to AI →',
    'Propiedades exclusivas. Acceso limitado.':'Exclusive properties. Limited access.','Ver oportunidades →':'View opportunities →','La mejor inversión':'The best investment','también es una mejor vida.':'is also a better life.',
    'Propiedades Destacadas':'Featured Properties','Oportunidades seleccionadas para tu mercado':'Selected opportunities for your market','♡ Ver todas':'♡ View all',
    'Selecciona dos o más propiedades para construir un recorrido.':'Select two or more properties to build a route.','Guardados':'Saved','Paradas':'Stops','Distancia est.':'Est. distance','Tiempo aprox.':'Approx. time',
    'Agregar dirección manual':'Add address manually','Ordenar ruta':'Optimize route','Guardar Open Tour':'Save Open Tour','Limpiar':'Clear','Compartir':'Share',
    'Oportunidades Off-Market':'Off-Market Opportunities','Accede a propiedades exclusivas antes que todos.':'Access exclusive properties before everyone else.','Explorar ahora →':'Explore now →',
    'Crea tu recorrido':'Build your route','Ver Open Tour':'View Open Tour','Recorridos guardados':'Saved tours'
  };
  const reverse=Object.fromEntries(Object.entries(dictionary).map(([a,b])=>[b,a]));

  const renderLabels=()=>{
    const en=lang==='en', set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val};
    set('pfSettingsKicker',en?'PREFERENCES':'PREFERENCIAS');set('pfSettingsTitle',en?'ProFolio Settings':'Configuración de ProFolio');
    set('pfLangTitle',en?'Language':'Idioma');set('pfLangDesc',en?'Change the main interface language.':'Cambia el idioma principal de la interfaz.');
    set('pfThemeTitle',en?'Appearance':'Apariencia');set('pfThemeDesc',en?'Choose light or dark mode.':'Elige modo claro u oscuro.');
    set('pfEsBtn',en?'Spanish':'Español');set('pfEnBtn',en?'English':'Inglés');set('pfLightBtn',en?'Light':'Claro');set('pfDarkBtn',en?'Dark':'Oscuro');
    set('pfSettingsNote',en?'Your preferences are saved on this device.':'Tus preferencias se guardan en este dispositivo.');
    document.getElementById('pfEsBtn')?.classList.toggle('active',lang==='es');document.getElementById('pfEnBtn')?.classList.toggle('active',lang==='en');
    document.getElementById('pfLightBtn')?.classList.toggle('active',theme==='light');document.getElementById('pfDarkBtn')?.classList.toggle('active',theme==='dark');
    const label=document.querySelector('#pfSettingsBtn .pf-settings-label');if(label)label.textContent=en?'Settings':'Configuración';
  };

  const translateTree=(root=document)=>{
    if(translating)return;translating=true;
    const map=lang==='en'?dictionary:reverse;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){const p=n.parentElement;if(!p||['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(p.tagName))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT}});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{const raw=n.nodeValue,t=raw.trim();if(t&&map[t])n.nodeValue=raw.replace(t,map[t])});
    document.documentElement.lang=lang;
    const search=document.getElementById('search');if(search)search.placeholder=lang==='en'?'Search areas, addresses, properties or opportunities...':'Buscar zonas, direcciones, propiedades u oportunidades...';
    const manual=document.getElementById('manualAddress');if(manual)manual.placeholder=lang==='en'?'Add address manually':'Agregar dirección manual';
    renderLabels();translating=false;
  };

  const applyTheme=()=>{
    document.body.classList.toggle('pf-dark',theme==='dark');
    document.documentElement.style.colorScheme=theme==='dark'?'dark':'light';
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=theme==='dark'?'#0b1119':'#111925';
    renderLabels();
  };
  const setLanguage=v=>{lang=v;localStorage.setItem(LANG_KEY,v);translateTree(document)};
  const setTheme=v=>{theme=v;localStorage.setItem(THEME_KEY,v);applyTheme()};

  const closeSettings=()=>{document.getElementById('pfSettingsBackdrop')?.classList.remove('open');document.body.style.overflow=''};
  const openSettings=()=>{
    let back=document.getElementById('pfSettingsBackdrop');
    if(!back){
      back=document.createElement('div');back.id='pfSettingsBackdrop';back.className='pf-settings-backdrop';
      back.innerHTML='<section class="pf-settings-card" role="dialog" aria-modal="true" aria-labelledby="pfSettingsTitle"><header class="pf-settings-head"><div><small id="pfSettingsKicker"></small><h2 id="pfSettingsTitle"></h2></div><button class="pf-settings-close" id="pfSettingsClose" type="button" aria-label="Cerrar">×</button></header><div class="pf-settings-body"><div class="pf-setting-row"><div class="pf-setting-copy"><strong id="pfLangTitle"></strong><small id="pfLangDesc"></small></div><div class="pf-setting-control"><button id="pfEsBtn" type="button"></button><button id="pfEnBtn" type="button"></button></div></div><div class="pf-setting-row"><div class="pf-setting-copy"><strong id="pfThemeTitle"></strong><small id="pfThemeDesc"></small></div><div class="pf-setting-control"><button id="pfLightBtn" type="button"></button><button id="pfDarkBtn" type="button"></button></div></div><p class="pf-settings-note" id="pfSettingsNote"></p></div></section>';
      document.body.appendChild(back);
      back.addEventListener('click',e=>{if(e.target===back)closeSettings()});
      document.getElementById('pfSettingsClose').onclick=closeSettings;
      document.getElementById('pfEsBtn').onclick=()=>setLanguage('es');document.getElementById('pfEnBtn').onclick=()=>setLanguage('en');
      document.getElementById('pfLightBtn').onclick=()=>setTheme('light');document.getElementById('pfDarkBtn').onclick=()=>setTheme('dark');
    }
    renderLabels();applyTheme();back.classList.add('open');document.body.style.overflow='hidden';
  };

  const installEntry=()=>{
    if(!document.getElementById('pfSettingsBtn')){
      const nav=document.querySelector('.premium-nav');
      if(nav){const b=document.createElement('button');b.className='nav-item pf-settings-nav';b.id='pfSettingsBtn';b.type='button';b.innerHTML='<span class="nav-glyph">⚙</span><span class="pf-settings-label">Configuración</span>';b.addEventListener('click',openSettings);nav.appendChild(b)}
    }
    const profile=document.querySelector('.profile-chip');
    if(profile&&!profile.dataset.pfSettingsBound){profile.dataset.pfSettingsBound='1';profile.setAttribute('role','button');profile.setAttribute('tabindex','0');profile.addEventListener('click',openSettings);profile.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openSettings()}})}
  };

  addStyles();installEntry();applyTheme();translateTree(document);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('pfSettingsBackdrop')?.classList.contains('open'))closeSettings()});
  const observer=new MutationObserver(ms=>{if(translating)return;for(const m of ms){for(const n of m.addedNodes){if(n.nodeType===1||n.nodeType===3)translateTree(n.nodeType===1?n:(n.parentElement||document))}}});
  observer.observe(document.body,{childList:true,subtree:true});
})();
/* PF_SETTINGS_RUNTIME_END */
