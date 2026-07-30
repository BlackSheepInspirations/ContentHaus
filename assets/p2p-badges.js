/* Purpose 2 Profit — badge-unlock popup + aurora confetti.
   Pops a celebration for any badge that is earned but not yet seen in this
   browser. "Seen" is tracked in localStorage for now; wire to customer
   metafields alongside the rest of the progress backend before public launch. */
(function(){
  var root = document.getElementById('p2pb');
  if(!root) return;
  var toast = document.getElementById('p2pb-toast');
  if(!toast) return;

  var SEEN_KEY = 'p2p_badges_seen';
  function loadSeen(){ try{ return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') || []; }catch(e){ return []; } }
  function saveSeen(a){ try{ localStorage.setItem(SEEN_KEY, JSON.stringify(a)); }catch(e){} }

  var medalEl  = toast.querySelector('.pbt-medal');
  var nameEl   = toast.querySelector('.pbt-name');
  var reqEl    = toast.querySelector('.pbt-req');
  var btnEl    = toast.querySelector('.pbt-btn');

  var queue = [], showing = false;

  function present(item){
    medalEl.className = 'pbt-medal ' + (item.color || '');
    medalEl.innerHTML = item.medal;
    nameEl.textContent = item.name;
    reqEl.textContent  = item.req;
    toast.classList.add('show');
    requestAnimationFrame(pbtBurst);
  }
  function next(){
    if(!queue.length){ showing = false; toast.classList.remove('show'); return; }
    showing = true;
    present(queue.shift());
  }
  btnEl.addEventListener('click', next);
  toast.addEventListener('click', function(e){ if(e.target === toast) next(); });

  /* apply badges the progress engine auto-earned (streaks, Trail Explorer,
     Comeback, …), then refresh the counts + live streak before we celebrate. */
  if(window.P2P){
    var auto = window.P2P.earnedSet();
    root.querySelectorAll('.badge').forEach(function(b){
      var nm = (b.querySelector('.name') || {}).textContent || '';
      if(nm && auto.indexOf(nm) !== -1 && !b.classList.contains('earned')){
        b.classList.remove('locked'); b.classList.add('earned');
        var lk = b.querySelector('.lock'); if(lk) lk.remove();
        if(!b.querySelector('.spark')){ var sp = document.createElement('span'); sp.className = 'spark'; (b.querySelector('.medal') || b).appendChild(sp); }
      }
    });
    // Capstone — once all five realm badges are earned, "Reached Freedom" lights up
    var REALMS = ['Open Water Cleared', 'Element Forest Cleared', 'Desert Blooms Cleared', 'Golden Harvest Cleared', 'Evergreen Cleared'];
    var earnedNow = {};
    root.querySelectorAll('.badge.earned .name').forEach(function(n){ earnedNow[n.textContent] = 1; });
    if(REALMS.every(function(r){ return earnedNow[r]; })){
      window.P2P.earnBadge('Reached Freedom');
      root.querySelectorAll('.badge').forEach(function(b){
        if(((b.querySelector('.name') || {}).textContent || '') === 'Reached Freedom' && !b.classList.contains('earned')){
          b.classList.remove('locked'); b.classList.add('earned');
          var lk = b.querySelector('.lock'); if(lk) lk.remove();
          if(!b.querySelector('.spark')){ var sp = document.createElement('span'); sp.className = 'spark'; (b.querySelector('.medal') || b).appendChild(sp); }
        }
      });
    }
    var stc = window.P2P.streak().count;
    root.querySelectorAll('.p2pb-streak').forEach(function(el){ el.textContent = stc; });
    var pstat = root.querySelector('.hstats .hstat:nth-child(1) b'); if(pstat) pstat.textContent = window.P2P.points();
    var lstat = root.querySelector('.hstats .hstat:nth-child(4) b'); if(lstat) lstat.textContent = window.P2P.level();
    var earnedN = root.querySelectorAll('.badge.earned').length;
    var totalN  = root.querySelectorAll('.badge').length;
    try{ localStorage.setItem('p2p_badges_stat', JSON.stringify({ earned:earnedN, total:totalN })); }catch(e){} // let the journey page show an accurate count
    var bstat = root.querySelector('.hstats .hstat:nth-child(2) b'); if(bstat) bstat.textContent = earnedN;
    var sm = root.querySelector('.summary');
    if(sm){
      sm.style.setProperty('--p', totalN ? Math.round(earnedN / totalN * 100) : 0);
      var rb = sm.querySelector('.ring b'); if(rb) rb.textContent = earnedN + '/' + totalN;
      var tb = sm.querySelector('.txt b'); if(tb) tb.textContent = earnedN + ' of ' + totalN + ' badges earned';
      var td = sm.querySelector('.txt div'); if(td) td.textContent = (totalN - earnedN) + ' more to unlock — keep climbing the trail.';
    }
  }

  /* collect earned-but-unseen badges */
  var seen = loadSeen(), fresh = [], all = seen.slice();
  root.querySelectorAll('.badge.earned').forEach(function(b){
    var name = (b.querySelector('.name') || {}).textContent || '';
    if(!name) return;
    var svg = b.querySelector('.medal svg');
    var color = (b.className.match(/c-[a-z]+/) || [''])[0];
    if(all.indexOf(name) === -1){
      fresh.push({ name:name, req:(b.querySelector('.req')||{}).textContent||'', color:color, medal: svg ? svg.outerHTML : '' });
      all.push(name);
    }
  });
  saveSeen(all); // mark them so they only celebrate once per browser

  if(fresh.length){
    queue = fresh;
    // let the page settle before the first pop
    setTimeout(next, 650);
  }

  /* ---- aurora confetti (stars + twinkles) ---- */
  function pbtBurst(){
    var cv = toast.querySelector('.pbt-canvas'); if(!cv) return;
    var DPR = Math.min(window.devicePixelRatio || 1, 2), ctx = cv.getContext('2d');
    var W = cv.width = toast.clientWidth * DPR, H = cv.height = toast.clientHeight * DPR;
    cv.style.width = toast.clientWidth + 'px'; cv.style.height = toast.clientHeight + 'px';
    var cx = W/2, cy = H*0.42, COL = ['#27ae6e','#39c5c0','#2563eb','#8f6fd6','#d6336c','#f4e2a6'], P = [];
    for(var i=0;i<90;i++){
      var a = Math.random()*6.283, sp = (2.5+Math.random()*7)*DPR;
      var ty = Math.random()<0.55 ? 'confetti' : (Math.random()<0.6 ? 'star' : 'twinkle');
      P.push({ x:cx, y:cy, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-3.5*DPR, g:0.13*DPR,
        rot:Math.random()*6.28, vr:(Math.random()-.5)*.35,
        size:(ty==='twinkle'?1.6:4+Math.random()*4)*DPR, color:COL[(Math.random()*COL.length)|0],
        type:ty, ph:Math.random()*6.28, life:1 });
    }
    var start = performance.now();
    (function frame(now){
      var alive = false; ctx.clearRect(0,0,W,H);
      for(var i=0;i<P.length;i++){ var p = P[i]; if(p.life<=0) continue; alive = true;
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr; p.ph += 0.25; p.life -= 0.012;
        ctx.globalAlpha = Math.max(0, p.life);
        if(p.type === 'confetti'){
          ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
          ctx.fillRect(-p.size/2, -p.size*0.35, p.size, p.size*0.7); ctx.restore();
        } else if(p.type === 'star'){
          ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
          ctx.shadowColor = p.color; ctx.shadowBlur = 6*DPR; var r = p.size;
          ctx.beginPath(); ctx.moveTo(0,-r); ctx.quadraticCurveTo(0,0,r,0); ctx.quadraticCurveTo(0,0,0,r);
          ctx.quadraticCurveTo(0,0,-r,0); ctx.quadraticCurveTo(0,0,0,-r); ctx.fill(); ctx.restore();
        } else {
          ctx.globalAlpha = Math.max(0,p.life)*(0.35+0.65*Math.abs(Math.sin(p.ph)));
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,6.28); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if(alive && now-start < 2400) requestAnimationFrame(frame); else ctx.clearRect(0,0,W,H);
    })(start);
  }

  /* expose for manual testing / future award hooks */
  window.p2pShowBadge = function(medalHTML, name, req, colorClass){
    queue.push({ medal:medalHTML, name:name, req:req, color:colorClass });
    if(!showing) next();
  };
})();
