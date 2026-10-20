import{API_BASE}from'./config.js';
const mode=new URLSearchParams(location.search).get('mode');
if(mode==='demo'||!API_BASE){if(mode==='live'&&!API_BASE){document.querySelector('#app').innerHTML='<section class="panel"><h2>TRIAL BELUM DISAMBUNGKAN</h2><p>Backend Cloudflare dan Google login perlu dikonfigurasi dahulu.</p><a href="?mode=demo">Buka demo</a></section>'}else await import('./app.js')}else await import('./live.js');
