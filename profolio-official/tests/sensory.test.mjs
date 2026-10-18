import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../amen-experience-v2.js',import.meta.url),'utf8');
const events={},storage=new Map(),notes=[],vibrations=[];let now=2000,reduced=false,contexts=0;
class AudioContext{
  constructor(){contexts++;this.state='running';this.currentTime=0;this.destination={};}
  createOscillator(){return {frequency:{setValueAtTime:f=>notes.push(f),exponentialRampToValueAtTime(){}},connect(){},start(){},stop(){}};}
  createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
  close(){return Promise.resolve();}
}
const context={document:{hidden:false,querySelector(){return null},querySelectorAll(){return[]},addEventListener:(n,f)=>events[n]=f,dispatchEvent(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>now},navigator:{vibrate:n=>vibrations.push(n)},matchMedia:()=>({matches:reduced}),CustomEvent:class{},AudioContext};
context.window=context;
vm.runInNewContext(source.slice(0,source.indexOf('  function toast'))+'function syncSound(){}\n})();',context);
const sound=context.__pfSound;
assert.equal(contexts,0,'no autoplay context');assert.equal(sound.enabled,false,'new users default silent');assert.equal(sound.haptics,false);
assert.equal(sound.play('door'),false);
sound.configure({enabled:true});assert.equal(sound.play('door'),false,'no user gesture');
let signatures=[];
for(const kind of ['door','tour','nav','confirm']){now+=1500;events.click({isTrusted:true});notes.length=0;assert.equal(sound.play(kind),true);signatures.push(notes.join(','));}
assert.equal(new Set(signatures).size,4,'four distinct note sequences');
sound.configure({volume:0});now+=1500;events.click({isTrusted:true});notes.length=0;assert.equal(sound.play('door'),false);assert.equal(notes.length,0,'zero means silence');
sound.configure({enabled:false,haptics:true});now+=1500;events.click({isTrusted:true});sound.play('nav');assert.equal(vibrations.at(-1),12);
reduced=true;vibrations.length=0;now+=1500;events.click({isTrusted:true});sound.play('nav');assert.equal(vibrations.length,0,'reduced motion blocks haptics');
sound.configure({enabled:false,haptics:false});now+=1500;events.click({isTrusted:true});vibrations.length=0;assert.equal(sound.play('confirm'),false);assert.equal(vibrations.length,0,'mute all');
context.document.hidden=true;sound.configure({enabled:true,volume:.5});now+=1500;events.click({isTrusted:true});assert.equal(sound.play('nav'),false,'background tab silent');
console.log('PASS: silent default, gesture gate, four signatures, volume zero, mute, reduced-motion haptics, hidden tab');
