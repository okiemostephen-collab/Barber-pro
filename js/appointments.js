/* Customer appointments — reuse the shared customer profile and fetch only this customer's bookings */
document.addEventListener("barberpro:ready",async event=>{
 const body=document.getElementById("appointmentRows");
 const db=window.barberProSupabase;
 try{
  const customer=await event.detail.customerPromise;
  if(customer?.__error)throw customer.__error;
  if(!customer?.id){body.innerHTML="<tr><td colspan='7'>Your customer profile is not available yet.</td></tr>";return;}
  const {data,error}=await db.from("appointments").select("service_name,appointment_date,appointment_time,price,discount_percent,discount_amount,final_price,status").eq("customer_id",customer.id).order("appointment_date",{ascending:false}).order("appointment_time",{ascending:false});
  if(error)throw error;
  body.innerHTML=(data||[]).map(x=>{
   const final=Number(x.final_price??x.price??0),discount=Number(x.discount_amount||0),original=final+discount;
   return "<tr><td>"+safe(x.service_name)+"</td><td>"+safe(x.appointment_date)+"</td><td>"+safe(x.appointment_time)+"</td><td>₦"+original.toLocaleString("en-NG")+"</td><td>"+Number(x.discount_percent||0)+"% (₦"+discount.toLocaleString("en-NG")+")</td><td>₦"+final.toLocaleString("en-NG")+"</td><td>"+safe(x.status)+"</td></tr>";
  }).join("")||"<tr><td colspan='7'>No appointments yet.</td></tr>";
 }catch(error){body.innerHTML="<tr><td colspan='7'>Appointments are temporarily unavailable. Please refresh in a moment.</td></tr>";}
});
function safe(v){return String(v??"").replace(/[&<>\\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c]));}