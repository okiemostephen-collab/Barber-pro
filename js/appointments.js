/* BarberPro appointments: customer-visible booking status */
(()=>{
 const esc=value=>{const map={"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;"};map[String.fromCharCode(34)]="&quot;";return String(value??"").replace(/[&<>"']/g,c=>map[c]);};
 const body=()=>document.getElementById("appointmentRows");
 const statusInfo=value=>{
  const status=String(value||"pending").toLowerCase();
  const labels={pending:"Awaiting barber confirmation",confirmed:"Confirmed by barber",completed:"Completed",cancelled:"Cancelled"};
  const classes={pending:"pending",confirmed:"confirmed",completed:"completed",cancelled:"cancelled"};
  return {label:labels[status]||status.replace(/_/g," "),className:classes[status]||"pending"};
 };
 const render=(rows,emptyMessage="No appointments yet.")=>{
  const target=body();if(!target)return;
  target.innerHTML=(rows||[]).map(x=>{
   const final=Number(x.final_price??x.price??0),discount=Number(x.discount_amount||0),original=final+discount,st=statusInfo(x.status);
   return "<tr><td>"+esc(x.service_name)+"</td><td>"+esc(x.appointment_date)+"</td><td>"+esc(x.appointment_time)+"</td><td>₦"+original.toLocaleString("en-NG")+"</td><td>"+Number(x.discount_percent||0)+"% (₦"+discount.toLocaleString("en-NG")+")</td><td>₦"+final.toLocaleString("en-NG")+"</td><td><span class='appointment-status status-"+st.className+"'>"+esc(st.label)+"</span></td></tr>";
  }).join("")||"<tr><td colspan='7'>"+esc(emptyMessage)+"</td></tr>";
 };
 let portalReady=false,customerId=null,db=null,loading=false;
 const load=async()=>{
  if(!customerId||!db||loading)return;loading=true;
  try{
   const {data,error}=await db.from("appointments").select("service_name,appointment_date,appointment_time,price,discount_percent,discount_amount,final_price,status").eq("customer_id",customerId).order("appointment_date",{ascending:false}).order("appointment_time",{ascending:false});
   if(error)throw error;
   render(data||[],"No appointments are linked to this account yet.");
   try{localStorage.setItem("barberpro-appointments-v2",JSON.stringify({uid:window.barberProCustomer?.id,at:Date.now(),data:data||[]}));}catch(_){}
  }catch(error){console.error("BarberPro appointments load failed:",error);render([],error?.message||"Could not load appointments. Please refresh.");}
  finally{loading=false;}
 };
 document.addEventListener("barberpro:ready",async event=>{
  portalReady=true;db=window.barberProSupabase;
  try{
   const customer=await event.detail.customerPromise;
   if(customer?.__error||!customer?.id){render([],customer?.__error?.message||"Your customer profile could not be loaded.");return;}
   customerId=customer.id;await load();
  }catch(error){render([],error?.message||"Could not load your customer profile.");}
 });
 window.addEventListener("focus",()=>{if(portalReady)load();});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&portalReady)load();});
 setTimeout(()=>{if(!portalReady&&body()?.textContent.includes("Loading appointments")){render([],"Your account connection did not start. Please sign out, sign in again, then refresh.");console.error("BarberPro diagnostic: portal-ready event not received.");}},18000);
})();