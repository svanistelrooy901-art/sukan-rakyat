import{readFile,appendFile}from'node:fs/promises';import{pathToFileURL}from'node:url';import{cloudflare,accountId,exactOrigin}from'./cloudflare-api.mjs';
const site=JSON.parse(await readFile(new URL('../site-config.json',import.meta.url),'utf8'));
export const hostname=site.customDomain;
exactOrigin('https://'+hostname);
if(!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(hostname))throw new Error('Invalid custom hostname.');
export async function attachDomain({account,request=cloudflare}){
 const base='/accounts/'+account+'/pages/projects/sukan-rakyat/domains';
 let domain;
 try{domain=(await request(base+'/'+hostname)).result}catch(e){if(e.status!==404)throw e;domain=(await request(base,{method:'POST',body:{name:hostname}})).result}
 if(domain?.name!==hostname||!['initializing','pending','active'].includes(domain.status))throw new Error('Custom domain needs attention in Cloudflare Pages → sukan-rakyat → Custom domains.');
 return {hostname,status:domain.status};
}
async function main(){
 const result=await attachDomain({account:accountId()});
 const text='## Custom subdomain\n\nHost: '+hostname+'\n\nCloudflare status: '+result.status+'\n\nDNS CNAME: sukanr → sukan-rakyat.pages.dev (set at the authoritative DNS provider if missing). Wait for Active and valid HTTPS before testing.\n\nGoogle Web Client: add https://'+hostname+' to Authorized JavaScript origins. Backend CORS is checked separately by this workflow.\n';
 console.log(text);if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,text);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
