// Roles come only from a verified Google email stored by the login endpoint.
export function isAdmin(user,env){return !!user.email&&(env.ADMIN_EMAILS||'').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean).includes(user.email.toLowerCase())}
export async function adminStats(db,now=Date.now()){
 const seven=now-7*86400000,month=now-30*86400000;
 const [accounts,games,participation,sports,growth]=await Promise.all([
  db.prepare(`SELECT COUNT(*) total,COALESCE(SUM(created_at>=?),0) new7,COALESCE(SUM(created_at>=?),0) new30,
   (SELECT COUNT(DISTINCT user_id) FROM auth_sessions WHERE expires_at>?) loggedIn7
   FROM users`).bind(seven,month,now).first(),
  db.prepare(`SELECT COUNT(*) total,COUNT(DISTINCT owner_id) organizers,
   COALESCE(SUM(created_at>=?),0) new7,
   COALESCE(SUM(julianday(json_extract(data,'$.date'))>=julianday(?)),0) upcoming,
   COALESCE(SUM(julianday(json_extract(data,'$.date'))<julianday(?)),0) past,
   COALESCE(SUM(json_extract(data,'$.capacity')),0) capacity FROM sessions`).bind(seven,new Date(now).toISOString(),new Date(now).toISOString()).first(),
  db.prepare(`WITH players AS (
   SELECT json_extract(p.value,'$.id') id,json_extract(p.value,'$.status') status,
    json_extract(p.value,'$.payment') payment,json_extract(p.value,'$.attendance') attendance,
    COALESCE(json_extract(p.value,'$.assessedFee'),json_extract(s.data,'$.fee'),0) due,
    CASE WHEN json_type(p.value,'$.ledger')='array' THEN COALESCE((SELECT SUM(json_extract(l.value,'$.amount')) FROM json_each(p.value,'$.ledger') l),0)
     WHEN json_extract(p.value,'$.payment')='verified' THEN COALESCE(json_extract(s.data,'$.fee'),0) ELSE 0 END paid
   FROM sessions s,json_each(s.data,'$.players') p)
   SELECT COALESCE(SUM(status='joined'),0) joined,COALESCE(SUM(status='waiting'),0) waiting,
    COUNT(DISTINCT CASE WHEN status='joined' THEN id END) uniquePlayers,
    COALESCE(SUM(status='joined' AND attendance='present'),0) present,
    COALESCE(SUM(status='joined' AND attendance='absent'),0) absent,
    COALESCE(SUM(status='joined' AND payment='pending'),0) pending,
    COALESCE(SUM(CASE WHEN status='joined' THEN due ELSE 0 END),0) target,
    COALESCE(SUM(CASE WHEN status='joined' THEN paid ELSE 0 END),0) received,
    COALESCE(SUM(CASE WHEN status='joined' THEN MAX(0,due-paid) ELSE 0 END),0) remaining
   FROM players`).bind().first(),
  db.prepare(`SELECT json_extract(data,'$.sport') sport,COUNT(*) sessions,
   COALESCE(SUM((SELECT COUNT(*) FROM json_each(s.data,'$.players') p WHERE json_extract(p.value,'$.status')='joined')),0) joined
   FROM sessions s GROUP BY sport ORDER BY sessions DESC,sport`).bind().all(),
  db.prepare(`SELECT day,SUM(accounts) accounts,SUM(sessions) sessions FROM (
   SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch','+8 hours') day,COUNT(*) accounts,0 sessions FROM users WHERE created_at>=? GROUP BY day
   UNION ALL SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch','+8 hours') day,0 accounts,COUNT(*) sessions FROM sessions WHERE created_at>=? GROUP BY day
   ) GROUP BY day ORDER BY day DESC`).bind(month,month).all()
 ]);
 return{generatedAt:new Date(now).toISOString(),accounts,games,participation,sports:sports.results,growth:growth.results};
}
