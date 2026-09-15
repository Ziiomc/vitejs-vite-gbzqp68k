(()=>{
  'use strict';
  const $=(q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const LS={saved:'pf-saved-tours',drafts:'pf-draft-properties',manual:'pf-manual-addresses'};
  let suppressLocationUntil=0;

  const afterReady=(fn)=>{
    const run=()=>setTimeout(fn,450);
    document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run,{once:true}):run();
  };

  const toast=(msg)=>{
    const el=$('#toast');
    if(!el){ console.info('[ProFolio]',msg); return; }
    el.textContent=msg;
    el.classList.add('show','visible');
    clearTimeout(el.__pfTimer);
    el.__pfTimer=setTimeout(()=>el.classList.remove('show','visible'),2600);
  };

  const closeModal=()=>{
    const modal=$('#modal'), card=$('#modalCard');
    modal?.classList.remove('show','open','visible');
    modal?.setAttribute('aria-hidden','true');
    if(card) card.innerHTML='';
  };

  const openModal=(title,kicker,html)=>{
    const modal=$('#modal'), card=$('#modalCard');
    if(!modal||!card) return;
    card.innerHTML=`<div class="premium-modal-head"><div><small>${kicker}</small><h2>${title}</h2></div><button class="premium-modal-close" type="button" data-pf-close>×</button></div>${html}`;
    modal.classList.add('show','open','visible');
    modal.setAttribute('aria-hidden','false');
    $('[data-pf-close]',card)?.addEventListener('click',closeModal);
    card.focus?.();
  };

  const activateNav=(btn)=>{
    if(!btn) return;
    $$('.premium-nav .nav-item').forEach(x=>x.classList.toggle('active',x===btn));
  };

  const scrollTo=(el)=>el?.scrollIntoView({behavior:'smooth',block:'start'});

  function hardenMapTouch(){
    const mapEl=$('#market-map');
    if(!mapEl) return;

    mapEl.style.touchAction='none';
    mapEl.style.overscrollBehavior='contain';

    const map=window.__pfMap;
    try{ map?.dragging?.enable(); map?.touchZoom?.enable(); map?.doubleClickZoom?.enable(); }
    catch(e){ console.warn('[ProFolio] map gestures',e); }

    const activePointers=new Set();
    const begin=(id)=>{
      activePointers.add(id);
      if(activePointers.size>1) suppressLocationUntil=Date.now()+1200;
    };
    const end=(id)=>{
      activePointers.delete(id);
      if(Date.now()<suppressLocationUntil) suppressLocationUntil=Math.max(suppressLocationUntil,Date.now()+350);
    };
    mapEl.addEventListener('pointerdown',e=>begin(e.pointerId),{passive:true});
    mapEl.addEventListener('pointerup',e=>end(e.pointerId),{passive:true});
    mapEl.addEventListener('pointercancel',e=>end(e.pointerId),{passive:true});
    mapEl.addEventListener('touchstart',e=>{ if(e.touches.length>1) suppressLocationUntil=Date.now()+1200; },{passive:true});
    mapEl.addEventListener('touchend',()=>{ if(Date.now()<suppressLocationUntil) suppressLocationUntil=Math.max(suppressLocationUntil,Date.now()+350); },{passive:true});

    // Replace the original location button after map-fix binds it. This removes
    // the legacy onclick so geolocation can only fire from an intentional tap.
    const original=$('#location');
    if(original){
      const locationBtn=original.cloneNode(true);
      original.replaceWith(locationBtn);
      locationBtn.setAttribute('type','button');
      locationBtn.setAttribute('aria-label','Centrar mapa en mi ubicación');
      locationBtn.addEventListener('pointerdown',e=>e.stopPropagation());
      locationBtn.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true});
      locationBtn.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        if(Date.now()<suppressLocationUntil) return;
        if(!navigator.geolocation){ toast('La geolocalización no está disponible en este dispositivo.'); return; }
        locationBtn.disabled=true;
        locationBtn.setAttribute('aria-busy','true');
        navigator.geolocation.getCurrentPosition(pos=>{
          const m=window.__pfMap;
          if(m) m.flyTo([pos.coords.latitude,pos.coords.longitude],14,{duration:.6});
          toast('Mapa centrado en tu ubicación.');
          locationBtn.disabled=false;
          locationBtn.removeAttribute('aria-busy');
        },()=>{
          toast('No se pudo obtener tu ubicación. Revisa el permiso del navegador.');
          locationBtn.disabled=false;
          locationBtn.removeAttribute('aria-busy');
        },{enableHighAccuracy:true,timeout:8000,maximumAge:30000});
      });
    }

    // Leaflet sometimes needs a second size pass after mobile layout settles.
    setTimeout(()=>window.__pfMap?.invalidateSize?.(true),100);
    setTimeout(()=>window.__pfMap?.invalidateSize?.(true),900);
  }

  function bindVideo(){
    const openVideo=()=>{
      const area=$('#areaPanelName')?.textContent?.trim()||$('#sectorSelect')?.selectedOptions?.[0]?.textContent||'Toda la región';
      openModal('Video Open House','VIDEO TOUR · MÁXIMO 60 S',`
        <p class="muted">Carga y previsualiza un video del sector <strong>${area}</strong>. ProFolio valida la duración antes de mostrarlo.</p>
        <label class="pf-upload-zone" style="display:block;padding:18px;border:1px dashed #c8cdd3;border-radius:14px;text-align:center">
          <strong>Seleccionar video</strong><br><small>MP4, MOV o formato compatible · máximo 60 segundos</small>
          <input id="pfVideoInput" type="file" accept="video/*" style="display:block;margin:12px auto 0;max-width:100%">
        </label>
        <div id="pfVideoPreview" style="margin-top:12px"></div>`);
      const input=$('#pfVideoInput'), preview=$('#pfVideoPreview');
      input?.addEventListener('change',()=>{
        const file=input.files?.[0]; if(!file||!preview) return;
        const url=URL.createObjectURL(file);
        const video=document.createElement('video');
        video.controls=true; video.playsInline=true; video.preload='metadata'; video.src=url;
        video.style.cssText='width:100%;max-height:380px;border-radius:14px;background:#09111b';
        video.addEventListener('loadedmetadata',()=>{
          if(video.duration>60.05){
            preview.innerHTML='<p class="premium-answer">El video supera 60 segundos. Selecciona una versión más corta.</p>';
            URL.revokeObjectURL(url); input.value=''; return;
          }
          preview.innerHTML=''; preview.appendChild(video);
          toast('Video listo para previsualizar.');
        },{once:true});
      });
    };
    ['navVideos','areaVideoBtn','areaVideoManageInline','areaVideoManagerBtn','areaVideoCover'].forEach(id=>$('#'+id)?.addEventListener('click',openVideo));
    $('#areaVideoDockClose')?.addEventListener('click',()=>{
      const dock=$('#areaVideoDock'); if(dock){ dock.hidden=true; dock.setAttribute('aria-hidden','true'); }
    });
  }

  function bindTurbo(){
    const openTurbo=()=>{
      const cards=$$('#propertyCards .property');
      const rows=cards.slice(0,6).map((card,i)=>{
        const title=card.querySelector('h3')?.textContent?.trim()||`Propiedad ${i+1}`;
        const price=card.querySelector('.price')?.textContent?.trim()||'—';
        const score=Math.max(62,94-i*5);
        return `<div class="premium-kpi" style="text-align:left"><strong>${score}/100</strong><small>${title}<br>${price}</small></div>`;
      }).join('');
      openModal('Portafolio Turbo','PRIORIZACIÓN COMERCIAL',`
        <p class="muted">Turbo prioriza las oportunidades visibles para que pases del mapa a la acción sin salir del flujo.</p>
        <div class="premium-grid">${rows||'<div class="premium-answer">No hay propiedades visibles con los filtros actuales.</div>'}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="primary" type="button" id="pfTurboMap">Ir al Market Map</button><button type="button" id="pfTurboTour">Abrir Open Tour</button></div>`);
      $('#pfTurboMap')?.addEventListener('click',()=>{closeModal();scrollTo($('#market-section'));});
      $('#pfTurboTour')?.addEventListener('click',()=>{closeModal();$('#navTour')?.click();});
    };
    $('#turboBtn')?.addEventListener('click',openTurbo);
    $('#navPortfolio')?.addEventListener('click',()=>{activateNav($('#navPortfolio'));openTurbo();});
  }

  function bindPublish(){
    $('#publishBtn')?.addEventListener('click',()=>{
      openModal('Publicar Propiedad','OFF-MARKET / FSBO',`
        <form id="pfPublishForm" class="pf-publish-form" style="display:grid;gap:10px">
          <input name="title" required placeholder="Nombre o dirección de la propiedad">
          <input name="zone" required placeholder="Sector / ciudad">
          <input name="price" inputmode="numeric" placeholder="Precio estimado (USD)">
          <select name="kind"><option value="offmarket">Off-Market</option><option value="regular">Regular</option><option value="premium">Premium</option><option value="turbo">Turbo</option></select>
          <textarea name="notes" rows="3" placeholder="Notas u oportunidad detectada"></textarea>
          <button class="primary" type="submit">Guardar borrador</button>
        </form>`);
      $('#pfPublishForm')?.addEventListener('submit',e=>{
        e.preventDefault();
        const data=Object.fromEntries(new FormData(e.currentTarget).entries());
        const drafts=JSON.parse(localStorage.getItem(LS.drafts)||'[]');
        drafts.unshift({...data,id:'draft-'+Date.now(),createdAt:new Date().toISOString()});
        localStorage.setItem(LS.drafts,JSON.stringify(drafts.slice(0,50)));
        closeModal(); toast('Borrador de propiedad guardado.');
      });
    });
  }

  function bindFavorites(){
    $('#favoritesBtn')?.addEventListener('click',()=>{
      const favs=$$('#propertyCards .property').filter(card=>card.querySelector('[data-fav]')?.textContent?.includes('♥'));
      openModal('Mis Favoritos','PROPIEDADES GUARDADAS',favs.length
        ? `<div style="display:grid;gap:8px">${favs.map(card=>`<div class="premium-answer"><strong>${card.querySelector('h3')?.textContent||'Propiedad'}</strong><br><small>${card.querySelector('.price')?.textContent||''} · ${card.querySelector('.muted')?.textContent||''}</small></div>`).join('')}</div>`
        : '<p class="premium-answer">Todavía no tienes favoritos. Usa ♡ en una propiedad para guardarla.</p>');
    });
  }

  function bindTourTools(){
    $('#optimizeBtn')?.addEventListener('click',()=>{
      let tour=JSON.parse(localStorage.getItem('pf-tour')||'[]');
      if(tour.length<3){ toast('Añade al menos 3 propiedades para ordenar la ruta.'); return; }
      const pending=tour.slice(1), ordered=[tour[0]];
      const dist=(a,b)=>Math.hypot((a.lat||0)-(b.lat||0),(a.lng||0)-(b.lng||0));
      while(pending.length){
        const last=ordered[ordered.length-1];
        let best=0;
        for(let i=1;i<pending.length;i++) if(dist(last,pending[i])<dist(last,pending[best])) best=i;
        ordered.push(pending.splice(best,1)[0]);
      }
      localStorage.setItem('pf-tour',JSON.stringify(ordered));
      sessionStorage.setItem('pf-scroll-tour','1');
      location.reload();
    });

    $('#saveTourBtn')?.addEventListener('click',()=>{
      const tour=JSON.parse(localStorage.getItem('pf-tour')||'[]');
      const manual=JSON.parse(localStorage.getItem(LS.manual)||'[]');
      if(!tour.length&&!manual.length){ toast('Añade una parada antes de guardar el Open Tour.'); return; }
      const saved=JSON.parse(localStorage.getItem(LS.saved)||'[]');
      saved.unshift({id:'tour-'+Date.now(),name:`Open Tour ${new Date().toLocaleDateString()}`,createdAt:new Date().toISOString(),stops:[...tour,...manual]});
      localStorage.setItem(LS.saved,JSON.stringify(saved.slice(0,25)));
      toast('Open Tour guardado en este dispositivo.');
    });

    const openSaved=()=>{
      const saved=JSON.parse(localStorage.getItem(LS.saved)||'[]');
      openModal('Open Tours guardados','RECORRIDOS',saved.length
        ? `<div style="display:grid;gap:8px">${saved.map(t=>`<div class="premium-answer"><strong>${t.name}</strong><br><small>${t.stops?.length||0} paradas · ${new Date(t.createdAt).toLocaleString()}</small></div>`).join('')}</div>`
        : '<p class="premium-answer">No hay recorridos guardados todavía.</p>');
    };
    $('#savedToursInlineBtn')?.addEventListener('click',openSaved);
    $('#savedToursBtn')?.addEventListener('click',openSaved);

    $('#shareTourBtn')?.addEventListener('click',async()=>{
      const tour=JSON.parse(localStorage.getItem('pf-tour')||'[]');
      if(!tour.length){ toast('Añade propiedades al Open Tour antes de compartir.'); return; }
      const text='ProFolio Open Tour\n'+tour.map((x,i)=>`${i+1}. ${x.title||x.address}`).join('\n');
      try{
        if(navigator.share) await navigator.share({title:'ProFolio Open Tour',text});
        else { await navigator.clipboard.writeText(text); toast('Recorrido copiado al portapapeles.'); }
      }catch(e){ if(e?.name!=='AbortError') toast('No se pudo compartir el recorrido.'); }
    });

    $('#addAddressBtn')?.addEventListener('click',()=>{
      const input=$('#manualAddress'); const value=input?.value?.trim();
      if(!value){ toast('Escribe una dirección para añadirla.'); return; }
      const manual=JSON.parse(localStorage.getItem(LS.manual)||'[]');
      manual.push({id:'manual-'+Date.now(),title:value,address:value,manual:true});
      localStorage.setItem(LS.manual,JSON.stringify(manual.slice(-25)));
      if(input) input.value='';
      const list=$('#tourList');
      if(list){
        const row=document.createElement('div'); row.className='tour-stop';
        row.innerHTML=`<span>＋</span><div><b>${value.replace(/[<>]/g,'')}</b><small>Parada manual</small></div>`;
        list.appendChild(row);
      }
      toast('Dirección añadida al recorrido.');
    });
  }

  function bindHelpAndHome(){
    const help=()=>openModal('Guía de ProFolio','AYUDA RÁPIDA',`
      <div class="premium-answer"><strong>Market Map</strong><br>Desliza con un dedo y usa dos dedos para acercar o alejar. Tocar el mapa nunca activa tu GPS.</div>
      <div class="premium-answer"><strong>Mi ubicación</strong><br>Solo se solicita al pulsar el botón ⌖ situado en la esquina inferior derecha del mapa.</div>
      <div class="premium-answer"><strong>Open Tour</strong><br>Añade propiedades, ordena la ruta, guárdala y compártela.</div>
      <div class="premium-answer"><strong>Turbo</strong><br>Prioriza oportunidades visibles para una revisión comercial rápida.</div>`);
    $('#navHelp')?.addEventListener('click',help);
    $('#helpBtn')?.addEventListener('click',help);
    $('#navExplore')?.addEventListener('click',()=>{activateNav($('#navExplore'));window.scrollTo({top:0,behavior:'smooth'});});
    $$('.premium-nav [data-premium-action="map"]').forEach(btn=>btn.addEventListener('click',()=>activateNav(btn)));
    $('#navTour')?.addEventListener('click',()=>activateNav($('#navTour')));
    $('#navVideos')?.addEventListener('click',()=>activateNav($('#navVideos')));
  }

  function restoreAfterReload(){
    if(sessionStorage.getItem('pf-scroll-tour')==='1'){
      sessionStorage.removeItem('pf-scroll-tour');
      setTimeout(()=>{$('#navTour')?.click();scrollTo($('#tourPanel'));toast('Ruta ordenada por proximidad.');},700);
    }
  }

  afterReady(()=>{
    hardenMapTouch();
    bindVideo();
    bindTurbo();
    bindPublish();
    bindFavorites();
    bindTourTools();
    bindHelpAndHome();
    restoreAfterReload();
  });
})();
