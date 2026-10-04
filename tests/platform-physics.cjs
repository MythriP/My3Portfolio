const assert = require('node:assert/strict');
const {createWorld,step,PLAYER_H,JUMP_SPEED,GRAVITY}=require('../assets/js/platform-game.js');
function layout(width) { return {spawn:{id:'spawn',x:24,y:240},stops:[.7,.18,.61,.3,.72].map((f,i)=>({id:`spark-${i}`,label:`Spark ${i}`,x:width*f,y:850+i*900})),endY:5000}; }
for(const width of [1440,927,390,320]) {
 const world=createWorld(width,layout(width));
 assert.ok(world.platforms.length>25);
 assert.equal(new Set(world.sparks.map(s=>s.y)).size,5);
 assert.ok(new Set(world.platforms.map(p=>Math.round(p.x))).size>15);
 // Every consecutive ledge is reachable by a jump, including across a viewport.
 for(let i=1;i<world.platforms.length;i++){
   const from=world.platforms[i-1],to=world.platforms[i];
   Object.assign(world.player,{x:from.x+from.w/2-13,y:from.y-PLAYER_H,vy:0,grounded:true});
   world.jumpHeld=false;
   let reached=false;
   for(let frame=0;frame<180;frame++){
     const dx=to.x+to.w/2-world.player.x-13;
     step(world,{right:dx>3,left:dx< -3,jump:frame===0,down:frame>55&&world.player.grounded},1/60);
     if(world.player.grounded&&Math.abs(world.player.y+PLAYER_H-to.y)<.1){reached=true;break;}
   }
   assert.ok(reached,`Unreachable ledge ${i} at width ${width}`);
 }
 assert.ok(world.sparks.every(s=>s.collected),'All five sparks collected along the route');
 console.log(`PASS: continuous ${world.platforms.length}-ledge route, all sparks, and five-spark reachability at ${width}px`);
}
const world=createWorld(390,layout(390));const y=world.player.y;
step(world,{jump:true},1/60);const vy=world.player.vy;step(world,{jump:true},1/60);assert.ok(world.player.vy>vy);
let peak=world.player.y;for(let i=0;i<48;i++){step(world,{},1/60);peak=Math.min(peak,world.player.y);}assert.ok(y-peak>240);
assert.ok(JUMP_SPEED*JUMP_SPEED/(2*GRAVITY)>190);
world.player.y=1000;step(world,{},1/60);assert.equal(world.falls,1);assert.equal(world.player.grounded,true);
console.log('PASS: higher jump, no midair repeat jump, and local fall recovery');
for(const width of [320,390,927,1440]) {
 for(let seed=1;seed<=100;seed++) {
  const world=createWorld(width,{...layout(width),seed});
  for(let i=1;i<world.platforms.length;i++){
   const a=world.platforms[i-1],b=world.platforms[i];
   assert.ok(Math.abs((a.x+a.w/2)-(b.x+b.w/2))<220,'Random horizontal gap exceeds jump reach');
   assert.ok(b.y-a.y<180,'Random vertical gap exceeds jump reach');
  }
 }
}
console.log('PASS: 400 randomized routes keep gaps within jump reach');
