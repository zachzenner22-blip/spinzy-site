
// ====== Theme (auto + toggle + persistence) ======
const THEME_KEY = 'spinzy_theme_v9';
function applyTheme(t){
  document.documentElement.classList.toggle('light', t === 'light');
}
(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved){ applyTheme(saved); }
  else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light'); // default
  }
  document.getElementById('themeToggle').addEventListener('click', ()=>{
    const isLight = document.documentElement.classList.contains('light');
    const next = isLight ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
})();

// ====== State ======
const STATE_KEY = 'spinzy_state_v9';
let state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null') || {
  wheels: [
    { title:'My Wheel', names:['Alice','Bob','Charlie','Dani','Eli','Fran'] }
  ]
};
function save(){ localStorage.setItem(STATE_KEY, JSON.stringify(state)); }

// ====== Helpers ======
function colorForIndex(i, total){
  const hue = (i * (360/total)) % 360;
  return `hsl(${hue}, 75%, 55%)`;
}
function measureAutoFont(ctx, text, maxWidth, maxPx, minPx){
  let size = maxPx;
  ctx.font = `bold ${size}px ui-sans-serif, system-ui, -apple-system, Arial`;
  while(size > minPx && ctx.measureText(text).width > maxWidth){
    size -= 1;
    ctx.font = `bold ${size}px ui-sans-serif, system-ui, -apple-system, Arial`;
  }
  return size;
}

// ====== Confetti ======
function confettiBurst(root = document.body){
  for(let i=0;i<80;i++){
    const d = document.createElement('div');
    d.style.position='fixed';
    d.style.width='8px'; d.style.height='8px';
    d.style.background=colorForIndex(i,80);
    d.style.top='-10px'; d.style.left=(Math.random()*100)+'%';
    d.style.transform=`rotate(${Math.random()*360}deg)`;
    d.style.opacity=String(0.7 + Math.random()*0.3);
    d.style.zIndex='60';
    document.body.appendChild(d);
    let y=-10, v=2+Math.random()*4, rot=Math.random()*6;
    const timer = setInterval(()=>{
      y+=v; d.style.top=y+'px'; d.style.transform=`translateY(${y}px) rotate(${rot+=6}deg)`;
      if(y>window.innerHeight+20){ d.remove(); clearInterval(timer); }
    }, 16);
  }
}

