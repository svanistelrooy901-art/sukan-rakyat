import assert from 'node:assert/strict';
import {API_BASE} from '../config.js';
const base=process.env.SUKAN_API_URL||API_BASE;
if(!base){console.log('Demo mode: no backend configured.');process.exit(0)}
const u=new URL(base);assert.equal(u.protocol,'https:');assert.equal(u.pathname,'/');
const origin=process.env.SUKAN_FRONTEND_ORIGIN||'https://svanistelrooy901-art.github.io';
async function request(path,options={}){return fetch(u.origin+path,{...options,signal:AbortSignal.timeout(20000)})}
const health=await request('/health');assert.equal(health.status,200);const status=await health.json();assert.equal(status.ok,true);assert.equal(status.features?.receiptWhatsApp,true,'Deploy Cloudflare backend with WhatsApp receipt support before publishing frontend.');
assert.equal(status.features?.lineupPositions,true,'Deploy Cloudflare backend with manual formation positions before publishing frontend.');
const challenge=await request('/auth/challenge',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});assert.equal(challenge.status,200);assert.equal(challenge.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(challenge.headers.get('Cache-Control'),'no-store');const login=await challenge.json();assert.match(login.nonce,/^[a-f0-9]{64}$/);assert.equal(login.clientId,'1062368006478-k9pdfge7ia145m5mb823cov2a541s590.apps.googleusercontent.com');
const privateData=await request('/sessions');assert.equal(privateData.status,401);
const denied=await request('/auth/challenge',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'});assert.equal(denied.status,403);assert.equal(denied.headers.get('Access-Control-Allow-Origin'),null);
console.log('PASS: live health, D1-backed Google challenge, client ID MATCH, CORS, unauthenticated access denied.');
