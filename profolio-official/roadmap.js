(() => {
  'use strict';
  const $ = q => document.querySelector(q);
  const syncTheme = () => {
    const dark = document.body.classList.contains('pf-dark');
    $('#themeToggle').textContent = dark ? '☀ Day mode' : '☾ Night mode';
    $('#themeToggle').setAttribute('aria-pressed', String(dark));
  };
  $('#themeToggle').addEventListener('click', () => document.dispatchEvent(new CustomEvent('pf:set-theme', {detail:{theme:document.body.classList.contains('pf-dark') ? 'light' : 'dark'}})));
  document.addEventListener('pf:theme-changed', syncTheme);
  syncTheme();
  const story = $('#brandStory');
  document.querySelectorAll('[data-brand-story]').forEach(b => b.addEventListener('click', () => story.showModal()));
  $('.wordmark').addEventListener('click', e => {e.preventDefault();story.showModal();});
  $('[data-close-story]').addEventListener('click', () => story.close());
  story.addEventListener('click', e => {if(e.target === story){const r=story.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)story.close();}});
  $('#openHouseAction').addEventListener('click', () => $('#openHouseIntro').showModal());
  $('[data-close-open-house]').addEventListener('click', () => $('#openHouseIntro').close());
  $('#browseOpenHouse').addEventListener('click', () => {$('#openHouseIntro').close();$('#homeBtn').click();$('#listViewBtn').click();$('#properties-section').scrollIntoView({behavior:'instant'});});
  $('#valueCoreAction').addEventListener('click', () => {$('#pfValueCoreTitle').scrollIntoView({behavior:'instant',block:'center'});$('#pfValueCoreTitle').focus({preventScroll:true});});
  $('#createAction').addEventListener('click', () => $('#publishBtn').click());
  const syncSensory=()=>{
    const prefs=window.__pfSound;if(!prefs)return;
    $('#sensorySound').checked=prefs.enabled;
    $('#sensoryHaptics').checked=prefs.haptics;
    $('#sensoryVolume').value=String(Math.round(prefs.volume*100));
    $('#sensoryVolumeValue').textContent=Math.round(prefs.volume*100)+'%';
    $('#hapticsSupport').textContent=typeof navigator.vibrate==='function'?'Vibration is available where your device permits it.':'Vibration is not supported by this browser; visual feedback remains available.';
  };
  $('#sensoryToggle').addEventListener('click',()=>{syncSensory();$('#sensoryDialog').showModal();});
  $('[data-close-sensory]').addEventListener('click',()=>$('#sensoryDialog').close());
  $('#sensorySound').addEventListener('change',e=>window.__pfSound.configure({enabled:e.target.checked}));
  $('#sensoryHaptics').addEventListener('change',e=>window.__pfSound.configure({haptics:e.target.checked}));
  $('#sensoryVolume').addEventListener('input',e=>window.__pfSound.configure({volume:Number(e.target.value)/100}));
  $('#muteAll').addEventListener('click',()=>window.__pfSound.configure({enabled:false,haptics:false}));
  document.querySelectorAll('[data-sound-preview]').forEach(b=>b.addEventListener('click',()=>window.__pfSound.play(b.dataset.soundPreview)));
  document.addEventListener('pf:preferences-changed',syncSensory);
})();
