import {gamePool,pickRandomRestaurant} from './games-core.js';

export function initGames({getAll,isBusy,setBusy,onWin,toast,beep,random,emojis}) {
  const $=s=>document.querySelector(s);
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
  function refreshEnvelope(){
    const pool=poolFor('envelope');
    $('#envelope-scope').textContent=`${sourceLabel('envelope')} ${pool.length}곳 중 한 곳만 뽑아요. 검색·음식·거리 필터는 적용하지 않아요.`;
    $('#envelope-open').disabled=isBusy()||!pool.length;
    $('#envelope-open').classList.remove('is-opening');
    $('#envelope-status').textContent=pool.length?'봉투 하나, 오늘의 식당 한 곳.':'이 지역에 등록된 식당이 없어요.';
  }
  function draw(mode){
    if(isBusy())return;
    const pool=poolFor(mode),winner=pickRandomRestaurant(pool,random);
    if(!winner){toast('추첨할 식당이 없어요.');return;}
    setBusy(true);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(mode==='envelope'){
      $('#envelope-open').classList.add('is-opening');$('#envelope-status').textContent='봉투 속 오늘의 식당을 열고 있어요…';beep(650,.1);
      setTimeout(()=>{setBusy(false);refreshRandom();refreshEnvelope();$('#envelope-status').textContent=`오늘은 ${winner.name}, 한 곳으로 정했어요.`;onWin(winner,'envelope');},reduced?150:1200);
      return;
    }
    $('.random-machine').classList.add('is-drawing');$('#random-status').textContent=`${pool.length}곳 중 오늘의 식당을 찾고 있어요…`;$('#random-draw span').textContent='맛있는 우연을 찾는 중…';
    const duration=reduced?200:1700,began=performance.now();let next=0;
    function show(r){$('#random-emoji').textContent=emojis[r.category]||'🍽️';$('#random-name').textContent=r.name;$('#random-meta').textContent=`${r.district} · ${r.category}`;}
    function frame(now){
      const elapsed=now-began;
      if(elapsed>=next&&elapsed<duration&&!reduced){show(pickRandomRestaurant(pool,random));$('#random-before').textContent=pickRandomRestaurant(pool,random).name;$('#random-after').textContent=pickRandomRestaurant(pool,random).name;beep(520+elapsed/duration*150,.025);next=elapsed+55+(elapsed/duration)**3*270;}
      if(elapsed<duration){requestAnimationFrame(frame);return;}
      show(winner);$('#random-before').textContent='오늘의 한 끼가 정해졌어요';$('#random-after').textContent='고민 끝! 이제 맛있게 먹으러 가요.';
      $('.random-machine').classList.remove('is-drawing');setBusy(false);refreshRandom();refreshEnvelope();$('#random-status').textContent=`${pool.length}곳 중 ${winner.name} 당첨!`;onWin(winner,'random');
    }
    requestAnimationFrame(frame);
  }
  $('#random-draw').addEventListener('click',()=>draw('random'));
  $('#random-district').addEventListener('change',()=>{if(isBusy())return;refreshRandom();$('#random-name').textContent='오늘의 한 끼';$('#random-emoji').textContent='🍽️';$('#random-meta').textContent='버튼 한 번이면 고민 끝!';$('#random-status').textContent='선택한 지역의 모든 식당에서 뽑아요.';});
  $('#envelope-district').addEventListener('change',refreshEnvelope);$('#envelope-open').addEventListener('click',()=>draw('envelope'));
  return {enter(mode){if(mode==='random')refreshRandom();if(mode==='envelope')refreshEnvelope();},refresh(){refreshRandom();refreshEnvelope();},replay:draw};
}
