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
