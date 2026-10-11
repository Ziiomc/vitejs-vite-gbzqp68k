(()=>{'use strict';
const $=q=>document.querySelector(q),L=(es,en)=>document.documentElement.lang==='en'?en:es,KEY='pf-demo-listings';let audio;
function play(mode){try{if(localStorage.getItem('pf_sound_v2')==='off')return}catch{}try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const n=audio.currentTime,v=Math.max(.003,Math.min(.035,Number(localStorage.getItem('pf_sound_volume_v2')||.3)*.04));(mode==='door'?[[330,0],[440,.13],[660,.27]]:mode==='turbo'?[[260,0],[420,.1],[580,.2]]:[[560,0],[750,.1]]).forEach(([freq,offset])=>{const o=audio.createOscillator(),g=audio.createGain(),start=n+offset;o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,start);g.gain.linearRampToValueAtTime(v,start+.02);g.gain.exponentialRampToValueAtTime(.0001,start+.16);o.connect(g);g.connect(audio.destination);o.start(start);o.stop(start+.17)})}catch(e){}}
function close(){const m=$('#modal');m?.classList.remove('show','open','visible');m?.setAttribute('aria-hidden','true');if($('#modalCard'))$('#modalCard').innerHTML=''}
function modal(title,body,hook){const m=$('#modal'),c=$('#modalCard');if(!m||!c)return;c.innerHTML='<div class="premium-modal-head"><div><small>PROFOLIO · PREVIEW</small><h2>'+title+'</h2></div><button type="button" class="premium-modal-close" id="launchClose">×</button></div>'+body;m.classList.add('show','open','visible');m.setAttribute('aria-hidden','false');$('#launchClose').onclick=close;if(hook)hook(c)}

