// Creates ignored deploy config from public repository variables. No API token is written.
import{readFile,writeFile}from'node:fs/promises';
const db=process.env.CLOUDFLARE_D1_DATABASE_ID,client=process.env.GOOGLE_CLIENT_ID;
if(!/^[a-f0-9-]{36}$/.test(db||''))throw new Error('Set CLOUDFLARE_D1_DATABASE_ID repository variable.');
if(!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(client||'')||client.startsWith('REPLACE'))throw new Error('Set GOOGLE_CLIENT_ID repository variable.');
const config=JSON.parse(await readFile(new URL('./wrangler.jsonc',import.meta.url),'utf8'));
config.d1_databases[0].database_id=db;config.vars.GOOGLE_CLIENT_ID=client;
await writeFile(new URL('./deploy.json',import.meta.url),JSON.stringify(config,null,2));
console.log('Deployment config prepared. Worker: sukan-rakyat-api; database: sukan-rakyat.');
