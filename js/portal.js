/* BarberPro customer portal — persistent readiness promise prevents missed events */
(()=>{
 const $=id=>document.getElementById(id);
 const timeout=(promise,ms,label)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+" timed out. Check your connection and refresh.")),ms))]);
 let resolveReady;window.barberProReady=new Promise(resolve=>{resolveReady=resolve;});
 try{
  if(!window.supabase?.createClient)throw new Error("Supabase could not load. Check your connection and refresh.");
  const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH");
  const ADMIN="00969825-e0d5-4a9b-9b83-81ec1bce6063",KEY="barberpro-profile-v2",TTL=300000;window.barberProSupabase=db;
  const cachedFor=uid=>{try{const v=JSON.parse(localStorage.getItem(KEY)||"null");return v&&v.uid===uid&&Date.now()-v.at<TTL?v.data:null;}catch(_){return null;}};
  window.logoutCustomer=async()=>{try{localStorage.removeItem(KEY);localStorage.removeItem("barberpro-appointments-v2");}catch(_){}const {error}=await db.auth.signOut();if(error)throw error;location.replace("index.html");};
  (async()=>{
   try{
    const {data,error}=await timeout(db.auth.getSession(),10000,"Checking your login");if(error){\n    const message=String(error.message||"").toLowerCase();\n    if(message.includes("refresh token")||message.includes("invalid jwt")||message.includes("session")){try{await db.auth.signOut({scope:"local"});}catch(_){}location.replace("index.html?session=expired");return;}\n    throw error;\n   }
    if(!data?.session){resolveReady({error:new Error("Your session has expired. Please sign in.")});const back=encodeURIComponent(location.pathname.split("/").pop()+location.search);location.replace("index.html?returnTo="+back);return;}
    const user=data.session.user;if(user.id===ADMIN){resolveReady({error:new Error("Administrator account detected.")});location.replace("admin/admin-dashboard.html");return;}
    window.barberProCustomer=user;const cached=cachedFor(user.id);let resolveProfile;
    const customerPromise=new Promise(resolve=>{resolveProfile=resolve;});
    const ready={user,db,customerPromise,profileCached:!!cached};
    resolveReady(ready);document.dispatchEvent(new CustomEvent("barberpro:ready",{detail:ready}));
    try{
     const result=await timeout(db.from("customers").select("id,full_name,phone").eq("auth_user_id",user.id).maybeSingle(),10000,"Loading your customer profile");
     if(result.error)throw result.error;if(!result.data)throw new Error("Your customer profile is not linked to this login.");
     try{localStorage.setItem(KEY,JSON.stringify({uid:user.id,at:Date.now(),data:result.data}));}catch(_){}
     resolveProfile(result.data);document.dispatchEvent(new CustomEvent("barberpro:profile-updated",{detail:{profile:result.data}}));
    }catch(err){resolveProfile(cached||{__error:err});document.dispatchEvent(new CustomEvent("barberpro:profile-error",{detail:{error:err}}));}
   }catch(err){console.error("BarberPro portal failed:",err);resolveReady({error:err});const msg=$("profileMessage")||$("dashboardMessage")||$("communityMessage");if(msg)msg.textContent=err.message||"Account connection failed.";}
  })();
 }catch(err){console.error("Portal setup failed:",err);resolveReady({error:err});}
})();