const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storedDrafts=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(x=>x&&typeof x==='object').slice(0,30).map((x,i)=>({...x,id:String(x.id||'legacy-'+i)})):[]}catch{return[]}};
const persistDrafts=data=>{try{localStorage.setItem(KEY,JSON.stringify(data.slice(0,30)));return true}catch{return false}};
const usMoney=n=>Number(n||0).toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const newId=()=>globalThis.crypto?.randomUUID?.()||'local-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);
const drafts=storedDrafts;
const addressSummary=x=>[x.address,x.city,x.state,x.zip].filter(Boolean).join(', ');
function portfolio(){
  const data=drafts();
  const row=x=>'<article class="pf-draft-row"><div><strong>'+safe(x.title||x.address||'Untitled property')+'</strong><small>'+safe(addressSummary(x))+'</small><span>'+safe(usMoney(x.price))+' · '+safe(x.type||'Property')+' · '+L('Borrador local','Local draft')+'</span></div><div class="pf-draft-actions"><button type="button" data-draft-edit="'+safe(x.id)+'">'+L('Editar','Edit')+'</button><button type="button" data-draft-delete="'+safe(x.id)+'">'+L('Eliminar','Delete')+'</button></div></article>';
  modal(L('Mis borradores','My saved drafts'),'<p class="pf-draft-disclaimer">'+L('Estos borradores se guardan solamente en este navegador. No son publicaciones reales y no aparecen en el mapa.','Drafts are saved only in this browser. They are not live listings and do not appear on the map.')+'</p><div class="pf-draft-summary">'+data.length+' '+L('borradores guardados','drafts saved')+'</div><div id="launchDrafts" class="pf-draft-list">'+(data.length?data.map(row).join(''):'<p class="pf-empty-drafts">'+L('No hay borradores guardados todavía.','You have no saved drafts yet.')+'</p>')+'</div><button class="launch-primary" type="button" id="newDraft">'+L('Crear nuevo borrador','Create new draft')+'</button>',()=>{
    $('#newDraft').onclick=()=>draft();
    $('#launchDrafts').onclick=e=>{
      const edit=e.target.closest('[data-draft-edit]');
      if(edit){const existing=drafts().find(x=>x.id===edit.dataset.draftEdit);if(existing)draft(existing);return}
      const remove=e.target.closest('[data-draft-delete]');
      if(remove){
        const existing=drafts().find(x=>x.id===remove.dataset.draftDelete);
        if(!existing)return;
        if(!window.confirm(L('¿Eliminar este borrador guardado en este navegador?','Delete this draft saved on this device?')))return;
        if(!persistDrafts(drafts().filter(x=>x.id!==existing.id))){alert(L('No se pudo eliminar el borrador.','Unable to delete the draft.'));return}
        portfolio();
      }
    };
  });
}
function draft(existing=null){
  const editing=Boolean(existing),x=existing||{};
  const text=(es,en)=>L(es,en);
  const field=(label,name,required,extra='',type='text')=>'<label>'+label+'<input name="'+name+'" type="'+type+'" '+(required?'required ':'')+extra+' value="'+safe(x[name]??'')+'"></label>';
  const typeValues=[['single_family','Single-family home'],['townhouse','Townhouse'],['condo','Condo'],['multi_family','Multi-family'],['land','Land'],['commercial','Commercial'],['other','Other']];
  const typeInput='<label>'+text('Tipo de inmueble','Property type')+'<select name="type">'+typeValues.map(([v,label])=>'<option value="'+v+'" '+(x.type===v?'selected':'')+'>'+label+'</option>').join('')+'</select></label>';
  const body='<p class="pf-draft-disclaimer">'+text('Guardado local de demostración. Esto no publica propiedades, crea una cuenta ni contacta a un agente.','Demo draft saved on this device only. This does not publish a listing, create an account, or contact an agent.')+'</p>'+
    '<form id="launchForm" class="launch-form pf-us-form">'+
    field(text('Título de la propiedad','Property title'),'title',true,'maxlength="120" placeholder="Coastal home near Wilmington"')+
    typeInput+
    field(text('Dirección','Street address'),'address',true,'maxlength="150" autocomplete="street-address" placeholder="123 Market Street"')+
    field(text('Ciudad','City'),'city',true,'maxlength="100" autocomplete="address-level2" placeholder="Wilmington"')+
    field(text('Estado (2 letras)','State (2-letter code)'),'state',true,'maxlength="2" minlength="2" pattern="[A-Za-z]{2}" autocomplete="address-level1" placeholder="NC"')+
    field(text('Código postal','ZIP code'),'zip',true,'maxlength="10" pattern="[0-9]{5}(-[0-9]{4})?" inputmode="numeric" autocomplete="postal-code" placeholder="28401"')+
    field(text('Precio de venta (USD)','Asking price (USD)'),'price',true,'min="1" max="999999999" step="1" inputmode="numeric"','number')+
    field(text('Correo de contacto','Contact email'),'email',true,'maxlength="254" autocomplete="email" placeholder="agent@example.com"','email')+
    '<label class="full">'+text('Descripción (opcional)','Description (optional)')+'<textarea name="description" maxlength="1600" rows="3" placeholder="'+text('Detalles que quieres guardar...','Notes about the property...')+'">'+safe(x.description||'')+'</textarea></label>'+
    '<div class="pf-draft-form-actions"><button class="launch-primary" type="submit">'+(editing?text('Guardar cambios','Save changes'):text('Guardar borrador','Save draft'))+'</button><button class="pf-draft-secondary" id="draftBack" type="button">'+text('Ver mis borradores','View my drafts')+'</button></div></form>';
  modal(editing?text('Editar borrador','Edit draft'):text('Nuevo borrador de propiedad','New property draft'),body,()=>{
    const f=$('#launchForm');
    if(!x.city)f.elements.city.value='Wilmington';
    if(!x.state)f.elements.state.value='NC';
    $('#draftBack').onclick=portfolio;
    f.onsubmit=e=>{
      e.preventDefault();if(!f.reportValidity())return;
      const d=new FormData(f),v={
        id:existing?.id||newId(),
        title:String(d.get('title')||'').trim().slice(0,120),
        type:String(d.get('type')||'single_family'),
        address:String(d.get('address')||'').trim().slice(0,150),
        city:String(d.get('city')||'').trim().slice(0,100),
        state:String(d.get('state')||'').trim().toUpperCase(),
        zip:String(d.get('zip')||'').trim(),
        price:Number(d.get('price')),
        email:String(d.get('email')||'').trim().slice(0,254),
        description:String(d.get('description')||'').trim().slice(0,1600),
        createdAt:existing?.createdAt||Date.now(),updatedAt:Date.now()
      };
      if(!v.title||!v.address||!v.city||!/^[A-Z]{2}$/.test(v.state)||!/^[0-9]{5}(-[0-9]{4})?$/.test(v.zip)||!Number.isFinite(v.price)||v.price<=0||v.price>999999999||!v.email){alert(text('Revisa los campos antes de guardar.','Please check the form fields.'));return}
      const list=drafts();const pos=list.findIndex(x=>x.id===v.id);
      if(pos>=0)list[pos]=v;else list.unshift(v);
      if(!persistDrafts(list)){alert(text('No se pudo guardar. Revisa el almacenamiento del navegador.','Unable to save. Check your browser storage settings.'));return}
      play('success');portfolio();
    };
    f.elements.title?.focus();
  });
}
function simple(title,es,en){modal(title,'<p>'+L(es,en)+'</p>')}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='publishBtn'){draft();play('success')}else if(b.id==='navPortfolio'){portfolio();play('success')}else if(b.id==='turboBtn'){simple('Turbo','La planificación avanzada está en desarrollo. Ya puedes filtrar por zona y presupuesto y crear un Open Tour.','Advanced planning is in development. You can filter by area and budget and build an Open Tour.');play('turbo')}else if(b.id==='navVideos'){simple('Video Open House','La publicación de videos llegará con almacenamiento en línea.','Shared video publishing will be added after cloud storage integration.')}else if(b.id==='navHelp'||b.id==='helpBtn'){simple(L('Guía de ProFolio','ProFolio Guide'),'Filtra las propiedades de muestra, guarda favoritos, prepara un Open Tour y crea un borrador. No hay pagos ni IA en vivo.','Filter sample homes, save favorites, build an Open Tour and create a draft. Payments and live AI are not connected.')}else if(b.id==='saveTourBtn'&&Number($('#tourStops')?.textContent||0)>0)play('door')},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#launchClose'))close()});
})();