import {distanceKm,filterRestaurants,pickCandidates,targetRotation,TAU,validateCustom} from './core.js';
import {initGames} from './games.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const paths={ladder:'<path d="M6 3v18M18 3v18M6 7h12M6 12h12M6 17h12"/>',pin:'<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 8.5a2.6 2.6 0 0 1 5 1c0 2-2.5 2-2.5 4m0 3h.01"/>',wheel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v7m9 2h-7m-2 9v-7m-9-2h7M6 6l4.5 4.5m7.5 7.5-4.5-4.5M18 6l-4.5 4.5m-7.5 7.5 4.5-4.5"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',locate:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 1v4m11 7h-4m-7 11v-4M1 12h4"/>',sliders:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/><circle cx="10" cy="18" r="2" fill="white"/>',chevron:'<path d="m6 9 6 6 6-6"/>',plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="m5 12 4 4L19 6"/>',x:'<path d="m6 6 12 12M6 18 18 6"/>',volumeOff:'<path d="m11 5-6 4H2v6h3l6 4V5Zm6 4 5 6m-5 0 5-6"/>',volume:'<path d="m11 5-6 4H2v6h3l6 4V5Zm4 4c2 2 2 4 0 6m3-9c4 4 4 8 0 12"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',spark:'<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Z"/>',shuffle:'<path d="m16 3 4 4-4 4m0 2 4 4-4 4M3 7h3c5 0 5 10 10 10h4M3 17h3c5 0 5-10 10-10h4"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',external:'<path d="M14 3h7v7m0-7L10 14m0-10H4v16h16v-6"/>',link:'<path d="m10 13 4-4m-5 6-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 2 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.5 6.6-4m-6.6 7 6.6 4"/>',utensils:'<path d="M4 3v6c0 3 6 3 6 0V3M7 3v18M20 3c-5 0-5 10 0 10V3Zm0 10v8"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[n]||paths.info}</svg>`;
function icons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.outerHTML=icon(el.dataset.icon)});}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emojis={'전체':'🍽️','한식':'🍚','중식':'🥟','일식':'🍣','양식':'🍝','분식':'🍙','카페':'☕','고기·구이':'🥩','치킨·주점':'🍗','회·해산물':'🦐','기타':'🍴'};
const gameLabels={roulette:'후보 룰렛',random:'전체 랜덤',envelope:'봉투 뽑기',ladder:'사다리타기'};
const colors=['#f9c4a7','#f7dfa0','#dce7c6','#d6e6e3','#e4dced','#f3c9b8','#f3e9bb','#e2e6b8','#f4d4d8','#cddfd0','#e8daca','#e6dff4'];
let all=[],base=[],candidates=[],rotation=0,busy=false,sound=false,audio=null,tab='roulette',toastTimer,shownMode='shared',finishSpin=null,locationRequest=0;
const filters={district:'전체',category:'전체',query:'',radius:0,origin:null,excluded:'',excludeIds:[]};
function readStore(){try{const p=JSON.parse(localStorage.getItem('oneul-v1')||'{}');return p&&typeof p==='object'?p:{};}catch{return {};}}
let saved=readStore();
let favorites=Array.isArray(saved.favorites)?saved.favorites.filter(x=>typeof x==='string').slice(0,500):[];
let custom=Array.isArray(saved.custom)?saved.custom.filter(r=>r&&typeof r.id==='string'&&validateCustom(r).ok).slice(0,200).map(r=>({...r,category:Object.keys(emojis).includes(r.category)?r.category:'기타',source:'custom',lat:undefined,lng:undefined})):[];
let history=Array.isArray(saved.history)?saved.history.filter(r=>r&&typeof r.id==='string'&&Number.isFinite(r.time)).slice(0,20):[];
function persist(){try{localStorage.setItem('oneul-v1',JSON.stringify({favorites,custom,history}));}catch{toast('저장 공간을 사용할 수 없어 이번 화면에서만 유지돼요.');}}
function toast(message){clearTimeout(toastTimer);const dialog=$('dialog[open]'),el=$('#toast');(dialog||document.body).append(el);el.classList.toggle('dialog-toast',!!dialog);el.textContent=message;el.hidden=false;toastTimer=setTimeout(()=>el.hidden=true,3600);}
function random(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;}
function filtered(){const data=filterRestaurants(all,{...filters,favorites:tab==='favorites'?favorites:null});const sort=$('#sort').value;
 if(sort==='name')data.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
 if(sort==='distance'&&filters.origin)data.sort((a,b)=>(distanceKm(filters.origin,a)??Infinity)-(distanceKm(filters.origin,b)??Infinity));
 return data;
}
function prettyDistance(r){const d=distanceKm(filters.origin,r);return d===null?'':d<1?`${Math.round(d*1000)}m`:`${d.toFixed(1)}km`;}
function renderList(){const data=filtered();$('#restaurant-count').textContent=data.length;$('#favorite-count').textContent=favorites.length;
 if(!data.length){let title='조건에 맞는 식당이 없어요',desc='검색어나 거리·음식 종류를 바꿔보세요.';
 if(tab==='favorites'&&!favorites.length){title='마음에 드는 식당을 찜해보세요';desc='식당 옆 하트를 누르면 여기에 모아드려요.';}
 $('#restaurants').innerHTML=`<div class="empty-state"><strong>${title}</strong>${desc}<button class="text-button" data-action="custom">${icon('plus')}직접 추가하기</button></div>`;return;}
 $('#restaurants').innerHTML=data.map(r=>`<div class="restaurant-row"><div class="food-icon">${emojis[r.category]||'🍽️'}</div><div class="restaurant-text"><button class="restaurant-name" data-detail="${esc(r.id)}" title="${esc(r.name)}">${esc(r.name)}</button><div class="restaurant-meta"><span>${esc(r.category)}</span><span>${r.district}</span>${prettyDistance(r)?`<span>${prettyDistance(r)}</span>`:''}${r.source==='custom'?'<span>직접 추가</span>':''}</div></div><div class="row-actions"><button data-favorite="${esc(r.id)}" class="${favorites.includes(r.id)?'selected':''}" aria-pressed="${favorites.includes(r.id)}" aria-label="${esc(r.name)} 찜">${icon('heart')}</button><button data-candidate="${esc(r.id)}" class="candidate-toggle ${candidates.some(c=>c.id===r.id)?'selected':''}" aria-pressed="${candidates.some(c=>c.id===r.id)}" aria-label="${esc(r.name)} 후보 ${candidates.some(c=>c.id===r.id)?'제외':'추가'}">${icon(candidates.some(c=>c.id===r.id)?'check':'plus')}</button></div></div>`).join('');
}
function renderCandidates(){for(const id of ['candidate-count','candidate-inline-count'])$('#'+id).textContent=candidates.length;
 $('#candidates').innerHTML=candidates.length?candidates.map((r,i)=>`<div class="candidate-chip"><span style="background:${colors[i]}"></span><span class="chip-name" title="${esc(r.name)}">${esc(r.name)}</span><button data-remove="${esc(r.id)}" aria-label="${esc(r.name)} 후보에서 제외">${icon('x')}</button></div>`).join(''):'<p class="subtle">왼쪽 식당 목록에서 + 버튼을 눌러 후보를 담아보세요.</p>';
 $('#spin').disabled=busy||!candidates.length;drawWheel();}
