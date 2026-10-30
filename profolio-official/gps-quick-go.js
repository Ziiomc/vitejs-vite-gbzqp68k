(()=>{
  'use strict';
  const form=document.getElementById('quickNavigationForm');
  if(!form||!window.ProFolioGPS)return;
  const input=document.getElementById('quickDestination');
  const status=document.getElementById('quickNavigationStatus');
  const button=document.getElementById('quickGoButton');
  if(/^es(?:-|$)/i.test(navigator.language||'')){button.textContent='Ir';button.setAttribute('aria-label','Ir a la dirección');}
  form.addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const url=window.ProFolioGPS.navigationURL(input.value,'driving');
      status.textContent='Opening directions in Google Maps…';
      window.location.assign(url);
    }catch(error){
      status.textContent=error.message||'Check the address and try again.';
      input.focus();
    }
  });
})();
