(()=>{
  'use strict';
  const PROFILE_KEY='pf_profile_v2', SOUND_KEY='pf_sound_v2', VOLUME_KEY='pf_sound_volume_v2';
  const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>Array.from(r.querySelectorAll(q)), id=x=>document.getElementById(x);
  const tr=(es,en)=>document.documentElement.lang==='en'?en:es;
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  let profile=read(PROFILE_KEY,null);
  let sound=localStorage.getItem(SOUND_KEY)!=='off';
  let volume=Math.max(.05,Math.min(1,Number(localStorage.getItem(VOLUME_KEY)||.32)));
  let ctx=null,timer=0;

  function tone(freq=560){
    if(!sound)return;
    try{
      ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();
      if(ctx.state==='suspended')ctx.resume();
      const o=ctx.createOscillator(),g=ctx.createGain(),n=ctx.currentTime;
      o.frequency.setValueAtTime(freq,n);
      g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(Math.max(.006,volume*.08),n+.008);g.gain.exponentialRampToValueAtTime(.0001,n+.08);
      o.connect(g);g.connect(ctx.destination);o.start(n);o.stop(n+.09);
    }catch{}
  }
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
    localStorage.setItem(SOUND_KEY,sound?'on':'off');localStorage.setItem(VOLUME_KEY,String(volume));
    $$('[data-amen-sound-toggle]').forEach(b=>{b.textContent=sound?tr('Activado','On'):tr('Desactivado','Off');b.classList.toggle('on',sound);b.classList.toggle('active',sound);b.setAttribute('aria-pressed',String(sound))});
    $$('[data-amen-volume]').forEach(r=>r.value=String(Math.round(volume*100)));
    $$('[data-amen-volume-value]').forEach(e=>e.textContent=Math.round(volume*100)+'%');
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
      <header class="amen-profile-head"><div><small>PROFOLIO · ${tr('MI CUENTA','MY ACCOUNT')}</small><h2 id="amenProfileTitle">${tr('Perfil y preferencias','Profile & preferences')}</h2></div><button class="amen-close" type="button" data-amen-close aria-label="${tr('Cerrar','Close')}">×</button></header>
      <div class="amen-profile-body">
        <div class="amen-profile-status"><span class="amen-avatar" data-amen-avatar>PF</span><div><b data-amen-status-title></b><small data-amen-status-copy></small></div></div>
        <form class="amen-form" id="amenProfileForm">
          <label><span>${tr('Nombre','Name')}</span><input name="name" autocomplete="name" required maxlength="60" placeholder="${tr('Tu nombre','Your name')}"></label>
          <label><span>${tr('Correo','Email')}</span><input name="email" type="email" autocomplete="email" required maxlength="100" placeholder="nombre@email.com"></label>
          <label><span>${tr('Teléfono','Phone')}</span><input name="phone" autocomplete="tel" maxlength="30" placeholder="+1 910..."></label>
          <label><span>${tr('Perfil','Role')}</span><select name="role"><option value="buyer">${tr('Comprador / Inversionista','Buyer / Investor')}</option><option value="agent">${tr('Agente','Agent')}</option><option value="seller">${tr('Propietario / Vendedor','Owner / Seller')}</option></select></label>
          <label class="full"><span>${tr('Zona principal','Main area')}</span><input name="area" maxlength="80" placeholder="Wilmington, NC"></label>
        </form>
        <div class="amen-profile-actions"><button class="amen-save" type="submit" form="amenProfileForm">${tr('Guardar perfil','Save profile')}</button><button class="amen-secondary" type="button" data-amen-settings>${tr('Configuración general','General settings')}</button></div>
        <section class="amen-sound"><div class="amen-sound-head"><div><strong>${tr('Sonido de interacción','Interaction sound')}</strong><small>${tr('Confirmaciones suaves al tocar y guardar.','Soft confirmations when tapping and saving.')}</small></div><button class="amen-toggle" type="button" data-amen-sound-toggle></button></div><label class="amen-volume"><span>${tr('Volumen','Volume')}</span><input data-amen-volume type="range" min="5" max="100" step="5"><b data-amen-volume-value></b></label></section>
      </div></section>`;
    document.body.appendChild(o);
    o.addEventListener('click',e=>{
      if(e.target===o||e.target.closest('[data-amen-close]')){o.classList.remove('open');document.body.style.overflow='';tone(410);return}
      if(e.target.closest('[data-amen-sound-toggle]')){sound=!sound;syncSound();if(sound)tone(680)}
      if(e.target.closest('[data-amen-settings]')){o.classList.remove('open');document.body.style.overflow='';setTimeout(()=>id('pfSettingsBtn')?.click(),60)}
    });
    o.addEventListener('input',e=>{if(e.target.matches('[data-amen-volume]')){volume=Math.max(.05,Math.min(1,Number(e.target.value)/100));syncSound()}});
    id('amenProfileForm').addEventListener('submit',e=>{
      e.preventDefault();const d=new FormData(e.currentTarget);
      profile={name:String(d.get('name')||'').trim(),email:String(d.get('email')||'').trim(),phone:String(d.get('phone')||'').trim(),role:String(d.get('role')||'buyer'),area:String(d.get('area')||'').trim(),updatedAt:Date.now()};
      write(PROFILE_KEY,profile);syncProfile();profileData();tone(720);toast(tr('Perfil guardado.','Profile saved.'));
    });
    profileData();syncSound();return o;
  }
  function openProfile(){const o=ensureProfile();profileData();syncSound();o.classList.add('open');document.body.style.overflow='hidden';setTimeout(()=>$('input[name="name"]',o)?.focus(),30);tone(630)}

  function installBottom(){
    if(id('amenBottomNav'))return;
    const n=document.createElement('nav');n.id='amenBottomNav';n.className='amen-bottom-nav';n.setAttribute('aria-label',tr('Navegación rápida ProFolio','ProFolio quick navigation'));
    n.innerHTML=`<button type="button" class="active" data-amen-nav="home"><i>⌂</i><span>${tr('Inicio','Home')}</span></button><button type="button" data-amen-nav="map"><i>▧</i><span>${tr('Mapa','Map')}</span></button><button type="button" data-amen-nav="favorites"><i>♡</i><span>${tr('Favoritos','Favorites')}</span></button><button type="button" data-amen-nav="tour"><i>↝</i><span>Open Tour</span></button><button type="button" data-amen-nav="profile"><i>◎</i><span>${tr('Perfil','Profile')}</span></button>`;
    document.body.appendChild(n);syncProfile();
    n.addEventListener('click',e=>{const b=e.target.closest('[data-amen-nav]');if(!b)return;const a=b.dataset.amenNav;
      if(a==='home')window.scrollTo({top:0,behavior:'smooth'});
      if(a==='map'){id('mapViewBtn')?.click();id('market-section')?.scrollIntoView({behavior:'smooth',block:'start'})}
      if(a==='favorites'){id('favoritesBtn')?.click();id('properties-section')?.scrollIntoView({behavior:'smooth',block:'start'})}
      if(a==='tour')id('navTour')?.click();
      if(a==='profile')openProfile();
      $$('#amenBottomNav button').forEach(x=>x.classList.toggle('active',x===b));tone(560);
    });
  }
  function filter(label){return $$('#filters button').find(b=>(b.textContent||'').trim().toLowerCase()===label.toLowerCase())}
  function installMapKey(){
    const w=$('.map-wrap');if(!w||id('amenMapKey'))return;
    const k=document.createElement('div');k.id='amenMapKey';k.className='amen-map-key';k.setAttribute('aria-label',tr('Simbología rápida del mapa','Quick map legend'));
    k.innerHTML=`<button type="button" class="coverage" data-amen-map="coverage">◎ ${tr('Cobertura','Coverage')}</button><button type="button" data-amen-map="regular">● Regular</button><button type="button" data-amen-map="premium">▲ Premium</button><button type="button" data-amen-map="feature">◇ ${tr('Oportunidad','Opportunity')}</button><button type="button" data-amen-map="turbo">ϟ Turbo</button>`;
    w.appendChild(k);k.addEventListener('click',e=>{const b=e.target.closest('[data-amen-map]');if(!b)return;const a=b.dataset.amenMap;
      if(a==='coverage')id('homeBtn')?.click();else filter(a==='feature'?'Oportunidad':a[0].toUpperCase()+a.slice(1))?.click();
      $$('#amenMapKey button').forEach(x=>x.classList.toggle('active',x===b));tone(560);
    });
  }
  function enhanceSettings(){
    const body=$('#pfSettingsBackdrop .pf-settings-body');if(!body||$('.pf-setting-sound-row',body))return;
    const row=document.createElement('div');row.className='pf-setting-row pf-setting-sound-row';
    row.innerHTML=`<div class="pf-setting-copy"><strong>${tr('Sonido de interacción','Interaction sound')}</strong><small>${tr('Activa o desactiva las confirmaciones suaves.','Enable or disable soft confirmations.')}</small></div><div class="amen-setting-sound"><button type="button" data-amen-sound-toggle></button></div>`;
    body.insertBefore(row,$('.pf-settings-note',body));row.addEventListener('click',e=>{if(e.target.closest('[data-amen-sound-toggle]')){sound=!sound;syncSound();if(sound)tone(680)}});syncSound();
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('.profile-chip')){e.preventDefault();e.stopImmediatePropagation();openProfile();return}
    if(e.target.closest('#pfSettingsBtn'))setTimeout(enhanceSettings,50);
    const b=e.target.closest('button');if(b&&!b.closest('#amenProfileOverlay')&&!b.closest('#amenBottomNav')&&!b.closest('#pfSettingsBackdrop'))tone(540);
  },true);
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest?.('.profile-chip')){e.preventDefault();e.stopImmediatePropagation();openProfile()}if(e.key==='Escape'&&id('amenProfileOverlay')?.classList.contains('open')){id('amenProfileOverlay').classList.remove('open');document.body.style.overflow=''}},true);

  installBottom();installMapKey();syncProfile();syncSound();
  window.addEventListener('load',()=>{setTimeout(()=>{installBottom();installMapKey();syncProfile()},180)});
})();