
// ===== Theme =====
const THEME_KEY='spinzy_theme_v13';
function applyTheme(t){ document.documentElement.classList.toggle('light', t==='light'); }
(function(){
  const saved=localStorage.getItem(THEME_KEY);
  if(saved) applyTheme(saved); else applyTheme( matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' );
  document.getElementById('themeToggle').addEventListener('click',()=>{
    const isLight=document.documentElement.classList.contains('light');
    const next=isLight?'dark':'light'; applyTheme(next); localStorage.setItem(THEME_KEY,next);
  });
})();

// ===== State =====
const STATE_KEY='spinzy_state_v13';
let state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null') || {
  current:0,
  wheels:[ { title:'My Wheel', names:['Alice','Bob','Charlie','Dani','Eli','Fran'] } ]
};
function save(){ localStorage.setItem(STATE_KEY, JSON.stringify(state)); }

// ===== Helpers =====
function colorForIndex(i,n){ const hue=(i*(360/n))%360; return `hsl(${hue},75%,55%)`; }
function autoFont(ctx, text, maxWidth, maxPx, minPx){
  let size=maxPx; ctx.font=`bold ${size}px ui-sans-serif, system-ui, Arial`;
  while(size>minPx && ctx.measureText(text).width>maxWidth){ size--; ctx.font=`bold ${size}px ui-sans-serif, system-ui, Arial`; }
  return size;
}
function easeOutCubic(x){ return 1 - Math.pow(1-x,3); }

// ===== Build UI =====
const tabsEl = document.getElementById('wheelTabs');
const slidesEl = document.getElementById('slides');

function renderAll(){ renderTabs(); renderSlides(); }

function renderTabs(){
  tabsEl.innerHTML='';
  state.wheels.forEach((w,i)=>{
    const b=document.createElement('button');
    b.className='tab'+(i===state.current?' active':'');
    b.textContent= w.title || `Wheel ${i+1}`;
    b.title=b.textContent;
    b.onclick=()=>{ state.current=i; save(); updateSlideTransform(); renderTabs(); };
    tabsEl.appendChild(b);
  });
}

function updateSlideTransform(){ slidesEl.style.transform = `translateX(-${state.current*100}%)`; }

function renderSlides(){
  slidesEl.innerHTML='';
  slidesEl.style.display='flex';
  slidesEl.style.transition='transform .35s ease';
  slidesEl.style.willChange='transform';
  state.wheels.forEach((w,i)=> slidesEl.appendChild(buildSlide(w,i)) );
  updateSlideTransform();
}

