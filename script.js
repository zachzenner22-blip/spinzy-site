
// ====== Theme (auto + toggle + persistence) ======
const THEME_KEY = 'spinzy_theme_v10';
function applyTheme(t){ document.documentElement.classList.toggle('light', t === 'light'); }
(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved){ applyTheme(saved); }
  else { const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
         applyTheme(prefersDark ? 'dark' : 'light'); }
  document.getElementById('themeToggle').addEventListener('click', ()=>{
    const isLight = document.documentElement.classList.contains('light');
    const next = isLight ? 'dark' : 'light';
    applyTheme(next); localStorage.setItem(THEME_KEY, next);
  });
})();

// ====== State ======
const STATE_KEY = 'spinzy_state_v10';
let state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null') || {
  current: 0,
  wheels: [
    { title:'My Wheel', names:['Alice','Bob','Charlie','Dani','Eli','Fran'] }
  ]
};
function save(){ localStorage.setItem(STATE_KEY, JSON.stringify(state)); }

// ====== Utilities ======
function colorForIndex(i, total){ const hue=(i*(360/total))%360; return `hsl(${hue},75%,55%)`; }
function measureAutoFont(ctx, text, maxWidth, maxPx, minPx){
  let size=maxPx; ctx.font=`bold ${size}px ui-sans-serif, system-ui, Arial`;
  while(size>minPx && ctx.measureText(text).width>maxWidth){
    size-=1; ctx.font=`bold ${size}px ui-sans-serif, system-ui, Arial`;
  } return size;
}
function speakYay(){ // Web Speech API fallback "Yay!"
  try{ const u=new SpeechSynthesisUtterance('Yay!'); u.rate=1.1; u.pitch=1.2; speechSynthesis.speak(u);}catch{}
}
function confettiBurst(){
  for(let i=0;i<80;i++){
    const d=document.createElement('div');
    d.style.position='fixed'; d.style.width='8px'; d.style.height='8px';
    d.style.background=colorForIndex(i,80); d.style.top='-10px'; d.style.left=(Math.random()*100)+'%';
    d.style.transform=`rotate(${Math.random()*360}deg)`; d.style.opacity=String(0.7+Math.random()*0.3); d.style.zIndex='60';
    document.body.appendChild(d);
    let y=-10, v=2+Math.random()*4, rot=Math.random()*6;
    const timer=setInterval(()=>{ y+=v; d.style.top=y+'px'; d.style.transform=`translateY(${y}px) rotate(${rot+=6}deg)`;
      if(y>innerHeight+20){ d.remove(); clearInterval(timer);} }, 16);
  }
}

// ====== Carousel Rendering ======
const slidesEl = document.getElementById('slides');
const pagerEl = document.getElementById('pager');

function goTo(index){
  state.current = Math.max(0, Math.min(index, state.wheels.length-1));
  slidesEl.style.transform = `translateX(-${state.current*100}%)`;
  [...pagerEl.children].forEach((b,i)=> b.classList.toggle('active', i===state.current));
  save();
}

function rebuildPager(){
  pagerEl.innerHTML='';
  state.wheels.forEach((w,i)=>{
    const b=document.createElement('button');
    b.className='bubble'+(i===state.current?' active':'');
    b.textContent=w.title||`Wheel ${i+1}`;
    b.title=w.title;
    b.onclick=()=>goTo(i);
    pagerEl.appendChild(b);
  });
}

function rebuildSlides(){
  slidesEl.innerHTML='';
  state.wheels.forEach((w,i)=> slidesEl.appendChild(buildSlide(w,i)));
}

