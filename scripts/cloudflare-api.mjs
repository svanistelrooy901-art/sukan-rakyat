// CI-only Cloudflare client. Never print response bodies or authentication headers.
export async function cloudflare(path,{method='GET',body,fetcher=fetch,token=process.env.CLOUDFLARE_API_TOKEN}={}){
 if(!token)throw new Error('CLOUDFLARE_API_TOKEN is missing in GitHub Actions secrets.');
 const r=await fetcher('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 const data=await r.json().catch(()=>null);
 if(!r.ok||data?.success===false||data?.errors?.length){const e=new Error(`Cloudflare API failed (${r.status}); check the token permissions and account resource scope. Response details are intentionally omitted.`);e.status=r.status;throw e}
 if(!data)throw new Error('Cloudflare API returned invalid JSON.');return data;
}
export function exactOrigin(v){const u=new URL(v);if(u.protocol!=='https:'||u.origin!==v||u.username||u.password||u.hostname.includes('*'))throw new Error('Frontend origin must be an exact HTTPS origin with no path or trailing slash.');return u.origin}
export function accountId(){const id=process.env.CLOUDFLARE_ACCOUNT_ID;if(!/^[a-f0-9]{32}$/.test(id||''))throw new Error('Set CLOUDFLARE_ACCOUNT_ID repository variable.');return id}
