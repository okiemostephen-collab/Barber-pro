/* BarberPro booking submission through the existing verified Edge Function */
(() => {
 const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH");
 const ENDPOINT="https://plokfuphzuyqtlbkjchp.supabase.co/functions/v1/barberpro-booking";
 const prices={"Low Fade":3000,"Mid Fade":3500,"Burst Fade":4000,"Afro Shape-up":2500,"Waves & Line-up":3000,"Haircut + Beard":5000};
 const form=document.getElementById("bookingForm");if(!form)return;
 const date=document.getElementById("appointmentDate"),msg=document.getElementById("bookingMessage"),btn=document.getElementById("bookingButton");
 const now=new Date();date.min=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
 form.addEventListener("submit",async e=>{e.preventDefault();btn.disabled=true;msg.textContent="Submitting booking…";try{
 const {data:{user},error:userError}=await db.auth.getUser();if(userError||!user)throw new Error("Please sign in again.");
 const {data:p,error:pe}=await db.from("customers").select("full_name,phone").eq("auth_user_id",user.id).single();if(pe)throw pe;
 const service=document.getElementById("serviceSelect").value;if(!prices[service])throw new Error("Please select a valid service.");
 if(date.value<date.min)throw new Error("Choose today or a future date.");
 const payload={name:p.full_name,phone:p.phone,service_name:service,date:date.value,time:document.getElementById("appointmentTime").value,price:prices[service]};
 const response=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const result=await response.json().catch(()=>({}));if(!response.ok||!result.success)throw new Error(result.error||result.message||"Booking failed.");
 msg.textContent="Booking submitted successfully. BarberPro has received your appointment.";form.reset();
 }catch(x){msg.textContent=x.message||"Unable to submit booking.";}finally{btn.disabled=false;}});
})();