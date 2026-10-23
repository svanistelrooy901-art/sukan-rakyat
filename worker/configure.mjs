// Creates ignored deploy config from public repository variables. No API token is written.
import{readFile,writeFile}from'node:fs/promises';
import{cloudflare,accountId,exactOrigin}from'../scripts/cloudflare-api.mjs';
const db=process.env.CLOUDFLARE_D1_DATABASE_ID,client=process.env.GOOGLE_CLIENT_ID;
if(!/^[a-f0-9-]{36}$/.test(db||''))throw new Error('Set CLOUDFLARE_D1_DATABASE_ID repository variable.');
if(!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(client||'')||client.startsWith('REPLACE'))throw new Error('Set GOOGLE_CLIENT_ID repository variable.');
const config=JSON.parse(await readFile(new URL('./wrangler.jsonc',import.meta.url),'utf8'));
config.vars.ADMIN_EMAILS=(process.env.ADMIN_EMAILS||'').trim();
config.d1_databases[0].database_id=db;config.vars.GOOGLE_CLIENT_ID=client;
// Preserve previously deployed origins during later backend-only deployments.
const site=JSON.parse(await readFile(new URL('../site-config.json',import.meta.url),'utf8'));
const origins=new Set(site.customDomain?[exactOrigin('https://'+site.customDomain)]:[]);
if(process.env.CLOUDFLARE_API_TOKEN){
 try{const current=(await cloudflare(`/accounts/${accountId()}/workers/scripts/${config.name}/settings`)).result;
 for(const binding of current.bindings||[])if(binding.name==='ADDITIONAL_FRONTEND_ORIGINS'&&binding.type==='plain_text')for(const value of binding.text.split(',').filter(Boolean))origins.add(exactOrigin(value));
 }catch(e){if(e.status!==404)throw e}
}
if(process.env.CLOUDFLARE_PAGES_ORIGIN)origins.add(exactOrigin(process.env.CLOUDFLARE_PAGES_ORIGIN));
config.vars.ADDITIONAL_FRONTEND_ORIGINS=[...origins].join(',');
await writeFile(new URL('./deploy.json',import.meta.url),JSON.stringify(config,null,2));
console.log('Deployment config prepared. Worker: sukan-rakyat-api; database: sukan-rakyat.');
