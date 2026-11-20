/* BarberPro portal: cached-first customer data with background refresh */
(()=>{
 const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH");
 const ADMIN="00969825-e0d5-4a9b-9b83-81ec1bce6063";
 const PROFILE_KEY="barberpro-profile-v2";
 const TTL=5*60*1000;
 window.barberProSupabase=db;
 const readCache=(key,uid)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v&&v.uid===uid&&Date.now()-v.at<TTL?v.data:null;}catch(_){return null;}};
 const saveCache=(key,uid,data)=>{try{localStorage.setItem(key,JSON.stringify({uid,at:Date.now(),data}));}catch(_){}};
 window.logoutCustomer=async()=>{try{localStorage.removeItem(PROFILE_KEY);localStorage.removeItem("barberpro-appointments-v2");}catch(_){}await db.auth.signOut();location.replace("index.html");};
 db.auth.getSession().then(async({data,error})=>{
  if(error||!data.session){location.replace("index.html");return;}
  const user=data.session.user;
  if(user.id===ADMIN){location.replace("admin/admin-dashboard.html");return;}
  window.barberProCustomer=user;
  const cached=readCache(PROFILE_KEY,user.id);
  let resolveProfile;
  const customerPromise=new Promise(resolve=>{resolveProfile=resolve;});
  if(cached)resolveProfile(cached);
  document.dispatchEvent(new CustomEvent("barberpro:ready",{detail:{user,customerPromise,profileCached:!!cached}}));
  const refresh=db.from("customers").select("id,full_name,phone").eq("auth_user_id",user.id).maybeSingle();
  refresh.then(({data:profile,error:profileError})=>{
   if(!profileError&&profile){saveCache(PROFILE_KEY,user.id,profile);resolveProfile(profile);document.dispatchEvent(new CustomEvent("barberpro:profile-updated",{detail:{profile}}));}
   else if(!cached)resolveProfile({__error:profileError||new Error("Profile unavailable")});
  }).catch(err=>{if(!cached)resolveProfile({__error:err});});
 });
})();