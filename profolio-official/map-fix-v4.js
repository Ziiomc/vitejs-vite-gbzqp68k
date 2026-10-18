(()=>{'use strict';const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];const AREAS={Wilmington:{d:'Wilmington',z:'28401',c:[34.2257,-77.9447],k:'city'},'Wilmington Downtown':{d:'Wilmington Downtown',z:'28401',c:[34.2257,-77.9447],k:'anchor'},Mayfaire:{d:'Mayfaire / Landfall',z:'28405',c:[34.2415,-77.832],k:'anchor'},Ogden:{d:'Ogden',z:'28411',c:[34.272,-77.8],k:'cdp'},'Porters Neck':{d:'Porters Neck',z:'28411',c:[34.3,-77.763],k:'cdp'},Northchase:{d:'Northchase',z:'28405',c:[34.306,-77.879],k:'cdp'},'Skippers Corner':{d:'Skippers Corner',z:'28429',c:[34.322,-77.91],k:'cdp'},'Castle Hayne':{d:'Castle Hayne',z:'28429',c:[34.355,-77.9],k:'cdp'},'Greenville Loop / Sound':{d:'Greenville Loop / Sound',z:'28409',c:[34.1996,-77.8714],k:'anchor'},'Wrightsville Beach':{d:'Wrightsville Beach',z:'28480',c:[34.2085,-77.7964],k:'city'},'Figure Eight Island':{d:'Figure Eight Island',z:'28411',c:[34.2707,-77.7428],k:'anchor'},Leland:{d:'Leland',z:'28451',c:[34.2563,-78.0447],k:'city'},'Carolina Beach':{d:'Carolina Beach',z:'28428',c:[34.0352,-77.8936],k:'city'},'Kure Beach':{d:'Kure Beach',z:'28449',c:[33.9968,-77.9072],k:'city'},'Oak Island':{d:'Oak Island',z:'28465',c:[33.9166,-78.1611],k:'city'},'Surf City':{d:'Surf City',z:'28445',c:[34.4271,-77.5461],k:'city'},'Topsail Beach':{d:'Topsail Beach',z:'28445',c:[34.3654,-77.6308],k:'city'},Hampstead:{d:'Hampstead',z:'28443',c:[34.3677,-77.7105],k:'cdp'},'Rocky Point':{d:'Rocky Point',z:'28457',c:[34.4559,-77.8654],k:'cdp'},Southport:{d:'Southport',z:'28461',c:[33.9216,-78.0203],k:'city'}};const P=[['p401','Porters Neck Coastal Estate','Porters Neck','28411','premium',1450000,5,4,390,34.3,-77.763,'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=82'],['p402','Mayfaire Modern Residence','Mayfaire','28405','premium',1185000,4,3.5,310,34.239,-77.833,'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82'],['p403','Ogden Solar House','Ogden','28411','feature',865000,4,3,285,34.272,-77.8,'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=82'],['p404','Downtown Brick Townhome','Wilmington Downtown','28401','regular',685000,3,2.5,210,34.225,-77.946,'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=82'],['p405','Carolina Beach Pool Home','Carolina Beach','28428','feature',925000,4,3,250,34.038,-77.892,'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=82'],['p406','Leland Family Home','Leland','28451','regular',495000,4,2.5,230,34.252,-78.042,'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=82'],['p407','Southport Marina View','Southport','28461','turbo',575000,3,2,205,33.923,-78.018,'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=82'],['p408','Hampstead Coastal Family Home','Hampstead','28443','regular',639000,4,3,244,34.367,-77.711,'https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1200&q=82'],['p409','Surf City Beach Residence','Surf City','28445','feature',799000,3,3,220,34.424,-77.552,'https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1200&q=82'],['p410','Rocky Point Acreage Opportunity','Rocky Point','28457','turbo',449000,3,2,218,34.452,-77.862,'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=82']].map(x=>({id:x[0],title:x[1],zone:x[2],zip:x[3],kind:x[4],price:x[5],beds:x[6],baths:x[7],area:x[8],lat:x[9],lng:x[10],image:x[11],address:`${x[2]}, NC ${x[3]}`}));const safeRead=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key));return value??fallback}catch{return fallback}};const storedFav=safeRead('pf-fav',[]),storedTour=safeRead('pf-tour',[]);const S={q:'',f:'all',a:'',budget:0,minPrice:0,minBeds:0,favOnly:false,fav:new Set(Array.isArray(storedFav)?storedFav:[]),tour:Array.isArray(storedTour)?storedTour:[]};let map,props=L.layerGroup(),bounds=L.layerGroup(),labels=L.layerGroup(),route,modalReturnFocus=null;const t=(es,en)=>document.documentElement.lang==='en'?en:es;const notify=msg=>{const el=$('#toast');if(!el)return alert(msg);el.textContent=msg;el.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove('show'),3200)};const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n),sqft=m=>Math.round(m*10.7639).toLocaleString('en-US'),kind=k=>({regular:'Regular',premium:'Premium',feature:t('Oportunidad','Opportunity'),turbo:'Turbo'}[k]||k),save=()=>{try{localStorage.setItem('pf-fav',JSON.stringify([...S.fav]));localStorage.setItem('pf-tour',JSON.stringify(S.tour))}catch{notify(t('El navegador no permite guardar estos cambios.','Your browser cannot save these changes.'))}};const css=document.createElement('style');css.textContent=`#market-map{height:100%!important;min-height:435px!important}.pfm{width:34px;height:34px;border-radius:50% 50% 50% 10px;transform:rotate(-45deg);display:grid;place-items:center;background:#fff;border:3px solid #8d0d31;box-shadow:0 6px 15px #0003}.pfm span{transform:rotate(45deg);font-weight:900;color:#8d0d31}.pfm.premium{border-color:#b07b28}.pfm.premium span{color:#b07b28}.pfm.feature{border-color:#287a92}.pfm.feature span{color:#287a92}.pfm.turbo{background:#8d0d31}.pfm.turbo span{color:#ffd675}.pfl{transform:translate(-50%,-50%);border:1px solid #8d0d3144;background:#fffffff2;color:#60122b;border-radius:8px;padding:4px 7px;box-shadow:0 4px 10px #0002;white-space:nowrap;font:800 9px system-ui}.pfl small{display:block;font-size:7px;color:#7b828a}.property-img{position:relative}.property-img .source{position:absolute;left:8px;top:8px}.card-favorite{position:absolute;right:7px;top:7px}.price-row{display:flex;justify-content:space-between;gap:6px}.pf-pop b,.pf-pop small,.pf-pop strong{display:block}.pf-pop b{font:600 14px Georgia}.pf-pop small{font-size:9px;color:#777;margin:3px 0}.pf-pop strong{color:#8d0d31;margin-bottom:6px}.pf-pop button{border:1px solid #ead9df;background:#fff;color:#7d0e2f;border-radius:6px;padding:6px;font-size:8px}.map-fallback-note{z-index:600!important}.pf-detail-grid{display:grid;grid-template-columns:minmax(220px,1fr) 1.15fr;gap:18px}.pf-detail-image{min-height:260px;border-radius:15px;background-size:cover;background-position:center}.pf-detail-copy h2{font-family:Georgia,serif;margin:5px 0 7px}.pf-detail-facts{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.pf-detail-facts span{background:#f7f1f3;color:#6e1230;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:800}.pf-detail-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.pf-detail-actions button{border-radius:9px;padding:9px 11px;border:1px solid #e2ccd3;background:#fff;color:#7b0d2e;font-weight:850;font-size:9px}.pf-detail-actions .primary{background:#7b0d2e;color:#fff;border-color:#7b0d2e}@media(max-width:680px){.pf-detail-grid{grid-template-columns:1fr}.pf-detail-image{min-height:210px}}`;document.head.appendChild(css);function visible(){const q=S.q.toLowerCase();return P.filter(p=>(S.f==='all'||p.kind===S.f)&&(!S.favOnly||S.fav.has(p.id))&&(!S.budget||p.price<=S.budget)&&(!S.minPrice||p.price>=S.minPrice)&&(!S.minBeds||p.beds>=S.minBeds)&&(!S.a||p.zone===S.a||(S.a==='Wilmington'&&/Wilmington|Mayfaire|Ogden|Porters Neck|Northchase|Skippers Corner|Castle Hayne|Greenville/.test(p.zone)))&&`${p.title} ${p.zone} ${p.zip}`.toLowerCase().includes(q))}function icon(p){const ch={regular:'●',premium:'▲',feature:'◇',turbo:'ϟ'}[p.kind]||'●';return L.divIcon({className:'pf-property-pin',html:`<div class="pfm ${p.kind}"><span aria-hidden="true">${ch}</span></div>`,iconSize:[40,40],iconAnchor:[20,20]})}function cards(){const r=$('#propertyCards'),a=visible();if($('#resultCount'))$('#resultCount').textContent=`${a.length} ${t('propiedades de ejemplo','sample properties')}`;if($('#premiumMetricCount'))$('#premiumMetricCount').textContent=a.length;if($('#premiumMetricPrice'))$('#premiumMetricPrice').textContent=a.length?'$'+Math.round(a.reduce((s,p)=>s+p.price,0)/a.length).toLocaleString('en-US'):'—';if(!r)return;r.innerHTML=a.map(p=>`<article class="property"><div class="property-img"><img src="${p.image}" srcset="${p.image.replace(/w=1200/,'w=360')} 360w, ${p.image.replace(/w=1200/,'w=640')} 640w, ${p.image} 1200w" sizes="(max-width: 700px) calc(100vw - 56px), 420px" alt="${escapeHTML(p.title)}" loading="lazy" decoding="async"><span class="source">Demo</span><button class="card-favorite" type="button" aria-label="${S.fav.has(p.id)?t('Quitar de favoritos','Remove saved home'):t('Guardar en favoritos','Save home')}: ${escapeHTML(p.title)}" aria-pressed="${S.fav.has(p.id)}" data-fav="${p.id}">${S.fav.has(p.id)?'♥':'♡'}</button></div><div class="property-body"><div class="price-row"><div class="price">${money(p.price)}</div><span class="tag">${kind(p.kind)}</span></div><h3>${p.title}</h3><div class="muted">${p.zone} · ${p.zip}</div><div class="property-facts">${p.beds} ${t("hab.","beds")} · ${p.baths} ${t("baños","baths")} · ${sqft(p.area)} sq ft</div><div class="card-actions"><button data-focus="${p.id}">${t("Ver propiedad ↗","View property ↗")}</button><button data-tour="${p.id}">${S.tour.some(x=>x.id===p.id)?t('✓ En recorrido','✓ In tour'):'+ Open Tour'}</button></div></div></article>`).join('');$$('[data-focus]',r).forEach(b=>b.onclick=()=>{const p=P.find(x=>x.id===b.dataset.focus);if(p&&map&&map.getZoom()<12)map.flyTo([p.lat,p.lng],12,{duration:.6});openProperty(b.dataset.focus)});$$('[data-fav]',r).forEach(b=>b.onclick=()=>{S.fav.has(b.dataset.fav)?S.fav.delete(b.dataset.fav):S.fav.add(b.dataset.fav);save();cards()});$$('[data-tour]',r).forEach(b=>b.onclick=()=>toggleTour(b.dataset.tour))}function openModal(html){const modal=$('#modal'),card=$('#modalCard');if(!modal||!card)return;if(modal.getAttribute('aria-hidden')!=='false')modalReturnFocus=document.activeElement;card.innerHTML=html;modal.classList.add('show','open','visible');modal.setAttribute('aria-hidden','false');card.querySelectorAll('[data-pf-close]').forEach(b=>b.onclick=()=>closeModal());card.focus({preventScroll:true})}
function closeModal(){const modal=$('#modal'),card=$('#modalCard');modal?.classList.remove('show','open','visible');modal?.setAttribute('aria-hidden','true');if(card)card.innerHTML='';const target=modalReturnFocus;modalReturnFocus=null;if(target?.isConnected&&typeof target.focus==='function')target.focus({preventScroll:true})}

