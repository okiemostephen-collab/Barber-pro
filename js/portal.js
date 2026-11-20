/* BarberPro customer-page session protection */
(() => {
 const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH");
 const ADMIN="00969825-e0d5-4a9b-9b83-81ec1bce6063";
 window.barberProSupabase=db;
 window.logoutCustomer=async()=>{await db.auth.signOut();location.replace("index.html");};
 db.auth.getSession().then(({data,error})=>{if(error||!data.session){const requested=location.pathname.replace(/^\\/Barber-pro\\//,"")+location.search;location.replace("index.html?returnTo="+encodeURIComponent(requested));return;}if(data.session.user.id===ADMIN){location.replace("admin/admin-dashboard.html");return;}window.barberProCustomer=data.session.user;document.dispatchEvent(new CustomEvent("barberpro:ready",{detail:{user:data.session.user}}));});
})();