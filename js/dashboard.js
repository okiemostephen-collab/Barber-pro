/* BarberPro customer dashboard */
(()=>{
 const logoutButton=document.getElementById("logoutButton"),message=document.getElementById("dashboardMessage");
 if(logoutButton)logoutButton.addEventListener("click",async()=>{
  if(logoutButton.dataset.loggingOut==="true")return;
  logoutButton.dataset.loggingOut="true";logoutButton.disabled=true;logoutButton.textContent="Logging out…";
  if(message)message.textContent="Signing you out securely…";
  try{
   if(typeof window.logoutCustomer==="function"){await window.logoutCustomer();return;}
   const db=window.barberProSupabase;if(!db?.auth)throw new Error("Your account connection is not ready. Refresh and try again.");
   const {error}=await db.auth.signOut();if(error)throw error;
   try{localStorage.clear();}catch(_){}location.replace("index.html");
  }catch(error){logoutButton.dataset.loggingOut="false";logoutButton.disabled=false;logoutButton.textContent="Log Out";if(message)message.textContent="Logout failed: "+(error?.message||"Please try again.");console.error("BarberPro logout failed:",error);}
 });
 const statusInfo=value=>{
  const status=String(value||"pending").toLowerCase();
  const labels={pending:"Awaiting barber confirmation",confirmed:"Confirmed by barber",completed:"Completed",cancelled:"Cancelled"};
  return {label:labels[status]||status.replace(/_/g," "),className:({pending:"pending",confirmed:"confirmed",completed:"completed",cancelled:"cancelled"})[status]||"pending"};
 };
 let customerId=null,db=null,loading=false;
 const loadAppointmentStatus=async()=>{
  const panel=document.getElementById("customerBookingStatus");if(!panel||!customerId||!db||loading)return;loading=true;
  try{
   const {data,error}=await db.from("appointments").select("service_name,appointment_date,appointment_time,status").eq("customer_id",customerId).order("created_at",{ascending:false}).limit(1).maybeSingle();
   if(error)throw error;
   if(!data){panel.innerHTML="<h2>Booking status</h2><p>You have no bookings yet. Choose a haircut to make your first appointment.</p><a class='gold-button' href='gallery.html'>Explore Haircuts</a>";return;}
   const st=statusInfo(data.status);
   panel.innerHTML="<div class='booking-status-heading'><div><p class='eyebrow'>LATEST BOOKING</p><h2>"+String(data.service_name||"Your appointment").replace(/[&<>"']/g,"")+"</h2></div><span class='appointment-status status-"+st.className+"'>"+st.label+"</span></div><p><strong>Date:</strong> "+String(data.appointment_date||"").replace(/[&<>"']/g,"")+" &nbsp; <strong>Time:</strong> "+String(data.appointment_time||"").replace(/[&<>"']/g,"")+"</p><p class='booking-status-note'>"+(st.className==="confirmed"?"Your barber has confirmed this appointment.":st.className==="pending"?"Your booking has been received. It is waiting for the barber to confirm.":st.className==="cancelled"?"This booking has been cancelled. Please contact the barber if you need help.":"Your appointment has been marked completed.")+"</p><a href='appointments.html'>View all appointments →</a>";
  }catch(error){console.error("Could not load customer booking status:",error);panel.innerHTML="<h2>Booking status</h2><p>We couldn't load your latest booking status. Please refresh the page or open My Appointments.</p>";}
  finally{loading=false;}
 };
 const showUser=async event=>{
  const user=event.detail.user,target=document.getElementById("customerName");
  if(target)target.textContent=user.user_metadata?.full_name||user.email||"Customer";
  try{
   const profile=await event.detail.customerPromise;
   if(profile?.__error)throw profile.__error;
   const name=profile?.full_name||user.email||"Customer";customerId=profile?.id||null;db=window.barberProSupabase;
   if(target)target.textContent=name;if(message)message.textContent="Welcome back, "+name+".";
   await loadAppointmentStatus();
  }catch(_){if(message)message.textContent="Your account is active. Some profile details are temporarily unavailable.";}
 };
 document.addEventListener("barberpro:ready",showUser);
 if(window.barberProCustomer){const user=window.barberProCustomer,target=document.getElementById("customerName");if(target)target.textContent=user.user_metadata?.full_name||user.email||"Customer";}
 window.addEventListener("focus",loadAppointmentStatus);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadAppointmentStatus();});
})();