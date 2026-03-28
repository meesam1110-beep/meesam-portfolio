(function(){
  'use strict';

  // Theme
  const html=document.documentElement,tb=document.getElementById('themeToggle');
  const saved=localStorage.getItem('theme');if(saved)html.setAttribute('data-theme',saved);
  tb.addEventListener('click',()=>{
    const n=html.getAttribute('data-theme')==='light'?'dark':'light';
    html.setAttribute('data-theme',n);localStorage.setItem('theme',n);
  });

  // Hero entrance
  window.addEventListener('load',()=>{
    document.querySelectorAll('.anim-up,.anim-fade').forEach(el=>{
      const d=parseInt(el.dataset.delay||'0',10);
      setTimeout(()=>el.classList.add('in'),d+300);
    });
  });

  // Descriptor cycle (subtle, not typewriter)
  const descs=['Consultant','Strategist','Finance Lead','Founder','Case Competitor','Community Builder'];
  const descEl=document.getElementById('descriptor');
  let di=0;
  function cycleDesc(){
    descEl.style.opacity='0';
    descEl.style.transform='translateY(8px)';
    setTimeout(()=>{
      di=(di+1)%descs.length;
      descEl.textContent=descs[di];
      descEl.style.opacity='1';
      descEl.style.transform='translateY(0)';
    },400);
  }
  if(descEl){
    descEl.style.transition='opacity .4s, transform .4s';
    setInterval(cycleDesc,2400);
  }

  // Scroll reveal
  const rObs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const sibs=e.target.parentElement.querySelectorAll('.reveal-up');
        const i=Array.from(sibs).indexOf(e.target);
        e.target.style.transitionDelay=i*100+'ms';
        e.target.classList.add('vis');rObs.unobserve(e.target);
      }
    });
  },{threshold:.08,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.reveal-up').forEach(el=>rObs.observe(el));

  // Nav scroll
  const tb2=document.getElementById('topbar');
  window.addEventListener('scroll',()=>tb2.classList.toggle('scrolled',scrollY>80),{passive:true});

  // Counter
  const cObs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){count(e.target);cObs.unobserve(e.target)}});
  },{threshold:.5});
  document.querySelectorAll('.metric-n[data-target]').forEach(n=>cObs.observe(n));
  function count(el){
    const t=+el.dataset.target,dur=1400,s=performance.now();
    (function f(now){const p=Math.min((now-s)/dur,1);el.textContent=Math.round((1-Math.pow(1-p,4))*t);if(p<1)requestAnimationFrame(f)})(s);
  }

  // (Experience is now a grid — no drag scroll needed)

  // Card tilt
  document.querySelectorAll('.v-card,.v-featured,.achv-row').forEach(c=>{
    if(!window.matchMedia('(pointer:fine)').matches)return;
    c.addEventListener('mousemove',e=>{
      const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      c.style.transform=`translateY(-4px) perspective(600px) rotateX(${-y*2}deg) rotateY(${x*2}deg)`;
    });
    c.addEventListener('mouseleave',()=>c.style.transform='');
  });

})();