function buildSlide(wheel, idx){
  const slide=document.createElement('section'); slide.className='slide';

  // LEFT: Wheel card
  const card=document.createElement('section'); card.className='card';
  const title=document.createElement('h2'); title.contentEditable='true'; title.textContent=wheel.title||'Untitled Wheel';
  title.addEventListener('input', ()=>{ wheel.title=title.textContent.trim(); save(); rebuildPager(); });
  card.appendChild(title);

  const wrap=document.createElement('div'); wrap.className='canvas-wrap';
  const notch=document.createElement('div'); notch.className='notch'; wrap.appendChild(notch);
  const canvas=document.createElement('canvas'); wrap.appendChild(canvas);
  const label=document.createElement('div'); label.className='center-label'; label.textContent='Push to Spin'; wrap.appendChild(label);
  card.appendChild(wrap);

  const winner=document.createElement('div'); winner.className='small-note'; winner.textContent=''; card.appendChild(winner);

  slide.appendChild(card);

  // RIGHT: Editable list
  const list=document.createElement('section'); list.className='list';
  const h3=document.createElement('h3'); h3.textContent='Names'; list.appendChild(h3);

  const chips=document.createElement('div'); chips.className='names'; list.appendChild(chips);
  const addRow=document.createElement('div'); addRow.className='add-row';
  addRow.innerHTML=`<input type="text" placeholder="Add a name and press Enter" aria-label="Add name"><button class="btn">Add</button>`;
  list.appendChild(addRow);

  const actions=document.createElement('div'); actions.className='actions';
  actions.innerHTML = `<button class="btn">Reset List</button><button class="btn danger">Delete Wheel</button>`;
  list.appendChild(actions);

  slide.appendChild(list);

  // Wire up list behavior
  const input = addRow.querySelector('input');
  const addBtn = addRow.querySelector('button');
  const resetBtn = actions.querySelector('.btn');
  const deleteBtn = actions.querySelector('.btn.danger');

  function renderChips(){
    chips.innerHTML='';
    wheel.names.forEach((n,i)=>{
      const chip=document.createElement('span'); chip.className='name-chip';
      chip.innerHTML=`<span>${n}</span><button title="Remove">✕</button>`;
      chip.querySelector('button').onclick=()=>{ wheel.names.splice(i,1); save(); renderChips(); draw(); };
      chips.appendChild(chip);
    });
  }

  function addName(){
    const v=input.value.trim();
    if(v){ wheel.names.push(v); input.value=''; save(); renderChips(); draw(); }
  }
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') addName(); });
  addBtn.addEventListener('click', addName);
  resetBtn.addEventListener('click', ()=>{ wheel.names=[]; save(); renderChips(); draw(); });
  deleteBtn.addEventListener('click', ()=>{
    state.wheels.splice(idx,1);
    if(state.wheels.length===0){ state.wheels.push({title:'My Wheel', names:[]}); }
    save(); rebuildSlides(); rebuildPager(); goTo(Math.min(state.current, state.wheels.length-1));
  });

  // Canvas drawing + spin
  const dpr=Math.min(2, devicePixelRatio||1);
  const sizeCSS=Math.min(560, Math.max(360, innerWidth*0.76));
  canvas.width = Math.floor(sizeCSS*dpr); canvas.height = Math.floor(sizeCSS*dpr);
  canvas.style.width=sizeCSS+'px'; canvas.style.height=sizeCSS+'px';
  const ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);

  let angle=0, spinning=false, idle=true;

  function draw(){
    const names = wheel.names.length? wheel.names : ['Add names…'];
    const n=names.length, radius=canvas.width/(2*dpr), center=radius, arc=(2*Math.PI)/n;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save(); ctx.translate(center,center); ctx.rotate(angle);
    for(let i=0;i<n;i++){
      ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,radius, i*arc, (i+1)*arc); ctx.closePath();
      ctx.fillStyle=colorForIndex(i,n); ctx.fill();
      ctx.save(); ctx.rotate(i*arc+arc/2); ctx.textAlign='right';
      const maxW=radius*0.6, fontSize=measureAutoFont(ctx, names[i], maxW, Math.max(22, radius*0.1), 10);
      ctx.fillStyle='#fff'; ctx.font=`bold ${fontSize}px ui-sans-serif, system-ui, Arial`;
      ctx.fillText(names[i], radius-14, 6); ctx.restore();
    }
    ctx.restore();
  }

  function winnerIndex(){
    const names = wheel.names.length? wheel.names : ['Add names…'];
    const n=names.length, arc=(2*Math.PI)/n;
    const normalized = (2*Math.PI - (angle % (2*Math.PI))) % (2*Math.PI);
    return Math.floor(normalized/arc) % n;
  }

  function colorNotch(){
    const names = wheel.names.length? wheel.names : ['Add names…'];
    const i = winnerIndex();
    const color = colorForIndex(i, names.length);
    // border/outline via drop-shadow color trick
    notch.style.filter = `drop-shadow(0 0 0 ${color}) drop-shadow(0 2px 6px rgba(0,0,0,.35))`;
  }

  function spin(){
    if(spinning) return;
    if(!wheel.names.length) return;
    idle=false; spinning=true; label.textContent='';
    const base = (8 + Math.random()*6) * Math.PI*2;
    const duration = 2600 + Math.random()*1600;
    const start = performance.now(); const startAngle = angle;
    function frame(now){
      const t=Math.min(1,(now-start)/duration); const eased=1-Math.pow(1-t,3);
      angle = startAngle + base*eased; draw();
      if(t<1) requestAnimationFrame(frame); else {
        spinning=false;
        const idx=winnerIndex(); const name=(wheel.names.length? wheel.names : ['Add names…'])[idx];
        colorNotch(); confettiBurst(); speakYay();
        document.getElementById('winnerName').textContent = name;
        const dlg=document.getElementById('winnerDialog'); dlg.showModal();
        const rem=document.getElementById('removeWinner'); const close=document.getElementById('closeDialog');
        rem.onclick=()=>{ const i=wheel.names.indexOf(name); if(i>-1){ wheel.names.splice(i,1); save(); } dlg.close(); renderChips(); draw(); };
        close.onclick=()=>{ dlg.close(); };
        label.textContent='Push to Spin';
        winner.textContent='Winner: '+name;
      }
    }
    requestAnimationFrame(frame);
  }

  // idle spin
  (function idleSpin(){ let last=performance.now(); function step(now){ if(!idle) return;
    const dt=now-last; last=now; angle += dt*0.00015; draw(); requestAnimationFrame(step);} requestAnimationFrame(step); })();

  canvas.addEventListener('click', spin);

  // initial render
  renderChips(); draw();
  return slide;
}

// Build initial UI
function renderAll(){ rebuildSlides(); rebuildPager(); goTo(state.current); }
renderAll();

// Toolbar
document.getElementById('addWheel').addEventListener('click', ()=>{
  state.wheels.push({ title:'New Wheel', names:[] }); save(); renderAll(); goTo(state.wheels.length-1);
});
document.getElementById('clearAll').addEventListener('click', ()=>{
  state.wheels = [{ title:'My Wheel', names:[] }]; state.current=0; save(); renderAll(); goTo(0);
});
