/* BarberPro customer dashboard */
(() => {
 document.addEventListener("barberpro:ready",async event=>{
 const db=window.barberProSupabase,user=event.detail.user;
 const {data:profile,error}=await db.from("customers").select("full_name,phone").eq("auth_user_id",user.id).maybeSingle();
 const name=profile?.full_name||user.email;
 const target=document.getElementById("customerName");if(target)target.textContent=name;
 const msg=document.getElementById("dashboardMessage");if(msg)msg.textContent=error?"Your account is active. Profile details could not be loaded.":"Welcome back, "+name+".";
 document.getElementById("logoutButton")?.addEventListener("click",()=>window.logoutCustomer());
 });
})();