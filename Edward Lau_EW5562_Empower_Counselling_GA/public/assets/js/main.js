const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];

// Navigation
const menuBtn=$('.menu-btn'), nav=$('.nav-links');
const closeMenu=()=>{if(!nav||!menuBtn)return;nav.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');menuBtn.setAttribute('aria-label','Open menu');};
if(menuBtn&&nav){
  menuBtn.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menuBtn.setAttribute('aria-expanded',String(open));menuBtn.setAttribute('aria-label',open?'Close menu':'Open menu');});
  $$('.nav-links a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.addEventListener('click',e=>{if(nav.classList.contains('open')&&!nav.contains(e.target)&&!menuBtn.contains(e.target))closeMenu();});
}

// Active nav state
const current=document.body.dataset.page;
$$('.nav-links [data-page]').forEach(a=>{if(a.dataset.page===current){a.classList.add('active');a.setAttribute('aria-current','page');}});

// Reveal motion with accessibility fallback
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
if(reduceMotion||!('IntersectionObserver' in window)){$$('.reveal').forEach(el=>el.classList.add('show'));}
else{const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');observer.unobserve(e.target)}}),{threshold:.12});$$('.reveal').forEach(el=>observer.observe(el));}

// Programme filters kept for future CMS-generated cards
$$('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;$$('.event-card[data-category]').forEach(card=>card.dataset.hidden=(f!=='all'&&card.dataset.category!==f)?'true':'false');}));

// Appointment and enquiry form handling
const jsonPost=async(path,payload)=>{
  const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||`Submission failed (${res.status})`);
  return data;
};
const setFormBusy=(form,busy)=>{form?.querySelectorAll('button,input,select,textarea').forEach(el=>{if(el.name==='company')return;el.disabled=busy});};

const booking=$('#bookingForm');
if(booking){
  const service=$('#service'); const params=new URLSearchParams(location.search); const prefill=params.get('service');
  if(prefill&&service){const opt=[...service.options].find(o=>o.value===prefill||o.textContent===prefill);if(opt)service.value=opt.value;}
  const date=$('#date'); if(date){const now=new Date(); const local=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);date.min=local;}
  const updateWhatsapp=()=>{
    const data=new FormData(booking),selected=service?.selectedOptions?.[0];
    const name=(data.get('name')||'Visitor').toString().trim(),inquiry=(data.get('inquiryType')||'First-time Enquiry').toString(),svc=selected?.dataset.title||selected?.textContent||'Counselling';
    const preferred=(data.get('date')||'Not specified').toString(),time=(data.get('time')||'Not specified').toString().trim(),note=(data.get('note')||'').toString().trim();
    let msg=`Hello, my name is ${name}. I found this information on the Empower Counselling website.\nEnquiry type: ${inquiry}\nService of interest: ${svc}\nPreferred date: ${preferred}\nPreferred contact time: ${time}`;
    if(note)msg+=`\nBrief note: ${note}`;msg+='\nThank you.';
    const cmsWa=window.EmpowerCMS?.getContact?.().whatsapp||'60128868809',wa=String(cmsWa).replace(/\D/g,'')||'60128868809';
    const link=$('#bookingWhatsapp');if(link)link.href='https://wa.me/'+wa+'?text='+encodeURIComponent(msg);
  };
  booking.addEventListener('input',updateWhatsapp);booking.addEventListener('change',updateWhatsapp);updateWhatsapp();
  booking.addEventListener('submit',async e=>{
    e.preventDefault(); const status=$('#bookingStatus'),submit=$('#bookingSubmit');
    if(!booking.reportValidity())return;
    const data=new FormData(booking),selected=service?.selectedOptions?.[0];
    const payload={fullName:data.get('name'),phone:data.get('phone'),email:data.get('email'),inquiryType:data.get('inquiryType'),serviceId:data.get('service'),serviceLabel:selected?.dataset.title||selected?.textContent||'',preferredDate:data.get('date'),preferredTime:data.get('time'),note:data.get('note'),company:data.get('company')};
    if(status){status.hidden=false;status.className='booking-status';status.textContent='Submitting booking request…';}
    setFormBusy(booking,true);if(submit)submit.textContent='Submitting…';
    try{
      const result=await jsonPost('/api/appointments',payload);
      if(status){status.className='booking-status success';const reference=result.id?String(result.id).slice(0,8).toUpperCase():'Recorded';status.textContent=`Your booking request was submitted successfully. Reference: ${reference}. Empower will contact you using the details provided.`;}
      booking.reset();updateWhatsapp();if(date){const now=new Date();date.min=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);}
    }catch(err){if(status){status.className='booking-status error-state';status.textContent=err.message+' You can still contact Empower using the WhatsApp button.';}}
    finally{setFormBusy(booking,false);if(submit)submit.textContent='Submit Booking Request →';}
  });
}

const enquiry=$('#enquiryForm');
if(enquiry){
  enquiry.addEventListener('submit',async e=>{
    e.preventDefault();if(!enquiry.reportValidity())return;
    const data=new FormData(enquiry),status=$('#enquiryStatus'),submit=$('#enquirySubmit');
    if(status){status.hidden=false;status.className='booking-status';status.textContent='Submitting enquiry…';}
    setFormBusy(enquiry,true);if(submit)submit.textContent='Submitting…';
    try{
      const result=await jsonPost('/api/enquiries',{name:data.get('name'),email:data.get('email'),phone:data.get('phone'),subject:data.get('subject'),message:data.get('message'),company:data.get('company')});
      if(status){status.className='booking-status success';const reference=result.id?String(result.id).slice(0,8).toUpperCase():'';status.textContent=reference?`Your enquiry was submitted successfully. Reference: ${reference}. Empower will contact you as soon as possible.`:'Your enquiry was submitted successfully. Empower will contact you as soon as possible.';}
      enquiry.reset();
    }
    catch(err){if(status){status.className='booking-status error-state';status.textContent=err.message||'The enquiry could not be submitted. Please try again later.';}}
    finally{setFormBusy(enquiry,false);if(submit)submit.textContent='Submit Enquiry →';}
  });
}

const year=$('#year'); if(year) year.textContent=new Date().getFullYear();
