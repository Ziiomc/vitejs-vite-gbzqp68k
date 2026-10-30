import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={URL,URLSearchParams};
vm.runInNewContext(readFileSync(new URL('../gps-navigation-core.js',import.meta.url),'utf8'),context);
const core=context.ProFolioGPS;
for(const mode of ['driving','walking','bicycling']){
  const destination='200 Water St, Wilmington & café #2';
  const url=new URL(core.navigationURL(destination,mode));
  assert.equal(url.origin,'https://www.google.com');assert.equal(url.pathname,'/maps/dir/');
  assert.equal(url.searchParams.get('destination'),destination);assert.equal(url.searchParams.get('travelmode'),mode);
  assert.equal(url.searchParams.get('api'),'1');assert.equal(url.searchParams.get('dir_action'),'navigate');assert.equal(url.searchParams.has('origin'),false,'no stored/current location sent by ProFolio');
}
assert.throws(()=>core.navigationURL('  ','driving'));assert.throws(()=>core.navigationURL('Wilmington','flying'));
assert.equal(new URL(core.navigationURL('javascript:alert(1)','driving')).protocol,'https:','destination never becomes executable navigation');
const values={type:'closure',location:'Main & Water',description:'Road closed'};
const createdAt='2026-10-27T06:32:00.000Z',report=core.report(values,'test',createdAt);
assert.equal(report.status,'local-only');
const recovered=core.readReports(JSON.stringify([report]));assert.equal(recovered.length,1);assert.equal(recovered[0].description,values.description);
for(const bad of ['null','{}','not JSON','[null]','[{"type":"__proto__"}]'])assert.equal(core.readReports(bad).length,0);
assert.throws(()=>core.report({...values,type:'__proto__'},'test',createdAt));assert.throws(()=>core.report({...values,location:' '},'test',createdAt));
assert.equal(core.report({...values,description:'a'.repeat(900)},'test',createdAt).description.length,600);
const place=core.coordinates({coords:{latitude:34.2257,longitude:-77.9447,accuracy:12.2}});
assert.equal(place.location,'34.22570, -77.94470');assert.equal(place.accuracy,12);
assert.throws(()=>core.coordinates({coords:{latitude:NaN,longitude:20}}));assert.throws(()=>core.coordinates({coords:{latitude:95,longitude:20}}));
console.log('PASS: encoded navigation destinations, supported modes, no origin disclosure, invalid data, local report round-trip and location validation');
// Exercise failure boundaries without requesting physical location or touching user storage.
const handlers={},elements=new Map();
function element(selector){if(!elements.has(selector))elements.set(selector,{value:'',textContent:'',disabled:false,hidden:false,addEventListener:(name,fn)=>handlers[selector+name]=fn,replaceChildren(){},append(){},removeAttribute(){},focus(){}});return elements.get(selector);}
const openedDirections=[];
const ui={location:{assign:(url)=>openedDirections.push(url)},document:{querySelector:element,createElement:()=>({append(){},click(){}})},ProFolioGPS:core,localStorage:{getItem:()=>null,setItem(){throw Object.assign(Error('full'),{name:'QuotaExceededError'});}},crypto:{randomUUID:()=> 'test'},navigator:{geolocation:{getCurrentPosition:(success,failure)=>failure({code:1})}},URL,Blob,Date,setTimeout,Event};ui.window=ui;
vm.runInNewContext(readFileSync(new URL('../gps-navigation.js',import.meta.url),'utf8'),ui);
element('#roadReportType').value='hazard';element('#roadReportLocation').value='Test location';element('#roadReportDescription').value='Unsaved report';
element('#roadDestination').value='200 Water St, Wilmington';element('#roadTravelMode').value='driving';
handlers['#roadNavigationFormsubmit']({preventDefault(){}});
assert.equal(openedDirections.length,1,'Go must open directions on the first submit');
assert.equal(openedDirections[0],core.navigationURL('200 Water St, Wilmington','driving'));
handlers['#roadReportFormsubmit']({preventDefault(){}});
assert.match(element('#roadReportStatus').textContent,/not saved/);assert.equal(element('#roadReportDescription').value,'Unsaved report','keep form content on storage failure');assert.equal(element('#exportRoadReports').disabled,true);
handlers['#reportLocationButtonclick']();assert.match(element('#reportLocationStatus').textContent,/denied/);assert.equal(element('#reportLocationButton').disabled,false,'manual entry remains available after denial');
ui.navigator.geolocation.getCurrentPosition=()=>{throw Error('unavailable')};handlers['#reportLocationButtonclick']();assert.match(element('#reportLocationStatus').textContent,/unavailable/);assert.equal(element('#reportLocationButton').disabled,false);
console.log('PASS: full storage keeps unsaved report, denied/unavailable location recovers without background tracking');