function refill(){if(busy)return;candidates=pickCandidates(filtered(),Number($('#auto-count').value),random);rotation=0;renderCandidates();renderList();}
function renderFilters(){for(const kind of ['district','radius'])$$(`[data-${kind}]`).forEach(b=>{const match=String(filters[kind])===b.dataset[kind];b.classList.toggle('selected',match);b.setAttribute('aria-pressed',match);});$$('[data-category]').forEach(b=>{b.classList.toggle('selected',filters.category===b.dataset.category);b.setAttribute('aria-pressed',filters.category===b.dataset.category);});}
function shortName(name){return name.replace(/\([^)]*\)/g,'').replace(/서산테크노밸리점|서산성연테크노벨리점|서산성연점|서산테크노점|테크노밸리점|성연테크노밸리점|성연점|서산점|테크노점|테크노밸리/g,'').trim()||name;}
function drawWheel(){const c=$('#wheel'),ctx=c.getContext('2d');ctx.clearRect(0,0,1000,1000);ctx.save();ctx.translate(500,500);
 ctx.beginPath();ctx.arc(0,0,474,0,TAU);ctx.fillStyle='#fff4cf';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#f0d692';ctx.stroke();
 for(let i=0;i<48;i++){const a=i*TAU/48;ctx.beginPath();ctx.arc(Math.cos(a)*461,Math.sin(a)*461,3.7,0,TAU);ctx.fillStyle='#dcb77b';ctx.fill();}
 const count=candidates.length||8;ctx.rotate(rotation);
 for(let i=0;i<count;i++){const start=i*TAU/count,end=(i+1)*TAU/count,mid=(start+end)/2;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,445,start,end);ctx.closePath();ctx.fillStyle=candidates.length?colors[i]:'#f3f1e5';ctx.fill();ctx.strokeStyle='#fffdf3';ctx.lineWidth=3;ctx.stroke();
  ctx.save();ctx.rotate(mid);ctx.textAlign='right';ctx.fillStyle='#595549';let text=candidates[i]?shortName(candidates[i].name):'후보를 담아주세요';ctx.font=`600 ${count>10?22:25}px 'Noto Sans KR',sans-serif`;
  let lines=[''];for(const ch of text){const line=lines.length-1;if(ctx.measureText(lines[line]+ch).width>218&&line<1)lines.push(ch);else lines[line]+=ch;}
  if(ctx.measureText(lines.at(-1)).width>218){while(ctx.measureText(lines.at(-1)+'…').width>218)lines[lines.length-1]=lines.at(-1).slice(0,-1);lines[lines.length-1]+='…';}
  lines.forEach((line,j)=>ctx.fillText(line,408,(j-(lines.length-1)/2)*32+9));ctx.restore();}
 ctx.restore();}
