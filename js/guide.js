/* BarberPro guided customer journey — manual, stable and page-aware */
(()=>{
 const path=()=>location.pathname.split("/").pop()||"index.html";
 if(path()==="admin-dashboard.html")return;
 const progressKey="barberpro-tour-progress-v2",seenKey="barberpro-tour-seen-v2";
 const steps=[
  {page:"dashboard.html",title:"Welcome to your BarberPro dashboard",copy:"This is your home base. Check your latest booking, then explore the services available to you.",target:"#customerBookingStatus"},
  {page:"dashboard.html",title:"Everything you need, in one place",copy:"These cards connect you to haircuts, appointments, your profile, rewards, grooming guides and the community.",target:".dashboard-grid"},
  {page:"gallery.html",title:"Find a look that feels right",copy:"Browse the haircut collection. Each style helps you discover what you would like to book.",target:".gallery-grid, .service-grid, .haircut-grid"},
  {page:"booking.html",title:"Make your appointment",copy:"Choose your haircut, select a date and time, review the price and submit your booking here.",target:"#bookingForm"},
  {page:"appointments.html",title:"Keep track of every booking",copy:"Your appointment history shows the service, date, time, price and the latest status from your barber.",target:"#appointmentRows"},
  {page:"profile.html",title:"Keep your profile up to date",copy:"Check your account details and update the information you want BarberPro to use.",target:"#profileForm, #profileName"},
  {page:"community.html",title:"Join the BarberPro community",copy:"Share useful ideas, ask questions, join discussions and see what other customers are saying.",target:"#communityFeed, #postForm"},
  {page:"community.html",title:"Share feedback and reviews",copy:"Use the review area to rate your experience and leave helpful feedback.",target:"#reviewForm"},
  {page:"haircare.html",title:"Learn how to care for your hair",copy:"Explore practical haircare guidance to help you maintain your chosen style.",target:"main"},
  {page:"hairline.html",title:"Give your hairline thoughtful care",copy:"Read the hairline guidance and choose comfortable grooming habits.",target:"main"},
  {page:"products.html",title:"Explore grooming essentials",copy:"Learn what different grooming products are for and how to choose them thoughtfully.",target:".product-grid"},
  {page:"loyalty.html",title:"Make your visits count",copy:"Check your completed visits and understand how the BarberPro reward cycle works.",target:".loyalty-panel"}
 ];
 const style=document.createElement("link");style.rel="stylesheet";style.href="css/guide.css?v=20261121c";document.head.appendChild(style);
 const root=document.createElement("section");root.className="bp-guide";root.setAttribute("aria-live","polite");
 root.innerHTML='<button type="button" class="bp-guide-launch" aria-label="Open the full BarberPro guide">Need help?</button><div class="bp-guide-card" hidden><div class="bp-guide-top"><span class="bp-guide-kicker">BARBERPRO WALKTHROUGH</span><button type="button" class="bp-guide-close" aria-label="Pause guide">×</button></div><div class="bp-guide-progress"><span class="bp-guide-progress-fill"></span></div><p class="bp-guide-reading"></p><h2 class="bp-guide-title"></h2><p class="bp-guide-copy"></p><div class="bp-guide-actions"><span class="bp-guide-count"></span><button type="button" class="bp-guide-next">Next</button></div></div><span class="bp-guide-pointer" aria-hidden="true" hidden>⌄</span>';
 document.body.appendChild(root);
 const nav=document.createElement("nav");nav.className="bp-quick-nav";nav.setAttribute("aria-label","BarberPro page shortcuts");
 nav.innerHTML='<a href="dashboard.html">Dashboard</a><a href="gallery.html">Haircuts</a><a href="booking.html">Book</a><a href="appointments.html">Appointments</a><a href="profile.html">Profile</a><a href="community.html">Community</a><a href="haircare.html">Haircare</a><a href="hairline.html">Hairline</a><a href="products.html">Products</a><a href="loyalty.html">Rewards</a><a href="index.html">Home</a>';
 document.body.insertBefore(nav,document.body.firstChild);
 const launch=root.querySelector(".bp-guide-launch"),card=root.querySelector(".bp-guide-card"),title=root.querySelector(".bp-guide-title"),copy=root.querySelector(".bp-guide-copy"),count=root.querySelector(".bp-guide-count"),reading=root.querySelector(".bp-guide-reading"),fill=root.querySelector(".bp-guide-progress-fill"),next=root.querySelector(".bp-guide-next"),close=root.querySelector(".bp-guide-close"),pointer=root.querySelector(".bp-guide-pointer");
 let index=0,active=null;
 const current=path();
 const getSaved=()=>{try{const n=Number(localStorage.getItem(progressKey));return Number.isInteger(n)&&n>=0&&n<steps.length?n:null;}catch(_){return null;}};
 const save=n=>{try{localStorage.setItem(progressKey,String(n));}catch(_){}};
 const clear=()=>{if(active){active.classList.remove("bp-guide-highlight");active=null;}pointer.hidden=true;};
 const pause=()=>{clear();card.hidden=true;launch.hidden=false;};
 const finish=()=>{clear();card.hidden=true;launch.hidden=false;try{localStorage.removeItem(progressKey);localStorage.setItem(seenKey,"1");}catch(_){}};
 const show=()=>{
  const step=steps[index];if(!step){finish();return;}
  save(index);
  if(step.page!==current){location.href=step.page;return;}
  clear();title.textContent=step.title;copy.textContent=step.copy;count.textContent=(index+1)+" of "+steps.length;reading.textContent="Step "+(index+1)+" / "+steps.length+"  •  "+step.page.replace(".html","").replace(/-/g," ");fill.style.width=((index+1)/steps.length*100)+"%";next.textContent=index===steps.length-1?"Finish":"Next";
  active=step.target.split(",").map(s=>s.trim()).map(s=>document.querySelector(s)).find(Boolean)||null;
  card.hidden=false;launch.hidden=true;
  if(active){
   active.classList.add("bp-guide-highlight");
   active.scrollIntoView({behavior:"auto",block:"center"});
   const r=active.getBoundingClientRect();pointer.style.left=Math.max(12,Math.min(window.innerWidth-36,r.left+r.width/2-12))+"px";pointer.style.top=Math.max(8,r.top-30)+"px";pointer.hidden=false;
  }
 };
 launch.addEventListener("click",()=>{const saved=getSaved();if(saved!==null)index=saved;else{const found=steps.findIndex(s=>s.page===current);index=found<0?0:found;}show();});
 next.addEventListener("click",()=>{index++;if(index>=steps.length)finish();else show();});
 close.addEventListener("click",pause);
 window.addEventListener("resize",()=>{if(active&&!card.hidden){const r=active.getBoundingClientRect();pointer.style.left=Math.max(12,Math.min(window.innerWidth-36,r.left+r.width/2-12))+"px";pointer.style.top=Math.max(8,r.top-30)+"px";}});
 // Deliberately do not auto-start or auto-resume. The customer chooses when to open the guide.
 try{if(localStorage.getItem(seenKey)==="1")launch.setAttribute("aria-label","Open the BarberPro guide again");}catch(_){}
})();