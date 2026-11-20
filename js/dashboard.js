/* BarberPro customer dashboard — waits for the persistent portal promise */
(()=>{
 const $=id=>document.getElementById(id);
 const logoutButton=$("logoutButton"),message=$("dashboardMessage");
 const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 if(logoutButton)logoutButton.addEventListener("click",async()=>{
  if(logoutButton.dataset.loggingOut==="true")return;
  logoutButton.dataset.loggingOut="true";logoutButton.disabled=true;logoutButton.textContent="Logging out…";
  if(message)message.textContent="Signing you out securely…";
  try{
   if(typeof window.logoutCustomer==="function"){await window.logoutCustomer();return;}
   const client=window.barberProSupabase;if(!client?.auth)throw new Error("Your account connection is not ready. Refresh and try again.");
   const {error}=await client.auth.signOut();if(error)throw error;
   location.replace("index.html");
  }catch(error){logoutButton.dataset.loggingOut="false";logoutButton.disabled=false;logoutButton.textContent="Log Out";if(message)message.textContent="Logout failed: "+(error?.message||"Please try again.");console.error("BarberPro logout failed:",error);}
 });
 const statusInfo=value=>{
  const status=String(value||"pending").toLowerCase();
  const labels={pending:"Awaiting barber confirmation",confirmed:"Confirmed by barber",completed:"Completed",cancelled:"Cancelled"};
  return {label:labels[status]||status.replace(/_/g," "),className:["pending","confirmed","completed","cancelled"].includes(status)?status:"pending"};
 };
 let customerId=null,db=null,loading=false;
 const panel=$("customerBookingStatus");
 const loadAppointmentStatus=async()=>{
  if(!panel||!customerId||!db||loading)return;
  loading=true;
  try{
   const {data,error}=await db.from("appointments")
    .select("service_name,appointment_date,appointment_time,status,created_at")
    .eq("customer_id",customerId)
    .order("created_at",{ascending:false})
    .limit(1)
    .maybeSingle();
   if(error)throw error;
   if(!data){
    panel.innerHTML="<h2>Booking status</h2><p>You have no bookings yet. Choose a haircut to make your first appointment.</p><a class='gold-button' href='gallery.html'>Explore Haircuts</a>";
    return;
   }
   const st=statusInfo(data.status);
   const note=st.className==="confirmed"?"Your barber has confirmed this appointment.":st.className==="pending"?"Your booking has been received. It is waiting for the barber to confirm.":st.className==="cancelled"?"This booking has been cancelled. Please contact the barber if you need help.":st.className==="completed"?"Your appointment has been marked completed.":"Your appointment status has been updated.";
   panel.innerHTML="<div class='booking-status-heading'><div><p class='eyebrow'>LATEST BOOKING</p><h2>"+esc(data.service_name||"Your appointment")+"</h2></div><span class='appointment-status status-"+st.className+"'>"+esc(st.label)+"</span></div><p><strong>Date:</strong> "+esc(data.appointment_date||"")+" &nbsp; <strong>Time:</strong> "+esc(data.appointment_time||"")+"</p><p class='booking-status-note'>"+note+"</p><a href='appointments.html'>View all appointments →</a>";
  }catch(error){
   console.error("Could not load customer booking status:",error);
   panel.innerHTML="<h2>Booking status</h2><p>We couldn't load your latest booking status. Please refresh the page or open My Appointments.</p>";
  }finally{loading=false;}
 };
 const start=async()=>{
  try{
   const ready=await window.barberProReady;
   if(!ready||ready.error)throw ready?.error||new Error("Your account connection is not ready.");
   db=ready.db||window.barberProSupabase;
   if(!db)throw new Error("The BarberPro connection is unavailable.");
   const profile=await ready.customerPromise;
   if(!profile||profile.__error||!profile.id)throw profile?.__error||new Error("Your customer profile could not be verified.");
   customerId=profile.id;
   const user=ready.user||window.barberProCustomer;
   const name=profile.full_name||user?.email||"Customer";
   if($("customerName"))$("customerName").textContent=name;
   if(message)message.textContent="Welcome back, "+name+".";
   await loadAppointmentStatus();
  }catch(error){
   console.error("BarberPro dashboard could not initialise:",error);
   if(message)message.textContent=error.message||"Your account information is temporarily unavailable.";
   if(panel)panel.innerHTML="<h2>Booking status</h2><p>We couldn't connect to your booking information. Please refresh the page.</p>";
  }
 };
 if(panel)panel.innerHTML="<h2>Booking status</h2><p>Checking your latest appointment…</p>";
 start();
 window.addEventListener("focus",loadAppointmentStatus);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadAppointmentStatus();});
 setInterval(()=>{if(!document.hidden)loadAppointmentStatus();},45000);
})();
