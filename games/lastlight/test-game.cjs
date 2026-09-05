// Offline deterministic engine checks: node test-game.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),events={};
const context=new Proxy({createRadialGradient:()=>({addColorStop(){}})}, {get:(t,k)=>t[k]||(()=>{})});
function el(id){if(!elements.has(id))elements.set(id,{classList:{add(){},remove(){}},getContext:()=>context,addEventListener(){},replaceChildren(){},append(){},textContent:''});return elements.get(id);}
const sandbox={console,Math,Set,innerWidth:1440,innerHeight:900,devicePixelRatio:1,localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:el,createElement:()=>el(Math.random()),addEventListener(){},documentElement:{}},addEventListener:(n,f)=>events[n]=f,requestAnimationFrame(){}};sandbox.window=sandbox;
const source=fs.readFileSync(__dirname+'/game.js','utf8').replace('window.lastlight={snapshot:',`window.test={begin,update,render,pause,dash,pulse,spawn,damageEnemy,choose,finish,keys,get:()=>({player,enemies,drops,shots,hostile,state,wave,beacon,boss,score}),setWaveTime:v=>waveTime=v,setBeacon:v=>beacon=v};window.lastlight={snapshot:`);
vm.runInNewContext(source,sandbox);const t=sandbox.test;
t.begin();assert.equal(t.get().state,'playing');assert.equal(t.get().wave,1);t.render();
const startY=t.get().player.y;t.keys.add('s');for(let i=0;i<60;i++)t.update(1/60);t.keys.clear();assert(t.get().player.y>startY+200);
t.pause();const pausedY=t.get().player.y;t.update(1);assert.equal(t.get().player.y,pausedY);t.pause();
t.dash();assert(t.get().player.dash>0);t.pulse();assert(t.get().player.pulse>0);
// Exercise timed spawns, every enemy AI, projectiles, collection, and drawing.
for(const type of ['drifter','hunter','spitter','brute'])t.spawn(type);
for(let i=0;i<600;i++){t.get().player.inv=10;t.setBeacon(100);t.update(1/60);if(i%60===0)t.render();}
assert(t.get().enemies.length>0);assert(t.get().shots.length>0);
// Verify every intermission, upgrade application, final boss, and victory.
for(let wave=1;wave<=5;wave++){
  assert.equal(t.get().wave,wave);t.setWaveTime(100);t.get().player.inv=10;t.setBeacon(100);
  for(const e of [...t.get().enemies])t.damageEnemy(e,1e6);
  t.update(1/60);
  if(wave<5){assert.equal(t.get().state,'upgrade');t.choose(0);assert.equal(t.get().state,'playing');}
  else {assert(t.get().boss);t.render();t.damageEnemy(t.get().boss,1e6);assert.equal(t.get().state,'won');t.render();}
}
t.begin();t.setBeacon(0);t.update(1/60);assert.equal(t.get().state,'lost');
t.begin();assert.equal(t.get().wave,1);assert.equal(t.get().score,0);assert.equal(t.get().player.hp,t.get().player.max);t.render();
console.log('PASS: movement, pause, abilities, enemy AI, shooting, five tides, upgrades, boss, victory, defeat, restart, rendering.');
