(()=>{
  'use strict';
  const $=q=>document.querySelector(q),core=window.ProFolioGPS,key='pf_road_reports_v1';
  let reports=[];
  try{reports=core.readReports(localStorage.getItem(key));}catch{$('#roadReportStatus').textContent='Browser storage is unavailable. Reports cannot be saved here.';}
  function render(){
    const list=$('#roadReportList');list.replaceChildren();
    $('#exportRoadReports').disabled=reports.length===0;
    if(!reports.length){const item=document.createElement('li');item.textContent='No local reports yet.';list.append(item);return;}
    for(const report of [...reports].reverse()){
      const item=document.createElement('li'),heading=document.createElement('strong'),place=document.createElement('p'),copy=document.createElement('p'),date=document.createElement('small');
      heading.textContent=core.TYPES[report.type]+' · Not sent';place.textContent=report.location;copy.textContent=report.description;date.textContent=new Date(report.createdAt).toLocaleString();item.append(heading,place,copy,date);list.append(item);
    }
  }
  const navigation=$('#startNavigation');
  function resetNavigation(){navigation.hidden=true;navigation.removeAttribute('href');$('#roadNavigationStatus').textContent='Prepare directions for your destination. Navigation opens separately in Google Maps.';}
  $('#roadDestination').addEventListener('input',resetNavigation);$('#roadTravelMode').addEventListener('change',resetNavigation);
  $('#roadNavigationForm').addEventListener('submit',event=>{
    event.preventDefault();
    try{navigation.href=core.navigationURL($('#roadDestination').value,$('#roadTravelMode').value);navigation.hidden=false;$('#roadNavigationStatus').textContent='Ready for '+$('#roadDestination').value.trim()+'. Your destination will be shared with Google Maps when you open navigation. Google Maps may show a route preview if live navigation is unavailable.';navigation.focus();}
    catch(error){resetNavigation();$('#roadNavigationStatus').textContent=error.message;}
  });
  $('#roadReportForm').addEventListener('submit',event=>{
    event.preventDefault();
    if(reports.length>=100){$('#roadReportStatus').textContent='This device has reached 100 local reports. Download your reports before continuing with a connected reporting service.';return;}
    try{
      const report=core.report({type:$('#roadReportType').value,location:$('#roadReportLocation').value,description:$('#roadReportDescription').value},crypto.randomUUID(),new Date().toISOString());
      const next=[...reports,report];localStorage.setItem(key,JSON.stringify(next));reports=next;render();
      $('#roadReportDescription').value='';$('#roadReportStatus').textContent='Saved on this device only. This report has not been sent or published.';
    }catch(error){$('#roadReportStatus').textContent=error.name==='QuotaExceededError'?'Storage is full. Your report was not saved.':error.name==='SecurityError'?'Browser storage is blocked. Your report was not saved.':error.message;}
  });
  const locationButton=$('#reportLocationButton');
  locationButton.addEventListener('click',()=>{
    const status=$('#reportLocationStatus');
    if(!navigator.geolocation){status.textContent='Location is unavailable. Enter the place manually.';return;}
    locationButton.disabled=true;status.textContent='Waiting for your location permission. Nothing is sent to ProFolio.';
    try{navigator.geolocation.getCurrentPosition(position=>{
      locationButton.disabled=false;
      try{const value=core.coordinates(position);$('#roadReportLocation').value=value.location;status.textContent='Location added'+(value.accuracy!==null?' (accuracy about '+value.accuracy+' m)':'')+'. Check that it matches the issue before saving.';}
      catch(error){status.textContent=error.message;}
    },error=>{locationButton.disabled=false;status.textContent=error.code===1?'Location permission was denied. Enter the place manually.':'Your location could not be obtained. Enter the place manually.';},{enableHighAccuracy:true,timeout:12000,maximumAge:0});}
    catch{locationButton.disabled=false;status.textContent='Location is unavailable. Enter the place manually.';}
  });
  $('#exportRoadReports').addEventListener('click',()=>{
    if(!reports.length)return;
    const payload={application:'ProFolio',scope:'Local reports only; not sent or verified',exportedAt:new Date().toISOString(),reports};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='profolio-road-reports-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('#roadReportStatus').textContent='Download requested. Review your file before sharing it; reports have not been sent.';
  });
  $('#demoExplorer').addEventListener('toggle',()=>{if($('#demoExplorer').open)window.dispatchEvent(new Event('resize'));});
  render();
})();
