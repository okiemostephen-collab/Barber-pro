/* Appointments: show loading, empty, and error states distinctly */
(()=>{
 const esc=value=>{const map={"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;"};map[String.fromCharCode(34)]="&quot;";return String(value??"").replace(/[&<>"']/g,c=>map[c]);};
 const render=(rows,emptyMessage="No appointments yet.")=>{
  const body=document.getElementById("appointmentRows");if(!body)return;
  body.innerHTML=(rows||[]).map(x=>{
   const final=Number(x.final_price??x.price??0),discount=Number(x.discount_amount||0),original=final+discount;
   return "<tr><td>"+esc(x.service_name)+"</td><td>"+esc(x.appointment_date)+"</td><td>"+esc(x.appointment_time)+"</td><td>₦"+original.toLocaleString("en-NG")+"</td><td>"+Number(x.discount_percent||0)+"% (₦"+discount.toLocaleString("en-NG")+")</td><td>₦"+final.toLocaleString("en-NG")+"</td><td>"+esc(x.status)+"</td></tr>";
  }).join("")||"<tr><td colspan='7'>"+esc(emptyMessage)+"</td></tr>";
 };
 document.addEventListener("barberpro:ready",async event=>{
  const user=event.detail.user,db=window.barberProSupabase,key="barberpro-appointments-v2";
  let cached=null;try{const v=JSON.parse(localStorage.getItem(key)||"null");if(v&&v.uid===user.id&&Date.now()-v.at<300000)cached=v.data;}catch(_){}
  if(cached)render(cached);
  try{
   const customer=await event.detail.customerPromise;
   if(customer?.__error||!customer?.id){if(!cached)render([],customer?.__error?.message||"Your customer profile could not be loaded.");return;}
   const {data,error}=await db.from("appointments").select("service_name,appointment_date,appointment_time,price,discount_percent,discount_amount,final_price,status").eq("customer_id",customer.id).order("appointment_date",{ascending:false}).order("appointment_time",{ascending:false});
   if(error)throw error;
   render(data||[]);
   try{localStorage.setItem(key,JSON.stringify({uid:user.id,at:Date.now(),data:data||[]}));}catch(_){}
  }catch(error){
   console.error("BarberPro appointments load failed:",error);
   if(!cached)render([],error?.message||"Could not load appointments. Please refresh.");
  }
 });
})();
