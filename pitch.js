import{lineupSlots}from'./core.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function pitchView(s,team,own){
 const slots=lineupSlots(s),ps=s.players.filter(p=>p.status==='joined'&&p.team===team);
 const rows=[...new Set(slots.map(x=>x.row))].map(row=>`<div class="pitch-row">${slots.filter(x=>x.row===row).map(slot=>{const p=ps.find(p=>p.position===slot.id);return `<${own?'button type="button"':'div'} class="player-dot ${own?'position-button':''}" ${own?`data-slot="${slot.id}" data-lineup-team="${team}" aria-label="${esc(slot.label)}: ${esc(p?.name||'Kosong')}, pilih pemain"`:''}><span class="position-label">${slot.label}</span><span class="jersey">${p?esc(p.name.slice(0,2).toUpperCase()):'+'}</span><span>${esc(p?.name||'Kosong')}</span></${own?'button':'div'}>`}).join('')}</div>`).join('');
 return `<p class="field-help">${own?'Tekan posisi untuk pilih pemain. Pilih team pemain dahulu. Pemain yang sudah di padang akan bertukar posisi; pemain gantian menggantikan penghuni slot.':'Posisi ditentukan organizer.'}</p><div class="pitch ${team==='B'?'team-b':''}"><div class="pitch-circle"></div>${rows}</div><p class="bench"><b>Pemain gantian / belum pilih posisi:</b> ${ps.filter(p=>!slots.some(x=>x.id===p.position)).map(p=>esc(p.name)).join(', ')||'Tiada'}</p>`;
}
export function lineupForm(s,team,slot,formId){
 const label=lineupSlots(s).find(x=>x.id===slot)?.label;if(!label)throw new Error('Posisi tidak sah.');
 const ps=s.players.filter(p=>p.status==='joined'&&p.team===team),current=ps.find(p=>p.position===slot);
 return `<h2>TEAM ${esc(team)} · ${label}</h2><form id="${formId}" data-team="${esc(team)}" data-slot="${esc(slot)}"><label>Pilih pemain<select name="playerId"><option value="">Kosongkan posisi</option>${ps.map(p=>`<option value="${esc(p.id)}" ${p.id===current?.id?'selected':''}>${esc(p.name)}${p.position?' (di padang)':' (gantian)'}</option>`).join('')}</select></label><p class="field-help">Pemain di posisi lain akan bertukar tempat. Kosongkan posisi untuk pindahkan pemain ke senarai gantian.</p><p class="error" role="alert"></p><button type="submit" class="primary">Simpan posisi</button></form>`;
}
