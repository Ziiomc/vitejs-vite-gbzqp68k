(()=>{'use strict';
const AREAS={
  Wilmington:{c:[34.2257,-77.9447],k:'city',label:'Wilmington'},
  'Wilmington Downtown':{c:[34.2257,-77.9447],k:'anchor',label:'Downtown Wilmington'},
  Mayfaire:{c:[34.2415,-77.832],k:'anchor',label:'Mayfaire / Landfall'},
  Ogden:{c:[34.272,-77.8],k:'cdp',label:'Ogden'},
  'Porters Neck':{c:[34.3,-77.763],k:'cdp',label:'Porters Neck'},
  Northchase:{c:[34.306,-77.879],k:'cdp',label:'Northchase'},
  'Skippers Corner':{c:[34.322,-77.91],k:'cdp',label:'Skippers Corner'},
  'Castle Hayne':{c:[34.355,-77.9],k:'cdp',label:'Castle Hayne'},
  'Greenville Loop / Sound':{c:[34.1996,-77.8714],k:'anchor',label:'Greenville Loop / Sound'},
  'Wrightsville Beach':{c:[34.2085,-77.7964],k:'city',label:'Wrightsville Beach'},
  'Figure Eight Island':{c:[34.2707,-77.7428],k:'anchor',label:'Figure Eight Island'},
  Leland:{c:[34.2563,-78.0447],k:'city',label:'Leland'},
  'Carolina Beach':{c:[34.0352,-77.8936],k:'city',label:'Carolina Beach'},
  'Kure Beach':{c:[33.9968,-77.9072],k:'city',label:'Kure Beach'},
  'Oak Island':{c:[33.9166,-78.1611],k:'city',label:'Oak Island'},
  'Surf City':{c:[34.4271,-77.5461],k:'city',label:'Surf City'},
  'Topsail Beach':{c:[34.3654,-77.6308],k:'city',label:'Topsail Beach'},
  Hampstead:{c:[34.3677,-77.7105],k:'cdp',label:'Hampstead'},
  'Rocky Point':{c:[34.4559,-77.8654],k:'cdp',label:'Rocky Point'},
  Southport:{c:[33.9216,-78.0203],k:'city',label:'Southport'}
};
const BASE='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer';
const esc=s=>String(s).replace(/'/g,"''");
const q=async(layer,params)=>{const u=new URL(`${BASE}/${layer}/query`);Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));u.searchParams.set('f','geojson');const r=await fetch(u.toString());if(!r.ok)throw new Error(`${layer} ${r.status}`);const j=await r.json();return j&&j.type==='FeatureCollection'?j:{type:'FeatureCollection',features:[]}};
const officialStyle={color:'#8d0d31',weight:3,opacity:.96,fillColor:'#8d0d31',fillOpacity:.025};
const anchorStyle={color:'#a71843',weight:2.6,opacity:.9,fillColor:'#a71843',fillOpacity:.018,dashArray:'7 5'};
const meshStyle={color:'#7c3048',weight:1.05,opacity:.33,fillOpacity:0};
async function named(map,layer,names,kind){if(!names.length)return new Set();const where=`STATE='37' AND BASENAME IN (${names.map(n=>`'${esc(n)}'`).join(',')})`;const j=await q(layer,{where,outFields:'BASENAME,NAME,GEOID,STATE',returnGeometry:'true',outSR:'4326'});const found=new Set();L.geoJSON(j,{pane:'pfOfficialBoundaries',style:officialStyle,onEachFeature:(f,l)=>{const n=f.properties?.BASENAME;if(n)found.add(n);const a=AREAS[n];if(a)l.bindTooltip(`${a.label} · límite ${kind}`,{sticky:true,className:'pf-boundary-tip'});}}).addTo(map);return found;}
async function containingBlock(map,name,a){const [lat,lng]=a.c;try{const j=await q(10,{where:"STATE='37'",geometry:`${lng},${lat}`,geometryType:'esriGeometryPoint',inSR:'4326',spatialRel:'esriSpatialRelIntersects',outFields:'GEOID,TRACT,BLKGRP,COUNTY,STATE',returnGeometry:'true',outSR:'4326'});if(!j.features?.length)throw new Error('no block group');L.geoJSON(j,{pane:'pfReferenceBoundaries',style:anchorStyle,onEachFeature:(f,l)=>l.bindTooltip(`${a.label} · sector censal de referencia`,{sticky:true,className:'pf-boundary-tip'})}).addTo(map);}catch(e){console.warn('ProFolio boundary fallback',name,e)}}
async function regionalMesh(map){try{const j=await q(8,{where:"STATE='37'",geometry:'-78.26,33.84,-77.43,34.53',geometryType:'esriGeometryEnvelope',inSR:'4326',spatialRel:'esriSpatialRelIntersects',outFields:'GEOID,TRACT,COUNTY,STATE',returnGeometry:'true',outSR:'4326'});L.geoJSON(j,{pane:'pfTerritoryMesh',interactive:false,style:meshStyle}).addTo(map);}catch(e){console.warn('ProFolio territory mesh',e)}}
function legend(){const host=document.querySelector('.coverage');if(!host||document.getElementById('pfBoundaryLegend'))return;const el=document.createElement('div');el.id='pfBoundaryLegend';el.className='pf-boundary-legend';el.innerHTML='<div><i class="official"></i><span>Municipio / CDP oficial</span></div><div><i class="reference"></i><span>Sector censal real de referencia</span></div><div><i class="mesh"></i><span>División censal territorial</span></div>';host.appendChild(el)}
async function run(){const map=window.__pfMap;if(!map||!window.L)return setTimeout(run,120);if(map.__pfBoundaryFix)return;map.__pfBoundaryFix=true;
  if(!map.getPane('pfTerritoryMesh')){map.createPane('pfTerritoryMesh');map.getPane('pfTerritoryMesh').style.zIndex=330;map.getPane('pfTerritoryMesh').style.pointerEvents='none'}
  if(!map.getPane('pfReferenceBoundaries')){map.createPane('pfReferenceBoundaries');map.getPane('pfReferenceBoundaries').style.zIndex=335}
  if(!map.getPane('pfOfficialBoundaries')){map.createPane('pfOfficialBoundaries');map.getPane('pfOfficialBoundaries').style.zIndex=340}
  const css=document.createElement('style');css.textContent='.pf-boundary-tip{background:#fff!important;color:#68142f!important;border:1px solid #8d0d3144!important;border-radius:8px!important;font:800 10px system-ui!important;box-shadow:0 5px 14px #0002!important}.pf-boundary-legend{display:grid;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #eee}.pf-boundary-legend div{display:flex;gap:7px;align-items:center;font-size:9px;color:#5f6871}.pf-boundary-legend i{width:24px;height:0;border-top:3px solid #8d0d31}.pf-boundary-legend i.reference{border-top-style:dashed;border-top-width:2px}.pf-boundary-legend i.mesh{border-color:#7c3048;border-top-width:1px;opacity:.55}';document.head.appendChild(css);
  legend();
  await regionalMesh(map);
  const cities=Object.entries(AREAS).filter(([,a])=>a.k==='city').map(([n])=>n);
  const cdps=Object.entries(AREAS).filter(([,a])=>a.k==='cdp').map(([n])=>n);
  let foundCity=new Set(),foundCdp=new Set();
  try{foundCity=await named(map,28,cities,'municipal oficial');}catch(e){console.warn('ProFolio municipal boundaries',e)}
  try{foundCdp=await named(map,30,cdps,'CDP oficial');}catch(e){console.warn('ProFolio CDP boundaries',e)}
  const fallbacks=[];
  Object.entries(AREAS).forEach(([n,a])=>{if(a.k==='anchor'||(a.k==='city'&&!foundCity.has(n))||(a.k==='cdp'&&!foundCdp.has(n)))fallbacks.push([n,a])});
  for(const [n,a] of fallbacks)await containingBlock(map,n,a);
  setTimeout(()=>map.invalidateSize(true),80);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,250));else setTimeout(run,250);
})();