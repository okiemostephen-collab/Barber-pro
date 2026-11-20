/* BarberPro customer dashboard — bind logout immediately, even if portal:ready fired early */
(() => {
 const logoutButton=document.getElementById("logoutButton");
 const message=document.getElementById("dashboardMessage");
 if(logoutButton){
  logoutButton.addEventListener("click",async()=>{
   if(logoutButton.dataset.loggingOut==="true")return;
   logoutButton.dataset.loggingOut="true";
   logoutButton.disabled=true;
   logoutButton.textContent="Logging out…";
   if(message)message.textContent="Signing you out securely…";
   try{
    if(typeof window.logoutCustomer==="function"){
     await window.logoutCustomer();
     return;
    }
    const db=window.barberProSupabase;
    if(!db?.auth)throw new Error("Your account connection is not ready. Refresh the page and try again.");
    const {error}=await db.auth.signOut();
    if(error)throw error;
    try{localStorage.clear();}catch(_){}
    location.replace("index.html");
   }catch(error){
    logoutButton.dataset.loggingOut="false";
    logoutButton.disabled=false;
    logoutButton.textContent="Log Out";
    if(message)message.textContent="Logout failed: "+(error?.message||"Please try again.");
    console.error("BarberPro logout failed:",error);
   }
  });
 }
 const showUser=async event=>{
  const user=event.detail.user;
  const target=document.getElementById("customerName");
  if(target)target.textContent=user.user_metadata?.full_name||user.email||"Customer";
  try{
   const profile=await event.detail.customerPromise;
   if(profile?.__error)throw profile.__error;
   const name=profile?.full_name||user.email||"Customer";
   if(target)target.textContent=name;
   if(message)message.textContent="Welcome back, "+name+".";
  }catch(_){if(message)message.textContent="Your account is active. Some profile details are temporarily unavailable.";}
 };
 document.addEventListener("barberpro:ready",showUser);
 // Handle the case where portal initialization completed before this script registered.
 if(window.barberProCustomer){
  const user=window.barberProCustomer;
  const target=document.getElementById("customerName");
  if(target)target.textContent=user.user_metadata?.full_name||user.email||"Customer";
 }
})();