function beep(pitch=500,duration=.04){if(!sound)return;try{audio ||=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(pitch,audio.currentTime);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{sound=false;}}
function setBusy(value){busy=value;$$('.finder button,.finder input,.finder select,.candidate-section button,.candidate-section select,.tab,#random-view button,#random-view select,#envelope-view button,#envelope-view select').forEach(e=>e.disabled=value);$('#spin').disabled=value||!candidates.length;$('#spin span').textContent=value?'맛있는 운명을 찾는 중…':'오늘의 한 끼 뽑기';}
function spin(){if(busy||!candidates.length)return;if($('#exclude-last').checked&&candidates.some(r=>filters.excludeIds.includes(r.id)))refill();if(!candidates.length){toast('다음에 뽑을 식당이 없어요. 최근 식당 제외를 끄거나 후보를 추가해 주세요.');return;}setBusy(true);const batch=[...candidates],index=Math.floor(random()*batch.length),start=rotation,target=targetRotation(start,index,batch.length);const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduce?200:history.length?2200:3200;const begun=performance.now();let lastStep=-1,finished=false;beep();
 finishSpin=()=>{if(finished)return;finished=true;rotation=target%TAU;drawWheel();$('#skip-spin').hidden=true;finishSpin=null;setBusy(false);completeChoice(batch[index],'roulette');};$('#skip-spin').hidden=false;
 function frame(now){const p=Math.min((now-begun)/duration,1),ease=1-(1-p)**4;rotation=start+(target-start)*ease;drawWheel();const step=Math.floor(rotation/(TAU/batch.length));if(step!==lastStep&&p<.99){lastStep=step;beep(500+p*250,.025);}
 if(p<1)requestAnimationFrame(t=>{if(!finished)frame(t);});else finishSpin?.();}
 requestAnimationFrame(t=>{if(!finished)frame(t);});
}
function completeChoice(winner,mode='roulette',record=true){
 if(record){history.unshift({id:winner.id,time:Date.now(),game:mode});history=history.slice(0,20);persist();if($('#exclude-last').checked)filters.excludeIds=[winner.id];}
 showResult(winner,true,mode);
 if(record){if(!matchMedia('(prefers-reduced-motion: reduce)').matches)confetti();[600,760,900].forEach((f,i)=>setTimeout(()=>beep(f,.13),i*120));}
}
function resultUrl(r){const url=new URL(location.href);url.search='';url.hash='';if(r.source==='custom'){const bytes=new TextEncoder().encode(JSON.stringify({name:r.name,address:r.address,district:r.district,category:r.category,menu:r.menu||''}));url.hash='custom='+btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}else url.hash='pick='+encodeURIComponent(r.id);if(['roulette','random','envelope'].includes(shownMode))url.hash+='&game='+shownMode;return url.toString();}
function showResult(r,win=false,mode='shared'){shownMode=win?mode:'shared';const distance=prettyDistance(r),query=encodeURIComponent(r.name);const kakao=`https://map.kakao.com/link/search/${query}`;
 $('#result-body').innerHTML=`<p class="winner-tag">${win?esc(gameLabels[mode]||'공유한 식당')+' · TODAY’S PICK':'OUR NEIGHBORHOOD'}</p><div class="winner-emoji">${emojis[r.category]||'🍴'}</div><p class="winner-subtitle">${win?'고민 끝! 오늘은 여기로 가요.':'우리 동네 식당을 만나보세요.'}</p><h2 id="result-title" class="winner-title">${esc(r.name)}</h2><span class="winner-category">${esc(r.category)} · ${esc(r.district)}</span><div class="winner-details"><div>${icon('pin')}<span>${esc(r.address)}${distance?`<p>선택한 기준점에서 직선거리 ${distance}</p>`:''}</span></div><div>${icon('utensils')}<span>${r.menu?esc(r.menu)+' <small>(직접 입력)</small>':'대표 메뉴 정보 없음'}</span></div><div>${icon('clock')}<span>영업시간은 지도에서 확인해 주세요</span></div></div><div class="map-buttons"><a href="${kakao}" target="_blank" rel="noopener noreferrer">카카오맵 검색 ↗</a><a href="https://map.naver.com/p/search/${query}" target="_blank" rel="noopener noreferrer">네이버지도 보기 ↗</a></div><div class="share-buttons"><button id="share-result">${icon('share')}친구에게 공유</button><button id="copy-result">${icon('link')}링크 복사</button></div><p class="result-footnote">공유창에서 카카오톡 등 사용 가능한 앱을 선택하세요.<br>식당 정보는 파일 기준이며, 방문 전 확인해 주세요.</p>${r.lat?'<button id="origin-result" class="again-button">'+icon('locate')+'이 식당 주변에서 찾기</button>':''}<button class="again-button" id="spin-again">${icon('reset')}${win?(mode==='envelope'?'새 봉투 하나 열기':mode==='shared'?'후보 룰렛으로 뽑기':'한 번 더 뽑아볼래요'):'후보에 담고 돌아가기'}</button>`;
 $('#copy-result').onclick=()=>copyResult(r);$('#share-result').onclick=()=>shareResult(r);
 $('#spin-again').onclick=()=>{if(!win&&!candidates.some(x=>x.id===r.id)){if(candidates.length>=12){toast('최대 12곳까지 담을 수 있어요. 후보를 먼저 줄여주세요.');return;}candidates.push(r);renderCandidates();renderList();}$('#result-dialog').close();if(win){const game=['roulette','random','envelope'].includes(mode)?mode:'roulette';if(tab!==game)setTab(game);if(game==='roulette')spin();else games.replay(game);}else if(tab!=='roulette'&&tab!=='favorites')setTab('roulette');};
 const originButton=$('#origin-result');if(originButton)originButton.onclick=()=>{filters.origin={lat:r.lat,lng:r.lng};filters.radius=1;filters.query='';$('#search').value='';$('#location-label').textContent=shortName(r.name)+' 주변';$('#location-hint').textContent='식당 위치 기준';$('#clear-location').hidden=false;$('#result-dialog').close();setTab('roulette');renderFilters();refill();toast('선택한 식당에서 1km 이내를 찾았어요.');};
 if(!$('#result-dialog').open)$('#result-dialog').showModal();}
async function copyResult(r){const url=resultUrl(r);try{await navigator.clipboard.writeText(url);toast('결과 링크를 복사했어요. 친구에게 보내보세요!');}catch{const el=document.createElement('textarea');el.value=url;el.style.position='fixed';el.style.opacity='0';$('#result-dialog').append(el);el.select();const ok=document.execCommand('copy');el.remove();toast(ok?'결과 링크를 복사했어요.':'복사하지 못했어요. 브라우저의 공유 기능을 이용해 주세요.');}}
async function shareResult(r){if(navigator.share){try{await navigator.share({title:'오늘한끼 — '+r.name,text:`오늘은 ${r.name} 어때요?\n${r.address}`,url:resultUrl(r)});}catch(e){if(e.name!=='AbortError')await copyResult(r);}}else{await copyResult(r);toast('링크를 복사했어요. 카카오톡 대화방에 붙여넣어 주세요.');}}
function confetti(){const canvas=$('#confetti'),ctx=canvas.getContext('2d');canvas.width=innerWidth;canvas.height=innerHeight;canvas.style.display='block';const parts=Array.from({length:100},()=>({x:innerWidth/2,y:innerHeight*.4,vx:(Math.random()-.5)*19,vy:-Math.random()*15-3,r:Math.random()*TAU,s:Math.random()*6+4,c:colors[Math.floor(Math.random()*colors.length)]}));const start=performance.now();function frame(now){ctx.clearRect(0,0,canvas.width,canvas.height);for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vy+=.22;p.r+=.08;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.globalAlpha=Math.max(0,1-(now-start)/2500);ctx.fillStyle=p.c;ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.5);ctx.restore();}if(now-start<2500)requestAnimationFrame(frame);else canvas.style.display='none';}requestAnimationFrame(frame);}
function renderHistory(){const rows=history.map(h=>({...h,restaurant:all.find(r=>r.id===h.id)})).filter(h=>h.restaurant);$('#history-list').innerHTML=rows.length?rows.map((h,i)=>`<div class="history-row"><span class="history-order">${String(i+1).padStart(2,'0')}</span><div class="food-icon">${emojis[h.restaurant.category]||'🍴'}</div><div class="restaurant-text"><b>${esc(h.restaurant.name)}</b><span class="history-game-tag">${gameLabels[h.game]||gameLabels.roulette}</span><small>${new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'}).format(h.time)} · ${h.restaurant.category}</small></div><button class="text-button" data-detail="${h.id}">다시 보기 ${icon('arrow')}</button></div>`).join(''):'<div class="empty-state"><strong>아직 맛있는 기록이 없어요</strong>첫 번째 게임으로 오늘의 식당을 만나보세요.</div>';}
function setTab(value){
 if(busy||!['roulette','random','envelope','favorites','history'].includes(value))return;
 const previous=tab;tab=value;
 $$('[data-tab]').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
 $('#main-view').hidden=!['roulette','favorites'].includes(tab);
 $('#history-view').hidden=tab!=='history';$('#random-view').hidden=tab!=='random';$('#envelope-view').hidden=tab!=='envelope';
 $('#finder-title').textContent=tab==='favorites'?'찜한 식당에서 골라요':'어디서 먹을까요?';
 if(tab==='history')renderHistory();else if(tab==='random'||tab==='envelope')games.enter(tab);
 else if(previous==='favorites'||tab==='favorites'||$('#exclude-last').checked)refill();else{renderList();renderCandidates();}
}

