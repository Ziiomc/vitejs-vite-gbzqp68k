(() => {
  'use strict';
  const $=q=>document.querySelector(q);
  const data=[
    {id:'sale-downtown',kind:'sale',title:'Downtown Brick Townhome',area:'Downtown Wilmington',position:[34.225,-77.946],copy:'Existing ProFolio sample · $685,000 illustrative asking price · 3 beds. No live listing.',property:'p404'},
    {id:'sale-ogden',kind:'sale',title:'Ogden Solar House',area:'Ogden / Wilmington region',position:[34.272,-77.8],copy:'Existing ProFolio sample · $865,000 illustrative asking price · 4 beds. No live listing.',property:'p403'},
    {id:'rent-mayfaire',kind:'rent',title:'Mayfaire rental example',area:'Mayfaire / Wilmington',position:[34.2415,-77.832],copy:'Fictional rental scenario for the preview. Price, availability, photos and landlord are not supplied.'},
    {id:'open-downtown',kind:'open',title:'Downtown Open House example',area:'Downtown Wilmington',position:[34.227,-77.944],copy:'Illustrative visit scenario using the sample townhome. No date, appointment or open-house availability is confirmed.',property:'p404'},
    {id:'event-wilmington',kind:'event',title:'Wilmington community event example',area:'Downtown Wilmington',position:[34.235,-77.945],copy:'Fictional community meetup scenario. No organizer, venue or scheduled event is verified.'}
  ];
  const labels={sale:'FOR SALE · DEMO',rent:'FOR RENT · DEMO',open:'OPEN HOUSE · DEMO',event:'LOCAL EVENT · DEMO'};
  const symbols={sale:'⌂',rent:'▤',open:'★',event:'◆'};
  const active=new Set(Object.keys(labels));
  let selected=null,map=null,markers=null,route=null;
  const origin=[34.2257,-77.9447];
  const stored=k=>{try{return localStorage.getItem(k)}catch{return null}};
  let dark=stored('pf_theme')!=='light';
  function theme(){document.body.classList.toggle('light',!dark);document.documentElement.style.colorScheme=dark?'dark':'light';$('#gpsTheme').textContent=dark?'☀ Day mode':'☾ Night mode';$('#gpsTheme').setAttribute('aria-pressed',String(dark));}
  $('#gpsTheme').addEventListener('click',()=>{dark=!dark;try{localStorage.setItem('pf_theme',dark?'dark':'light')}catch{}theme();});theme();
  function clearSelection(){selected=null;$('#gpsDetail').hidden=true;if(route&&map){map.removeLayer(route);route=null;}$('#routeStatus').textContent='';}
  function choose(item){
    selected=item;$('#gpsDetail').hidden=false;
    $('#gpsDetailType').textContent=labels[item.kind];$('#gpsDetailTitle').textContent=item.title;
    $('#gpsDetailCopy').textContent=item.copy;$('#gpsDetailLocation').textContent='Area reference: '+item.area;
    $('#openSample').hidden=!item.property;if(item.property)$('#openSample').href='./?property='+encodeURIComponent(item.property);
    $('#routeStatus').textContent='';if(route&&map){map.removeLayer(route);route=null;}
    document.querySelectorAll('.gps-stop').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stop===item.id)));
    map?.setView(item.position,13,{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});
    $('#gpsDetail').scrollIntoView({behavior:'instant',block:'nearest'});$('#gpsDetailTitle').focus({preventScroll:true});
  }
  function render(){
    const query=$('#destination').value.trim().toLowerCase();
    const items=data.filter(x=>active.has(x.kind)&&`${x.title} ${x.area}`.toLowerCase().includes(query));
    if(selected&&!items.some(x=>x.id===selected.id))clearSelection();
    $('#gpsResultCount').textContent=items.length+' demo '+(items.length===1?'stop':'stops');$('#gpsResults').replaceChildren();markers?.clearLayers();
    for(const item of items){
      const b=document.createElement('button');b.type='button';b.className='gps-stop';b.dataset.stop=item.id;b.setAttribute('aria-pressed',String(item.id===selected?.id));
      const type=document.createElement('small');type.textContent=labels[item.kind];const title=document.createElement('strong');title.textContent=symbols[item.kind]+' '+item.title;const area=document.createElement('span');area.textContent=item.area;b.append(type,title,area);b.addEventListener('click',()=>choose(item));$('#gpsResults').append(b);
      if(map){const marker=L.marker(item.position,{title:item.title+' · Fictional demo',alt:item.title+' · Fictional demo',icon:L.divIcon({className:'gps-marker',html:'<span class="gps-pin '+item.kind+'">'+symbols[item.kind]+'</span>',iconSize:[36,36],iconAnchor:[18,18]})}).addTo(markers);marker.on('click',()=>choose(item));}
    }
    if(!items.length){const p=document.createElement('p');p.textContent='No matching demo stops. Try Downtown, Ogden or Mayfaire, or reset the filters.';$('#gpsResults').append(p);}
    $('#gpsStatus').textContent=items.length+' fictional sample stops shown. Pins are approximate area references.';
  }
  document.querySelectorAll('[data-layer]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.layer;active.has(k)?active.delete(k):active.add(k);b.setAttribute('aria-pressed',String(active.has(k)));render();}));
  $('#gpsSearchForm').addEventListener('submit',e=>{e.preventDefault();render();});$('#destination').addEventListener('input',render);
  $('#resetGPS').addEventListener('click',()=>{$('#destination').value='';Object.keys(labels).forEach(k=>active.add(k));document.querySelectorAll('[data-layer]').forEach(b=>b.setAttribute('aria-pressed','true'));clearSelection();render();map?.setView([34.24,-77.88],11);});
  $('#voiceExample').addEventListener('click',()=>$('#voiceDialog').showModal());$('#closeVoice').addEventListener('click',()=>$('#voiceDialog').close());
  $('#useVoiceExample').addEventListener('click',()=>{$('#voiceDialog').close();$('#destination').value='Downtown';render();$('#destination').focus();});
  $('#closeGPSDetail').addEventListener('click',()=>{const target=selected?.id;clearSelection();render();document.querySelector('[data-stop="'+target+'"]')?.focus();});
  $('#showConcept').addEventListener('click',()=>{
    if(!selected)return;
    if(map){if(route)map.removeLayer(route);route=L.polyline([origin,selected.position],{color:'#d3a137',weight:5,dashArray:'8 9'}).addTo(map);map.fitBounds(route.getBounds().pad(.35),{maxZoom:14,animate:false});}
    $('#routeStatus').textContent='Route concept only: fixed demo start in Downtown Wilmington → '+selected.area+'. Straight line; no road guidance, ETA, traffic or live location.';
    $('#gpsStatus').textContent=$('#routeStatus').textContent;
    $('.gps-map-frame').scrollIntoView({behavior:'instant',block:'center'});
  });
  if(window.L){
    try{
      map=L.map('gpsMap',{scrollWheelZoom:false}).setView([34.24,-77.88],11);markers=L.layerGroup().addTo(map);
      let failures=0;const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
      tiles.on('tileerror',()=>{if(++failures>=4)$('#gpsMapFallback').hidden=false;});tiles.on('tileload',()=>{failures=0;$('#gpsMapFallback').hidden=true;});
      fetch('./wilmington-boundaries.geojson').then(r=>{if(!r.ok)throw Error('Outline unavailable');return r.json();}).then(d=>L.geoJSON({...d,features:d.features.filter(f=>f.properties.pfName==='Wilmington')},{interactive:false,style:{color:'#8d1837',weight:2.5,fillOpacity:.02}}).addTo(map)).catch(()=>{});
    }catch{$('#gpsMapFallback').hidden=false;}
  }else $('#gpsMapFallback').hidden=false;
  render();
})();
