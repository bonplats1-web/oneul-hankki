import {pickCandidates} from './core.js';
export function gamePool(data,district='전체') {
  return [...new Map(data.filter(r=>['성연면','지곡면'].includes(r.district)&&(district==='전체'||r.district===district)).map(r=>[r.id,r])).values()];
}
export function pickRandomRestaurant(pool,rng=Math.random) {
  return pool.length ? pool[Math.floor(rng()*pool.length)] : null;
}
export function createLadder(columns,rows=15,rng=Math.random) {
  if(!Number.isInteger(columns)||columns<2||columns>8||!Number.isInteger(rows)||rows<1)throw new RangeError('Invalid ladder size');
  const bridges=Array.from({length:rows},()=>{
    const row=[];
    for(let x=0;x<columns-1;x++)if(rng()<.4){row.push(x);x++;}
    if(!row.length)row.push(Math.floor(rng()*(columns-1)));
    return row;
  });
  return {columns,rows,bridges};
}
export function traceLadder(ladder,start) {
  if(!Number.isInteger(start)||start<0||start>=ladder.columns)throw new RangeError('Invalid starting column');
  let column=start;const points=[[column,0]];
  ladder.bridges.forEach((bridges,row)=>{
    const y=(row+1)/(ladder.rows+1);points.push([column,y]);
    if(bridges.includes(column)){column++;points.push([column,y]);}
    else if(bridges.includes(column-1)){column--;points.push([column,y]);}
  });
  points.push([column,1]);return {column,points};
}
export function createLadderRound(pool,count=6,rng=Math.random) {
  const restaurants=pickCandidates(gamePool(pool),Math.max(2,Math.min(8,count)),rng);
  if(restaurants.length<2)return null;
  return {restaurants,ladder:createLadder(restaurants.length,15,rng)};
}
