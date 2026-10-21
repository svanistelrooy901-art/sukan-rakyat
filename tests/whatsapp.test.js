import test from 'node:test';import assert from 'node:assert/strict';
import{organizerPhone,receiptLink,setPayment,recalculate,join}from'../core.js';
test('WhatsApp numbers normalize local and international forms and reject malformed links',()=>{
 for(const value of['0123456789','+60 (12) 345-6789','60123456789','0060123456789'])assert.equal(organizerPhone(value),'60123456789');
 assert.equal(organizerPhone('+44 7700 900123'),'447700900123');
 for(const value of['',undefined,'abc0123456789','https://wa.me/60123456789','01234','+600123456789','+60123456789?text=evil','1'.repeat(16)])assert.throws(()=>organizerPhone(value));
});
test('receipt message encodes session and participant names and preserves pending claim amount',()=>{
 const s={organizerPhone:'0123456789',owner:'owner',ownerName:'Mamu',title:'Game & geng #1',date:'2099-01-01T12:00:00Z',fee:1500,cost:3000,capacity:2,players:[]};join(s,'owner','Mamu');join(s,'alice','A & B');setPayment(s,'alice','alice','pending');recalculate(s,'owner','fixed',2000);
 const u=new URL(receiptLink(s,s.players[1]));assert.equal(u.origin,'https://wa.me');assert.equal(u.pathname,'/60123456789');assert.equal([...u.searchParams.keys()].length,1);const text=u.searchParams.get('text');assert.match(text,/Game & geng #1/);assert.match(text,/A & B/);assert.match(text,/RM\s*15\.00/);assert.doesNotMatch(text,/RM\s*20\.00/);assert.match(text,/lampirkan resit/);
});