function clearLocation(message=''){
 locationRequest++;filters.origin=null;filters.radius=0;$('#geolocate').disabled=false;$('#location-label').textContent='내 위치로 찾기';$('#location-hint').textContent='위치 선택은 선택사항';$('#clear-location').hidden=true;$('#sort').value='default';$('#location-notice').textContent=message||'위치를 켜지 않아도 지역·상호명 검색과 모든 게임을 이용할 수 있어요.';renderFilters();refill();
}
function locate(){
 const request=++locationRequest;
 const failed=()=>{if(request===locationRequest)clearLocation('위치 없이 이용 중이에요. 지역·상호명으로 검색하거나 식당의 주변 찾기를 사용해 주세요.');};
 $('#geolocate').disabled=true;$('#location-label').textContent='위치 확인 중…';$('#clear-location').hidden=false;$('#location-notice').textContent='위치를 확인하는 동안에도 지역·상호명 검색과 게임을 이용할 수 있어요.';
 try{
  if(!navigator.geolocation){failed();return;}
  navigator.geolocation.getCurrentPosition(pos=>{
   if(request!==locationRequest)return;
   if(!Number.isFinite(pos.coords.latitude)||!Number.isFinite(pos.coords.longitude)){failed();return;}
   filters.origin={lat:pos.coords.latitude,lng:pos.coords.longitude};filters.radius=1;$('#geolocate').disabled=false;$('#location-label').textContent='현재 내 위치';$('#location-hint').textContent='이 기기에서만 사용';
   const nearby=filtered().length;
   if(!nearby)filters.radius=0;
   $('#location-notice').textContent=nearby?'내 위치 1km 안에서 찾고 있어요. 거리 전체를 선택하면 모든 식당을 볼 수 있어요.':'선택한 조건으로 내 위치 1km 안에 식당이 없어 거리 제한을 풀었어요. 지역·상호명으로 계속 찾아보세요.';renderFilters();refill();
  },failed,{enableHighAccuracy:false,timeout:8000,maximumAge:60000});
 }catch{failed();}
}
function addCustom(r){const valid=validateCustom(r);if(!valid.ok){$('#form-error').textContent=valid.message;return false;}r={...r,name:r.name.trim(),address:r.address.trim()};const existing=all.find(x=>x.name.trim()===r.name&&x.address.trim()===r.address);if(existing){$('#form-error').textContent='이미 등록된 식당이에요.';return false;}if(custom.length>=200){$('#form-error').textContent='직접 추가한 식당은 최대 200곳까지 저장할 수 있어요.';return false;}const entry={id:'custom-'+crypto.randomUUID(),name:r.name.trim(),address:r.address.trim(),district:r.district,category:r.category,menu:r.menu?.trim()||'',source:'custom'};custom.push(entry);all=[...base,...custom];persist();games.refresh();if(candidates.length<12)candidates.push(entry);renderList();renderCandidates();toast(candidates.some(c=>c.id===entry.id)?'내 식당을 추가하고 룰렛에도 담았어요.':'식당을 추가했어요. 후보를 비운 뒤 룰렛에 담아주세요.');return true;}
function restoreShared(){try{
 const params=new URLSearchParams(location.hash.slice(1)),game=params.get('game'),mode=['roulette','random','envelope'].includes(game)?game:'shared';
 if(params.has('pick')){const r=all.find(r=>r.id===params.get('pick'));if(r)showResult(r,true,mode);else toast('공유된 식당을 현재 자료에서 찾을 수 없어요.');}
 if(params.has('custom')&&location.hash.length<4000){const bytes=Uint8Array.from(atob(params.get('custom').replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));const r=JSON.parse(new TextDecoder().decode(bytes));if(validateCustom(r).ok&&typeof r.menu==='string'&&r.menu.length<=60){r.id='shared';r.source='custom';r.category=Object.keys(emojis).includes(r.category)?r.category:'기타';delete r.lat;delete r.lng;showResult(r,true,mode);}}
 }catch{toast('공유 링크를 읽지 못했어요. 새로 식당을 골라보세요.');}}
