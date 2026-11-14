import {gamePool,pickRandomRestaurant,createLadderRound,traceLadder} from './games-core.js';

export function initGames({getAll,isBusy,setBusy,onWin,toast,beep,random,esc,emojis}) {
  const $=s=>document.querySelector(s);
  let active='roulette',round=null,resolved=false,lastWinner=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const poolFor=game=>gamePool(getAll(),$(`#${game}-district`).value);
  const sourceLabel=game=>$(`#${game}-district`).value==='전체'?'성연면·지곡면':$(`#${game}-district`).value;

  function refreshRandom(){
    const pool=poolFor('random');
    $('#random-pool-count').textContent=pool.length;
    $('#random-scope-note').textContent=`${sourceLabel('random')}의 모든 등록 식당 (직접 추가 포함)`;
    $('#random-chance').textContent=pool.length?`식당마다 당첨 확률 1 / ${pool.length}`:'이 지역에 등록된 식당이 없어요.';
    $('#random-draw').disabled=isBusy()||!pool.length;
    $('#random-draw span').textContent=$('#random-district').value==='전체'?'전체 식당에서 뽑기':`${sourceLabel('random')} 식당에서 뽑기`;
  }

  function drawRandom(){
    if(isBusy())return;
    const pool=poolFor('random'),winner=pickRandomRestaurant(pool,random);
    if(!winner){toast('추첨할 식당이 없어요.');return;}
    setBusy(true);
    $('.random-machine').classList.add('is-drawing');
    $('#random-status').textContent=`${pool.length}곳 중 오늘의 식당을 찾고 있어요…`;
    $('#random-draw span').textContent='맛있는 우연을 찾는 중…';
    const duration=reduced()?250:2700,began=performance.now();let next=0;
    function show(r){$('#random-emoji').textContent=emojis[r.category]||'🍽️';$('#random-name').textContent=r.name;$('#random-meta').textContent=`${r.district} · ${r.category}`;}
    function frame(now){
      const elapsed=now-began;
      if(elapsed>=next&&elapsed<duration){
        if(!reduced()){show(pickRandomRestaurant(pool,random));$('#random-before').textContent=pickRandomRestaurant(pool,random).name;$('#random-after').textContent=pickRandomRestaurant(pool,random).name;beep(520+elapsed/duration*150,.025);}
        next=elapsed+55+(elapsed/duration)**3*270;
      }
      if(elapsed<duration){requestAnimationFrame(frame);return;}
      show(winner);$('#random-before').textContent='오늘의 한 끼가 정해졌어요';$('#random-after').textContent='고민 끝! 이제 맛있게 먹으러 가요.';
      $('.random-machine').classList.remove('is-drawing');setBusy(false);refreshRandom();
      $('#random-status').textContent=`${pool.length}곳 중 ${winner.name} 당첨!`;
      onWin(winner,'random');
    }
    requestAnimationFrame(frame);
  }

  function prepareLadder(){
    if(isBusy())return;
    const pool=poolFor('ladder');
    round=createLadderRound(pool,Number($('#ladder-count').value),random);resolved=false;lastWinner=null;
    $('#ladder-result').hidden=true;
    const count=round?.restaurants.length||0;
    $('#ladder-source').textContent=round?`${sourceLabel('ladder')} ${pool.length}곳 중 ${count}곳을 중복 없이 무작위 배정했어요.`:'사다리타기에는 등록된 식당이 2곳 이상 필요해요.';
    $('#ladder-status').textContent=round?'위의 출발 번호를 눌러주세요.':'식당을 추가하거나 다른 지역을 선택해 주세요.';
    const starts=$('#ladder-starts'),svg=$('#ladder-svg'),ends=$('#ladder-ends');
    starts.innerHTML='';svg.innerHTML='';ends.innerHTML='';
    if(!round)return;
    $('#ladder-board').style.setProperty('--columns',count);
    $('#ladder-board').style.setProperty('--min-board-width',Math.max(300,count*76)+'px');
    starts.innerHTML=Array.from({length:count},(_,i)=>`<button data-start="${i}" aria-label="${i+1}번 사다리 출발">${i+1}</button>`).join('');
    svg.setAttribute('viewBox',`0 0 ${count*100} 340`);
    svg.setAttribute('aria-label',`${count}개의 출발 번호와 식당을 연결하는 사다리`);
    const x=i=>(i+.5)*100,y=t=>20+t*300;
    let markup=Array.from({length:count},(_,i)=>`<line class="ladder-rail" x1="${x(i)}" x2="${x(i)}" y1="20" y2="320"/>`).join('');
    round.ladder.bridges.forEach((row,j)=>row.forEach(i=>{const py=y((j+1)/(round.ladder.rows+1));markup+=`<line class="ladder-bridge" x1="${x(i)}" x2="${x(i+1)}" y1="${py}" y2="${py}"/>`;}));
    svg.innerHTML=markup+'<path id="ladder-trace" class="ladder-trace" d=""/>';
    ends.innerHTML=Array.from({length:count},(_,i)=>`<div class="ladder-end"><span class="question" aria-hidden="true">?</span><small>${i+1}번 도착점</small></div>`).join('');
  }

  function startLadder(start){
    if(isBusy()||!round||resolved)return;
    const current=round,{column,points}=traceLadder(current.ladder,start);
    const winner=current.restaurants[column];
    setBusy(true);
    document.querySelector(`[data-start="${start}"]`).classList.add('selected');
    $('#ladder-status').textContent=`${start+1}번 출발! 사다리를 따라 내려가는 중이에요…`;
    const path=$('#ladder-trace');
    path.setAttribute('d',points.map(([x,y],i)=>`${i?'L':'M'} ${(x+.5)*100} ${20+y*300}`).join(' '));
    const length=path.getTotalLength();path.style.strokeDasharray=String(length);path.style.strokeDashoffset=String(length);
    const duration=reduced()?250:3500,began=performance.now();let lastTick=-1;
    function frame(now){
      const progress=Math.min(1,(now-began)/duration);path.style.strokeDashoffset=String(length*(1-progress));
      const tick=Math.floor(progress*12);if(tick!==lastTick){lastTick=tick;beep(490+tick*23,.025);}
      if(progress<1){requestAnimationFrame(frame);return;}
      resolved=true;lastWinner=winner;setBusy(false);
      document.querySelectorAll('[data-start]').forEach(b=>b.disabled=true);
      $('#ladder-ends').innerHTML=current.restaurants.map((r,i)=>`<div class="ladder-end ${i===column?'winner':''}"><b>${esc(r.name)}</b><small>${esc(r.district)} · ${esc(r.category)}</small></div>`).join('');
      $('#ladder-status').textContent=`${start+1}번 출발 → ${column+1}번 도착 · ${winner.name} 당첨!`;
      $('#ladder-result').hidden=false;
      onWin(winner,'ladder');
    }
    requestAnimationFrame(frame);
  }

  $('#random-draw').addEventListener('click',drawRandom);
  $('#random-district').addEventListener('change',()=>{if(isBusy())return;refreshRandom();$('#random-name').textContent='오늘의 한 끼';$('#random-emoji').textContent='🍽️';$('#random-meta').textContent='버튼 한 번이면 고민 끝!';$('#random-status').textContent='선택한 지역의 모든 식당에서 뽑아요.';});
  $('#ladder-district').addEventListener('change',prepareLadder);
  $('#ladder-count').addEventListener('change',prepareLadder);
  $('#ladder-new').addEventListener('click',prepareLadder);
  $('#ladder-starts').addEventListener('click',e=>{const button=e.target.closest('[data-start]');if(button)startLadder(Number(button.dataset.start));});
  $('#ladder-result').addEventListener('click',()=>{if(lastWinner&&!isBusy())onWin(lastWinner,'ladder',false);});
  return {
    enter(mode){active=mode;if(mode==='random')refreshRandom();if(mode==='ladder')prepareLadder();},
    refresh(){refreshRandom();if(active==='ladder')prepareLadder();},
    replay(mode){if(mode==='random')drawRandom();else if(mode==='ladder'){prepareLadder();$('#ladder-starts button')?.focus();}}
  };
}
