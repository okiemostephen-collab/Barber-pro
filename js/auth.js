/* BarberPro authentication */
(() => {
 const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH");
 const ADMIN="00969825-e0d5-4a9b-9b83-81ec1bce6063";
 const $=id=>document.getElementById(id);
 const show=(id,msg,ok)=>{const e=$(id);if(e){e.textContent=msg;e.style.color=ok?"#287a4c":"#b94343";}};
 $("loginForm")?.addEventListener("submit",async e=>{e.preventDefault();const b=$("loginButton");b.disabled=true;show("loginMessage","Signing in…",true);try{const {data,error}=await db.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});if(error)throw error;location.replace(data.user.id===ADMIN?"admin/admin-dashboard.html":"dashboard.html");}catch(x){show("loginMessage",x.message,false);}finally{b.disabled=false;}});
 $("signupForm")?.addEventListener("submit",async e=>{e.preventDefault();const b=$("signupButton");b.disabled=true;show("signupMessage","Creating account…",true);try{const {data,error}=await db.auth.signUp({email:$("signupEmail").value.trim(),password:$("signupPassword").value,options:{data:{full_name:$("signupName").value.trim(),phone:$("signupPhone").value.trim()}}});if(error)throw error;if(data.session)location.replace("dashboard.html");else show("signupMessage","Account created. Check your email to confirm it, then sign in.",true);}catch(x){show("signupMessage",x.message,false);}finally{b.disabled=false;}});
 db.auth.getSession().then(({data})=>{if(data.session)location.replace(data.session.user.id===ADMIN?"admin/admin-dashboard.html":"dashboard.html");});
})();