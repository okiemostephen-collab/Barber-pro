/* BarberPro simple, lightweight page guide */
(()=> {
 const key="barberpro-guide-seen-v1";
 const path=location.pathname.split("/").pop()||"index.html";
 const isAdmin=path.startsWith("admin/");
 const stepsByPage={
  "index.html":[["Explore Haircuts","Tap here to browse haircut styles and start a booking.","a[href='gallery.html']"],["Create an account or log in","Use this form to access your personal dashboard.","#loginForm"]],
  "dashboard.html":[["Your dashboard","These cards take you to the main parts of BarberPro.",".dashboard-grid"],["Book a haircut","Choose a style and follow the booking steps.","a[href='gallery.html']"],["Your appointments","Check your bookings and their status.","a[href='appointments.html']"],["Community","Share ideas, comment and review BarberPro.","a[href='community.html']"]],
  "appointments.html":[["Your appointments","Your bookings appear in this table. Scroll sideways if you are on a small screen.","#appointmentRows"],["Back to dashboard","Use the Dashboard link to return to your main page.","a[href='dashboard.html']"]],
  "profile.html":[["Your profile","Your account information is shown here.","#profileName"],["Update your details","Edit your name or phone number and save your changes.","#profileForm"]],
  "community.html":[["Community discussions","Read what other BarberPro members are sharing.","#communityFeed"],["Write a post","Share a question, useful tip or idea here.","#postForm"],["Comments and reviews","Comment on posts or leave your rating for BarberPro.","#reviewForm"]],
  "gallery.html":[["Explore haircut styles","Browse the available styles. Choose a style to continue.",".service-grid, .gallery-grid, .haircut-grid"],["Continue to booking","Use the booking button on a style or the booking link in the menu.","a[href='booking.html'], a[href*='booking']"]],
  "booking.html":[["Book your haircut","Choose your service and enter your appointment details.","form"]],
  "haircare.html":[["Haircare guide","Scroll through the tips to learn how to care for your hair.","main"]],
  "hairline.html":[["Hairline care","Read the guide and follow the practical care tips.","main"]],
  "loyalty.html":[["Loyalty Club","Check your progress and available rewards here.","main"]],
  "products.html":[["Grooming products","Browse the product information and care suggestions.","main"]]
 };
 if(isAdmin)return;
 const steps=stepsByPage[path]||[["Explore this page","Use the menu links to move between BarberPro pages.","header nav, .main-nav"]];
 const style=document.createElement("link");style.rel="stylesheet";style.href=(path.includes("/")?"../":"")+"css/guide.css?v=20261120a";document.head.appendChild(style);
 const root=document.createElement("section");root.className="bp-guide";root.setAttribute("aria-live","polite");root.innerHTML='<button type="button" class="bp-guide-launch" aria-label="Show the BarberPro website guide"> <span aria-hidden="true">☝</span> Need help?</button><div class="bp-guide-card" hidden><div class="bp-guide-top"><span class="bp-guide-kicker">BARBERPRO QUICK GUIDE</span><button type="button" class="bp-guide-close" aria-label="Close guide">×</button></div><h2 class="bp-guide-title"></h2><p class="bp-guide-copy"></p><div class="bp-guide-actions"><span class="bp-guide-count"></span><button type="button" class="bp-guide-next">Next</button></div></div><span class="bp-guide-pointer" aria-hidden="true">👆</span>';
 document.body.appendChild(root);
 const launch=root.querySelector(".bp-guide-launch"),card=root.querySelector(".bp-guide-card"),title=root.querySelector(".bp-guide-title"),copy=root.querySelector(".bp-guide-copy"),count=root.querySelector(".bp-guide-count"),next=root.querySelector(".bp-guide-next"),close=root.querySelector(".bp-guide-close"),pointer=root.querySelector(".bp-guide-pointer");
 let index=0,active=null;
 const clear=()=>{if(active){active.classList.remove("bp-guide-highlight");active=null;}pointer.hidden=true;};
 const finish=()=>{clear();card.hidden=true;launch.hidden=false;try{localStorage.setItem(key,"1");}catch(_){}};
 const show=()=>{
  const step=steps[index];if(!step){finish();return;}
  clear();title.textContent=step[0];copy.textContent=step[1];count.textContent=(index+1)+" of "+steps.length;next.textContent=index===steps.length-1?"Finish":"Next";
  const candidates=step[2].split(",").map(s=>s.trim());active=candidates.map(s=>document.querySelector(s)).find(Boolean)||null;
  if(active){active.classList.add("bp-guide-highlight");active.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});pointer.hidden=false;}
  else pointer.hidden=true;
  card.hidden=false;launch.hidden=true;
 };
 launch.addEventListener("click",()=>{index=0;show();});
 next.addEventListener("click",()=>{index++;if(index>=steps.length)finish();else show();});
 close.addEventListener("click",finish);
 try{if(!localStorage.getItem(key))setTimeout(()=>{if(!document.hidden)show();},1200);}catch(_){}
})();