icons();$('#categories').innerHTML=Object.entries(emojis).map(([key,emoji])=>`<button data-category="${key}" class="${key==='전체'?'selected':''}" aria-pressed="${key==='전체'}"><span>${emoji}</span>${key}</button>`).join('');
$('#spin').onclick=spin;$('#skip-spin').onclick=()=>finishSpin?.();$('#shuffle').onclick=()=>{refill();toast('지금 조건에 맞춰 새로운 후보를 담았어요.');};$('#auto-count').onchange=refill;
$('#clear-candidates').onclick=()=>{if(busy)return;candidates=[];renderCandidates();renderList();};
function toggleSound(){sound=!sound;$$('#sound-toggle,[data-sound-toggle]').forEach(b=>{b.innerHTML=icon(sound?'volume':'volumeOff');b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',sound?'효과음 끄기':'효과음 켜기');});if(sound)beep(600,.1);toast(sound?'효과음을 켰어요.':'효과음을 껐어요.');}
$$('#sound-toggle,[data-sound-toggle]').forEach(b=>b.onclick=toggleSound);
$('#search').oninput=e=>{if(busy)return;filters.query=e.target.value;refill();};$('#exclude').oninput=e=>{if(busy)return;filters.excluded=e.target.value;refill();};
$('#exclude-last').onchange=e=>{filters.excludeIds=e.target.checked&&history[0]?[history[0].id]:[];refill();};
$('#sort').onchange=()=>{if($('#sort').value==='distance'&&!filters.origin){$('#sort').value='default';toast('내 위치 또는 식당을 기준점으로 먼저 선택해 주세요.');return;}renderList();};
$('#geolocate').onclick=locate;$('#clear-location').onclick=()=>clearLocation();
$('#reset-filters').onclick=()=>{if(busy)return;Object.assign(filters,{district:'전체',category:'전체',query:'',radius:0,excluded:'',excludeIds:[]});$('#search').value='';$('#exclude').value='';$('#exclude-last').checked=false;$('#sort').value='default';renderFilters();refill();};
$('#custom-form').onsubmit=e=>{e.preventDefault();if(busy)return;const r=Object.fromEntries(new FormData(e.target));if(addCustom(r)){$('#custom-dialog').close();e.target.reset();$('#form-error').textContent='';}};
$('#clear-history').onclick=()=>{history=[];filters.excludeIds=[];persist();renderHistory();toast('추첨 기록을 비웠어요.');};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-close')){b.closest('dialog').close();return;}
 if(b.dataset.action==='info'){$('#info-dialog').showModal();return;}
 if(b.dataset.action==='custom'){if(busy)return;$('#custom-form [name=district]').value=filters.district==='지곡면'?'지곡면':'성연면';$('#form-error').textContent='';$('#custom-dialog').showModal();return;}
 if(b.dataset.tab){setTab(b.dataset.tab);return;}
 if(b.dataset.detail){const r=all.find(x=>x.id===b.dataset.detail);if(r&&!busy)showResult(r);return;}
 if(busy)return;
 if(b.dataset.district){filters.district=b.dataset.district;renderFilters();refill();}
 if(b.dataset.radius){const r=Number(b.dataset.radius);if(r&&!filters.origin){toast('내 위치를 허용하거나 식당 상세에서 주변 찾기를 선택해 주세요.');return;}filters.radius=r;renderFilters();refill();}
 if(b.dataset.category){filters.category=b.dataset.category;renderFilters();refill();}
 if(b.dataset.favorite){const id=b.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];persist();if(tab==='favorites')refill();else renderList();}
 if(b.dataset.remove||b.dataset.candidate){const id=b.dataset.remove||b.dataset.candidate;if(candidates.some(r=>r.id===id))candidates=candidates.filter(r=>r.id!==id);else{if(candidates.length>=12){toast('최대 12곳까지 담을 수 있어요. 후보를 하나 빼주세요.');return;}const r=all.find(x=>x.id===id);if(r)candidates.push(r);}rotation=0;renderCandidates();renderList();}
});
let pointerStart=null;$('#wheel').addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};});$('#wheel').addEventListener('pointerup',e=>{if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>35)spin();pointerStart=null;});$('#wheel').addEventListener('pointercancel',()=>pointerStart=null);
document.addEventListener('keydown',e=>{if(e.key==='/'&&['roulette','favorites'].includes(tab)&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();$('#search').focus();}});
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$$('dialog').forEach(d=>d.addEventListener('close',()=>{const el=d.querySelector('#toast');if(el){const active=$('dialog[open]');(active||document.body).append(el);el.classList.toggle('dialog-toast',!!active);}}));
window.addEventListener('hashchange',restoreShared);
const games=initGames({getAll:()=>all,isBusy:()=>busy,setBusy,onWin:completeChoice,toast,beep,random,esc,emojis});
try{const response=await fetch('./restaurants.json');if(!response.ok)throw new Error('data');base=await response.json();all=[...base,...custom];candidates=pickCandidates(all,Number($('#auto-count').value),random);games.refresh();renderFilters();renderList();renderCandidates();document.fonts?.ready.then(drawWheel);restoreShared();}catch{$('#restaurants').innerHTML='<div class="empty-state"><strong>식당 자료를 불러오지 못했어요</strong>연결 상태를 확인한 뒤 새로고침해 주세요.</div>';$('#spin').disabled=true;games.refresh();}
