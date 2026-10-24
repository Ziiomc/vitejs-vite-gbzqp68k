(()=>{
  'use strict';
  const PROFILE_KEY='pf_profile_v2', SOUND_KEY='pf_sound_v2', VOLUME_KEY='pf_sound_volume_v2';
  const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>Array.from(r.querySelectorAll(q)), id=x=>document.getElementById(x);
  const tr=(es,en)=>document.documentElement.lang==='en'?en:es;
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  let profile=read(PROFILE_KEY,null);
  const stored=k=>{try{return localStorage.getItem(k)}catch{return null}};
  let sound=stored(SOUND_KEY)==='on';
  let haptics=stored('pf_haptics_v1')==='on';
  let lastGesture=-Infinity;
  const gesture=e=>{if(e.isTrusted)lastGesture=performance.now()};
  document.addEventListener('pointerdown',gesture,true);
  document.addEventListener('keydown',gesture,true);
  document.addEventListener('click',gesture,true);
  let volume=Math.round(Math.max(0,Math.min(1,Number(stored(VOLUME_KEY)??.70)))*20)/20;
  let ctx=null,timer=0,lastSoundAt=0,lastHapticAt=-Infinity;

  function touchFeedback(kind='nav'){
    const now=performance.now();
    if(document.hidden||now-lastGesture>1000||now-lastHapticAt<80||!haptics||
      typeof navigator.vibrate!=='function'||matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
    try{lastHapticAt=now;return navigator.vibrate(kind==='confirm'?[18,30,18]:18)!==false}catch{return false}
  }
  // Every enabled control receives touch feedback, including dialogs, map zoom
  // and controls added after load. Sound remains mapped to four useful actions.
  document.addEventListener('click',e=>{
    if(!e.isTrusted)return;
    const control=e.target.closest?.('button,[role="button"],a[href],summary,input[type="checkbox"],input[type="radio"]');
    if(control&&!control.disabled&&control.getAttribute('aria-disabled')!=='true'&&control.id!=='muteAll')touchFeedback();
  },true);

  function audioContext(){
    if(!sound)return null;
    try{
      ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();
      if(ctx.state==='suspended')ctx.resume();
      return ctx;
    }catch{return null}
  }
  function voice(ac,{freq,at=0,duration=.12,gain=.04,type='sine',endFreq=0}){
    const o=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime+at,peak=Math.max(.002,Math.min(.15,gain*volume));
    o.type=type;o.frequency.setValueAtTime(freq,n);
    if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,n+duration);
    g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(peak,n+.012);g.gain.exponentialRampToValueAtTime(.0001,n+duration);
    o.connect(g);g.connect(ac.destination);o.start(n);o.stop(n+duration+.02);
  }
  function bell(ac,freq,at=.0,duration=.52,gain=.055){
    voice(ac,{freq,at,duration,gain,type:'sine'});
    voice(ac,{freq:freq*2.01,at,duration:duration*.62,gain:gain*.24,type:'sine'});
    voice(ac,{freq:freq*3.02,at,duration:duration*.38,gain:gain*.09,type:'sine'});
  }
  function playSound(kind='nav'){
    const now=performance.now();
    if(document.hidden||now-lastGesture>1000||now-lastSoundAt<80)return false;
    lastSoundAt=now;
    touchFeedback(kind);
    if(!sound||volume===0)return false;
    const ac=audioContext();if(!ac)return false;
    try{
      if(kind==='door'){
        bell(ac,659.25,0,.6,.10);bell(ac,493.88,.27,.68,.09);
      }else if(kind==='confirm'){
        bell(ac,587.33,0,.33,.085);bell(ac,783.99,.105,.36,.076);bell(ac,987.77,.215,.42,.06);
      }else if(kind==='tour'){
        bell(ac,440,0,.28,.075);bell(ac,659.25,.17,.36,.085);bell(ac,880,.34,.49,.08);
      }else{
        // Two dry, fixed-pitch strikes instead of the rejected bubble sweep.
        voice(ac,{freq:392,at:0,duration:.13,gain:.12,type:'triangle'});
        voice(ac,{freq:523.25,at:.07,duration:.16,gain:.10,type:'triangle'});
      }
      document.dispatchEvent(new CustomEvent('pf:sound-play',{detail:{kind}}));
      return true;
    }catch{return false}
  }
  const stopAudio=()=>{if(ctx){ctx.close().catch(()=>{});ctx=null}try{navigator.vibrate?.(0)}catch{}};
  const configure=values=>{
    if(typeof values.enabled==='boolean')sound=values.enabled;
    if(typeof values.haptics==='boolean')haptics=values.haptics;
    if(Number.isFinite(values.volume))volume=Math.max(0,Math.min(1,values.volume));
    if(!sound||volume===0)stopAudio();
    try{localStorage.setItem('pf_haptics_v1',haptics?'on':'off')}catch{}
    syncSound();
  };
  window.__pfSound={play:playSound,touch:touchFeedback,configure,get enabled(){return sound},get volume(){return volume},get haptics(){return haptics}};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAudio()});
  function toast(msg){
    let e=id('amenToast');
    if(!e){e=document.createElement('div');e.id='amenToast';e.className='amen-toast';e.setAttribute('role','status');document.body.appendChild(e)}
    e.textContent=msg;e.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>e.classList.remove('show'),1700);
  }
  const initials=n=>(n||'PF').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'PF';

  function syncProfile(){
    const chip=$('.profile-chip'),avatar=$('.profile-avatar');
    if(avatar)avatar.textContent=initials(profile?.name);
    if(chip){
      const strong=$('div strong',chip),small=$('div small',chip);
      if(strong)strong.textContent=profile?.name||tr('Crear perfil','Create profile');
      if(small)small.textContent=profile?.email||tr('Acceso rápido','Quick access');
    }
    const navIcon=$('#amenBottomNav [data-amen-nav="profile"] i');if(navIcon)navIcon.textContent=profile?initials(profile.name):'◎';
  }
  function syncSound(){
    try{localStorage.setItem(SOUND_KEY,sound?'on':'off');localStorage.setItem(VOLUME_KEY,String(volume))}catch{}
    $$('[data-amen-sound-toggle]').forEach(b=>{b.textContent=sound?tr('Activado','On'):tr('Desactivado','Off');b.classList.toggle('on',sound);b.classList.toggle('active',sound);b.setAttribute('aria-pressed',String(sound))});
    $$('[data-amen-volume]').forEach(r=>r.value=String(Math.round(volume*100)));
    $$('[data-amen-volume-value]').forEach(e=>e.textContent=Math.round(volume*100)+'%');
    if(!sound||volume===0){if(ctx){ctx.close().catch(()=>{});ctx=null}}
    document.dispatchEvent(new CustomEvent('pf:preferences-changed'));
  }

  function profileData(){
    const o=id('amenProfileOverlay');if(!o)return;
    const f=id('amenProfileForm');
    if(f){f.elements.name.value=profile?.name||'';f.elements.email.value=profile?.email||'';f.elements.phone.value=profile?.phone||'';f.elements.role.value=profile?.role||'buyer';f.elements.area.value=profile?.area||'Wilmington, NC'}
    $('[data-amen-avatar]',o).textContent=initials(profile?.name);
    $('[data-amen-status-title]',o).textContent=profile?profile.name:tr('Crea tu perfil en menos de un minuto','Create your profile in under a minute');
    $('[data-amen-status-copy]',o).textContent=profile?(profile.email||tr('Perfil guardado en este dispositivo','Profile saved on this device')):tr('Guarda favoritos y recorridos con acceso rápido.','Save favorites and routes with quick access.');
  }
  function ensureProfile(){
    let o=id('amenProfileOverlay');if(o)return o;
    o=document.createElement('div');o.id='amenProfileOverlay';o.className='amen-profile-overlay';
    o.innerHTML=`<section class="amen-profile-card" role="dialog" aria-modal="true" aria-labelledby="amenProfileTitle">
      <header class="amen-profile-head"><div><small>PROFOLIO · ${tr('PERFIL LOCAL','LOCAL PROFILE')}</small><h2 id="amenProfileTitle">${tr('Perfil y preferencias','Profile & preferences')}</h2></div><button class="amen-close" type="button" data-amen-close aria-label="${tr('Cerrar','Close')}">×</button></header>
      <div class="amen-profile-body">
        <p class="amen-local-note">${tr('Este perfil se guarda solo en este navegador. No es una cuenta en línea ni activa contactos con agentes.','Saved only on this device. This is not an online account and cannot contact agents.')}</p>
        <div class="amen-profile-status"><span class="amen-avatar" data-amen-avatar>PF</span><div><b data-amen-status-title></b><small data-amen-status-copy></small></div></div>
        <form class="amen-form" id="amenProfileForm">
          <label><span>${tr('Nombre','Name')}</span><input name="name" autocomplete="name" required maxlength="60" placeholder="${tr('Tu nombre','Your name')}"></label>
          <label><span>${tr('Correo','Email')}</span><input name="email" type="email" autocomplete="email" required maxlength="100" placeholder="nombre@email.com"></label>
          <label><span>${tr('Teléfono','Phone')}</span><input name="phone" autocomplete="tel" maxlength="30" placeholder="+1 910..."></label>
          <label><span>${tr('Perfil','Role')}</span><select name="role"><option value="buyer">${tr('Comprador / Inversionista','Buyer / Investor')}</option><option value="agent">${tr('Agente','Agent')}</option><option value="seller">${tr('Propietario / Vendedor','Owner / Seller')}</option></select></label>
          <label class="full"><span>${tr('Zona principal','Main area')}</span><input name="area" maxlength="80" placeholder="Wilmington, NC"></label>
        </form>
        <div class="amen-profile-actions"><button class="amen-save" type="submit" form="amenProfileForm">${tr('Guardar perfil','Save profile')}</button><button class="amen-secondary" type="button" data-amen-settings>${tr('Configuración general','General settings')}</button></div>
        <section class="amen-sound"><div class="amen-sound-head"><div><strong>${tr('Sonido de interacción','Interaction sound')}</strong><small>${tr('Timbre al abrir propiedades, señal de recorrido, confirmación y navegación.','Four distinctive cues for property details, tours, confirmations and navigation.')}</small></div><button class="amen-toggle" type="button" data-amen-sound-toggle></button></div><label class="amen-volume"><span>${tr('Volumen','Volume')}</span><input data-amen-volume aria-label="Interaction volume" type="range" min="0" max="100" step="5"><b data-amen-volume-value></b></label></section>
      </div></section>`;
    document.body.appendChild(o);
    o.addEventListener('click',e=>{
      if(e.target===o||e.target.closest('[data-amen-close]')){o.classList.remove('open');document.body.style.overflow='';return}
      if(e.target.closest('[data-amen-sound-toggle]')){sound=!sound;syncSound();if(sound)playSound('nav')}
      if(e.target.closest('[data-amen-settings]')){o.classList.remove('open');document.body.style.overflow='';setTimeout(()=>id('pfSettingsBtn')?.click(),60)}
    });
    o.addEventListener('input',e=>{if(e.target.matches('[data-amen-volume]')){volume=Math.max(0,Math.min(1,Number(e.target.value)/100));syncSound()}});
    id('amenProfileForm').addEventListener('submit',e=>{
      e.preventDefault();const d=new FormData(e.currentTarget);
      profile={name:String(d.get('name')||'').trim(),email:String(d.get('email')||'').trim(),phone:String(d.get('phone')||'').trim(),role:String(d.get('role')||'buyer'),area:String(d.get('area')||'').trim(),updatedAt:Date.now()};
      write(PROFILE_KEY,profile);syncProfile();profileData();playSound('confirm');toast(tr('Perfil guardado.','Profile saved.'));
    });
    profileData();syncSound();return o;
  }
  function openProfile(){const o=ensureProfile();profileData();syncSound();o.classList.add('open');document.body.style.overflow='hidden';setTimeout(()=>$('input[name="name"]',o)?.focus(),30)}

  function installBottom(){
    if(id('amenBottomNav'))return;
    const n=document.createElement('nav');n.id='amenBottomNav';n.className='amen-bottom-nav';n.setAttribute('aria-label',tr('Navegación rápida ProFolio','ProFolio quick navigation'));
    n.innerHTML=`<button type="button" class="active" aria-current="page" data-amen-nav="home"><i>⌂</i><span>${tr('Inicio','Home')}</span></button><button type="button" data-amen-nav="map"><i>▧</i><span>${tr('Mapa','Map')}</span></button><button type="button" data-amen-nav="favorites"><i>♡</i><span>${tr('Favoritos','Favorites')}</span></button><button type="button" data-amen-nav="tour"><i>↝</i><span>Open Tour</span></button><button type="button" data-amen-nav="drafts"><i>＋</i><span>${tr('Borradores','Drafts')}</span></button><button type="button" data-amen-nav="profile"><i>◎</i><span>${tr('Perfil','Profile')}</span></button>`;
    document.body.appendChild(n);syncProfile();
    n.addEventListener('click',e=>{const b=e.target.closest('[data-amen-nav]');if(!b)return;const a=b.dataset.amenNav;
      if(a!=='tour'&&!id('tourPanel')?.hidden)id('closeTourBtn')?.click();
      if(a==='home')window.scrollTo({top:0,behavior:'smooth'});
      if(a==='map'){if(id('favoritesBtn')?.getAttribute('aria-pressed')==='true')id('favoritesBtn').click();id('mapViewBtn')?.click();id('market-section')?.scrollIntoView({behavior:'smooth',block:'start'})}
      if(a==='favorites'){if(id('favoritesBtn')?.getAttribute('aria-pressed')!=='true')id('favoritesBtn')?.click();id('listViewBtn')?.click();id('properties-section')?.scrollIntoView({behavior:'smooth',block:'start'})}
      if(a==='tour')id('navTour')?.click();
      if(a==='drafts')id('navPortfolio')?.click();
      if(a==='profile')openProfile();
      $$('#amenBottomNav button').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-current',active?'page':'false')});playSound(a==='tour'?'tour':'nav');
    });
  }
  function enhanceSettings(){
    const body=$('#pfSettingsBackdrop .pf-settings-body');if(!body||$('.pf-setting-sound-row',body))return;
    const row=document.createElement('div');row.className='pf-setting-row pf-setting-sound-row';
    row.innerHTML=`<div class="pf-setting-copy"><strong>${tr('Sonido de interacción','Interaction sound')}</strong><small>${tr('Controla los timbres y la señal breve de navegación.','Control four cues: property, tour, confirmation and navigation.')}</small></div><div class="amen-setting-sound"><button type="button" data-amen-sound-toggle></button></div>`;
    body.insertBefore(row,$('.pf-settings-note',body));row.addEventListener('click',e=>{if(e.target.closest('[data-amen-sound-toggle]')){sound=!sound;syncSound();if(sound)playSound('nav')}});syncSound();
  }

  const isAdding=b=>/^\s*(\+|♡|Guardar|Save)/i.test((b?.textContent||'').trim());
  function soundForControl(b){
    if(!b||b.closest('#amenProfileOverlay,#amenBottomNav,#pfSettingsBackdrop'))return;
    if(b.matches('[data-focus]'))return playSound('door');
    if(b.matches('[data-tour],[data-pf-tour],[data-poptour]')&&isAdding(b))return playSound('tour');
    if(b.matches('[data-fav],[data-pf-fav]')&&isAdding(b))return playSound('confirm');
    if(b.id==='navTour'||b.id==='openHouseAction'||b.id==='browseOpenHouse')return playSound('tour');
    if(b.id==='valueCoreAction'||b.id==='createAction')return playSound('nav');
    if(b.id==='saveTourBtn'&&Number(id('tourStops')?.textContent||0)>0)return playSound('confirm');
    if(b.matches('#filters button,#homeBtn,#mapViewBtn,#listViewBtn,#wilmingtonFocus,#favoritesBtn,.premium-nav button,.top-links button,[data-premium-action]'))return playSound('nav');
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('.profile-chip')){e.preventDefault();e.stopImmediatePropagation();playSound('nav');openProfile();return}
    if(e.target.closest('#pfSettingsBtn'))setTimeout(enhanceSettings,50);
    soundForControl(e.target.closest('button,[role="button"],a'));
  },true);
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest?.('.profile-chip')){e.preventDefault();e.stopImmediatePropagation();playSound('nav');openProfile()}if(e.key==='Escape'&&id('amenProfileOverlay')?.classList.contains('open')){id('amenProfileOverlay').classList.remove('open');document.body.style.overflow=''}},true);

  // Keep a single interactive category filter. The map has its own optional legend.
  id('amenMapKey')?.remove();installBottom();syncProfile();syncSound();
  document.addEventListener('pf:language-changed',()=>{
    id('amenProfileOverlay')?.remove();
    $('.pf-setting-sound-row')?.remove();
    id('amenBottomNav')?.remove();
    id('amenMapKey')?.remove();
    installBottom();syncProfile();syncSound();
  });
  window.addEventListener('load',()=>{setTimeout(()=>{installBottom();syncProfile()},180)});
})();
