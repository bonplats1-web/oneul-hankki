export function gamePool(data,district='전체') {
  return [...new Map(data.filter(r=>['성연면','지곡면'].includes(r.district)&&(district==='전체'||r.district===district)).map(r=>[r.id,r])).values()];
}
export function pickRandomRestaurant(pool,rng=Math.random) {
  return pool.length ? pool[Math.floor(rng()*pool.length)] : null;
}