function openProperty(id){
  const p=P.find(x=>x.id===id);if(!p)return;
  const results=visible(),found=results.findIndex(x=>x.id===id),options=found>=0?results:P;
  const at=options.findIndex(x=>x.id===id),previous=at>0?options[at-1]:null,next=at<options.length-1?options[at+1]:null;
  const fav=S.fav.has(id),inTour=S.tour.some(x=>x.id===id);
  openModal(`<div class="premium-modal-head"><div><small>${t('FICHA DE EJEMPLO','SAMPLE PROPERTY')} · ${kind(p.kind).toUpperCase()}</small><h2 id="pfPropertyTitle">${escapeHTML(p.title)}</h2></div><button class="premium-modal-close" type="button" data-pf-close aria-label="${t('Cerrar detalles','Close property details')}">×</button></div>
    <div class="pf-detail-grid" data-pf-property-id="${p.id}">
      <div class="pf-detail-image"><img class="pf-detail-photo" src="${escapeHTML(p.image)}" srcset="${escapeHTML(p.image.replace(/w=1200/,'w=420'))} 420w, ${escapeHTML(p.image.replace(/w=1200/,'w=800'))} 800w, ${escapeHTML(p.image)} 1200w" sizes="(max-width: 700px) calc(100vw - 64px), 480px" alt="${escapeHTML(t('Fotografía ilustrativa de','Illustrative photo for'))} ${escapeHTML(p.title)}" decoding="async"></div>
      <div class="pf-detail-copy">
        <strong class="pf-detail-price">${money(p.price)}</strong><p class="muted">${escapeHTML(p.address)}</p>
        <div class="pf-detail-facts"><span>${p.beds} ${t('dormitorios','beds')}</span><span>${p.baths} ${t('baños','baths')}</span><span>${sqft(p.area)} sq ft ${t('aprox.','approx.')}</span><span>ZIP ${escapeHTML(p.zip)}</span></div>
        <p class="pf-detail-notice">${t('Inmueble y fotografía ilustrativos; no es un anuncio verificado ni está disponible para comprar desde esta demo.','Sample property and illustrative photo. This is not a verified or purchasable listing.')}</p>
        <div class="pf-detail-actions">
          <button class="primary" type="button" data-pf-map="${p.id}">${t('Ver en mapa','View on map')}</button>
          <button type="button" data-pf-fav="${p.id}" aria-pressed="${fav}">${fav?t('♥ Guardada','♥ Saved'):t('♡ Guardar','♡ Save')}</button>
          <button type="button" data-pf-tour="${p.id}" aria-pressed="${inTour}">${inTour?t('✓ En Open Tour','✓ In Open Tour'):'+ Open Tour'}</button>
          <button type="button" data-pf-share="${p.id}">${t('↗ Compartir ficha de ejemplo','↗ Share sample link')}</button>
        </div>
        <p class="pf-contact-status" role="note">${t('Contacto con agente no disponible: esta propiedad es ilustrativa.','Agent contact is unavailable: this is an illustrative sample, not a real listing.')}</p>
      </div>
    </div>
    <nav class="pf-detail-pager" aria-label="${t('Navegar propiedades de ejemplo','Browse sample properties')}">
      <button type="button" data-pf-prev ${previous?'':'disabled'}>← ${t('Anterior','Previous')}</button>
      <span aria-live="polite">${at+1} ${t('de','of')} ${options.length}</span>
      <button type="button" data-pf-next ${next?'':'disabled'}>${t('Siguiente','Next')} →</button>
    </nav>`);
  const card=$('#modalCard');
  card.querySelector('[data-pf-map]')?.addEventListener('click',()=>{
    closeModal();setViewMode('map');map?.flyTo([p.lat,p.lng],14);
  });
  card.querySelector('[data-pf-fav]')?.addEventListener('click',()=>{
    S.fav.has(id)?S.fav.delete(id):S.fav.add(id);save();render();openProperty(id);
  });
  card.querySelector('[data-pf-tour]')?.addEventListener('click',()=>{
    toggleTour(id);openProperty(id);
  });
  card.querySelector('[data-pf-share]')?.addEventListener('click',()=>shareProperty(p));
  card.querySelector('[data-pf-prev]')?.addEventListener('click',()=>{if(previous)openProperty(previous.id)});
  card.querySelector('[data-pf-next]')?.addEventListener('click',()=>{if(next)openProperty(next.id)});
}
function samplePropertyUrl(id){const url=new URL(window.location.href);url.searchParams.set('property',id);url.hash='';return url.toString()}
async function shareProperty(p){
  const url=samplePropertyUrl(p.id),text=t('Propiedad de ejemplo en ProFolio — no es un anuncio inmobiliario verificado.','ProFolio sample property — not a verified real estate listing.');
  try{
    if(typeof navigator.share==='function'){await navigator.share({title:p.title+' · ProFolio demo',text,url});return}
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);notify(t('Enlace de demostración copiado.','Sample listing link copied.'));return}
    if(typeof window.prompt==='function')window.prompt(t('Copia este enlace de demostración:','Copy this sample listing link:'),url);
    else notify(t('No se puede compartir desde este navegador.','Sharing is unavailable in this browser.'));
  }catch(err){if(err?.name!=='AbortError')notify(t('No se pudo compartir el enlace.','Unable to share link.'))}
}
function openLinkedProperty(){
  try{
    const id=new URL(window.location.href).searchParams.get('property');
    if(id&&P.some(p=>p.id===id))openProperty(id);
  }catch{}
}
function routeStats(){let km=0;const geo=S.tour.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));for(let i=1;i<geo.length;i++){const a=geo[i-1],b=geo[i],R=6371,rad=Math.PI/180,dLat=(b.lat-a.lat)*rad,dLon=(b.lng-a.lng)*rad,aa=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;km+=R*2*Math.atan2(Math.sqrt(aa),Math.sqrt(1-aa))}return{km,minutes:Math.round(km/42*60+Math.max(0,geo.length-1)*8)}}
function savedTours(){try{const result=JSON.parse(localStorage.getItem('pf-saved-tours')||'[]');return Array.isArray(result)?result:[]}catch{return[]}}
function saveTour(){if(!S.tour.length)return notify(t('Agrega al menos una propiedad al Open Tour.','Add at least one property to Open Tour.'));const st=routeStats(),all=savedTours(),id='tour-'+Date.now();all.unshift({id,name:'Open Tour '+new Date().toLocaleDateString(document.documentElement.lang==='en'?'en-US':'es-CL'),stops:S.tour.map(x=>({...x})),km:st.km,minutes:st.minutes,createdAt:Date.now()});try{localStorage.setItem('pf-saved-tours',JSON.stringify(all.slice(0,30)));notify(t('Open Tour guardado solo en este navegador.','Open Tour saved only in this browser.'))}catch{notify(t('No se pudo guardar el recorrido. Revisa el almacenamiento del navegador.','Could not save the tour. Check browser storage.'))}}
function openSavedTours(){const all=savedTours();openModal(`<div class="premium-modal-head"><div><small>PROFOLIO · ${t('RECORRIDOS','TOURS')}</small><h2>${t('Open Tours guardados','Saved Open Tours')}</h2></div><button class="premium-modal-close" type="button" data-pf-close>×</button></div>${all.length?all.map(t=>`<div class="saved-tour" style="display:flex;justify-content:space-between;gap:10px;padding:10px;border:1px solid #eadde1;border-radius:10px;margin:7px 0"><div><b>${escapeHTML(t.name)}</b><small style="display:block;color:#777">${Array.isArray(t.stops)?t.stops.length:0} ${document.documentElement.lang==='en'?'stops':'paradas'} · ${(Number(t.km||0)*0.621371).toFixed(1)} mi</small></div><span><button data-load="${escapeHTML(t.id)}">${document.documentElement.lang==='en'?'Open':'Abrir'}</button> <button data-del="${escapeHTML(t.id)}">${document.documentElement.lang==='en'?'Delete':'Eliminar'}</button></span></div>`).join(''):'<p class="muted">'+t('Todavía no hay recorridos guardados.','No tours saved yet.')+'</p>'}`);const card=$('#modalCard');card.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{const t=savedTours().find(x=>x.id===b.dataset.load);if(!t||!Array.isArray(t.stops))return;S.tour=t.stops.filter(x=>x&&typeof x.id==='string').map(x=>({...x}));save();closeModal();render();$('#navTour')?.click()});card.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{try{localStorage.setItem('pf-saved-tours',JSON.stringify(savedTours().filter(x=>x.id!==b.dataset.del)));openSavedTours()}catch{notify(t('No se pudo borrar el recorrido.','Could not delete the tour.'))}})}
function optimizeTour(){const todo=S.tour.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng)),manual=S.tour.filter(x=>!Number.isFinite(x.lat)||!Number.isFinite(x.lng));if(todo.length<3)return notify(t('Añade tres propiedades ubicadas para ordenar la ruta.','Add three mapped properties to optimize the tour.'));const ordered=[todo.shift()];while(todo.length){const a=ordered[ordered.length-1];let bi=0,bd=Infinity;todo.forEach((b,i)=>{const d=(a.lat-b.lat)**2+(a.lng-b.lng)**2;if(d<bd){bd=d;bi=i}});ordered.push(todo.splice(bi,1)[0])}S.tour=[...ordered,...manual];save();render()}
async function shareTour(){if(!S.tour.length)return notify(t('Tu Open Tour está vacío.','Your Open Tour is empty.'));const st=routeStats(),text='ProFolio Open Tour\n'+S.tour.length+' '+t('paradas','stops')+' · '+(st.km*0.621371).toFixed(1)+' mi · '+st.minutes+' '+t('min aprox.','min (est.)')+'\n'+S.tour.map((x,i)=>(i+1)+'. '+x.title+' — '+x.address).join('\n');try{if(navigator.share)await navigator.share({title:'ProFolio Open Tour',text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);notify(t('Recorrido copiado al portapapeles.','Tour copied to clipboard.'))}else alert(text)}catch{}}
function render(){
  props.clearLayers();
  const homes=visible(), zoom=map.getZoom(), groups=[];
  // Group close-by markers in screen coordinates. No external plugin required.
  homes.forEach(p=>{
    const xy=map.project([p.lat,p.lng],zoom);
    const existing=zoom<16?groups.find(g=>Math.hypot(g.x-xy.x,g.y-xy.y)<54):null;
    if(existing){existing.items.push(p);const n=existing.items.length;existing.x+=(xy.x-existing.x)/n;existing.y+=(xy.y-existing.y)/n}
    else groups.push({items:[p],x:xy.x,y:xy.y});
  });
  groups.forEach(group=>{
    if(group.items.length>1){
      const positions=group.items.map(p=>[p.lat,p.lng]);
      const center=[group.items.reduce((a,p)=>a+p.lat,0)/group.items.length,group.items.reduce((a,p)=>a+p.lng,0)/group.items.length];
      const label=group.items.length+' '+t('propiedades cercanas; ampliar mapa','homes nearby; click to zoom in');
      const cluster=L.marker(center,{icon:L.divIcon({className:'pf-cluster-icon',html:'<span>'+group.items.length+'</span>',iconSize:[46,46],iconAnchor:[23,23]}),title:label});
      cluster.on('click',()=>map.flyToBounds(L.latLngBounds(positions).pad(.65),{maxZoom:Math.min(16,zoom+3),duration:.5}));
      cluster.addTo(props);
      return;
    }
    const p=group.items[0];
    const m=L.marker([p.lat,p.lng],{icon:icon(p),title:p.title+' · '+kind(p.kind),alt:p.title+' · '+kind(p.kind)});
    m.on('click',()=>{window.__pfSound?.play('door');if(map.getZoom()<12)map.flyTo([p.lat,p.lng],12,{duration:.6});openProperty(p.id)});
    m.addTo(props);
  });
  cards();drawRoute();tourUI();
}function toggleTour(id){const p=P.find(x=>x.id===id),i=S.tour.findIndex(x=>x.id===id);if(i>=0){S.tour.splice(i,1)}else if(p){S.tour.push({id:p.id,title:p.title,address:p.address,lat:p.lat,lng:p.lng})}else{return notify(t('Esta parada ya no está disponible.','This stop is no longer available.'))}save();render()}function drawRoute(){if(route)map.removeLayer(route);const geo=S.tour.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));if(geo.length>1)route=L.polyline(geo.map(x=>[x.lat,x.lng]),{color:'#e0a92e',weight:5,opacity:.95,dashArray:'9 7'}).addTo(map)}const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>c==='&'?'&amp;':c==='<'?'&lt;':c==='>'?'&gt;':c==='"'?'&quot;':'&#39;');function tourUI(){if($('#navTourCount'))$('#navTourCount').textContent=S.tour.length;if($('#tourStops'))$('#tourStops').textContent=S.tour.length;const st=routeStats();if($('#tourKm'))$('#tourKm').textContent=(st.km*0.621371).toFixed(1)+' mi';if($('#tourTime'))$('#tourTime').textContent=st.minutes+' min';if($('#tourList'))$('#tourList').innerHTML=S.tour.map((x,i)=>`<div class="tour-stop"><span>${i+1}</span><div><b>${escapeHTML(x.title)}</b><small>${escapeHTML(x.address)}</small></div><button type="button" aria-label="${t('Quitar parada','Remove stop')}" data-rm="${escapeHTML(x.id)}">×</button></div>`).join('')||'<p class="muted">'+t('Tu recorrido aparecerá aquí.','Your tour will appear here.')+'</p>';$$('[data-rm]',$('#tourList')||document).forEach(b=>b.onclick=()=>toggleTour(b.dataset.rm));$('#tourBar')?.classList.toggle('show',S.tour.length>0);if($('#tourBarCount'))$('#tourBarCount').textContent=`${S.tour.length} ${t('seleccionadas','selected')}`}function areaPanel(name,source){const p=$('#areaPanel');if(!p)return;if(!name){p.hidden=true;return}const a=AREAS[name];$('#areaPanelName').textContent=a.d;$('#areaPanelZip').textContent='ZIP '+a.z;$('#areaPanelCount').textContent=`${P.filter(x=>x.zone===name).length} ${t('propiedades de ejemplo','sample properties')}`;$('#areaPanelSource').textContent=source==='city'?t('Límite municipal oficial · U.S. Census TIGERweb 2026.','Official city boundary · U.S. Census TIGERweb 2026.'):source==='cdp'?t('Límite censal oficial (CDP) · U.S. Census TIGERweb 2026.','Official census boundary (CDP) · U.S. Census TIGERweb 2026.'):t('Sector de referencia. El contorno punteado es un grupo censal cercano, no el límite del barrio.','Reference area. Its dashed outline is a nearby census block group, not the neighborhood boundary.');p.hidden=false}/* All named ProFolio areas are visible by default.
   Municipal/CDP lines come from Census TIGERweb; non-legal marketing areas use
   the containing census block group as a clearly-labelled *reference*, never
   a fabricated neighborhood boundary. No county-wide census mesh. */
