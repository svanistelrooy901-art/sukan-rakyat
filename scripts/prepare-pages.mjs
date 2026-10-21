import{appendFile}from'node:fs/promises';import{cloudflare,accountId,exactOrigin}from'./cloudflare-api.mjs';
const account=accountId(),name=process.env.CLOUDFLARE_PAGES_PROJECT||'sukan-rakyat';
if(!/^[a-z0-9][a-z0-9-]{0,57}$/.test(name))throw new Error('Invalid Cloudflare Pages project name.');
const path=`/accounts/${account}/pages/projects/${name}`;
let project;try{project=(await cloudflare(path)).result}catch(e){if(e.status!==404)throw e;project=(await cloudflare(`/accounts/${account}/pages/projects`,{method:'POST',body:{name,production_branch:'main'}})).result}
if(project?.name!==name||project.production_branch!=='main'||project.source)throw new Error('Expected a Direct Upload Pages project on main. Existing project settings were not changed.');
if(typeof project.subdomain!=='string'||!/^[a-z0-9-]+\.pages\.dev$/.test(project.subdomain))throw new Error('Cloudflare did not return a valid Pages subdomain.');
const origin=exactOrigin('https://'+project.subdomain);
if(!process.env.GITHUB_OUTPUT)throw new Error('Run this script in GitHub Actions.');
await appendFile(process.env.GITHUB_OUTPUT,`project=${name}\norigin=${origin}\n`);
console.log(`Pages project ready: ${name}; production origin: ${origin}`);
