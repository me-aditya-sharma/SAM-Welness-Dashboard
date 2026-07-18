/* ============================================================
   MindBloom — shared behavior across all pages
   ============================================================ */
window.MindBloom = (function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------- Page-load veil transition ---------- */
  function initPageVeil(){
    const veil = document.getElementById('page-veil');
    if(!veil) return;
    requestAnimationFrame(()=> veil.classList.add('active'));
    setTimeout(()=> veil.style.display='none', 650);

    document.querySelectorAll('a[data-transition]').forEach(link=>{
      link.addEventListener('click', (e)=>{
        const href = link.getAttribute('href');
        if(!href || href.startsWith('#') || link.target==='_blank') return;
        if(document.startViewTransition){ return; } // let native API handle it
        e.preventDefault();
        veil.style.display='block';
        veil.classList.remove('active');
        requestAnimationFrame(()=>veil.classList.add('active'));
        setTimeout(()=>{ window.location.href = href; }, 420);
      });
    });
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu(){
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.mobile-menu');
    if(!toggle || !menu) return;
    toggle.addEventListener('click', ()=>{
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? '✕' : '☰';
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal(){
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries)=>{
      entries.forEach((e,idx)=>{
        if(e.isIntersecting){
          setTimeout(()=>e.target.classList.add('in'), (idx%4)*80);
          io.unobserve(e.target);
        }
      });
    }, {threshold:.15});
    els.forEach(el=>io.observe(el));
  }

  /* ---------- Tilt cards ---------- */
  function initTilt(){
    if(isTouch || reduceMotion) return;
    document.querySelectorAll('.tilt').forEach(card=>{
      card.addEventListener('mousemove', (e)=>{
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left)/r.width - 0.5;
        const py = (e.clientY - r.top)/r.height - 0.5;
        card.style.transform = `perspective(700px) rotateX(${(-py*8).toFixed(2)}deg) rotateY(${(px*8).toFixed(2)}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', ()=>{ card.style.transform=''; });
    });
  }

  /* ---------- Animated counters ---------- */
  function initCounters(){
    const els = document.querySelectorAll('[data-count]');
    if(!els.length) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const decimals = el.dataset.count.includes('.') ? 1 : 0;
        const dur = 1200; const start = performance.now();
        function step(now){
          const p = Math.min((now-start)/dur, 1);
          const eased = 1 - Math.pow(1-p, 3);
          el.textContent = (target*eased).toFixed(decimals) + suffix;
          if(p<1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, {threshold:.5});
    els.forEach(el=>io.observe(el));
  }

  /* ---------- Ambient floating blobs ---------- */
  const blobSVGs = {
    heart: `<svg viewBox="0 0 60 54" width="W" height="H"><path d="M30 50 C-6 26 4 2 22 4 C28 5 30 12 30 12 C30 12 32 5 38 4 C56 2 66 26 30 50Z" fill="url(#gp)"/></svg>`,
    star: `<svg viewBox="0 0 60 60" width="W" height="H"><path d="M30 2 C32 20 40 28 58 30 C40 32 32 40 30 58 C28 40 20 32 2 30 C20 28 28 20 30 2Z" fill="url(#gy)"/></svg>`,
    cross: `<svg viewBox="0 0 60 60" width="W" height="H"><path d="M22 4h16c4 0 6 4 6 8v6h6c4 0 8 2 8 6v16c0 4-4 6-8 6h-6v6c0 4-2 8-6 8H22c-4 0-6-4-6-8v-6h-6c-4 0-8-2-8-6V18c0-4 4-6 8-6h6V4c0-4 2 0 6 0Z" fill="url(#gg)"/></svg>`,
    drop: `<svg viewBox="0 0 50 60" width="W" height="H"><path d="M25 2 C40 24 46 36 46 44 C46 53 36 58 25 58 C14 58 4 53 4 44 C4 36 10 24 25 2Z" fill="url(#gb)"/></svg>`,
  };
  const defs = `<defs>
    <radialGradient id="gp" cx="30%" cy="25%" r="75%"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#F5A9D0"/></radialGradient>
    <radialGradient id="gy" cx="30%" cy="25%" r="75%"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#F5D06B"/></radialGradient>
    <radialGradient id="gg" cx="30%" cy="25%" r="75%"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#A8C68A"/></radialGradient>
    <radialGradient id="gb" cx="30%" cy="25%" r="75%"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#8FB4F0"/></radialGradient>
  </defs>`;
  function scatterBlobs(container, count){
    if(!container) return;
    container.insertAdjacentHTML('afterbegin', `<svg width="0" height="0">${defs}</svg>`);
    const shapes = Object.keys(blobSVGs);
    const anims = ['drift1','drift2','drift3'];
    for(let i=0;i<count;i++){
      const shape = shapes[i % shapes.length];
      const size = 46 + Math.random()*70;
      const html = blobSVGs[shape].replace(/W/g,size).replace(/H/g,size);
      const el = document.createElement('div');
      el.className='blob';
      el.style.left = (Math.random()*90)+'%';
      el.style.top = (Math.random()*90)+'%';
      el.style.opacity = 0.55 + Math.random()*0.4;
      el.style.animation = reduceMotion ? 'none' : `${anims[i%3]} ${8+Math.random()*10}s ease-in-out infinite`;
      el.style.animationDelay = (Math.random()*4)+'s';
      el.dataset.depth = (0.02 + Math.random()*0.05).toFixed(3);
      el.innerHTML = html;
      container.appendChild(el);
    }
  }
  function initBlobs(){
    document.querySelectorAll('[data-blob-field]').forEach(field=>{
      scatterBlobs(field, parseInt(field.dataset.blobField)||5);
    });
    if(!isTouch && !reduceMotion){
      let mx=window.innerWidth/2, my=window.innerHeight/2;
      window.addEventListener('mousemove', (e)=>{ mx=e.clientX; my=e.clientY; }, {passive:true});
      function loop(){
        const cx = window.innerWidth/2, cy= window.innerHeight/2;
        document.querySelectorAll('.blob').forEach(b=>{
          const depth = parseFloat(b.dataset.depth||0.03);
          b.style.marginLeft = ((mx-cx)*depth)+'px';
          b.style.marginTop = ((my-cy)*depth)+'px';
        });
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }
  }

  /* ---------- Custom cursor ---------- */
  function initCursor(){
    if(isTouch) return;
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if(!dot||!ring) return;
    let rx=0, ry=0, tx=0, ty=0;
    window.addEventListener('mousemove', (e)=>{
      tx=e.clientX; ty=e.clientY;
      dot.style.left = tx+'px'; dot.style.top = ty+'px';
    }, {passive:true});
    function loop(){
      rx += (tx-rx)*0.18; ry += (ty-ry)*0.18;
      ring.style.left = rx+'px'; ring.style.top = ry+'px';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    const colorMap = {
      pink:{c:'#E06BB0'}, yellow:{c:'#E0A93D'}, teal:{c:'#1E5F5A'}, purple:{c:'#3D2C6B'}
    };
    document.querySelectorAll('[data-cursor-color]').forEach(el=>{
      el.addEventListener('mouseenter', ()=>{
        const c = (colorMap[el.dataset.cursorColor] || colorMap.purple).c;
        dot.style.background = c; ring.style.borderColor = c;
        ring.style.width='54px'; ring.style.height='54px';
      });
      el.addEventListener('mouseleave', ()=>{
        dot.style.background = '#7A2E8C'; ring.style.borderColor = '#E06BB0';
        ring.style.width='38px'; ring.style.height='38px';
      });
    });

    const canvas = document.getElementById('cursor-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize(){ canvas.width=innerWidth; canvas.height=innerHeight; }
    resize(); window.addEventListener('resize', resize);
    let particles = []; let lastX=tx, lastY=ty;
    window.addEventListener('mousemove', (e)=>{
      const dist = Math.hypot(e.clientX-lastX, e.clientY-lastY);
      if(dist>14 && particles.length<60 && !reduceMotion){
        particles.push({x:e.clientX,y:e.clientY,r:4+Math.random()*4,life:1,
          c:['#F5A9D0','#F5D06B','#A8C68A','#8FB4F0'][Math.floor(Math.random()*4)]});
        lastX=e.clientX; lastY=e.clientY;
      }
    }, {passive:true});
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(p=>{
        ctx.globalAlpha = p.life; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        p.life -= 0.025; p.y -= 0.4;
      });
      particles = particles.filter(p=>p.life>0);
      ctx.globalAlpha=1;
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ---------- Data layer (localStorage) ---------- */
  const STORE_KEY = 'mindbloom.moods.v1';
  const JOURNAL_KEY = 'mindbloom.journal.v1';
  function getMoods(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY))||[]; }catch(e){ return []; } }
  function saveMood(entry){ const all=getMoods(); all.unshift(entry); localStorage.setItem(STORE_KEY, JSON.stringify(all)); return all; }
  function deleteMood(id){ const all=getMoods().filter(m=>m.id!==id); localStorage.setItem(STORE_KEY, JSON.stringify(all)); return all; }
  function getJournal(){ try{ return JSON.parse(localStorage.getItem(JOURNAL_KEY))||[]; }catch(e){ return []; } }
  function saveJournal(entry){ const all=getJournal(); all.unshift(entry); localStorage.setItem(JOURNAL_KEY, JSON.stringify(all)); return all; }

  function initAll(){
    initPageVeil();
    initMobileMenu();
    initReveal();
    initTilt();
    initCounters();
    initBlobs();
    initCursor();
  }

  return { initAll, reduceMotion, isTouch, getMoods, saveMood, deleteMood, getJournal, saveJournal };
})();

document.addEventListener('DOMContentLoaded', MindBloom.initAll);
