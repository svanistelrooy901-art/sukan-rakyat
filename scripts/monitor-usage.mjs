import{appendFile}from'node:fs/promises';import{pathToFileURL}from'node:url';import{cloudflare,accountId}from'./cloudflare-api.mjs';
export function level(value,limit){if(!Number.isFinite(value)||value<0)throw new Error('Metric unavailable');const ratio=value/limit;return ratio>=.8?'ACTION':ratio>=.7?'PREPARE':ratio>=.5?'WATCH':'OK'}
export function metricSum(rows,key){if(!Array.isArray(rows)||!rows.length)throw new Error('Analytics not yet available; missing data is not zero usage.');return rows.reduce((n,r)=>{const value=r.sum?.[key];if(!Number.isFinite(value)||value<0)throw new Error('Incomplete analytics response.');return n+value},0)}
export const workerQuery=`query($account:string,$start:string,$end:string){viewer{accounts(filter:{accountTag:$account}){total:workersInvocationsAdaptive(limit:1,filter:{datetime_geq:$start,datetime_leq:$end}){sum{requests}}app:workersInvocationsAdaptive(limit:1,filter:{scriptName:"sukan-rakyat-api",datetime_geq:$start,datetime_leq:$end}){sum{requests errors}quantiles{cpuTimeP99}}}}}`;
export const d1Query=`query($account:string!,$day:Date){viewer{accounts(filter:{accountTag:$account}){d1AnalyticsAdaptiveGroups(limit:1,filter:{date_geq:$day,date_leq:$day}){sum{rowsRead rowsWritten}}}}}`;
export async function collectUsage({account,database,now=new Date(),request=cloudflare}){
 const day=now.toISOString().slice(0,10),variables={account,start:day+'T00:00:00.000Z',end:now.toISOString(),day};
 const reports=[],unavailable=[];
 for(const[name,query]of[['Workers',workerQuery],['D1',d1Query]]){
 try{const result=await request('/graphql',{method:'POST',body:{query,variables}}),a=result.data?.viewer?.accounts?.[0];if(!a)throw new Error('No account analytics.');
 if(name==='Workers'){
 reports.push({name:'Workers requests (whole account, UTC today)',value:metricSum(a.total,'requests'),limit:100000});
 reports.push({name:'API requests (Sukan Rakyat, UTC today)',value:metricSum(a.app,'requests')});
 reports.push({name:'API runtime errors (not HTTP error statuses)',value:metricSum(a.app,'errors')});
 }else{reports.push({name:'D1 rows read (whole account, UTC today)',value:metricSum(a.d1AnalyticsAdaptiveGroups,'rowsRead'),limit:5000000});reports.push({name:'D1 rows written (whole account, UTC today)',value:metricSum(a.d1AnalyticsAdaptiveGroups,'rowsWritten'),limit:100000})}
 }catch{unavailable.push(name+' analytics unavailable: check Account Analytics: Read for this account, dataset access, or aggregation delay.')}
 }
 try{const r=await request(`/accounts/${account}/d1/database/${database}`),value=r.result?.file_size;if(!Number.isFinite(value)||value<0)throw new Error('Missing size.');reports.push({name:'Sukan Rakyat database bytes (Free per-database reference)',value,limit:500000000})}catch{unavailable.push('D1 size unavailable: check D1 read permission and database ID.')}
 return{day,reports,unavailable};
}
export function usageReport(data,{free=true}={}){
 const lines=['## Sukan Rakyat usage monitor',`\nUTC date: ${data.day}. Daily reset: 08:00 Malaysia. Analytics can be delayed/sampled; these are early-warning estimates, not billing records.`, '\n| Metric | Usage | Free reference | State |','|---|---:|---:|---|'];let critical=false;
 for(const m of data.reports){const state=m.limit&&free?level(m.value,m.limit):'INFO';if(state==='ACTION')critical=true;lines.push(`| ${m.name} | ${m.value.toLocaleString('en-US')} | ${m.limit?m.limit.toLocaleString('en-US'):'—'} | ${state} |`)}
 for(const issue of data.unavailable)lines.push('\nUNAVAILABLE: '+issue);
 lines.push('\nWATCH ≥50%; PREPARE ≥70%; ACTION ≥80% of Free reference. No paid upgrade is performed. These limits are shared across the account. Storage shown is this database only; check account storage separately in Cloudflare. CPU and HTTP error rates remain available in the Cloudflare dashboard.');
 return{text:lines.join('\n')+'\n',failed:critical||data.unavailable.length>0};
}
async function main(){const database=process.env.CLOUDFLARE_D1_DATABASE_ID;if(!/^[a-f0-9-]{36}$/.test(database||''))throw new Error('Set CLOUDFLARE_D1_DATABASE_ID.');const result=usageReport(await collectUsage({account:accountId(),database}),{free:process.env.SUKAN_MONITOR_FREE_LIMITS!=='false'});console.log(result.text);if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,result.text);if(result.failed)process.exitCode=1}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{console.error('Usage monitor could not complete. Check account ID, database ID and token permissions in GitHub settings. No secrets or raw API responses are logged.');process.exitCode=1});
