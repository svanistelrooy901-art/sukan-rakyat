export class HttpError extends Error {constructor(status,message){super(message);this.status=status}}
export const fail=(status,message)=>{throw new HttpError(status,message)};
export function randomToken(){return [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function hash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
function decode(part){try{const s=part.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}catch{fail(401,'Token Google tidak sah.')}}
let keyCache={keys:[],until:0};
export async function verifyGoogle(token,clientId,nonce,fetcher=fetch,now=Date.now()){
 if(typeof token!=='string'||token.length>16000)fail(401,'Token Google tidak sah.');
 const parts=token.split('.');if(parts.length!==3)fail(401,'Token Google tidak sah.');let head,claims;try{head=JSON.parse(new TextDecoder().decode(decode(parts[0])));claims=JSON.parse(new TextDecoder().decode(decode(parts[1])))}catch{fail(401,'Token Google tidak sah.')}
 if(head.alg!=='RS256'||typeof head.kid!=='string')fail(401,'Algoritma token tidak sah.');
 if(keyCache.until<now){const res=await fetcher('https://www.googleapis.com/oauth2/v3/certs');if(!res.ok)fail(503,'Pengesahan Google tidak tersedia.');const body=await res.json();if(!Array.isArray(body.keys))fail(503,'Kunci Google tidak tersedia.');keyCache={keys:body.keys,until:now+300000}}
 const jwk=keyCache.keys.find(k=>k.kid===head.kid);if(!jwk)fail(401,'Kunci token tidak dikenali. Cuba login semula.');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))fail(401,'Tandatangan token tidak sah.');
 if(!['https://accounts.google.com','accounts.google.com'].includes(claims.iss)||claims.aud!==clientId||typeof claims.exp!=='number'||claims.exp<=now/1000||typeof claims.iat!=='number'||claims.iat>now/1000+60||now/1000-claims.iat>600||claims.nonce!==nonce||claims.email_verified!==true||typeof claims.sub!=='string'||!claims.sub||claims.sub.length>255)fail(401,'Token Google tamat atau tidak sepadan.');
 return{id:claims.sub,name:String(claims.name||'Pemain').slice(0,80)};
}
export async function authenticate(request,db){const raw=request.headers.get('Authorization')||'';if(!/^Bearer [a-f0-9]{64}$/.test(raw))fail(401,'Login Google diperlukan.');const tokenHash=await hash(raw.slice(7));const u=await db.prepare('SELECT u.id,u.name FROM auth_sessions a JOIN users u ON u.id=a.user_id WHERE a.token_hash=? AND a.expires_at>?').bind(tokenHash,Date.now()).first();if(!u)fail(401,'Sesi login tamat. Sila login semula.');return {...u,tokenHash}}
export async function rateLimit(db,key,max,windowMs){const now=Date.now();const row=await db.prepare('INSERT INTO request_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING count').bind(key,now+windowMs,now,now,now+windowMs).first();if(row.count>max)fail(429,'Terlalu banyak permintaan. Cuba sebentar lagi.')}
