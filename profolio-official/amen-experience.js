(()=>{
  'use strict';

  const PROFILE_KEY='pf_amen_profile_v1';
  const SOUND_KEY='pf_amen_sound_v1';
  const VOLUME_KEY='pf_amen_volume_v1';
  const $=(q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const byId=id=>document.getElementById(id);
  const readJSON=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const writeJSON=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  const lang=()=>document.documentElement.lang==='en'?'en':'es';
  const tr=(es,en)=>lang()==='en'?en:es;

  let profile=readJSON(PROFILE_KEY,null);
  let soundEnabled=localStorage.getItem(SOUND_KEY)!=='off';
  let soundVolume=Math.min(1,Math.max(.05,Number(localStorage.getItem(VOLUME_KEY)||.32)));
  let audioCtx=null;
  let toastTimer=0;

  const toast=(message)=>{
    let el=byId('amenToast');
    if(!el){
      el=document.createElement('div');
      el.id='amenToast';
      el.className='amen-toast';
      el.setAttribute('role','status');
      el.setAttribute('aria-live','polite');
      document.body.appendChild(el);
    }
    el.textContent=message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove('show'),1800);
  };

  const playTone=(kind='tap')=>{
    if(!soundEnabled) return;
    try{
      audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended') audioCtx.resume();
      const osc=audioCtx.createOscillator();
      const gain=audioCtx.createGain();
      const now=audioCtx.currentTime;
      const notes={tap:560,save:720,open:630,close:410};
      osc.frequency.setValueAtTime(notes[kind]||560,now);
      osc.frequency.exponentialRampToValueAtTime((notes[kind]||560)*1.08,now+.045);
      gain.gain.setValueAtTime(0.0001,now);
      gain.gain.exponentialRampToValueAtTime(Math.max(.006,soundVolume*.08),now+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,now+.075);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(now); osc.stop(now+.085);
    }catch{}
  };

  const initials=(name)=>{
    const value=(name||'PF').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
    return value||'PF';
  };

  const syncProfileUI=()=>{
    const avatar=$('.profile-avatar');
    const chip=$('.profile-chip');
    const strong=chip?.querySelector('div strong');
    const small=chip?.querySelector('div small');
    if(avatar) avatar.textContent=initials(profile?.name);
    if(strong) strong.textContent=profile?.name||tr('Crear perfil','Create profile');
    if(small) small.textContent=profile?.email||tr('Acceso rápido','Quick access');
    const navAvatar=$('.amen-bottom-nav [data-amen-nav="profile"] i');
    if(navAvatar) navAvatar.textContent=profile?initials(profile.name):'◎';
  };

  const syncSoundUI=()=>{
    localStorage.setItem(SOUND_KEY,soundEnabled?'on':'off');
    localStorage.setItem(VOLUME_KEY,String(soundVolume));
    $$('[data-amen-sound-toggle]').forEach(btn=>{
      btn.classList.toggle('on',soundEnabled);
      btn.classList.toggle('active',soundEnabled);
      btn.setAttribute('aria-pressed',String(soundEnabled));
      btn.textContent=soundEnabled?tr('Activado','On'):tr('Desactivado','Off');
    });
    $$('[data-amen-volume]').forEach(input=>{input.value=String(Math.round(soundVolume*100))});
    $$('[data-amen-volume-value]').forEach(el=>{el.textContent=Math.round(soundVolume*100)+'%'});
  };

  const closeProfile=()=>{
    byId('amenProfileOverlay')?.classList.remove('open');
    document.body.style.overflow='';
    playTone('close');
  };

  const renderProfile=()=>{
    let overlay=byId('amenProfileOverlay');
    if(!overlay){
      overlay=document.createElement('div');
      overlay.id='amenProfileOverlay';
      overlay.className='amen-profile-overlay';
      overlay.innerHTML=`
        <section class="amen-profile-card" role="dialog" aria-modal="true" aria-labelledby="amenProfileTitle">
          <header class="amen-profile-head">
            <div><small>PROFOLIO · ${tr('MI CUENTA','MY ACCOUNT')}</small><h2 id="amenProfileTitle">${tr('Perfil y preferencias','Profile & preferences')}</h2></div>
            <button class="amen-close" type="button" data-amen-close aria-label="${tr('Cerrar','Close')}">×</button>
          </header>
          <div class="amen-profile-body">
            <div class="amen-profile-status">
              <span class="amen-avatar" data-amen-avatar>PF</span>
              <div><b data-amen-status-title></b><small data-amen-status-copy></small></div>
            </div>
            <form class="amen-form" id="amenProfileForm">
              <label><span>${tr('Nombre','Name')}</span><input name="name" autocomplete="name" required maxlength="60" placeholder="${tr('Tu nombre','Your name')}"></label>
              <label><span>${tr('Correo','Email')}</span><input name="email" type="email" autocomplete="email" required maxlength="100" placeholder="nombre@email.com"></label>
              <label><span>${tr('Teléfono','Phone')}</span><input name="phone" autocomplete="tel" maxlength="30" placeholder="+1 910..."></label>
              <label><span>${tr('Perfil','Role')}</span><select name="role"><option value="buyer">${tr('Comprador / Inversionista','Buyer / Investor')}</option><option value="agent">${tr('Agente','Agent')}</option><option value="seller">${tr('Propietario / Vendedor','Owner / Seller')}</option></select></label>
              <label class="full"><span>${tr('Zona principal','Main area')}</span><input name="area" maxlength="80" placeholder="Wilmington, NC"></label>
            </form>
            <div class="amen-profile-actions">
              <button class="amen-save" type="submit" form="amenProfileForm">${tr('Guardar perfil','Save profile')}</button>
              <button class="amen-secondary" type="button" data-amen-settings>${tr('Configuración general','General settings')}</button>
            </div>
            <section class="amen-sound" aria-label="${tr('Sonido de interacción','Interaction sound')}">
              <div class="amen-sound-head"><div><strong>${tr('Sonido de interacción','Interaction sound')}</strong><small>${tr('Confirmaciones suaves al tocar botones y guardar acciones.','Soft confirmations when tapping buttons and saving actions.')}</small></div><button class="amen-toggle" type="button" data-amen-sound-toggle></button></div>
              <label class="amen-volume"><span>${tr('Volumen','Volume')}</span><input data-amen-volume type="range" min="5" max="100" step="5"><b data-amen-volume-value></b></label>
            </section>
          </div>
        </section>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-amen-close]')) closeProfile()});
      overlay.querySelector('#amenProfileForm').addEventListener('submit',e=>{
        e.preventDefault();
        const fd=new FormData(e.currentTarget);
        profile={
          name:String(fd.get('name')||'').trim(),
          email:String(fd.get('email')||'').trim(),
          phone:String(fd.get('phone')||'').trim(),
          role:String(fd.get('role')||'buyer'),
          area:String(fd.get('area')||'').trim(),
          updatedAt:Date.now()
        };
        writeJSON(PROFILE_KEY,profile);
        syncProfileUI();
        renderProfileData();
        playTone('save');
        toast(tr('Perfil guardado.','Profile saved.'));
      });
      overlay.addEventListener('click',e=>{
        const toggle=e.target.closest('[data-amen-sound-toggle]');
        if(toggle){soundEnabled=!soundEnabled;syncSoundUI();if(soundEnabled)playTone('open');}
        const settings=e.target.closest('[data-amen-settings]');
        if(settings){closeProfile();setTimeout(()=>byId('pfSettingsBtn')?.click(),80)}
      });
      overlay.addEventListener('input',e=>{
        if(e.target.matches('[data-amen-volume]')){
          soundVolume=Math.max(.05,Math.min(1,Number(e.target.value)/100));
          syncSoundUI();
        }
      });
    }
    renderProfileData();
    syncSoundUI();
    return overlay;
  };

  const renderProfileData=()=>{
    const overlay=byId('amenProfileOverlay');
    if(!overlay) return;
    const form=overlay.querySelector('#amenProfileForm');
    if(form){
      form.elements.name.value=profile?.name||'';
      form.elements.email.value=profile?.email||'';
      form.elements.phone.value=profile?.phone||'';
      form.elements.role.value=profile?.role||'buyer';
      form.elements.area.value=profile?.area||'Wilmington, NC';
    }
    const avatar=overlay.querySelector('[data-amen-avatar]');
    const title=overlay.querySelector('[data-amen-status-title]');
    const copy=overlay.querySelector('[data-amen-status-copy]');
    if(avatar) avatar.textContent=initials(profile?.name);
    if(title) title.textContent=profile?profile.name:tr('Crea tu perfil en menos de un minuto','Create your profile in under a minute');
    if(copy) copy.textContent=profile?(profile.email||tr('Perfil guardado en este dispositivo','Profile saved on this device')):tr('Guarda favoritos y organiza tus recorridos con acceso rápido.','Save favorites and organize routes with quick access.');
  };

  const openProfile=()=>{
    const overlay=renderProfile();
    overlay.classList.add('open');
    document.body.style.overflow='hidden';
    setTimeout(()=>overlay.querySelector('input[name="name"]')?.focus(),40);
    playTone('open');
  };

  const simpleAction=(action)=>{
    const actions={
      home:()=>window.scrollTo({top:0,behavior:'smooth'}),
      map:()=>{byId('mapViewBtn')?.click();(byId('market-section')||$('.map-card'))?.scrollIntoView({behavior:'smooth',block:'start'})},
      favorites:()=>{byId('favoritesBtn')?.click();byId('properties-section')?.scrollIntoView({behavior:'smooth',block:'start'});toast(tr('Mostrando tus propiedades guardadas.','Showing your saved properties.'))},
      tour:()=>{byId('navTour')?.click();if(!byId('navTour')) byId('tourBarOpen')?.click()},
      profile:openProfile
    };
    actions[action]?.();
    $$('.amen-bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.amenNav===action));
  };

  const installBottomNav=()=>{
    if(byId('amenBottomNav')) return;
    const nav=document.createElement('nav');
    nav.id='amenBottomNav';
    nav.className='amen-bottom-nav';
    nav.setAttribute('aria-label',tr('Navegación rápida ProFolio','ProFolio quick navigation'));
    nav.innerHTML=`
      <button type="button" class="active" data-amen-nav="home"><i>⌂</i><span>${tr('Inicio','Home')}</span></button>
      <button type="button" data-amen-nav="map"><i>▧</i><span>${tr('Mapa','Map')}</span></button>
      <button type="button" data-amen-nav="favorites"><i>♡</i><span>${tr('Favoritos','Favorites')}</span></button>
      <button type="button" data-amen-nav="tour"><i>↝</i><span>Open Tour</span></button>
      <button type="button" data-amen-nav="profile"><i>◎</i><span>${tr('Perfil','Profile')}</span></button>`;
    document.body.appendChild(nav);
    nav.addEventListener('click',e=>{
      const btn=e.target.closest('[data-amen-nav]');
      if(btn){simpleAction(btn.dataset.amenNav);playTone('tap')}
    });
    syncProfileUI();
  };

  const filterButton=(label)=>{
    const normalized=label.toLowerCase();
    return $$('#filters button').find(b=>(b.textContent||'').trim().toLowerCase()===normalized);
  };

  const installMapKey=()=>{
    const wrap=$('.map-wrap');
    if(!wrap||byId('amenMapKey')) return;
    const key=document.createElement('div');
    key.id='amenMapKey';
    key.className='amen-map-key';
    key.setAttribute('aria-label',tr('Simbología rápida del mapa','Quick map legend'));
    key.innerHTML=`
      <button type="button" class="coverage" data-amen-map="coverage">◎ ${tr('Cobertura','Coverage')}</button>
      <button type="button" data-amen-map="regular">● ${tr('Regular','Regular')}</button>
      <button type="button" data-amen-map="premium">▲ Premium</button>
      <button type="button" data-amen-map="feature">◇ ${tr('Oportunidad','Opportunity')}</button>
      <button type="button" data-amen-map="turbo">ϟ Turbo</button>`;
    wrap.appendChild(key);
    key.addEventListener('click',e=>{
      const btn=e.target.closest('[data-amen-map]');
      if(!btn) return;
      const k=btn.dataset.amenMap;
      if(k==='coverage') byId('homeBtn')?.click();
      else {
        const labels={regular:'Regular',premium:'Premium',feature:tr('Oportunidad','Opportunity'),turbo:'Turbo'};
        (filterButton(labels[k])||filterButton(k==='feature'?'Oportunidad':labels[k]))?.click();
      }
      $$('.amen-map-key button').forEach(x=>x.classList.toggle('active',x===btn));
      playTone('tap');
    });
  };

  const enhanceSettings=()=>{
    const body=$('#pfSettingsBackdrop .pf-settings-body');
    if(!body||body.querySelector('.pf-setting-sound-row')) return;
    const row=document.createElement('div');
    row.className='pf-setting-row pf-setting-sound-row';
    row.innerHTML=`<div class="pf-setting-copy"><strong>${tr('Sonido de interacción','Interaction sound')}</strong><small>${tr('Activa o desactiva las confirmaciones suaves de la interfaz.','Enable or disable soft interface confirmations.')}</small></div><div class="amen-setting-sound"><button type="button" data-amen-sound-toggle></button></div>`;
    body.insertBefore(row,body.querySelector('.pf-settings-note'));
    row.addEventListener('click',e=>{
      if(e.target.closest('[data-amen-sound-toggle]')){
        soundEnabled=!soundEnabled;
        syncSoundUI();
        if(soundEnabled) playTone('open');
      }
    });
    syncSoundUI();
    installBasicButtons();
  };

  const wireEasyProfileAccess=()=>{
    document.addEventListener('click',e=>{
      const chip=e.target.closest('.profile-chip');
      if(chip){
        e.preventDefault();
        e.stopImmediatePropagation();
        openProfile();
      }
    },true);
    document.addEventListener('keydown',e=>{
      if((e.key==='Enter'||e.key===' ')&&e.target.closest?.('.profile-chip')){
        e.preventDefault();e.stopImmediatePropagation();openProfile();
      }
      if(e.key==='Escape'&&byId('amenProfileOverlay')?.classList.contains('open')) closeProfile();
    },true);
  };

  const installSoundFeedback=()=>{
    document.addEventListener('click',e=>{
      const btn=e.target.closest('button,a[role="button"]');
      if(!btn||btn.closest('#amenProfileOverlay')||btn.closest('#amenBottomNav')||btn.closest('#pfSettingsBackdrop')) return;
      playTone('tap');
    },false);
  };

  const openSimpleModal=(title,kicker,body)=>{
    const modal=byId('modal'),card=byId('modalCard');if(!modal||!card)return;
    card.innerHTML='<div class="premium-modal-head"><div><small>'+kicker+'</small><h2>'+title+'</h2></div><button class="premium-modal-close" type="button" data-amen-basic-close>×</button></div>'+body;
    modal.classList.add('show','open','visible');modal.setAttribute('aria-hidden','false');
    card.querySelector('[data-amen-basic-close]')?.addEventListener('click',()=>{modal.classList.remove('show','open','visible');modal.setAttribute('aria-hidden','true');card.innerHTML=''})
  };

  const installBasicButtons=()=>{
    const bind=(id,fn)=>{const el=byId(id);if(el&&!el.dataset.amenBasicBound){el.dataset.amenBasicBound='1';el.addEventListener('click',fn)}};
    bind('turboBtn',()=>{const b=$('#filters button').find(x=>(x.textContent||'').trim()==='Turbo');b?.click();byId('properties-section')?.scrollIntoView({behavior:'smooth',block:'start'});toast(tr('Mostrando oportunidades Turbo.','Showing Turbo opportunities.'))});
    bind('navPortfolio',()=>byId('turboBtn')?.click());
    bind('navVideos',()=>openSimpleModal(tr('Video Open House','Video Open House'),'PROFOLIO · OPEN HOUSE','<p class="premium-answer">'+tr('Acceso simple a los recorridos y videos de las propiedades y sectores. Selecciona una propiedad desde la ficha para continuar el recorrido.','Simple access to property and area tours and videos. Select a property card to continue.')+'</p>'));
    bind('navHelp',()=>openSimpleModal(tr('Guía de ProFolio','ProFolio Guide'),'PROFOLIO · VALUE CORE','<div class="premium-grid"><div class="premium-kpi"><strong>1</strong><small>'+tr('Explora el mapa','Explore the map')+'</small></div><div class="premium-kpi"><strong>2</strong><small>'+tr('Guarda favoritos','Save favorites')+'</small></div><div class="premium-kpi"><strong>3</strong><small>'+tr('Arma un Open Tour','Build an Open Tour')+'</small></div><div class="premium-kpi"><strong>4</strong><small>'+tr('Crea tu perfil','Create your profile')+'</small></div></div>'));
    bind('helpBtn',()=>byId('navHelp')?.click());
    bind('publishBtn',()=>{
      openSimpleModal(tr('Registrar oportunidad','Register opportunity'),'PROFOLIO · OFF-MARKET','<form id="amenQuickProperty" class="amen-form"><label class="full">'+tr('Nombre o dirección','Name or address')+'<input name="title" required maxlength="100" placeholder="'+tr('Ej. Propiedad detectada en Wilmington','E.g. Wilmington opportunity')+'"></label><label>'+tr('Sector','Area')+'<input name="zone" maxlength="80" placeholder="Wilmington"></label><label>ZIP<input name="zip" maxlength="10" placeholder="28401"></label></form><div class="amen-profile-actions"><button class="amen-save" type="submit" form="amenQuickProperty">'+tr('Guardar ficha','Save record')+'</button></div>');
      const form=byId('amenQuickProperty');form?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form),all=readJSON('pf_quick_properties_v1',[]);all.unshift({id:'draft-'+Date.now(),title:String(fd.get('title')||'').trim(),zone:String(fd.get('zone')||'').trim(),zip:String(fd.get('zip')||'').trim(),createdAt:Date.now()});writeJSON('pf_quick_properties_v1',all.slice(0,50));playTone('save');toast(tr('Ficha guardada en este dispositivo.','Record saved on this device.'));byId('modal')?.classList.remove('show','open','visible')})
    });
  };

  const maintain=()=>{
    installBottomNav();
    installMapKey();
    enhanceSettings();
    syncProfileUI();
    syncSoundUI();
    installBasicButtons();
  };

  wireEasyProfileAccess();
  installSoundFeedback();
  maintain();
  const observer=new MutationObserver(()=>maintain());
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('storage',maintain);
  window.addEventListener('load',()=>setTimeout(maintain,200));
})();