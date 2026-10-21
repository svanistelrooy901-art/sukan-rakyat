export const DEMO_USER = 'mamu';
export const SPORTS = {football:{name:'Bola sepak',icon:'⚽',formats:['11 sebelah','9 sebelah']},futsal:{name:'Futsal',icon:'🥅',formats:['5 sebelah']},badminton:{name:'Badminton',icon:'🏸',formats:['Beregu','Perseorangan']}};
export function money(cents){return new Intl.NumberFormat('ms-MY',{style:'currency',currency:'MYR'}).format(cents/100)}
export function due(s,p){return p.assessedFee??s.fee}
export function received(s,p){return p.ledger?p.ledger.reduce((a,x)=>a+x.amount,0):(p.payment==='verified'?s.fee:0)}
export function balance(s,p){return due(s,p)-received(s,p)}
export function migrate(s){s.feeMode??='fixed';s.feeHistory??=[];s.mapsUrl??='';s.deadline??='';s.reminderHours??=24;for(const p of s.players){p.assessedFee??=s.fee;p.attendance??='unknown';if(!p.ledger)p.ledger=p.payment==='verified'?[{amount:s.fee,at:p.verifiedAt||null,actor:s.owner,kind:'legacy'}]:[];p.claimAmount??=p.payment==='pending'?Math.max(0,balance(s,p)):0}return s}
export function totals(s){const active=s.players.filter(p=>p.status==='joined');return {joined:active.length,waiting:s.players.filter(p=>p.status==='waiting').length,received:active.reduce((n,p)=>n+received(s,p),0),target:active.reduce((n,p)=>n+due(s,p),0),remaining:active.reduce((n,p)=>n+Math.max(0,balance(s,p)),0),paid:active.filter(p=>balance(s,p)<=0).length}}
export function canView(s,id){return s.owner===id||s.players.some(p=>p.id===id&&p.status==='joined')}
export function join(s,id,name){if(s.players.some(p=>p.id===id))throw new Error('Anda sudah menyertai sesi ini.');const waiting=totals(s).joined>=s.capacity;s.players.push({id,name,status:waiting?'waiting':'joined',payment:'unpaid',team:'',position:'',verifiedAt:null,assessedFee:s.fee,attendance:'unknown',ledger:[],claimAmount:0});return waiting}
export function leave(s,id){if(s.owner===id)throw new Error('Organizer perlu kekal dalam sesi.');const p=s.players.find(p=>p.id===id);if(p&&(received(s,p)>0||p.payment==='pending'))throw new Error('Hubungi organizer untuk semak bayaran / urusan refund.');s.players=s.players.filter(p=>p.id!==id);const next=s.players.find(p=>p.status==='waiting');if(next&&totals(s).joined<s.capacity)next.status='joined'}
export function setPayment(s,actor,id,status,amount){migrate(s);if(!['unpaid','pending','verified'].includes(status))throw new Error('Status tidak sah.');const p=s.players.find(p=>p.id===id&&p.status==='joined');if(!p)throw new Error('Pemain bukan peserta aktif.');if(actor!==s.owner&&(actor!==id||status!=='pending'))throw new Error('Hanya organizer boleh mengesahkan bayaran.');if(status==='pending'){if(p.payment==='pending'||balance(s,p)<=0)throw new Error('Tiada bayaran baharu perlu dimaklumkan.');p.claimAmount=balance(s,p);p.payment='pending';return}if(status==='unpaid'){const paid=received(s,p);if(paid)p.ledger.push({amount:-paid,at:new Date().toISOString(),actor,kind:'correction'});p.claimAmount=0;p.payment='unpaid';p.verifiedAt=null;return}const value=amount??(p.payment==='pending'?p.claimAmount:Math.max(0,balance(s,p)));if(!Number.isSafeInteger(value)||value<=0)throw new Error('Jumlah bayaran mesti melebihi RM0.');p.ledger.push({amount:value,at:new Date().toISOString(),actor,kind:'payment'});p.claimAmount=0;p.verifiedAt=new Date().toISOString();p.payment=balance(s,p)<=0?'verified':'unpaid'}
export function mapsLink(v){if(!v)return '';try{const u=new URL(v);const h=u.hostname.toLowerCase();if(u.protocol!=='https:'||u.username||u.password||u.port)throw 0;if(h==='maps.app.goo.gl'||(h==='goo.gl'&&u.pathname.startsWith('/maps'))||h==='maps.google.com'||((h==='google.com'||h==='www.google.com'||h==='google.com.my'||h==='www.google.com.my')&&u.pathname.startsWith('/maps')))return u.href}catch{}throw new Error('Gunakan link HTTPS Google Maps yang sah.')}
export function proposedFee(s,mode=s.feeMode,manual=s.fee){const ps=s.players.filter(p=>p.status==='joined');if(!['fixed','capacity','attendance'].includes(mode))throw new Error('Mod kutipan tidak sah.');if(mode==='fixed'){if(!Number.isSafeInteger(manual)||manual<0)throw new Error('Jumlah tidak sah.');return manual}if(mode==='attendance'&&ps.some(p=>p.attendance==='unknown'))throw new Error('Tandakan kehadiran semua peserta dahulu.');const count=mode==='capacity'?s.capacity:ps.filter(p=>p.attendance==='present').length;if(!count)throw new Error('Sekurang-kurangnya seorang mesti hadir.');return Math.ceil(s.cost/count)}
export function recalculate(s,actor,mode,manual=s.fee){if(actor!==s.owner)throw new Error('Hanya organizer boleh ubah kutipan.');migrate(s);const fee=proposedFee(s,mode,manual);s.feeHistory.push({at:new Date().toISOString(),actor,mode,previous:s.fee,next:fee,assessments:s.players.filter(p=>p.status==='joined').map(p=>({id:p.id,previous:due(s,p),next:mode==='attendance'&&p.attendance!=='present'?0:fee}))});s.fee=fee;s.feeMode=mode;for(const p of s.players.filter(p=>p.status==='joined')){p.assessedFee=mode==='attendance'&&p.attendance!=='present'?0:fee;if(p.payment!=='pending')p.payment=balance(s,p)<=0?'verified':'unpaid'}return fee}
export function setAttendance(s,actor,id,value){if(actor!==s.owner)throw new Error('Hanya organizer boleh rekod kehadiran.');if(!['unknown','present','absent'].includes(value))throw new Error('Kehadiran tidak sah.');const p=s.players.find(p=>p.id===id&&p.status==='joined');if(!p)throw new Error('Pemain tidak sah.');p.attendance=value}
export function reminderState(s,p,now=Date.now()){if(!s.deadline||balance(s,p)<=0)return '';const end=new Date(s.deadline).getTime();if(now>end)return 'Lewat bayar';return end-now<=s.reminderHours*3600000?'Bayaran hampir deadline':'Belum sampai deadline'}
export function validateSession(d){if(!SPORTS[d.sport]||!SPORTS[d.sport].formats.includes(d.format))throw new Error('Pilih sukan dan format yang sah.');if(!d.title.trim()||!d.location.trim())throw new Error('Isi nama sesi dan lokasi.');if(!Number.isInteger(d.capacity)||d.capacity<1)throw new Error('Had peserta mesti nombor bulat sekurang-kurangnya 1.');if(!Number.isSafeInteger(d.fee)||d.fee<0||!Number.isSafeInteger(d.cost)||d.cost<0)throw new Error('Masukkan jumlah bayaran yang sah.');if(!Number.isFinite(new Date(d.date).getTime())||new Date(d.date)<=new Date())throw new Error('Pilih masa sesi pada masa hadapan.');mapsLink(d.mapsUrl||'');if(d.deadline&&!Number.isFinite(new Date(d.deadline).getTime()))throw new Error('Deadline tidak sah.');if(d.sport==='badminton'&&(!Number.isInteger(d.courts)||d.courts<1))throw new Error('Masukkan jumlah court.');return d}
export function shuffle(s,rng=Math.random){const players=s.players.filter(p=>p.status==='joined');for(let i=players.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[players[i],players[j]]=[players[j],players[i]]}players.forEach((p,i)=>{p.team=i%2?'B':'A';p.position=''})}
function future(days,hour){const d=new Date();d.setDate(d.getDate()+days);d.setHours(hour,0,0,0);return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
export function seed(){const names=['Mamu','Aiman','Faris','Hakim','Syafiq','Amir','Azlan','Din','Izzat','Rizal','Khairul','Faiz'];return [{id:'futsal-jumaat',sport:'futsal',format:'5 sebelah',title:'Friday Night Futsal',location:'Court contoh · Bayan Baru',date:future(3,21),capacity:16,fee:2000,cost:28000,owner:'mamu',ownerName:'Mamu',account:'',recipient:'',qr:'',note:'Bawa kasut court dan air sendiri. Kita main santai, semua dapat minit!',formation:'2-2',courts:1,players:names.map((name,i)=>({id:i?'p'+i:'mamu',name,status:'joined',payment:i<8?'verified':i<10?'pending':'unpaid',team:i%2?'B':'A',position:'',verifiedAt:null}))},{id:'bola-ahad',sport:'football',format:'9 sebelah',title:'Veteran Turun Padang',location:'Padang contoh · Seberang Jaya',date:future(5,8),capacity:28,fee:1500,cost:30000,owner:'p1',ownerName:'Aiman',account:'',recipient:'',qr:'',note:'Rolling subs. Penat? Tukar dulu, sambung kemudian.',formation:'3-3-2',courts:1,players:names.slice(1,7).map((name,i)=>({id:'p'+(i+1),name,status:'joined',payment:'unpaid',team:'',position:''}))},{id:'badminton-rabu',sport:'badminton',format:'Beregu',title:'Smash & Santai',location:'Dewan contoh · Batu Kawan',date:future(2,20),capacity:12,fee:1200,cost:12000,owner:'p2',ownerName:'Faris',account:'',recipient:'',qr:'',note:'Dua court. Shuttle dibawa organizer.',formation:'',courts:2,players:[{id:'p2',name:'Faris',status:'joined',payment:'verified',team:'',position:''}]}]}

// WhatsApp click-to-chat accepts international digits, without the leading +.
export function organizerPhone(value){
 if(typeof value!=='string'||value.length>40||!/^\+?[\d\s()\-]+$/.test(value.trim()))throw new Error('Isi nombor WhatsApp organizer yang sah, contoh +60123456789.');
 let phone=value.trim().replace(/[\s()\-]/g,'').replace(/^\+/,'');
 if(phone.startsWith('00'))phone=phone.slice(2);
 else if(phone.startsWith('0'))phone='60'+phone.slice(1);
 if(!/^[1-9]\d{7,14}$/.test(phone)||phone.startsWith('600'))throw new Error('Guna kod negara, contoh +60123456789 (Malaysia: 0123456789 juga diterima).');
 return phone;
}
export function receiptLink(s,p){
 const phone=organizerPhone(s.organizerPhone),amount=p.payment==='pending'?p.claimAmount:Math.max(0,balance(s,p));
 const text=`Salam ${s.ownerName}, saya ${p.name}.\nSukan Rakyat — ${s.title}\nTarikh sesi: ${new Date(s.date).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'})} (MYT)\nSaya dah transfer ${money(amount)}.\nSaya akan lampirkan resit di sini. Mohon semak transaksi bank. Terima kasih!`;
 return 'https://wa.me/'+phone+'?text='+encodeURIComponent(text);
}

export const FORMATIONS={'11 sebelah':['4-3-3','4-4-2','3-5-2'],'9 sebelah':['3-3-2','3-2-3','4-3-1'],'5 sebelah':['2-2','1-2-1','3-1']};
export function lineupSlots(s){
 if(s.sport==='badminton'||!FORMATIONS[s.format]?.includes(s.formation))throw new Error('Formation tidak sah.');
 const rows=[1,...s.formation.split('-').map(Number)];
 return rows.flatMap((count,row)=>Array.from({length:count},(_,col)=>({id:`${row}:${col}`,row,label:row===0?'GK':`${row===1?'DEF':row===rows.length-1?'FWD':'MID'} ${col+1}`})));
}
export function setLineup(s,actor,team,slot,playerId){
 if(actor!==s.owner)throw new Error('Hanya organizer boleh susun posisi.');
 if(!['A','B'].includes(team)||!lineupSlots(s).some(x=>x.id===slot))throw new Error('Posisi tidak sah.');
 const ps=s.players.filter(p=>p.status==='joined'&&p.team===team),old=ps.find(p=>p.position===slot);
 if(playerId===''){if(old)old.position='';return}
 const p=ps.find(p=>p.id===playerId);if(!p)throw new Error('Pilih peserta aktif dalam team ini dahulu.');
 if(old?.id===p.id)return;
 const previous=lineupSlots(s).some(x=>x.id===p.position)?p.position:'';
 if(old)old.position=previous;
 p.position=slot;
}
export function setFormation(s,actor,formation){
 if(actor!==s.owner)throw new Error('Hanya organizer boleh ubah formation.');
 if(s.sport==='badminton'||!FORMATIONS[s.format]?.includes(formation))throw new Error('Formation tidak sah.');
 if(s.formation!==formation){s.formation=formation;for(const p of s.players)p.position=''}
}
