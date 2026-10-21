import assert from'node:assert/strict';import{API_BASE}from'../config.js';import{exactOrigin}from'./cloudflare-api.mjs';
const origin=exactOrigin(process.env.SUKAN_FRONTEND_ORIGIN);
for(const path of['/','/live.js','/core.js','/pitch.js','/config.js','/manifest.webmanifest']){
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(20000),cache:'no-store'});assert.equal(r.status,200,`Frontend asset unavailable: ${path}`);const body=await r.text();assert.ok(body.length>20);
 if(path==='/')assert.match(body,/Sukan Rakyat/);
 if(path==='/config.js')assert.ok(body.includes(new URL(process.env.SUKAN_API_URL||API_BASE).origin),'Frontend API configuration mismatch');
 if(path==='/manifest.webmanifest')assert.equal(JSON.parse(body).start_url,'./');
}
console.log('PASS: Cloudflare frontend HTML, modules, API config and PWA manifest. Google login still requires an interactive two-account trial.');
