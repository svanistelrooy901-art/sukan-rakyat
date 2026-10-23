import test from'node:test';import assert from'node:assert/strict';import{JSDOM}from'jsdom';import{readFile}from'node:fs/promises';import{adminView}from'../admin-view.js';
const stats={generatedAt:'2026-10-23T12:00:00Z',accounts:{total:10,new7:3,new30:8,loggedIn7:4},games:{total:5,new7:2,upcoming:3,past:2,organizers:2},participation:{joined:20,uniquePlayers:8,waiting:1,present:3,absent:1,pending:2,target:30000,received:20000,remaining:10000},sports:[{sport:'futsal',sessions:5,joined:20}],growth:[{day:'2026-10-23',accounts:3,sessions:2}]};
test('admin view renders aggregate values and escapes unknown sport and error text',()=>{
 const html=adminView({isAdmin:true},{...stats,sports:[{sport:'<img src=x onerror=alert(1)>',sessions:5,joined:20}]});const d=new JSDOM(html).window.document;
 assert.match(d.body.textContent,/AKAUN BERDAFTAR/);assert.match(d.body.textContent,/RM\s*200\.00/);assert.equal(d.querySelector('img'),null);
 assert.match(adminView(null,null),/Login admin/);assert.match(adminView({isAdmin:false},null),/Akses admin sahaja/);assert.match(adminView({isAdmin:true},null,'<script>bad</script>'),/&lt;script&gt;/);
});
test('admin route uses authenticated stats, refreshes and removes data on logout',async()=>{
 const dom=new JSDOM(await readFile(new URL('../index.html',import.meta.url),'utf8'),{url:'https://frontend.example/#admin'}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};w.scrollTo=()=>{};
 Object.assign(globalThis,{window:w,document:w.document,location:w.location,sessionStorage:w.sessionStorage,FormData:w.FormData});sessionStorage.setItem('sukan-rakyat-live-token','a'.repeat(64));let count=0;
 globalThis.fetch=async(url,options)=>{const path=new URL(url).pathname;assert.ok(options.headers.Authorization);let data;
 if(path==='/me')data={user:{id:'admin',name:'Mamu',isAdmin:true}};else if(path==='/admin/stats'){count++;data=stats}else if(path==='/auth/logout')data={ok:true};else throw Error('Unexpected '+path);return new Response(JSON.stringify(data))};
 const flush=async()=>{await new Promise(setImmediate);await new Promise(setImmediate)};
 await import('../live.js?admin-ui');await flush();assert.match(document.querySelector('#app').textContent,/AKAUN BERDAFTAR/);assert.equal(count,1);assert.equal(document.querySelector('header nav').lastElementChild.textContent,'Admin Dashboard');assert.equal(document.querySelector('#admin-dashboard-nav').getAttribute('aria-current'),'page');assert.ok([...document.querySelectorAll('[data-nav]')].every(b=>!b.classList.contains('active')));
 document.querySelector('[data-do="refresh"]').click();await flush();assert.equal(count,2);
 document.querySelector('#profile').click();await flush();assert.ok(document.querySelector('[data-do="admin"]'));
 document.querySelector('[data-do="logout"]').click();await flush();assert.match(document.querySelector('#app').textContent,/Login admin/);assert.doesNotMatch(document.querySelector('#app').textContent,/AKAUN BERDAFTAR/);assert.equal(document.querySelector('#admin-dashboard-nav'),null);dom.window.close();
});
