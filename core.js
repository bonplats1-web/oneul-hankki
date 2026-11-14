export const TAU = Math.PI * 2;
export function distanceKm(a,b) {
  if(!a || !b || !Number.isFinite(a.lat) || !Number.isFinite(b.lat) || !Number.isFinite(a.lng) || !Number.isFinite(b.lng)) return null;
  const r=Math.PI/180, dlat=(b.lat-a.lat)*r, dlng=(b.lng-a.lng)*r;
  const v=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(v),Math.sqrt(Math.max(0,1-v)));
}
export function filterRestaurants(data,{district='전체',category='전체',query='',radius=0,origin=null,excluded='',excludeIds=[],favorites=null}={}) {
  const q=query.trim().toLocaleLowerCase('ko'), omit=excluded.split(/[,，]/).map(x=>x.trim().toLowerCase()).filter(Boolean);
  return data.filter(r=> (district==='전체'||r.district===district) && (category==='전체'||r.category===category) &&
    (!q||[r.name,r.address,r.category].join(' ').toLowerCase().includes(q)) && !excludeIds.includes(r.id) &&
    !omit.some(x=>[r.name,r.category].join(' ').toLowerCase().includes(x)) && (!favorites||favorites.includes(r.id)) &&
    (!radius||(origin && distanceKm(origin,r)!==null && distanceKm(origin,r)<=radius)));
}
export function pickCandidates(data,count=8,rng=Math.random) {
  const pool=[...new Map(data.map(r=>[r.id,r])).values()];
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,Math.max(0,Math.min(12,count)));
}
export function winnerAt(rotation,n) {if(!n)return -1;return Math.floor((((-Math.PI/2-rotation)%TAU)+TAU)%TAU/(TAU/n));}
export function targetRotation(current,index,n) {
  const desired=(((-Math.PI/2-(index+.5)*TAU/n)%TAU)+TAU)%TAU;
  return current+6*TAU+((desired-current%TAU+TAU)%TAU);
}
export function validateCustom(r){
  if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.trim().length>60)return {ok:false,message:'식당 이름을 1~60자로 입력해 주세요.'};
  if(!['성연면','지곡면'].includes(r.district)||typeof r.address!=='string'||!r.address.includes(r.district)||r.address.trim().length<8||r.address.length>180)return {ok:false,message:'선택한 면 이름이 포함된 서산시 주소를 입력해 주세요.'};
  if(!/서산시\s+(성연면|지곡면)\s+\S+/.test(r.address))return {ok:false,message:'서산시 성연면 또는 서산시 지곡면의 상세 주소가 필요해요.'};
  return {ok:true};
}
