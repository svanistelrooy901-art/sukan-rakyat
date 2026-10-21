import test from 'node:test';import assert from 'node:assert/strict';
import{FORMATIONS,lineupSlots,setLineup,setFormation,shuffle}from'../core.js';
import{pitchView}from'../pitch.js';
const game=()=>({owner:'owner',sport:'football',format:'11 sebelah',formation:'4-3-3',players:[['a','A'],['b','A'],['c','A'],['d','B']].map(([id,team])=>({id,name:id,status:'joined',team,position:''}))});
test('all football and futsal formations expose exact unique slot counts including goalkeeper',()=>{
 for(const[format,options]of Object.entries(FORMATIONS))for(const formation of options){const slots=lineupSlots({sport:format==='5 sebelah'?'futsal':'football',format,formation});assert.equal(slots.length,parseInt(format));assert.equal(new Set(slots.map(x=>x.id)).size,slots.length);assert.equal(slots[0].label,'GK')}
});
test('positions are explicit, swap occupants, bench displaced substitutes and persist across serialization',()=>{
 const s=game();assert.match(pitchView(s,'A',true),/Kosong/);assert.doesNotMatch(pitchView(s,'A',true),/class="jersey">A</);
 setLineup(s,'owner','A','0:0','a');setLineup(s,'owner','A','1:0','b');setLineup(s,'owner','A','1:0','a');assert.equal(s.players[0].position,'1:0');assert.equal(s.players[1].position,'0:0');
 setLineup(s,'owner','A','0:0','c');assert.equal(s.players[1].position,'');assert.equal(s.players[2].position,'0:0');
 setLineup(s,'owner','B','0:0','d');assert.equal(s.players[2].position,s.players[3].position);
 const saved=JSON.parse(JSON.stringify(s));assert.equal(pitchView(saved,'A',true),pitchView(s,'A',true));setLineup(saved,'owner','A','0:0','');assert.equal(saved.players[2].position,'');assert.equal(saved.players[3].position,'0:0');
});
test('only organizer can set positions, only active same-team players allowed, invalid slots rejected without changes',()=>{
 const s=game();s.players.push({id:'waiting',team:'A',status:'waiting'});const before=JSON.stringify(s);
 for(const[actor,team,slot,id]of[['a','A','0:0','a'],['owner','A','99:0','a'],['owner','C','0:0','a'],['owner','A','0:0','d'],['owner','A','0:0','waiting'],['owner','A','0:0','unknown']])assert.throws(()=>setLineup(s,actor,team,slot,id));
 assert.equal(JSON.stringify(s),before);assert.throws(()=>setLineup({...s,sport:'badminton'},'owner','A','0:0','a'));assert.doesNotMatch(pitchView(s,'A',false),/data-slot=/);
});
test('formation changes and shuffle clear positions while invalid changes preserve lineup',()=>{
 const s=game();setLineup(s,'owner','A','0:0','a');setLineup(s,'owner','B','0:0','d');assert.throws(()=>setFormation(s,'a','4-4-2'));assert.throws(()=>setFormation(s,'owner','2-2'));assert.equal(s.players[0].position,'0:0');setFormation(s,'owner','4-3-3');assert.equal(s.players[0].position,'0:0');setFormation(s,'owner','4-4-2');assert.ok(s.players.every(p=>p.position===''));setLineup(s,'owner','A','0:0','a');shuffle(s,()=>0.4);assert.ok(s.players.every(p=>p.position===''));
});
