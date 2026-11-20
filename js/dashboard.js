/* BarberPro customer dashboard — show the account immediately, enrich when profile arrives */
(() => {
 document.addEventListener("barberpro:ready",async event=>{
  const user=event.detail.user;
  const target=document.getElementById("customerName");
  const msg=document.getElementById("dashboardMessage");
  if(target)target.textContent=user.user_metadata?.full_name||user.email||"Customer";
  document.getElementById("logoutButton")?.addEventListener("click",()=>window.logoutCustomer());
  try{
   const profile=await event.detail.customerPromise;
   if(profile?.__error)throw profile.__error;
   const name=profile?.full_name||user.email||"Customer";
   if(target)target.textContent=name;
   if(msg)msg.textContent="Welcome back, "+name+".";
  }catch(_){if(msg)msg.textContent="Your account is active. Some profile details are temporarily unavailable.";}
 });
})();