let boundaryEnabled=true;
let boundaryLoad=null;
let boundaryComplete=false;
let boundaryErrors=0;
const boundaryShapes=new Map();
const TIGER_BOUNDARIES='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer';
async function boundaryQuery(layer,params){
  const url=new URL(TIGER_BOUNDARIES+'/'+layer+'/query');
  Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,String(value)));
  url.searchParams.set('f','geojson');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch(url.toString(),{signal:controller.signal});
    if(!response.ok)throw new Error('TIGERweb HTTP '+response.status);
    const collection=await response.json();
    if(collection?.type!=='FeatureCollection'||!Array.isArray(collection.features))throw new Error('Invalid Census geometry');
    return collection.features.filter(feature=>feature?.geometry);
  }finally{clearTimeout(timeout)}
}
function borderStyle(name,type){
  const active=S.a===name;
  return {
    color:active?'#fff0a2':type==='reference'?'#e5a96b':'#e7aa38',
    weight:active?3.7:type==='reference'?1.75:2.15,
    opacity:active?1:.90,
    fillColor:active?'#ffe2a0':'#b48639',
    fillOpacity:active?.095:.012,
    dashArray:type==='reference'?'6 6':undefined,
    lineCap:'round',lineJoin:'round',smoothFactor:1.5
  }
}
function borderDescription(name,type){
  if(type==='reference')return name+' · '+t('grupo censal cercano (no es límite oficial del barrio)','nearby census block group (not a neighborhood boundary)');
  return name+' · '+t('límite oficial del censo','official Census boundary');
}
function addBoundaryShape(name,geometry,type){
  if(!AREAS[name]||boundaryShapes.has(name)||!geometry)return;
  const layer=L.geoJSON(geometry,{
    pane:'pfAreaBoundaries',
    style:()=>borderStyle(name,type),
    onEachFeature:(_feature,polygon)=>{
      polygon.bindTooltip(borderDescription(name,type),{sticky:true,className:'pf-area-boundary-tip'});
      polygon.on('click',()=>selectArea(name,false));
    }
  });
  if(layer.getLayers().length===0)return;
  boundaryShapes.set(name,{layer,type});
  drawAreaBoundaries();
}
function drawAreaBoundaries(){
  bounds.clearLayers();
  if(!boundaryEnabled)return;
  for(const [name,entry] of boundaryShapes){
    entry.layer.setStyle(borderStyle(name,entry.type));
    entry.layer.addTo(bounds);
  }
}
function boundaryHint(){
  const element=$('#pfMapBoundaryHint');if(!element)return;
  if(!boundaryEnabled){element.textContent=t('Límites ocultos. Activa el control para volver a ver todos los sectores.','Boundaries hidden. Turn them on to see every area again.');return}
  if(!boundaryComplete){element.textContent=t('Cargando los límites de los sectores de Wilmington…','Loading Wilmington area boundaries…');return}
  const official=[...boundaryShapes.values()].filter(x=>x.type==='official').length;
  const reference=[...boundaryShapes.values()].filter(x=>x.type==='reference').length;
  const total=Object.keys(AREAS).length;
  if(!official&&!reference){
    element.textContent=t('No fue posible cargar los límites censales. Los nombres de sectores y las propiedades siguen disponibles.','Census outlines could not load. Area labels and properties are still available.');
    return;
  }
  element.textContent=t(
    `Sectores delimitados: ${official} oficiales y ${reference} de referencia, de ${total}. Los contornos punteados no son límites oficiales de barrios.`,
    `Area outlines: ${official} official and ${reference} reference, of ${total}. Dashed areas are not official neighborhood boundaries.`
  );
}
async function loadAllAreaBoundaries(){
  const kindNames=k=>Object.entries(AREAS).filter(([,area])=>area.k===k).map(([name])=>name);
  const officialGroups=[[28,kindNames('city')],[30,kindNames('cdp')]];
  await Promise.all(officialGroups.map(async ([layer,names])=>{
    const safeName=name=>"'"+name.replace(/'/g,"''")+"'";
    try{
      const features=await boundaryQuery(layer,{
        where:"STATE='37' AND BASENAME IN ("+names.map(safeName).join(',')+")",
        outFields:'BASENAME,NAME,GEOID,STATE',
        returnGeometry:'true',outSR:'4326',
        maxAllowableOffset:'0.00008'
      });
      for(const feature of features){
        const name=feature?.properties?.BASENAME;
        if(!name||!AREAS[name]||!names.includes(name))continue;
        // Several disjoint Census shapes may share the same area name.
        // Combine them rather than silently dropping the later features.
        const existing=boundaryShapes.get(name);
        if(existing){existing.layer.addData(feature);continue}
        addBoundaryShape(name,feature,'official');
      }
    }catch(error){boundaryErrors++;console.warn('Official area boundaries unavailable',layer,error)}
  }));
  const lacking=Object.entries(AREAS).filter(([name])=>!boundaryShapes.has(name));
  // Exact legal boundaries do not exist for the "anchor" areas in this demo.
  // Restore the original nearby Census block-group references, marked dashed.
  await Promise.all(lacking.map(async ([name,area])=>{
    const [lat,lng]=area.c;
    try{
      const features=await boundaryQuery(10,{
        where:"STATE='37'",
        geometry:lng+','+lat,
        geometryType:'esriGeometryPoint',
        inSR:'4326',spatialRel:'esriSpatialRelIntersects',
        outFields:'GEOID,TRACT,BLKGRP,COUNTY,STATE',
        returnGeometry:'true',outSR:'4326',
        maxAllowableOffset:'0.00008'
      });
      if(features.length)addBoundaryShape(name,features[0],'reference');
    }catch(error){boundaryErrors++;console.warn('Reference area unavailable',name,error)}
  }));
  boundaryComplete=true;
  drawAreaBoundaries();
  boundaryHint();
}
function updateBoundary(){
  drawAreaBoundaries();
  boundaryHint();
  if(boundaryEnabled&&!boundaryLoad){
    boundaryLoad=loadAllAreaBoundaries().catch(error=>{
      boundaryErrors++;
      boundaryComplete=true;
      console.warn('Area boundary loading failed',error);
      boundaryHint();
    });
  }
}
function selectArea(n,fly=true){S.a=n||'';if($('#sectorSelect'))$('#sectorSelect').value=S.a;areaPanel(n,AREAS[n]?.k);updateBoundary();render();if(n&&fly)map.flyTo(AREAS[n].c,n==='Wilmington'?10:12)}/* Position floating property cards against the actual map, not a magic pixel offset.
   Filter labels wrap differently with display widths and text scaling. */
function positionFloatingRail(){
  const container=$('.dashboard-grid'),mapContent=$('#market-section');
  if(!container||!mapContent||typeof container.getBoundingClientRect!=='function'||typeof mapContent.getBoundingClientRect!=='function')return;
  if(!window.matchMedia('(min-width:1280px)').matches)return;
  const top=Math.round(mapContent.getBoundingClientRect().top-container.getBoundingClientRect().top+9);
  if(Number.isFinite(top))container.style?.setProperty?.('--pf-rail-top',Math.max(0,top)+'px');
}
function setViewMode(mode){const list=mode==='list',dashboard=$('.dashboard-grid');dashboard?.classList.toggle('pf-list-mode',list);for(const [selector,pressed] of [['#mapViewBtn',!list],['#listViewBtn',list]]){const button=$(selector);button?.classList.toggle('active',pressed);button?.setAttribute('aria-pressed',String(pressed))}const target=$(list?'#properties-section':'#market-section');target?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});if(!list)setTimeout(()=>map?.invalidateSize(),80)}

