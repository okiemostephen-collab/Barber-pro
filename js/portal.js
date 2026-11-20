/* BarberPro customer session + shared, short-lived profile cache */
(() => {
 const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH");
 const ADMIN="00969825-e0d5-4a9b-9b83-81ec1bce6063";
 const CACHE_MS=90000;
 window.barberProSupabase=db;
 window.logoutCustomer=async()=>{try{sessionStorage.removeItem("barberpro-profile-v1");}catch(_){}await db.auth.signOut();location.replace("index.html");};
 window.getBarberProCustomerProfile=async(force=false)=>{
  const user=window.barberProCustomer;if(!user)return null;
  const key="barberpro-profile-v1";
  if(!force){try{const cached=JSON.parse(sessionStorage.getItem(key)||"null");if(cached&&cached.uid===user.id&&Date.now()-cached.at<CACHE_MS)return cached.profile;}catch(_){}}
  const {data,error}=await db.from("customers").select("id,full_name,phone").eq("auth_user_id",user.id).maybeSingle();
  if(error)throw error;
  if(data){try{sessionStorage.setItem(key,JSON.stringify({uid:user.id,at:Date.now(),profile:data}));}catch(_){}}
  return data;
 };
 db.auth.getSession().then(({data,error})=>{
  if(error||!data.session){const requested=location.pathname.split("/").slice(2).join("/")+location.search;location.replace("index.html?returnTo="+encodeURIComponent(requested));return;}
  const user=data.session.user;
  if(user.id===ADMIN){location.replace("admin/admin-dashboard.html");return;}
  window.barberProCustomer=user;
  const customerPromise=window.getBarberProCustomerProfile().catch(error=>({__error:error}));
  document.dispatchEvent(new CustomEvent("barberpro:ready",{detail:{user,customerPromise}}));
 });
})();