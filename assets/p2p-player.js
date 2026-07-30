/* Purpose 2 Profit — Course Player */
(function(){
  var root = document.getElementById('p2pp');
  if(!root) return;
  var course = root.getAttribute('data-course') || 'course';
  var courseTitle = root.getAttribute('data-course-title') || 'Course';
  var userName = root.getAttribute('data-user') || '';
  var storeKey = 'p2p_course_' + course + '_done';

  var lis = Array.prototype.slice.call(root.querySelectorAll('.lessons li'));
  var panels = Array.prototype.slice.call(root.querySelectorAll('.lpanel'));
  var total = lis.length;
  if(!total) return;

  var doneSet = {};
  try{ (JSON.parse(localStorage.getItem(storeKey)||'[]')||[]).forEach(function(i){ doneSet[i]=1; }); }catch(e){}

  function saveDone(){ try{ localStorage.setItem(storeKey, JSON.stringify(Object.keys(doneSet).map(Number))); }catch(e){} }
  function doneCount(){ return Object.keys(doneSet).length; }
  function pct(){ return Math.round(doneCount()/total*100); }

  var track=document.getElementById('p2pp-track'), ppct=document.getElementById('p2pp-ppct'),
      sbar=document.getElementById('p2pp-sbar'), spct=document.getElementById('p2pp-spct');
  function refresh(){
    var p=pct();
    if(track) track.style.width=p+'%'; if(ppct) ppct.textContent=p+'%';
    if(sbar) sbar.style.width=p+'%'; if(spct) spct.textContent=p+'% complete';
    lis.forEach(function(li,i){ li.classList.toggle('done', !!doneSet[i]); });
    panels.forEach(function(pn,i){
      var t=pn.querySelector('.toggle'), m=pn.querySelector('.markbtn');
      var d=!!doneSet[i];
      if(t) t.classList.toggle('done', d);
      if(m){ m.classList.toggle('done', d); m.textContent = d ? '✓ Completed' : 'Mark lesson complete'; }
    });
  }
  function activate(i){
    lis.forEach(function(li,n){ li.classList.toggle('active', n===i); });
    panels.forEach(function(pn,n){ pn.style.display = n===i ? '' : 'none'; });
    if(window.scrollY>120) window.scrollTo({top:0,behavior:'smooth'});
  }
  /* badge-earned pop-up — queued on completion, shown after the certificate closes */
  var bpEl = document.getElementById('p2pp-badgepop'), bpQ = [], BP_SEEN = 'p2p_badges_seen';
  var bpName = bpEl ? bpEl.querySelector('.bp-name') : null;
  var bpCanvas = bpEl ? bpEl.querySelector('.bp-canvas') : null;
  function bpLoadSeen(){ try{ return JSON.parse(localStorage.getItem(BP_SEEN) || '[]') || []; }catch(e){ return []; } }
  function bpSaveSeen(a){ try{ localStorage.setItem(BP_SEEN, JSON.stringify(a)); }catch(e){} }
  function bpCollect(){
    if(!window.P2P || !window.P2P.earnedSet) return;
    var earned = window.P2P.earnedSet() || [], all = bpLoadSeen().slice();
    earned.forEach(function(n){ if(all.indexOf(n) === -1){ bpQ.push(n); all.push(n); } });
    bpSaveSeen(all);
  }
  function bpConfetti(){
    var cv = bpCanvas; if(!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = cv.width = cv.clientWidth * DPR, H = cv.height = cv.clientHeight * DPR; if(!W || !H) return;
    var colors = ['#f4e2a6','#d8b45a','#39c5c0','#8f6fd6','#27ae6e'], P = [];
    for(var i=0;i<90;i++){ P.push({ x:W/2 + (Math.random()-.5)*W*0.3, y:H*0.34, vx:(Math.random()-.5)*11*DPR, vy:(Math.random()*-10-3)*DPR, s:(Math.random()*5+3)*DPR, c:colors[(Math.random()*colors.length)|0], r:Math.random()*6, vr:(Math.random()-.5)*0.4 }); }
    var t0 = performance.now();
    (function frame(t){
      var el = t - t0, a = Math.max(0, 1 - el/2600); ctx.clearRect(0,0,W,H);
      P.forEach(function(p){ p.vy += 0.25*DPR; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s*0.62); ctx.restore(); });
      if(el < 2600 && bpEl.classList.contains('show')) requestAnimationFrame(frame); else ctx.clearRect(0,0,W,H);
    })(t0);
  }
  function bpNext(){ if(!bpEl) return; if(!bpQ.length){ bpEl.classList.remove('show'); return; } bpName.textContent = bpQ.shift(); bpEl.classList.add('show'); requestAnimationFrame(bpConfetti); }
  if(bpEl){
    var bpc = bpEl.querySelector('.bp-close'); if(bpc) bpc.addEventListener('click', bpNext);
    bpEl.addEventListener('click', function(e){ if(e.target === bpEl) bpNext(); });
  }
  function mark(i){
    if(doneSet[i]) delete doneSet[i]; else doneSet[i]=1;
    saveDone(); refresh();
    if(doneCount()===total){
      if(window.P2P) window.P2P.completeCourse(course); // First Steps / Finding Your Current
      recordCert(); // save the certificate so it can be re-viewed in Milestones
      if(window.P2P && window.P2P.awardCert) window.P2P.awardCert(course); // +25 once per course
      if(window.P2P && window.P2P.push) window.P2P.push(); // flush to cross-device backend
      bpCollect(); // capture newly-earned badges to celebrate after the certificate
      setTimeout(celebrate, 350);
    }
  }

  lis.forEach(function(li,i){ li.addEventListener('click', function(){ activate(i); }); });
  panels.forEach(function(pn,i){
    var t=pn.querySelector('.toggle'), m=pn.querySelector('.markbtn'),
        prev=pn.querySelector('[data-nav="prev"]'), next=pn.querySelector('[data-nav="next"]');
    if(t) t.addEventListener('click', function(){ mark(i); });
    if(m) m.addEventListener('click', function(){ mark(i); });
    if(prev) prev.addEventListener('click', function(){ activate(Math.max(0,i-1)); });
    if(next) next.addEventListener('click', function(){ activate(Math.min(total-1,i+1)); });
  });

  // start on first incomplete lesson
  var start=0; for(var i=0;i<total;i++){ if(!doneSet[i]){ start=i; break; } }
  refresh(); activate(start);

  /* ---------- certificate ---------- */
  var certEl=document.getElementById('p2pp-cert');
  function fillCert(){
    if(!certEl) return;
    var n=certEl.querySelector('.cname'), c=certEl.querySelector('.ccourse'),
        d=certEl.querySelector('.cdate'), id=certEl.querySelector('.cid');
    if(n) n.textContent = userName || 'Your Name';
    if(c) c.textContent = courseTitle;
    if(d){ var dt=new Date(); d.textContent='Awarded '+dt.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}); }
    if(id){ id.textContent='ID · '+ certIdFor(); }
  }
  function genId(){ var s='P2P-'+new Date().getFullYear()+'-'; for(var i=0;i<6;i++) s+='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[(Math.random()*32)|0]; return s; }
  function storedCerts(){ try{ return JSON.parse(localStorage.getItem('p2p_certificates') || '{}') || {}; }catch(e){ return {}; } }
  function certIdFor(){ var c=storedCerts()[course]; return (c && c.id) || root.getAttribute('data-certid') || genId(); }
  function recordCert(){ var certs=storedCerts(); if(!certs[course]){ certs[course]={ handle:course, title:courseTitle, name:userName||'', id:(root.getAttribute('data-certid')||genId()), ts:Date.now() }; try{ localStorage.setItem('p2p_certificates', JSON.stringify(certs)); }catch(e){} } }
  function showCert(){ fillCert(); certEl.classList.add('show'); }
  function hideCert(){ certEl.classList.remove('show'); if(bpQ && bpQ.length) setTimeout(bpNext, 250); }
  function downloadCert(){
    var img=certEl.querySelector('img'); if(!img) return;
    var W=1600, H=Math.round(W*img.naturalHeight/img.naturalWidth);
    var cv=document.createElement('canvas'); cv.width=W; cv.height=H; var x=cv.getContext('2d');
    x.drawImage(img,0,0,W,H);
    x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#132a54';
    x.font='600 '+Math.round(W*0.055)+'px "Snell Roundhand","Brush Script MT",cursive';
    x.fillText(userName||'Your Name', W*0.5, H*0.556);
    x.fillStyle='#173056'; x.font='700 '+Math.round(W*0.021)+'px Georgia,serif';
    x.fillText((courseTitle||'').toUpperCase(), W*0.5, H*0.66);
    x.fillStyle='#3a4d70'; x.font='italic '+Math.round(W*0.012)+'px Georgia,serif';
    var dt=new Date(); x.fillText('Awarded '+dt.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}), W*0.11, H*0.72);
    x.font=Math.round(W*0.011)+'px Georgia,serif';
    x.fillText('ID · '+certIdFor(), W*0.89, H*0.72);
    var a=document.createElement('a'); a.download='P2P-Certificate.png'; a.href=cv.toDataURL('image/png'); a.click();
    if(window.P2P) window.P2P.earnBadge('Certified'); // downloaded your first certificate
  }
  if(certEl){
    var cx=certEl.querySelector('[data-cert="close"]'), cd=certEl.querySelector('[data-cert="download"]');
    if(cx) cx.addEventListener('click', hideCert);
    if(cd) cd.addEventListener('click', downloadCert);
    certEl.addEventListener('click', function(e){ if(e.target===certEl) hideCert(); });
  }

  /* ---------- celebration ---------- */
  var cel=document.getElementById('p2pp-cel'), cv=cel?cel.querySelector('canvas'):null, ctx, W,H,DPR, P=[],SP=[], until=0, run=false;
  function csize(){DPR=Math.min(devicePixelRatio||1,2);W=cv.width=innerWidth*DPR;H=cv.height=innerHeight*DPR;cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';}
  addEventListener('resize',function(){if(cel&&cel.classList.contains('show'))csize();});
  var GREENS=['#3fae5a','#6cbf3f','#2e8b57','#8fce4a','#248a4a','#57b86a'], SPK=['#ffffff','#ffffff','#f6d868','#8ff0e0','#8ff0e0','#c77dff','#ff9ec7'];
  function rnd(a,b){return a+Math.random()*(b-a);} function pk(a){return a[(Math.random()*a.length)|0];}
  function ell(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,6.2832);ctx.fill();}
  function irid(p,sh){var h=(p.hue+sh+p.t*30)%360;var g=ctx.createLinearGradient(-p.size,-p.size,p.size,p.size);g.addColorStop(0,'hsla('+h+',92%,72%,.92)');g.addColorStop(.5,'hsla('+((h+55)%360)+',96%,82%,.9)');g.addColorStop(1,'hsla('+((h+130)%360)+',90%,70%,.92)');return g;}
  function spawn(t){var s=DPR; if(t==='leaf'){P.push({t2:t,x:rnd(0,W),y:-30*s,vy:rnd(.7,1.9)*s,sway:rnd(.6,1.6),amp:rnd(.5,1.6)*s,rot:rnd(0,6.28),vr:rnd(-.04,.04),size:rnd(9,17)*s,t:rnd(0,6.28),color:pk(GREENS)});}
    else{P.push({t2:t,x:rnd(0,W),y:H+30*s,vy:rnd(.5,1.3)*s,sway:rnd(.7,1.5),amp:rnd(.8,2.2)*s,rot:rnd(-.3,.3),size:rnd(13,22)*s,t:rnd(0,6.28),phase:rnd(0,6.28),flap:rnd(.18,.30),hue:rnd(180,305)});}}
  function loop(now){ if(!run)return; ctx.clearRect(0,0,W,H);
    for(var i=0;i<SP.length;i++){var s=SP[i];s.t+=.016;s.x+=s.vx;s.y+=s.vy; if(s.x<-10)s.x=W+10;if(s.x>W+10)s.x=-10;if(s.y<-10)s.y=H+10;if(s.y>H+10)s.y=-10;
      var a=s.base*(0.25+0.75*Math.abs(Math.sin(s.t*s.tw))); var g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*3.4);g.addColorStop(0,s.col);g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.globalAlpha=a*.8;ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,s.r*3.4,0,6.28);ctx.fill(); ctx.globalAlpha=Math.min(1,a*1.2);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,s.r*.7,0,6.28);ctx.fill();}
    if(now<until){for(var k=0;k<3;k++)spawn(pk(['leaf','leaf','leaf','butterfly','dragonfly']));}
    for(var i=P.length-1;i>=0;i--){var p=P[i];p.t+=.016; ctx.globalAlpha=1;
      if(p.t2==='leaf'){p.y+=p.vy;p.x+=Math.sin(p.t*p.sway)*p.amp;p.rot+=p.vr; ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);var r=p.size;ctx.fillStyle=p.color;ctx.globalAlpha=.92;
        ctx.beginPath();ctx.moveTo(0,-r);ctx.bezierCurveTo(r*.85,-r*.35,r*.85,r*.4,0,r);ctx.bezierCurveTo(-r*.85,r*.4,-r*.85,-r*.35,0,-r);ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=Math.max(1,r*.06);ctx.beginPath();ctx.moveTo(0,-r*.9);ctx.lineTo(0,r*.9);ctx.stroke();ctx.restore();}
      else{p.y-=p.vy;p.x+=Math.sin(p.t*p.sway)*p.amp;p.phase+=p.flap;var s=p.size; ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot+Math.sin(p.t)*.12);
        if(p.t2==='butterfly'){var fl=.30+.70*Math.abs(Math.sin(p.phase));ctx.globalAlpha=.94;ctx.fillStyle=irid(p,0); for(var sd=-1;sd<=1;sd+=2){ctx.save();ctx.scale(sd*fl,1);ell(s*.55,-s*.28,s*.62,s*.5);ell(s*.42,s*.34,s*.44,s*.36);ctx.restore();} ctx.fillStyle='#241d30';ell(0,0,s*.10,s*.62);}
        else{var fl=.55+.45*Math.sin(p.phase*1.7);ctx.globalAlpha=.8;ctx.fillStyle=irid(p,40); ctx.save();ctx.scale(1,fl);ell(-s*.75,-s*.12,s*.92,s*.15);ell(s*.75,-s*.12,s*.92,s*.15);ell(-s*.62,s*.16,s*.78,s*.12);ell(s*.62,s*.16,s*.78,s*.12);ctx.restore(); ctx.globalAlpha=.95;ctx.fillStyle='#1f6b52';ell(0,s*.28,s*.10,s*.95);ctx.fillStyle='#39c5c0';ell(0,-s*.34,s*.17,s*.17);}
        ctx.restore();}
      if(p.y>H+60*DPR||p.y<-80*DPR)P.splice(i,1);
    }
    requestAnimationFrame(loop);
  }
  function celebrate(){ if(!cel){ showCert(); return; } cel.classList.add('show'); ctx=cv.getContext('2d'); csize();
    SP=[]; for(var i=0;i<70;i++)SP.push({x:rnd(0,W),y:rnd(0,H),vx:rnd(-.25,.25)*DPR,vy:rnd(-.25,.25)*DPR,r:rnd(1.1,2.6)*DPR,t:rnd(0,6.28),tw:rnd(2.5,5),col:pk(SPK),base:rnd(.4,.9)});
    P=[]; until=performance.now()+2600; run=true; requestAnimationFrame(loop);
  }
  function endCel(){ run=false; if(cel) cel.classList.remove('show'); }
  if(cel){
    var vc=cel.querySelector('[data-cel="cert"]'), bk=cel.querySelector('[data-cel="back"]');
    if(vc) vc.addEventListener('click', function(){ endCel(); showCert(); });
    if(bk) bk.addEventListener('click', endCel);
  }
  root._p2ppCelebrate = celebrate; // exposed for testing
})();