let openTourReturnFocus=null;
function openTourPanel(){
  const panel=$('#tourPanel'),backdrop=$('#tourBackdrop');
  if(!panel)return;
  if(panel.hidden)openTourReturnFocus=document.activeElement;
  panel.hidden=false;
  if(backdrop)backdrop.hidden=false;
  document.body.classList.add('pf-tour-open');
  tourUI();
  panel.focus({preventScroll:true});
}
function closeTourPanel(){
  const panel=$('#tourPanel'),backdrop=$('#tourBackdrop');
  if(!panel||panel.hidden)return;
  panel.hidden=true;
  if(backdrop)backdrop.hidden=true;
  document.body.classList.remove('pf-tour-open');
  const target=openTourReturnFocus;openTourReturnFocus=null;
  if(target?.isConnected&&typeof target.focus==='function')target.focus({preventScroll:true});
}
function controls(){const sel=$('#sectorSelect');if(sel){Object.entries(AREAS).forEach(([n,a])=>{if(![...sel.options].some(o=>o.value===n)){const o=document.createElement('option');o.value=n;o.textContent=a.d;sel.appendChild(o)}});sel.onchange=()=>selectArea(sel.value,true)}const budget=$('#budgetSelect');if(budget)budget.onchange=()=>{S.budget=Number(budget.value)||0;render()};
const minPrice=$('#minPriceSelect');if(minPrice)minPrice.onchange=()=>{S.minPrice=Number(minPrice.value)||0;render()};
const beds=$('#bedsSelect');if(beds)beds.onchange=()=>{S.minBeds=Number(beds.value)||0;render()};const f=$('#filters');if(f){f.innerHTML='';[['all',t('Todas','All')],['regular','Regular'],['premium','Premium'],['feature',t('Oportunidad','Opportunity')],['turbo','Turbo']].forEach(([k,t])=>{const b=document.createElement('button');b.type='button';b.dataset.kind=k;b.innerHTML='<span class="pf-category-shape" aria-hidden="true">'+({all:'⌂',regular:'●',premium:'▲',feature:'◇',turbo:'ϟ'}[k]||'●')+'</span><span>'+t+'</span>';b.setAttribute('aria-label',k==='all'?'Show all sample homes':'Show '+t+' sample homes');b.className=k===S.f?'active':'';b.setAttribute('aria-pressed',String(k===S.f));b.onclick=()=>{S.f=k;$$('button',f).forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});render()};f.appendChild(b)})}if($('#search'))$('#search').oninput=e=>{S.q=e.target.value.trim();render()};if($('#homeBtn'))$('#homeBtn').onclick=()=>{S.q='';S.f='all';S.a='';S.budget=0;S.minPrice=0;S.minBeds=0;S.favOnly=false;if(budget)budget.value='0';if(minPrice)minPrice.value='0';if(beds)beds.value='0';if($('#search'))$('#search').value='';if(sel)sel.value='';const fav=$('#favoritesBtn');if(fav){fav.setAttribute('aria-pressed','false');fav.textContent=t('♡ Solo guardadas','♡ Saved only')}$$('button',f||document).forEach(b=>{const active=b.dataset.kind==='all';b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});areaPanel();updateBoundary();render();map.fitBounds(L.latLngBounds(Object.values(AREAS).map(a=>a.c)).pad(.08),{maxZoom:9})};if($('#wilmingtonFocus'))$('#wilmingtonFocus').onclick=()=>selectArea('Wilmington');if($('#location'))$('#location').onclick=()=>{if(!navigator.geolocation)return notify(t('La ubicación no está disponible en este navegador.','Location is unavailable in this browser.'));navigator.geolocation.getCurrentPosition(p=>map.flyTo([p.coords.latitude,p.coords.longitude],13),()=>notify(t('No se pudo obtener tu ubicación. Revisa los permisos.','Could not get your location. Check browser permissions.')))};if($('#addAddressBtn'))$('#addAddressBtn').onclick=()=>{const input=$('#manualAddress'),address=input?.value.trim();if(!address)return input?.focus();S.tour.push({id:'manual-'+Date.now(),title:address,address,manual:true});input.value='';save();render();notify(t('Parada guardada solo en este navegador. No se ubicará en el mapa hasta conectar geocodificación.','Stop saved only in this browser. It will not appear on the map until geocoding is connected.'))};if($('#navTour'))$('#navTour').onclick=openTourPanel;if($('#closeTourBtn'))$('#closeTourBtn').onclick=closeTourPanel;if($('#tourBackdrop'))$('#tourBackdrop').onclick=closeTourPanel;if($('#tourBarOpen'))$('#tourBarOpen').onclick=()=>$('#navTour').click();if($('#favoritesBtn')){const b=$('#favoritesBtn');b.setAttribute('aria-pressed',String(S.favOnly));b.textContent=S.favOnly?t('♥ Ver todas','♥ Show all'):t('♡ Solo guardadas','♡ Saved only');b.onclick=()=>{S.favOnly=!S.favOnly;b.setAttribute('aria-pressed',String(S.favOnly));b.textContent=S.favOnly?t('♥ Ver todas','♥ Show all'):t('♡ Solo guardadas','♡ Saved only');render()}};if($('#saveTourBtn'))$('#saveTourBtn').onclick=saveTour;if($('#savedToursInlineBtn'))$('#savedToursInlineBtn').onclick=openSavedTours;if($('#savedToursBtn'))$('#savedToursBtn').onclick=openSavedTours;if($('#optimizeBtn'))$('#optimizeBtn').onclick=optimizeTour;if($('#shareTourBtn'))$('#shareTourBtn').onclick=shareTour;if($('#tourBarClear'))$('#tourBarClear').onclick=()=>{S.tour=[];save();render()};if($('#clearTourBtn'))$('#clearTourBtn').onclick=()=>{S.tour=[];save();render()};if($('#areaPanelClose'))$('#areaPanelClose').onclick=()=>{S.a='';if(sel)sel.value='';areaPanel();updateBoundary();render()};if($('#areaOverviewBtn'))$('#areaOverviewBtn').onclick=()=>$('#homeBtn').click();if($('#areaExploreBtn'))$('#areaExploreBtn').onclick=()=>setViewMode('list');if($('#areaOpenTourBtn'))$('#areaOpenTourBtn').onclick=()=>$('#navTour').click();if($('#mapViewBtn'))$('#mapViewBtn').onclick=()=>setViewMode('map');if($('#listViewBtn'))$('#listViewBtn').onclick=()=>setViewMode('list');if($('#listBackToMap'))$('#listBackToMap').onclick=()=>setViewMode('map')}function initMapAppearance(){
  const el=$('#market-map');if(!el)return;
  const modes=['brand','light','dark'];
  let choice='brand';
  try{const saved=localStorage.getItem('pf_map_style_v1');if(modes.includes(saved))choice=saved}catch{}
  const updateStyle=(value)=>{
    choice=modes.includes(value)?value:'brand';
    el.dataset.pfMapStyle=choice;
    $$('[data-pf-map-style]').forEach(button=>{
      const active=button.dataset.pfMapStyle===choice;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    try{localStorage.setItem('pf_map_style_v1',choice)}catch{}
  };
  updateStyle(choice);
  $$('[data-pf-map-style]').forEach(b=>b.addEventListener('click',()=>{updateStyle(b.dataset.pfMapStyle);window.__pfSound?.play('nav')}));
  const border=$('#pfBoundariesToggle');
  if(border){boundaryEnabled=border.checked===true;border.addEventListener('change',()=>{boundaryEnabled=border.checked;updateBoundary()})}
  updateBoundary();
}
function init(){const el=$('#market-map');if(!el||!window.L)return;if(el._leaflet_id||el.querySelector('.leaflet-pane'))return;map=L.map(el,{zoomControl:false,minZoom:7,maxZoom:18}).setView([34.2,-77.88],9);window.__pfMap=map;L.control.zoom({position:'bottomright'}).addTo(map);const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map);
let tileErrors=0;
tiles.on('tileload',()=>{tileErrors=0;const note=$('#mapFallbackNote');if(note)note.hidden=true});
tiles.on('tileerror',()=>{if(++tileErrors>=4){const note=$('#mapFallbackNote');if(note)note.hidden=false}});
map.createPane('pfAreaBoundaries');map.getPane('pfAreaBoundaries').style.zIndex='440';props.addTo(map);bounds.addTo(map);labels.addTo(map);Object.entries(AREAS).filter(([n])=>n!=='Wilmington').forEach(([n,a])=>{const m=L.marker(a.c,{icon:L.divIcon({className:'',html:`<button class="pfl"><span>${a.d}</span><small>${a.z}</small></button>`,iconSize:[1,1]})}).addTo(labels);m.on('click',()=>selectArea(n))});controls();initMapAppearance();
  // At regional zoom, long neighborhood labels obscure the geographic context.
  // Users can still choose every area from the select; labels return when zooming in.
  const syncMapDensity=()=>el.classList.toggle('pf-area-labels-visible',map.getZoom()>=11);
  syncMapDensity();render();openLinkedProperty();
  map.on('zoomend',()=>{syncMapDensity();render()});$('#modal')?.addEventListener('click',e=>{if(e.target===$('#modal'))closeModal()});document.addEventListener('keydown',e=>{const opened=$('#modal')?.getAttribute('aria-hidden')==='false';if(e.key==='Escape'&&opened){closeModal();return}if(e.key==='Escape'&&!$('#tourPanel')?.hidden){closeTourPanel();return}if(!opened||!$('#modalCard [data-pf-property-id]')||!['ArrowLeft','ArrowRight'].includes(e.key)||e.target?.closest?.('input,textarea,select,[contenteditable]'))return;const selector=e.key==='ArrowLeft'?'[data-pf-prev]':'[data-pf-next]';const b=$('#modalCard')?.querySelector(selector);if(b&&!b.disabled){e.preventDefault();b.click()}});document.addEventListener('pf:language-changed',()=>{controls();render();drawAreaBoundaries();boundaryHint();if(S.a)areaPanel(S.a,AREAS[S.a]?.k)});setTimeout(()=>{map.invalidateSize(true);positionFloatingRail()},100);
setTimeout(()=>{map.invalidateSize(true);positionFloatingRail()},800);
if(typeof ResizeObserver!=='undefined'){
  const railObserver=new ResizeObserver(()=>positionFloatingRail());
  const toolbar=$('.map-toolbar');
  if(toolbar)railObserver.observe(toolbar);
}
window.addEventListener('resize',()=>{map.invalidateSize();positionFloatingRail()})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,150));else setTimeout(init,150)})();