import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_QR_BYTES,validateQrFile} from '../core.js';

test('QR upload accepts 64 KB, slightly larger files and the 256 KB boundary',()=>{
 for(const type of ['image/png','image/jpeg','image/webp']){
  for(const size of [64000,65536,65537,MAX_QR_BYTES])assert.doesNotThrow(()=>validateQrFile({type,size}));
 }
});
test('QR size and format errors explain the actual rejection',()=>{
 assert.throws(()=>validateQrFile({type:'image/png',size:MAX_QR_BYTES+1}),/Gambar terlalu besar.*256 KB/);
 for(const type of ['image/heic','image/gif','image/svg+xml','']){
  assert.throws(()=>validateQrFile({type,size:64000}),/Format gambar tidak disokong/);
 }
});
