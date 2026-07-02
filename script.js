(function(){
  'use strict';

  // Theme
  const html=document.documentElement,tb=document.getElementById('themeToggle');
  const saved=localStorage.getItem('theme');if(saved)html.setAttribute('data-theme',saved);
  tb.addEventListener('click',()=>{
    const n=html.getAttribute('data-theme')==='light'?'dark':'light';
    html.setAttribute('data-theme',n);localStorage.setItem('theme',n);
  });

  hydrateVisitorBadge();

  // Loader: quick brand reveal, then release once the visible hero photos are ready.
  const loaderStart=performance.now();
  let heroReady=Promise.resolve();
  const hideLoader=()=>{
    const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minTime=prefersReduced?0:2350;
    const maxHeroWait=prefersReduced?0:3400;
    const minWait=Math.max(0,minTime-(performance.now()-loaderStart));
    Promise.allSettled([
      sleep(minWait),
      Promise.race([heroReady,sleep(maxHeroWait)])
    ]).then(()=>{
      html.classList.add('is-loaded');
      setTimeout(()=>document.getElementById('siteLoader')?.remove(),520);
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideLoader,{once:true});
  else hideLoader();

  // Shuffle hero marquee on each refresh while keeping the loop seamless.
  const heroTrack=document.querySelector('[data-photo-collection="hero-marquee"]');
  if(heroTrack){
    const sources=Array.from(heroTrack.querySelectorAll('img'))
      .map(img=>img.getAttribute('src'))
      .filter(Boolean);
    const uniqueSources=getMarqueeSequence(sources);
    if(uniqueSources.length>1){
      shuffle(uniqueSources);
      heroTrack.innerHTML=[...uniqueSources,...uniqueSources]
        .map((src,index)=>`<img src="${src}" alt="" loading="${index<6?'eager':'lazy'}" decoding="async"${index<6?' fetchpriority="high"':''}>`)
        .join('');
      heroReady=waitForHeroImages(heroTrack,6);
    }
  }

  // Hero entrance
  window.addEventListener('load',()=>{
    document.querySelectorAll('.anim-up,.anim-fade').forEach(el=>{
      const d=parseInt(el.dataset.delay||'0',10);
      setTimeout(()=>el.classList.add('in'),d+50);
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

  function getMarqueeSequence(list){
    if(list.length%2===0){
      const half=list.length/2;
      const first=list.slice(0,half);
      const second=list.slice(half);
      if(first.every((src,index)=>src===second[index]))return first;
    }
    return list.slice();
  }

  function waitForHeroImages(track,count){
    const imgs=Array.from(track.querySelectorAll('img')).slice(0,count);
    if(!imgs.length)return Promise.resolve();
    return Promise.all(imgs.map(imageReady));
  }

  async function hydrateVisitorBadge(){
    const badge=document.querySelector('[data-analytics-badge]');
    const countEl=document.querySelector('[data-analytics-count]');
    const labelEl=document.querySelector('[data-analytics-label]');
    if(!badge||!countEl||!labelEl)return;

    try{
      const res=await fetch(`analytics.json?v=${Date.now()}`,{
        cache:'no-store',
        headers:{'Accept':'application/json'}
      });
      if(!res.ok)throw new Error(`Analytics fetch failed: ${res.status}`);

      const data=await res.json();
      const status=(data?.status||'').toString().toLowerCase();
      const count=Number(data?.count);
      const label=(data?.label||'views this year').toString();

      if(!['live','manual'].includes(status)){
        badge.classList.add('is-pending');
        countEl.textContent='Daily';
        labelEl.textContent='Google Analytics sync';
        badge.title='Google Analytics refresh runs once a day.';
        badge.setAttribute('aria-label','Google Analytics syncs daily');
        return;
      }

      if(!Number.isFinite(count)||count<=0)return;

      badge.classList.remove('is-pending');
      countEl.textContent=count.toLocaleString('en-CA');
      labelEl.textContent=label;

      if(status==='manual'){
        badge.title='Manual placeholder until live analytics sync is connected.';
      }
      if(data?.updatedAt){
        const updated=new Date(data.updatedAt);
        if(!Number.isNaN(updated.getTime())){
          const stamp=updated.toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'});
          badge.title=`Updated ${stamp}`;
        }
      }
      badge.setAttribute('aria-label',`${count.toLocaleString('en-CA')} ${label}`);
    }catch(err){
      console.warn('Visitor badge sync unavailable.',err);
    }
  }

  function imageReady(img){
    if(img.complete&&img.naturalWidth>0)return img.decode?img.decode().catch(()=>{}):Promise.resolve();
    return new Promise(resolve=>{
      const done=()=>resolve();
      img.addEventListener('load',done,{once:true});
      img.addEventListener('error',done,{once:true});
      if(img.decode)img.decode().then(done).catch(done);
    });
  }

  function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}

  function shuffle(list){
    for(let i=list.length-1;i>0;i-=1){
      const j=Math.floor(Math.random()*(i+1));
      [list[i],list[j]]=[list[j],list[i]];
    }
    return list;
  }

})();
