(()=>{
  'use strict';
  const $=(q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const mobile=()=>window.matchMedia('(max-width: 900px)').matches;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let mapInteractive=false;

  const toast=(msg)=>{
    const el=$('#toast');
    if(!el) return;
    el.textContent=msg;
    el.classList.add('show','visible');
    clearTimeout(el.__pfV3Timer);
    el.__pfV3Timer=setTimeout(()=>el.classList.remove('show','visible'),2200);
  };

  const openModal=(title,kicker,html)=>{
    const modal=$('#modal'),card=$('#modalCard');
    if(!modal||!card) return;
    card.innerHTML=`<div class="premium-modal-head"><div><small>${esc(kicker)}</small><h2>${esc(title)}</h2></div><button class="premium-modal-close" type="button" data-pfv3-close>×</button></div>${html}`;
    modal.classList.add('show','open','visible');
    modal.setAttribute('aria-hidden','false');
    $('[data-pfv3-close]',card)?.addEventListener('click',closeModal,{once:true});
    card.focus?.();
  };
  const closeModal=()=>{
    const modal=$('#modal'),card=$('#modalCard');
    modal?.classList.remove('show','open','visible');
    modal?.setAttribute('aria-hidden','true');
    if(card) card.innerHTML='';
  };
  const smooth=(el)=>el?.scrollIntoView({behavior:'smooth',block:'start'});

  function setMapMode(active,announce=true){
    const mapEl=$('#market-map'),wrap=mapEl?.closest('.map-wrap'),btn=$('.pf-map-mode',wrap||document);
    const map=window.__pfMap;
    if(!mapEl||!wrap) return;
    mapInteractive=!!active;
    wrap.classList.toggle('pf-map-active',mapInteractive);
    mapEl.classList.toggle('pf-map-active',mapInteractive);
    mapEl.style.touchAction=mapInteractive?'none':'pan-y';
    wrap.style.touchAction=mapInteractive?'none':'pan-y';
    try{
      if(mapInteractive){
        map?.dragging?.enable(); map?.touchZoom?.enable(); map?.doubleClickZoom?.enable(); map?.scrollWheelZoom?.disable();
      }else{
        map?.dragging?.disable(); map?.touchZoom?.disable(); map?.doubleClickZoom?.disable(); map?.scrollWheelZoom?.disable(); map?.boxZoom?.disable(); map?.keyboard?.disable();
      }
    }catch(e){ console.warn('[ProFolio mobile] map mode',e); }
    if(btn){
      btn.classList.toggle('is-active',mapInteractive);
      btn.textContent=mapInteractive?'Seguir bajando':'Mover mapa';
      btn.setAttribute('aria-pressed',String(mapInteractive));
    }
    if(announce) toast(mapInteractive?'Mapa desbloqueado. Toca “Seguir bajando” para volver al scroll.':'Scroll de página activado.');
  }

  function installMapGate(){
    const mapEl=$('#market-map'),wrap=mapEl?.closest('.map-wrap');
    if(!mapEl||!wrap||wrap.dataset.pfV3Gate) return;
    wrap.dataset.pfV3Gate='1';
    const btn=document.createElement('button');
    btn.type='button'; btn.className='pf-map-mode'; btn.textContent='Mover mapa'; btn.setAttribute('aria-pressed','false');
    const hint=document.createElement('div');
    hint.className='pf-map-hint'; hint.textContent='Desliza para seguir bajando · toca “Mover mapa” para explorar';
    wrap.append(btn,hint);
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setMapMode(!mapInteractive);});
    btn.addEventListener('pointerdown',e=>e.stopPropagation());
    setTimeout(()=>setMapMode(false,false),250);
    setTimeout(()=>setMapMode(false,false),1100);
  }

  function openTurbo(){
    const cards=$$('#propertyCards .property');
    const top=cards.slice(0,4).map((card,i)=>{
      const title=card.querySelector('h3')?.textContent?.trim()||`Oportunidad ${i+1}`;
      const price=card.querySelector('.price')?.textContent?.trim()||'Precio por revisar';
      const area=card.querySelector('.muted')?.textContent?.trim()||'Wilmington';
      const score=Math.max(74,96-i*7);
      return `<button type="button" class="premium-kpi pf-turbo-row" data-pf-turbo-index="${i}" style="text-align:left;border:0;cursor:pointer"><strong>${score}/100</strong><small>${esc(title)}<br>${esc(price)} · ${esc(area)}</small></button>`;
    }).join('');
    openModal('Turbo','OPORTUNIDADES PRIORITARIAS',`
      <p class="muted">Te muestra primero qué revisar. No necesitas entender todo el mapa para empezar.</p>
      <div class="premium-grid">${top||'<div class="premium-answer">El inventario todavía está cargando. Puedes abrir el mapa y volver a Turbo en unos segundos.</div>'}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
        <button class="primary" type="button" data-pf-turbo-map>Ver en mapa</button>
        <button type="button" data-pf-turbo-props>Ver propiedades</button>
      </div>`);
    $('[data-pf-turbo-map]')?.addEventListener('click',()=>{closeModal();route('map');});
    $('[data-pf-turbo-props]')?.addEventListener('click',()=>{closeModal();route('properties');});
    $$('.pf-turbo-row',$('#modalCard')).forEach((row,i)=>row.addEventListener('click',()=>{
      closeModal();
      const card=cards[i]; smooth(card||$('#properties-section'));
      setTimeout(()=>card?.querySelector('button')?.focus?.(),450);
    }));
  }

  function route(name){
    switch(name){
      case 'home': window.scrollTo({top:0,behavior:'smooth'}); break;
      case 'map':
        setMapMode(false,false); smooth($('#market-section')); break;
      case 'properties':
        smooth($('#properties-section')); break;
      case 'turbo': openTurbo(); break;
      case 'tour':
        $('#navTour')?.click();
        setTimeout(()=>smooth($('#tourPanel')?.hidden?$('#properties-section'):$('#tourPanel')),120);
        break;
      case 'offmarket': $('#publishBtn')?.click(); break;
      case 'videos': $('#areaVideoManagerBtn')?.click(); break;
      case 'assistant': $('[data-premium-action="assistant"]')?.click(); break;
      case 'analysis': $('[data-premium-action="analysis"]')?.click(); break;
      case 'favorites': $('#favoritesBtn')?.click(); break;
    }
  }

  function simplifyHero(){
    const eyebrow=$('.hero-copy>small'),title=$('.hero-copy h1'),sub=$('.hero-copy p'),search=$('#search');
    if(eyebrow) eyebrow.textContent='PROFOLIO · WILMINGTON';
    if(title) title.innerHTML='Encuentra. Analiza.<br>Recorre.';
    if(sub) sub.textContent='Todo lo importante del mercado, en una sola pantalla.';
    if(search) search.placeholder='Buscar zona o propiedad…';

    const mapAction=$('.hero-action[data-premium-action="map"] strong');
    const tourAction=$('.hero-action[data-premium-action="tour"] strong');
    const turboAction=$('#turboBtn strong');
    const publishAction=$('#publishBtn strong');
    if(mapAction) mapAction.textContent='Explorar mapa';
    if(tourAction) tourAction.textContent='Ruta';
    if(turboAction) turboAction.textContent='Turbo';
    if(publishAction) publishAction.textContent='Publicar';
  }

  function simplifyBottomNav(){
    const nav=$('.premium-nav');
    if(!nav||nav.dataset.pfV3Nav) return;
    nav.dataset.pfV3Nav='1';

    const explore=$('#navExplore');
    const mapBtn=$('.premium-nav [data-premium-action="map"]');
    const tour=$('#navTour');
    const oldVideos=$('#navVideos');
    const oldTurbo=$('#navPortfolio');

    if(explore){
      explore.querySelector('span:last-of-type').textContent='Inicio';
      explore.addEventListener('click',()=>setTimeout(()=>route('home'),0));
    }
    if(mapBtn){
      mapBtn.querySelector('span:last-of-type').textContent='Mapa';
      mapBtn.addEventListener('click',()=>setTimeout(()=>route('map'),0));
    }
    if(tour) tour.querySelector('span:last-of-type').textContent='Ruta';

    if(oldVideos){
      const props=oldVideos.cloneNode(true);
      props.id='navVideos';
      props.querySelector('.nav-glyph').textContent='⌑';
      props.querySelector('span:last-of-type').textContent='Propiedades';
      oldVideos.replaceWith(props);
      props.addEventListener('click',()=>{
        $$('.premium-nav .nav-item').forEach(x=>x.classList.remove('active'));
        props.classList.add('active'); route('properties');
      });
    }

    if(oldTurbo){
      const turbo=oldTurbo.cloneNode(true);
      turbo.id='navPortfolio';
      turbo.querySelector('span:last-of-type').textContent='Turbo';
      oldTurbo.replaceWith(turbo);
      turbo.addEventListener('click',()=>{
        $$('.premium-nav .nav-item').forEach(x=>x.classList.remove('active'));
        turbo.classList.add('active'); openTurbo();
      });
    }
  }

  function guaranteeTurboButton(){
    const old=$('#turboBtn');
    if(!old||old.dataset.pfV3Turbo) return;
    const fresh=old.cloneNode(true);
    fresh.id='turboBtn'; fresh.dataset.pfV3Turbo='1';
    old.replaceWith(fresh);
    fresh.addEventListener('click',openTurbo);
  }

  function reorganizeContent(){
    const mapColumn=$('.map-column'),mapCard=$('.map-card'),properties=$('#properties-section'),banner=$('.offmarket-banner'),metric=$('.metric-strip');
    if(!mapColumn||!mapCard||!properties||properties.dataset.pfV3Moved) return;
    properties.dataset.pfV3Moved='1';
    mapCard.insertAdjacentElement('afterend',properties);

    const tools=document.createElement('section');
    tools.className='pf-mobile-tools';
    tools.innerHTML=`
      <button class="pf-mobile-tool" type="button" data-pf-route="offmarket"><span class="pf-tool-icon">◇</span><b>Off-Market</b><span>Registra oportunidades locales.</span></button>
      <button class="pf-mobile-tool" type="button" data-pf-route="videos"><span class="pf-tool-icon">▷</span><b>Video Open House</b><span>Gestiona recorridos de hasta 60 s.</span></button>
      <button class="pf-mobile-tool" type="button" data-pf-route="assistant"><span class="pf-tool-icon">✦</span><b>Asistente IA</b><span>Analiza lo que estás viendo.</span></button>
      <button class="pf-mobile-tool" type="button" data-pf-route="analysis"><span class="pf-tool-icon">▥</span><b>Análisis de zona</b><span>Lee el sector sin complicaciones.</span></button>`;
    properties.insertAdjacentElement('afterend',tools);
    if(banner) tools.insertAdjacentElement('afterend',banner);
    if(metric&&banner) banner.insertAdjacentElement('afterend',metric);
  }

  function bindRoutes(){
    document.addEventListener('click',e=>{
      const btn=e.target.closest('[data-pf-route]');
      if(!btn) return;
      e.preventDefault(); route(btn.dataset.pfRoute);
    });

    $('.hero-action[data-premium-action="map"]')?.addEventListener('click',()=>setTimeout(()=>route('map'),0));
    $('.hero-action[data-premium-action="tour"]')?.addEventListener('click',()=>setTimeout(()=>route('tour'),0));
    $('#navTour')?.addEventListener('click',()=>setTimeout(()=>smooth($('#tourPanel')?.hidden?$('#properties-section'):$('#tourPanel')),160));
  }

  function makeButtonsFeelAlive(){
    $$('button').forEach(btn=>{
      if(btn.dataset.pfV3Tap) return;
      btn.dataset.pfV3Tap='1';
      btn.addEventListener('pointerdown',()=>btn.classList.add('pf-pressed'),{passive:true});
      ['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,()=>btn.classList.remove('pf-pressed'),{passive:true}));
    });
  }

  function boot(){
    if(!mobile()) return;
    simplifyHero();
    reorganizeContent();
    simplifyBottomNav();
    guaranteeTurboButton();
    bindRoutes();
    installMapGate();
    makeButtonsFeelAlive();
    setTimeout(()=>window.__pfMap?.invalidateSize?.(true),350);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1000),{once:true});
  else setTimeout(boot,1000);
})();
