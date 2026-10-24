import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../amen-experience-v2.js',import.meta.url),'utf8');
const events={},storage=new Map(),notes=[],vibrations=[],levels=[];let now=2000,reduced=false,contexts=0;
class AudioContext{
  constructor(){contexts++;this.state='running';this.currentTime=0;this.destination={};}
  createOscillator(){return {frequency:{setValueAtTime:f=>notes.push(f),exponentialRampToValueAtTime(){}},connect(){},start(){},stop(){}};}
  createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime:v=>levels.push(v)},connect(){}};}
  close(){return Promise.resolve();}
}
const context={document:{hidden:false,querySelector(){return null},querySelectorAll(){return[]},addEventListener:(n,f)=>(events[n]??=[]).push(f),dispatchEvent(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>now},navigator:{vibrate:n=>vibrations.push(n)},matchMedia:()=>({matches:reduced}),CustomEvent:class{},AudioContext};
const click=(control=null,isTrusted=true)=>{for(const fn of events.click)fn({isTrusted,target:{closest:()=>control}})};
context.window=context;
vm.runInNewContext(source.slice(0,source.indexOf('  function toast'))+'function syncSound(){}\n})();',context);
const sound=context.__pfSound;
assert.equal(sound.volume,.85,'new users get a stronger default; activation remains explicit');
assert.equal(contexts,0,'no autoplay context');assert.equal(sound.enabled,false,'new users default silent');assert.equal(sound.haptics,false);
assert.equal(sound.play('door'),false);
sound.configure({enabled:true});assert.equal(sound.play('door'),false,'no user gesture');
let signatures=[];
for(const kind of ['door','tour','nav','confirm']){now+=1500;click();notes.length=0;assert.equal(sound.play(kind),true);signatures.push(notes.join(','));}
assert.equal(new Set(signatures).size,4,'four distinct note sequences');
sound.configure({volume:0});now+=1500;click();notes.length=0;assert.equal(sound.play('door'),false);assert.equal(notes.length,0,'zero means silence');
sound.configure({enabled:false,haptics:true});now+=1500;click();sound.play('nav');assert.equal(vibrations.at(-1),18);
const control={id:'unmappedDialogClose',disabled:false,getAttribute(){return null},matches(){return false}};
now+=1500;vibrations.length=0;click(control);assert.deepEqual(vibrations,[18],'unmapped controls vibrate even with sound off');
sound.play('nav');assert.equal(vibrations.length,1,'mapped sound does not duplicate the click vibration');
for(const c of [{...control,disabled:true},{...control,id:'muteAll'},{...control,getAttribute(){return 'true'}}]){now+=1500;vibrations.length=0;click(c);assert.equal(vibrations.length,0,'disabled and mute controls do not vibrate')}
now+=1500;vibrations.length=0;click(control,false);assert.equal(vibrations.length,0,'synthetic clicks do not vibrate');
sound.configure({enabled:true,volume:1});now+=1500;notes.length=0;levels.length=0;click(control);
assert.deepEqual(notes,[392,523.25],'previously unmapped close controls now sound');
assert.equal(Math.max(...levels),.24,'stronger bounded output at full volume');
sound.play('nav');assert.equal(notes.length,2,'local handlers cannot duplicate a cue');
for(const c of [{...control,disabled:true},{...control,id:'muteAll'},{...control,getAttribute(){return 'true'}}]){now+=1500;notes.length=0;click(c);assert.equal(notes.length,0,'disabled and mute controls stay silent')}
now+=1500;notes.length=0;click(control,false);assert.equal(notes.length,0,'synthetic controls stay silent');
for(const [selector,kind] of [['[data-focus]','door'],['[data-tour]','tour'],['[data-fav]','confirm']]){now+=1500;notes.length=0;click({...control,matches:s=>s.split(',').includes(selector)});assert.equal(notes.join(','),signatures[['door','tour','nav','confirm'].indexOf(kind)],'action retains its distinctive cue')}
reduced=true;vibrations.length=0;now+=1500;click(control);sound.play('nav');assert.equal(vibrations.length,0,'reduced motion blocks haptics');
sound.configure({enabled:false,haptics:false});now+=1500;click(control);vibrations.length=0;assert.equal(sound.play('confirm'),false);assert.equal(vibrations.length,0,'mute all');
context.document.hidden=true;sound.configure({enabled:true,haptics:true,volume:.5});now+=1500;click(control);assert.equal(sound.play('nav'),false,'background tab silent');
assert.equal(vibrations.filter(x=>x!==0).length,0,'background tab does not vibrate');
console.log('PASS: four signatures, sound on unmapped controls, stronger bounded gain, no duplicate cues, disabled/synthetic/background silence, haptics and reduced motion');
