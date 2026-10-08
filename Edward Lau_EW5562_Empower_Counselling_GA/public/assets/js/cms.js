(() => {
  const fallback = window.EMPOWER_FALLBACK_CONTENT || {settings:{},counsellor:{},homeGuide:{items:[]},services:[],programs:[],videos:[]};
  let state = typeof structuredClone === 'function' ? structuredClone(fallback) : JSON.parse(JSON.stringify(fallback));
  const q = (s, c=document) => c.querySelector(s);
  const qa = (s, c=document) => [...c.querySelectorAll(s)];
  const esc = (value='') => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const cleanWhatsapp = value => String(value || '').replace(/\D/g,'');
  const slugValue = s => typeof s === 'string' ? s : (s && s.current) || '';
  const urlSafe = value => { try { const u = new URL(value, location.origin); return ['http:','https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const imageUrl = value => {
    if(!value) return '';
    if(typeof value === 'string') return value;
    return value.url || value.src || '';
  };
  function youtubeId(url=''){
    try{const u=new URL(url);if(u.hostname.includes('youtu.be'))return u.pathname.slice(1).split('/')[0];if(u.pathname.startsWith('/shorts/'))return u.pathname.split('/')[2];if(u.pathname.startsWith('/embed/'))return u.pathname.split('/')[2];return u.searchParams.get('v')||'';}catch{return ''}
  }
  function formatDate(d){if(!d)return'';const x=new Date(d+'T00:00:00');if(Number.isNaN(x.getTime()))return d;return new Intl.DateTimeFormat('en-MY',{year:'numeric',month:'short',day:'numeric'}).format(x);}
  function statusLabel(status){return({open:'Open for Registration',full:'Fully Booked',completed:'Completed'})[status]||'Open for Registration'}
  function categoryLabel(category){return({training:'Training',workshop:'Workshop',talk:'Talk'})[category]||category||'Event'}
  async function fetchCMS(){
    const res = await fetch('/api/content',{headers:{Accept:'application/json'},cache:'no-store'});
    if(!res.ok) throw new Error(`CMS API failed (${res.status})`);
    return await res.json();
  }
  function mergeContent(remote){
    if(!remote)return fallback;
    return {
      settings:{...fallback.settings,...(remote.settings||{})},
      counsellor:{...fallback.counsellor,...(remote.counsellor||{})},
      homeGuide:{...fallback.homeGuide,...(remote.homeGuide||{}),items:Array.isArray(remote.homeGuide?.items)?remote.homeGuide.items:(fallback.homeGuide?.items||[])},
      services:Array.isArray(remote.services)?remote.services:fallback.services,
      programs:Array.isArray(remote.programs)?remote.programs:fallback.programs,
      videos:Array.isArray(remote.videos)?remote.videos:fallback.videos
    };
  }
  function applyGlobal(){
    const s=state.settings||{},c=state.counsellor||{},wa=cleanWhatsapp(s.whatsapp)||'60128868809',name=c.nameZh||c.nameEn||'Benson Lim',title=c.titleZh||'Counsellor';
    qa('.brand strong').forEach(el=>el.textContent=`${title} ${name}`);
    qa('.brand-sub').forEach((el,i)=>el.textContent=i===0?`EMPOWER COUNSELLING · ${(s.serviceArea||'Kuching, Sarawak').split(',')[0].toUpperCase()}`:(s.brandName||'EMPOWER COUNSELLING CONSULTANCY SERVICES').toUpperCase());
    qa('a[href*="wa.me/"]').forEach(a=>{const raw=a.getAttribute('href')||'';let text='';try{text=new URL(raw).searchParams.get('text')||''}catch{}a.href=`https://wa.me/${wa}${text?`?text=${encodeURIComponent(text)}`:''}`});
    qa('a[href^="tel:"]').forEach(a=>{a.href=`tel:${cleanWhatsapp(s.phone||wa)}`;if(a.textContent.toLowerCase().includes('phone'))a.textContent=`Phone · ${s.phone||wa}`});
    qa('.footer-links a').forEach(a=>{const txt=a.textContent.trim();if(txt.startsWith('Facebook')&&s.facebook)a.href=s.facebook;if(txt.startsWith('YouTube')&&s.youtube)a.href=s.youtube});
    const footerBottom=q('.footer-bottom span:last-child'); if(footerBottom) footerBottom.textContent=`${s.appointmentRequired!==false?'Appointment required · ':''}Contact hours ${s.businessHours||'9:00 AM – 6:00 PM'}`;
  }
  function renderServiceCards(container){if(!container||!state.services?.length)return;container.innerHTML=state.services.map((x,i)=>{const slug=slugValue(x.slug)||`service-${i+1}`;return `<div class="service-card show"><span class="num">${String(i+1).padStart(2,'0')}</span><h3>${esc(x.title)}</h3><p>${esc(x.shortDescription||x.description||'')}</p><a href="services.html#${esc(slug)}">Learn More →</a></div>`}).join('')}

  function safeHref(value=''){
    const raw=String(value||'').trim();
    if(!raw)return '#';
    if(raw.startsWith('#')||/^[a-zA-Z0-9._/-]+(?:#[a-zA-Z0-9_-]+)?$/.test(raw))return raw;
    try{const u=new URL(raw,location.origin);return ['http:','https:'].includes(u.protocol)?u.href:'#';}catch{return '#'}
  }
  function renderHomeGuide(){
    const section=q('#homeGuideSection');if(!section)return;
    const g=state.homeGuide||{}, eyebrow=q('#homeGuideEyebrow'), title=q('#homeGuideTitle'), grid=q('#homeGuideGrid');
    if(eyebrow)eyebrow.textContent=[g.eyebrowEn,g.eyebrowZh].filter(Boolean).join(' / ')||'WHERE DO I START?';
    if(title&&g.title)title.innerHTML=esc(g.title).replace(/\n/g,'<br>');
    if(grid){
      const items=[...(g.items||[])].filter(x=>x.active!==false).sort((a,b)=>(a.order||0)-(b.order||0));
      if(items.length){grid.innerHTML=items.map(x=>{const articleUrl=String(x.facebookArticleUrl||x.facebookUrl||x.fbUrl||x.articleUrl||'').trim();const destination=safeHref(articleUrl||x.href);const external=/^https?:\/\//i.test(destination);return `<div class="concern show"><div class="icon">${esc(x.icon||'•')}</div><div><b>${esc(x.question||'')}</b><span class="muted">${esc(x.description||'')}</span><br><a href="${esc(destination)}"${external?' target="_blank" rel="noopener noreferrer"':''}>${esc(x.linkText||'Learn More →')}</a></div></div>`}).join('');section.hidden=false}else section.hidden=true;
    }
  }
  function renderHome(){
    if(document.body.dataset.page!=='home')return;const s=state.settings||{},c=state.counsellor||{};const title=q('.hero-copy h1');if(title&&s.homepageTagline){const parts=String(s.homepageTagline).split('，');title.innerHTML=parts.length>1?`${esc(parts[0])}，<br><em>${esc(parts.slice(1).join('，'))}</em>`:esc(s.homepageTagline)}const sub=q('.hero-copy .sub');if(sub&&s.homepageIntro)sub.textContent=s.homepageIntro;const heroTime=q('.hero-meta strong');if(heroTime&&s.businessHours)heroTime.textContent=s.businessHours;const qName=q('.quote-card b');if(qName)qName.textContent=`${c.titleZh||'Counsellor'} ${c.nameZh||c.nameEn||'Benson Lim'}`;const qDesc=q('.quote-card p');if(qDesc)qDesc.textContent=`${c.nameEn||''} · ${s.brandName||'Empower Counselling Consultancy Services'}`;const portrait=imageUrl(c.photoUrl||c.photo);if(portrait){const img=q('.portrait-card img');if(img){img.src=portrait;img.alt=`${c.nameZh||c.nameEn||'Benson Lim'}`}}const aboutLead=q('section.section:not(.soft) .lead');if(aboutLead&&c.intro)aboutLead.textContent=c.intro;const skills=q('.profile-panel .skill-list');if(skills&&c.specialities?.length)skills.innerHTML=c.specialities.map(x=>`<span>${esc(x)}</span>`).join('');renderServiceCards(q('.services-grid'));renderHomeGuide();renderHomePrograms();renderVideos(q('#homeVideos'),3)
  }
  function renderServicesPage(){
    if(document.body.dataset.page!=='services'||!state.services?.length)return;const side=q('.side-card'),detail=q('.detail-grid > div:last-child');if(side)side.innerHTML='<h3>Services</h3>'+state.services.map(x=>`<a href="#${esc(slugValue(x.slug))}">${esc(x.title)}</a>`).join('')+'<a href="contact.html">Book a Consultation →</a>';if(detail)detail.innerHTML=state.services.map((x,i)=>{const slug=slugValue(x.slug)||`service-${i+1}`,topics=(x.topics||[]).map(t=>`<li>${esc(t)}</li>`).join(''),isTraining=slug==='training',note=slug==='mindfulness'?'<div class="notice">Website content describes services and is not medical diagnosis or an emergency crisis service. If there is immediate danger or urgent medical need, contact local emergency services or an appropriate medical facility.</div>':'';return `<div class="content-block show" id="${esc(slug)}"><div class="eyebrow">${String(i+1).padStart(2,'0')} · ${esc((x.labelEn||slug).toUpperCase())}</div><h2>${esc(x.title)}</h2><p>${esc(x.description||x.shortDescription||'')}</p>${topics?`<h3>Topics May Include</h3><ul>${topics}</ul>`:''}${note}${isTraining?'<a class="btn ghost service-cta" href="programs.html">View Programmes & Events →</a>':`<a class="btn service-cta" href="contact.html?service=${encodeURIComponent(x.title)}">Ask About This Service →</a>`}</div>`}).join('')
  }
  function renderAbout(){
    if(document.body.dataset.page!=='about')return;const c=state.counsellor||{},portrait=imageUrl(c.photoUrl||c.photo);if(portrait){const img=q('.about-art');if(img){img.src=portrait;img.alt=`${c.nameZh||c.nameEn||'Benson Lim'}`}}const h=q('#intro h2');if(h)h.textContent=`${c.titleZh||'Counsellor'} ${c.nameZh||c.nameEn||'Benson Lim'}`;const ps=qa('#intro p');if(ps[0]&&c.intro)ps[0].textContent=c.intro;if(ps[1]&&c.intro2)ps[1].textContent=c.intro2;const skills=q('#intro .skill-list');if(skills&&c.specialities?.length)skills.innerHTML=c.specialities.map(x=>`<span>${esc(x)}</span>`).join('');const approach=q('#approach p');if(approach&&c.philosophy)approach.textContent=c.philosophy;const quote=q('#approach .quote-panel');if(quote&&c.quote)quote.textContent=`“${c.quote}”`;if(c.credentials?.length&&!q('#credentials')){const block=document.createElement('div');block.className='content-block show';block.id='credentials';block.innerHTML=`<div class="eyebrow">PROFESSIONAL BACKGROUND</div><h2>Professional Qualifications & Background</h2><ul>${c.credentials.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;q('#focus').after(block);const side=q('.side-card');if(side){const a=document.createElement('a');a.href='#credentials';a.textContent='Professional Qualifications';side.insertBefore(a,side.lastElementChild)}}
  }
  function programmeWhatsappMessage(p,status='open'){
    const details=[
      p.title?`Programme / Event: ${p.title}`:'',
      p.startDate?`Date: ${formatDate(p.startDate)}`:'',
      p.timeText?`Time: ${p.timeText}`:'',
      p.venue?`Venue: ${p.venue}`:'',
      p.fee?`Fee: ${p.fee}`:''
    ].filter(Boolean);
    const closing=status==='full'
      ? 'I can see that this programme is currently fully booked. Is there a waiting list or another upcoming session? Thank you.'
      : 'Is registration still available? Could you share the registration process and more details? Thank you.';
    return ['Hello, I am interested in the following programme / event and would like more registration details:','',...details,'',closing].join('\n');
  }
  function programCard(p){
    const img=imageUrl(p.coverImageUrl||p.coverImage),status=p.status||'open',meta=[categoryLabel(p.category),formatDate(p.startDate),p.timeText,p.venue].filter(Boolean),reg=urlSafe(p.registrationUrl),wa=cleanWhatsapp(state.settings?.whatsapp)||'60128868809';
    let action='';
    if(status==='completed'){
      action='<span class="programme-ended">Event completed</span>';
    }else{
      const msg=programmeWhatsappMessage(p,status);
      const label=status==='full'?'Ask About Waiting List on WhatsApp ↗':'Register / Enquire on WhatsApp ↗';
      const external=reg?`<a class="text-link programme-register-link" href="${esc(reg)}" target="_blank" rel="noopener">Open External Registration Link ↗</a>`:'';
      action=`<div class="programme-actions"><a class="btn ghost" href="https://wa.me/${wa}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${label}</a>${external}</div>`;
    }
    return `<article class="event-card cms-event"><div class="programme-cover ${img?'has-image':''}">${img?`<img src="${esc(img)}" alt="${esc(p.imageAlt||p.title)}">`:'<span>EMPOWER</span>'}<b class="programme-status status-${esc(status)}">${esc(statusLabel(status))}</b></div><div class="event-body"><div class="event-meta">${meta.map((x,i)=>`${i?'<span>·</span>':''}<span>${esc(x)}</span>`).join('')}</div><h3>${esc(p.title)}</h3><p>${esc(p.summary||p.description||'')}</p>${p.fee?`<p class="programme-fee">Fee: ${esc(p.fee)}</p>`:''}${action}</div></article>`;
  }
  function setProgrammeGrid(holder,count){if(!holder)return;holder.dataset.count=String(Math.min(count,3))}
  function renderHomePrograms(){const holder=q('#homeProgrammes');if(!holder)return;const list=[...(state.programs||[])].filter(p=>(p.status||'open')!=='completed').sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured))||String(b.startDate||'').localeCompare(String(a.startDate||''))).slice(0,3);if(!list.length){holder.hidden=true;return}holder.hidden=false;setProgrammeGrid(holder,list.length);holder.innerHTML=list.map(programCard).join('')}
  function renderPrograms(){
    if(document.body.dataset.page!=='programs')return;
    const holder=q('#cmsPrograms'),section=q('#cmsProgramsSection'),empty=q('#programmesFallback');
    if(!holder)return;
    const source=[...(state.programs||[])];
    if(!source.length){if(section)section.hidden=true;holder.innerHTML='';if(empty)empty.hidden=false;return}
    if(section)section.hidden=false;if(empty)empty.hidden=true;
    const search=q('#programSearch'),status=q('#programStatus'),sort=q('#programSort'),count=q('#programResultsCount');
    const draw=()=>{
      const term=(search?.value||'').trim().toLowerCase(),st=status?.value||'all',order=sort?.value||'newest';
      let list=source.filter(p=>{
        const hay=[p.title,p.summary,p.description,p.venue,categoryLabel(p.category)].filter(Boolean).join(' ').toLowerCase();
        return (!term||hay.includes(term))&&(st==='all'||(p.status||'open')===st);
      });
      list.sort((a,b)=>order==='az'?String(a.title||'').localeCompare(String(b.title||''),'en'):order==='oldest'?String(a.startDate||'9999').localeCompare(String(b.startDate||'9999')):String(b.startDate||'').localeCompare(String(a.startDate||'')));
      setProgrammeGrid(holder,list.length);
      holder.innerHTML=list.length?list.map(programCard).join(''):'<div class="filter-empty">No programmes or events match the current filters. Try another keyword or filter.</div>';
      if(count)count.textContent=`Showing ${list.length} of ${source.length} programmes and events`;
    };
    [search,status,sort].forEach(el=>{if(el&&!el.dataset.bound){el.addEventListener(el.tagName==='INPUT'?'input':'change',draw);el.dataset.bound='1'}});
    draw();
  }
  function videoCard(v){const url=urlSafe(v.youtubeUrl)||state.settings?.youtube||'#',id=youtubeId(url),thumb=id?`https://i.ytimg.com/vi/${id}/hqdefault.jpg`:'';return `<a class="video-card cms-video" href="${esc(url)}" target="_blank" rel="noopener" ${thumb?`style="background-image:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.58)),url('${thumb}')"`:''}><span class="play">▶</span><h3>${esc(v.title)}</h3><p>${esc(v.description||v.category||'Watch on YouTube')} ↗</p></a>`}
  function renderVideos(container,limit=0){if(!container||!state.videos?.length)return;const items=limit?state.videos.slice(0,limit):state.videos;container.innerHTML=items.map(videoCard).join('');if(!limit&&state.settings?.youtube)container.innerHTML+=`<a class="video-card channel-card" href="${esc(state.settings.youtube)}" target="_blank" rel="noopener"><span class="play">↗</span><h3>${esc(state.counsellor?.nameZh||state.counsellor?.nameEn||'Benson Lim')} YouTube Channel</h3><p>Browse all public videos on the channel.</p></a>`}
  function renderResources(){if(document.body.dataset.page==='resources')renderVideos(q('#resourceVideos'))}
  function renderContact(){
    if(document.body.dataset.page!=='contact')return;
    const s=state.settings||{},rows=qa('.contact-card .contact-row');
    if(rows[0]){const b=q('b a',rows[0]);if(b){b.textContent=`${s.phone||'+60 12-886 8809'} ↗`;b.href=`https://wa.me/${cleanWhatsapp(s.whatsapp)}`}}
    if(rows[1]){const b=q('b',rows[1]);if(b)b.textContent=[s.businessDays,s.businessHours].filter(Boolean).join(' · ')||'9:00 AM – 6:00 PM'}
    if(rows[3]){const b=q('b',rows[3]);if(b)b.textContent=s.address||s.serviceArea||'Kuching, Sarawak';const m=q('.muted',rows[3]);if(m)m.textContent=s.address?'Advance booking is required.':'The session location will be provided when your appointment is confirmed.'}
    const social=rows[4];if(social){const links=qa('a',social);if(links[0]&&s.facebook)links[0].href=s.facebook;if(links[1]&&s.youtube)links[1].href=s.youtube}
    const service=q('#service');
    if(service&&state.services?.length){
      const current=service.value;
      service.innerHTML=state.services.map(x=>`<option value="${esc(x.id||slugValue(x.slug)||x.title)}" data-title="${esc(x.title)}">${esc(x.title)}</option>`).join('')+'<option value="other" data-title="Other Enquiry">Other Enquiry</option>';
      if([...service.options].some(o=>o.value===current))service.value=current;
      const prefill=new URLSearchParams(location.search).get('service');
      if(prefill){const option=[...service.options].find(o=>o.textContent===prefill||o.value===prefill);if(option)service.value=option.value;}
    }
  }
  function applyAll(){applyGlobal();renderHome();renderServicesPage();renderAbout();renderPrograms();renderResources();renderContact();document.documentElement.dataset.cms='independent'}
  async function init(){applyAll();try{const remote=await fetchCMS();state=mergeContent(remote);applyAll();window.dispatchEvent(new CustomEvent('empowercms:loaded',{detail:state}))}catch(err){console.warn('[Empower CMS] API unavailable, using built-in fallback content:',err);window.dispatchEvent(new CustomEvent('empowercms:error',{detail:String(err)}))}}
  window.EmpowerCMS={getState:()=>state,getContact:()=>state.settings||{},isConfigured:()=>true};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