// ====== Wheel rendering and logic ======
function createWheelCard(wheel, idx){
  const card = document.createElement('section');
  card.className = 'card';

  // Title (editable)
  const title = document.createElement('h2');
  title.contentEditable = 'true';
  title.textContent = wheel.title || 'Untitled Wheel';
  title.addEventListener('input', ()=>{ wheel.title = title.textContent.trim(); save(); });
  card.appendChild(title);

  // Canvas + notch + push label
  const wrap = document.createElement('div');
  wrap.className = 'canvas-wrap';
  const notch = document.createElement('div');
  notch.className = 'notch';
  wrap.appendChild(notch);

  const canvas = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const sizeCSS = Math.min(520, Math.max(360, window.innerWidth*0.86));
  canvas.width = Math.floor(sizeCSS * dpr);
  canvas.height = Math.floor(sizeCSS * dpr);
  canvas.style.width = sizeCSS+'px';
  canvas.style.height = sizeCSS+'px';
  wrap.appendChild(canvas);

  const push = document.createElement('div');
  push.className = 'small-note';
  push.textContent = 'Push to Spin';
  wrap.appendChild(push);
  card.appendChild(wrap);

  // Winner + controls
  const winner = document.createElement('div');
  winner.className = 'winner';
  card.appendChild(winner);

  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.innerHTML = `
    <input type="text" placeholder="Add a name and press Enter" aria-label="Add name"/>
    <button class="btn mini">Reset List</button>
    <button class="btn mini danger">Delete Wheel</button>
  `;
  card.appendChild(controls);
  const input = controls.querySelector('input');
  const resetBtn = controls.querySelector('.btn.mini:not(.danger)');
  const deleteBtn = controls.querySelector('.btn.mini.danger');

  // Context (per wheel)
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  let angle = 0;
  let spinning = false;
  let idle = true; // gentle idle animation until first interaction

  function draw(){
    const names = wheel.names.length ? wheel.names : ['Add names…'];
    const n = names.length;
    const radius = canvas.width / (2*dpr);
    const center = radius;
    const arc = (2*Math.PI)/n;

    // background plate
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle);
    // slices
    for(let i=0;i<n;i++){
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0,0,radius, i*arc, (i+1)*arc);
      ctx.closePath();
      ctx.fillStyle = colorForIndex(i,n);
      ctx.fill();
      // text
      ctx.save();
      ctx.rotate(i*arc + arc/2);
      ctx.textAlign='right';
      const maxWidth = radius*0.6;
      const fontSize = measureAutoFont(ctx, names[i], maxWidth, Math.max(22, radius*0.1), 10);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, -apple-system, Arial`;
      ctx.fillText(names[i], radius-14, 6);
      ctx.restore();
    }
    ctx.restore();

    // If we want a center hub or ring, we could draw here (omitted for clean look)
  }

  function pickWinnerIndex(){
    const names = wheel.names.length ? wheel.names : ['Add names…'];
    const n = names.length;
    const arc = (2*Math.PI)/n;
    // pointer at top (0 radians with our post-translate)
    // Convert angle to degrees to compute index
    const normalized = (2*Math.PI - (angle % (2*Math.PI))) % (2*Math.PI);
    const idx = Math.floor(normalized / arc) % n;
    return idx;
  }

  function setNotchBorderToWinner(){
    const names = wheel.names.length ? wheel.names : ['Add names…'];
    const n = names.length;
    const i = pickWinnerIndex();
    const color = colorForIndex(i, n);
    notch.style.setProperty('--win-color', color);
    notch.style.borderBottomColor = '#fff'; // keep fill neutral
    notch.style.boxShadow = 'none';
    // color the "outline" via ::after border
    notch.style.setProperty('--outline', color);
    // update with CSS variable by toggling inline style on pseudo not supported; so we hack by setting filter via drop-shadow of color
    notch.style.filter = `drop-shadow(0 0 0 ${color}) drop-shadow(0 2px 6px rgba(0,0,0,.35))`;
  }

  function openWinnerDialog(name){
    const dlg = document.getElementById('winnerDialog');
    document.getElementById('winnerName').textContent = name;
    dlg.showModal();
    // wire actions
    const removeBtn = document.getElementById('removeWinner');
    const closeBtn = document.getElementById('closeDialog');
    const onRemove = ()=>{
      const idx = wheel.names.indexOf(name);
      if(idx>-1){ wheel.names.splice(idx,1); save(); }
      dlg.close();
      draw(); // refresh wheel
      render(); // refresh list state
    };
    const onClose = ()=> dlg.close();
    removeBtn.onclick = onRemove;
    closeBtn.onclick = onClose;
  }

  function spin(){
    if(spinning) return;
    if(!wheel.names.length) return;
    idle = false;
    spinning = true;
    push.textContent = '';
    const base = (8 + Math.random()*6) * Math.PI*2; // total radians to rotate
    const duration = 2500 + Math.random()*1500;
    const start = performance.now();
    const startAngle = angle;

    function frame(now){
      const t = Math.min(1, (now - start)/duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1-t, 3);
      angle = startAngle + base * eased;
      draw();
      if(t < 1){
        requestAnimationFrame(frame);
      } else {
        spinning = false;
        const winnerIdx = pickWinnerIndex();
        const name = (wheel.names.length ? wheel.names : ['Add names…'])[winnerIdx];
        setNotchBorderToWinner();
        document.getElementById('winSound').currentTime = 0;
        document.getElementById('winSound').play().catch(()=>{});
        confettiBurst();
        winner.textContent = 'Winner: ' + name;
        push.textContent = 'Push to Spin';
        openWinnerDialog(name);
      }
    }
    requestAnimationFrame(frame);
  }

  // idle slow spin before first interaction
  (function idleSpin(){
    let last = performance.now();
    function step(now){
      if(!idle){ return; }
      const dt = now - last; last = now;
      angle += (dt * 0.00015); // slow
      draw();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  })();

  // Events
  canvas.addEventListener('click', spin);
  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      const val = input.value.trim();
      if(val){
        wheel.names.push(val);
        input.value='';
        save();
        draw();
      }
    }
  });
  resetBtn.addEventListener('click', ()=>{
    wheel.names = [];
    save(); draw();
  });
  deleteBtn.addEventListener('click', ()=>{
    state.wheels.splice(idx,1);
    if(state.wheels.length === 0){
      state.wheels.push({title:'My Wheel', names:[]});
    }
    save(); render();
  });

  draw();
  return card;
}

// ====== Render all wheels ======
const app = document.getElementById('app');
function render(){
  app.innerHTML='';
  state.wheels.forEach((w,i)=>{
    const card = createWheelCard(w, i);
    app.appendChild(card);
  });
}
render();

// Toolbar actions
document.getElementById('addWheel').addEventListener('click', ()=>{
  state.wheels.push({ title:'New Wheel', names:[] });
  save(); render();
});
document.getElementById('clearAll').addEventListener('click', ()=>{
  state.wheels = [{ title:'My Wheel', names:[] }];
  save(); render();
});

// Winner dialog close on outside click ESC default is supported by <dialog>
