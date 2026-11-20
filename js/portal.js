/* BarberPro customer portal: load the verified Supabase profile before exposing it to pages */
(()=>{
 const $=id=>document.getElementById(id);
 const showStartupError=message=>{
  const title=$("profileName");if(title)title.textContent="Unable to load your account";
  const detail=$("profileNameDetail");if(detail)detail.textContent="Please refresh or sign in again.";
  const profileMessage=$("profileMessage");if(profileMessage)profileMessage.textContent=message;
  const rows=$("appointmentRows");if(rows)rows.innerHTML="<tr><td colspan='7'>"+String(message).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))+"</td></tr>";
 };
 const withTimeout=(promise,ms,label)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+" timed out. Check your internet connection and refresh.")),ms))]);
 try{
  if(!window.supabase?.createClient)throw new Error("The Supabase library did not load. Check your internet connection, then refresh.");
  const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH");
  const ADMIN="00969825-e0d5-4a9b-9b83-81ec1bce6063";
  const PROFILE_KEY="barberpro-profile-v2",TTL=5*60*1000;
  window.barberProSupabase=db;
  const readCache=(key,uid)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v&&v.uid===uid&&Date.now()-v.at<TTL?v.data:null;}catch(_){return null;}};
  const saveCache=(key,uid,data)=>{try{localStorage.setItem(key,JSON.stringify({uid,at:Date.now(),data}));}catch(_){}};
  window.logoutCustomer=async()=>{try{localStorage.removeItem(PROFILE_KEY);localStorage.removeItem("barberpro-appointments-v2");}catch(_){}await db.auth.signOut();location.replace("index.html");};
  withTimeout(db.auth.getSession(),10000,"Checking your login session").then(async({data,error})=>{
   if(error)throw error;
   if(!data?.session){location.replace("index.html");return;}
   const user=data.session.user;
   if(user.id===ADMIN){location.replace("admin/admin-dashboard.html");return;}
   window.barberProCustomer=user;
   const cached=readCache(PROFILE_KEY,user.id);
   let resolveProfile,settled=false;
   const customerPromise=new Promise(resolve=>{resolveProfile=value=>{if(!settled){settled=true;resolve(value);}};});
   document.dispatchEvent(new CustomEvent("barberpro:ready",{detail:{user,customerPromise,profileCached:!!cached}}));
   try{
    const result=await withTimeout(db.from("customers").select("id,full_name,phone").eq("auth_user_id",user.id).maybeSingle(),8000,"Loading your profile");
    if(result.error)throw result.error;
    if(!result.data)throw new Error("Your customer profile is not linked to this login. Please contact BarberPro support.");
    saveCache(PROFILE_KEY,user.id,result.data);
    resolveProfile(result.data);
    document.dispatchEvent(new CustomEvent("barberpro:profile-updated",{detail:{profile:result.data}}));
   }catch(profileError){
    if(cached)resolveProfile(cached);
    else resolveProfile({__error:profileError});
    document.dispatchEvent(new CustomEvent("barberpro:profile-error",{detail:{error:profileError}}));
   }
  }).catch(error=>{
   console.error("BarberPro portal initialization failed:",error);
   showStartupError(error?.message||"BarberPro could not initialize. Please refresh.");
  });
 }catch(error){
  console.error("BarberPro portal setup failed:",error);
  showStartupError(error?.message||"BarberPro could not initialize. Please refresh.");
 }
})();