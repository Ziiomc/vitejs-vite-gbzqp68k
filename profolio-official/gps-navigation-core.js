(function(root){
  'use strict';
  const TYPES=Object.freeze({hazard:'Road hazard',closure:'Road closure',traffic:'Traffic obstruction',map:'Incorrect map information',other:'Other issue'});
  function text(value,max){return typeof value==='string'?value.trim().slice(0,max):'';}
  function navigationURL(destination,mode){
    const place=text(destination,200);
    if(!place)throw Error('Enter a destination first.');
    if(!['driving','walking','bicycling'].includes(mode))throw Error('Choose a travel mode.');
    const url=new URL('https://www.google.com/maps/dir/');
    url.search=new URLSearchParams({api:'1',destination:place,travelmode:mode,dir_action:'navigate'}).toString();
    return url.href;
  }
  function report(values,id,createdAt){
    const location=text(values.location,200),description=text(values.description,600);
    if(!Object.hasOwn(TYPES,values.type)||!location||!description)throw Error('Choose an issue type and enter its location and description.');
    return {id,type:values.type,location,description,createdAt,status:'local-only'};
  }
  function readReports(raw){
    try{
      const list=JSON.parse(raw||'[]');if(!Array.isArray(list))return [];
      return list.slice(0,100).filter(x=>x&&typeof x.id==='string'&&typeof x.createdAt==='string'&&Number.isFinite(Date.parse(x.createdAt))&&Object.hasOwn(TYPES,x.type)&&typeof x.location==='string'&&x.location.trim()&&typeof x.description==='string'&&x.description.trim()).map(x=>report(x,x.id,x.createdAt));
    }catch{return [];}
  }
  function coordinates(position){
    const {latitude,longitude,accuracy}=position.coords;
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw Error('No valid location was returned. Enter the place manually.');
    return {location:latitude.toFixed(5)+', '+longitude.toFixed(5),accuracy:Number.isFinite(accuracy)&&accuracy>=0?Math.round(accuracy):null};
  }
  root.ProFolioGPS=Object.freeze({TYPES,navigationURL,report,readReports,coordinates});
})(globalThis);