function buildSlide(wheel, idx){
  const slide=document.createElement('section'); slide.className='slide';

  // Left: wheel card
  const wheelCard=document.createElement('section'); wheelCard.className='card';
  const title=document.createElement('h2'); title.contentEditable='true'; title.textContent=wheel.title||'Untitled Wheel';
  title.addEventListener('input',()=>{ wheel.title=title.textContent.trim(); save(); renderTabs(); });
  wheelCard.appendChild(title);

  const wrap=document.createElement('div'); wrap.className='canvas-wrap';
  const notch=document.createElement('div'); notch.className='notch'; wrap.appendChild(notch);

  const canvas=document.createElement('canvas'); wrap.appendChild(canvas);
  const center=document.createElement('div'); center.className='center-btn';
  const spinBtn=document.createElement('button'); spinBtn.className='spin'; spinBtn.textContent='Push to Spin'; center.appendChild(spinBtn);
  wrap.appendChild(center);
  wheelCard.appendChild(wrap);

  const smallNote=document.createElement('div'); smallNote.style.textAlign='center'; smallNote.style.opacity='.7'; smallNote.style.marginTop='6px'; wheelCard.appendChild(smallNote);

  slide.appendChild(wheelCard);

  // Right: list card
  const list=document.createElement('section'); list.className='card';
  const h3=document.createElement('h3'); h3.textContent='Names'; list.appendChild(h3);
  const chips=document.createElement('div'); chips.className='names'; list.appendChild(chips);
  const addRow=document.createElement('div'); addRow.className='add-row';
  addRow.innerHTML=`<input type="text" placeholder="Add a name and press Enter" aria-label="Add name"><button class="btn">Add</button>`;
  list.appendChild(addRow);
  const actions=document.createElement('div'); actions.className='actions';
  actions.innerHTML = `<button class="btn" data-act="reset">Reset List</button><button class="btn danger" data-act="delete">Delete Wheel</button>`;
  list.appendChild(actions);
  slide.appendChild(list);

  // Behavior
  const input=addRow.querySelector('input'), addBtn=addRow.querySelector('button');
  const resetBtn=actions.querySelector('[data-act="reset"]'), delBtn=actions.querySelector('[data-act="delete"]');

  function renderChips(){
    chips.innerHTML='';
    wheel.names.forEach((n,i)=>{
      const chip=document.createElement('span'); chip.className='name-chip';
      const b=document.createElement('button'); b.textContent='✕'; b.title='Remove from list';
      const t=document.createElement('span'); t.textContent=n;
      b.onclick=()=>{ wheel.names.splice(i,1); save(); renderChips(); draw(); };
      chip.appendChild(t); chip.appendChild(b);
      chips.appendChild(chip);
    });
  }
  function addName(){
    const v=input.value.trim(); if(!v) return;
    wheel.names.push(v); input.value=''; save(); renderChips(); draw();
  }
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') addName(); });
  addBtn.addEventListener('click', addName);
  resetBtn.addEventListener('click', ()=>{ wheel.names=[]; save(); renderChips(); draw(); });
  delBtn.addEventListener('click', ()=>{
    state.wheels.splice(idx,1);
    if(state.wheels.length===0){ state.wheels=[{title:'My Wheel', names:[]}]; state.current=0; }
    else if(state.current>=state.wheels.length){ state.current=state.wheels.length-1; }
    save(); renderAll();
  });

  // Canvas setup
  const dpr=Math.min(2, devicePixelRatio||1);
  const cssSize=Math.min(600, Math.max(380, window.innerWidth*0.72));
  canvas.width=Math.floor(cssSize*dpr); canvas.height=Math.floor(cssSize*dpr);
  canvas.style.width=cssSize+'px'; canvas.style.height=cssSize+'px';
  const ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);
  let angle=0, spinning=false;

  function draw(){
    const names = wheel.names.length? wheel.names : ['Add names…'];
    const n=names.length; const radius=canvas.width/(2*dpr); const center=radius; const arc=(2*Math.PI)/n;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save(); ctx.translate(center,center); ctx.rotate(angle);
    for(let i=0;i<n;i++){
      ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,radius, i*arc, (i+1)*arc); ctx.closePath();
      ctx.fillStyle=colorForIndex(i,n); ctx.fill();
      ctx.save(); ctx.rotate(i*arc+arc/2); ctx.textAlign='right';
      const maxW=radius*0.64, fontSize=autoFont(ctx, names[i], maxW, Math.max(22, radius*0.1), 10);
      ctx.fillStyle='#fff'; ctx.font=`bold ${fontSize}px ui-sans-serif, system-ui, Arial`;
      ctx.fillText(names[i], radius-18, 6); ctx.restore();
    }
    ctx.restore();
    colorNotch(); // after draw, update notch color
  }

  function winnerIndex(){
    const names = wheel.names.length? wheel.names : ['Add names…'];
    const n=names.length, arc=(2*Math.PI)/n;
    const normalized=(2*Math.PI - (angle % (2*Math.PI))) % (2*Math.PI);
    return Math.floor(normalized/arc) % n;
  }
  function colorNotch(){
    const names = wheel.names.length? wheel.names : ['Add names…'];
    const i=winnerIndex(); const color=colorForIndex(i, names.length);
    notch.style.filter = `drop-shadow(0 0 0 ${color}) drop-shadow(0 2px 6px rgba(0,0,0,.35))`;
  }

  function finishSpin(){
    const names = wheel.names.length? wheel.names : ['Add names…'];
    const idx=winnerIndex(); const name=names[idx];
    document.getElementById('winnerName').textContent = name;
    const dlg=document.getElementById('winnerDialog'); dlg.showModal();
    const rem=document.getElementById('removeWinner'); const close=document.getElementById('closeDialog');
    rem.onclick=()=>{ // remove ONLY from wheel; keep in list
      const fromWheelIndex = wheel.names.indexOf(name);
      if(fromWheelIndex>-1){ wheel.names.splice(fromWheelIndex,1); save(); }
      dlg.close(); renderChips(); draw();
    };
    close.onclick=()=> dlg.close();
    smallNote.textContent='Winner: '+name;
    spinBtn.style.display='inline-block';
  }

  function spin(){
    if(spinning) return; if(!wheel.names.length) return;
    spinning=true; smallNote.textContent=''; spinBtn.style.display='none';
    const baseTurns = 8 + Math.random()*5;
    const target = baseTurns * Math.PI*2;
    const start=performance.now(); const duration=3000+Math.random()*1200; const startAngle=angle;
    function frame(now){
      const t=Math.min(1,(now-start)/duration); angle = startAngle + target*easeOutCubic(t); draw();
      if(t<1) requestAnimationFrame(frame); else { spinning=false; burstConfettiMinimal(); finishSpin(); }
    }
    requestAnimationFrame(frame);
  }

  // Optimized confetti (minimal DOM / short life)
  function burstConfettiMinimal(){
    const count=36;
    for(let i=0;i<count;i++){
      const m=document.createElement('div');
      m.className='confetti';
      m.style.left=(50 + (Math.random()*40-20))+'%';
      m.style.background=colorForIndex(i,count);
      document.body.appendChild(m);
      const anim= m.animate([
        { transform:'translate(-50%, -20px) rotate(0deg)', opacity:1, top:'10px' },
        { transform:`translate(${(Math.random()*200-100)}px, ${window.innerHeight*0.9}px) rotate(${180+Math.random()*180}deg)`, opacity:0.9, top: (window.innerHeight-10)+'px' }
      ], { duration: 900+Math.random()*600, easing:'ease-out' });
      anim.onfinish=()=> m.remove();
    }
  }

  // add confetti base style
  if(!document.getElementById('confetti-style')){
    const s=document.createElement('style'); s.id='confetti-style';
    s.textContent='.confetti{position:fixed; top:0; width:8px; height:8px; border-radius:2px; z-index:60; will-change: transform, opacity;}';
    document.head.appendChild(s);
  }

  canvas.addEventListener('click', spin);
  spinBtn.addEventListener('click', spin);

  // initial
  renderChips(); draw();

  return slide;
}

// Toolbar actions
document.getElementById('addWheel').addEventListener('click', ()=>{
  state.wheels.push({ title:`Wheel ${state.wheels.length+1}`, names:[] });
  state.current=state.wheels.length-1; save(); renderAll();
});
document.getElementById('clearAll').addEventListener('click', ()=>{
  state = { current:0, wheels:[{ title:'My Wheel', names:['Alice','Bob','Charlie','Dani','Eli','Fran'] }] };
  save(); renderAll();
});

// Render
renderAll();
