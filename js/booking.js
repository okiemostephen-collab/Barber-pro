/* BarberPro booking — preselects haircut from gallery and authenticates Edge Function request */
(() => {
 const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH");
 const ENDPOINT="https://plokfuphzuyqtlbkjchp.supabase.co/functions/v1/barberpro-booking";
 const styles={
  "Low Fade":{price:3000,img:"https://images.pexels.com/photos/7447151/pexels-photo-7447151.jpeg?auto=compress&cs=tinysrgb&w=1600",desc:"Clean low fade with a sharp natural line-up."},
  "Mid Fade":{price:3500,img:"https://images.pexels.com/photos/4524960/pexels-photo-4524960.jpeg?auto=compress&cs=tinysrgb&w=1600",desc:"Balanced mid fade with defined natural texture."},
  "Burst Fade":{price:3000,img:"https://images.pexels.com/photos/4197944/pexels-photo-4197944.jpeg?auto=compress&cs=tinysrgb&w=1600",desc:"Curved burst fade with a textured top."},
  "Afro Shape-up":{price:2500,img:"https://images.pexels.com/photos/9363463/pexels-photo-9363463.jpeg?auto=compress&cs=tinysrgb&w=1600",desc:"Shaped natural afro with a crisp outline."},
  "Waves & Line-up":{price:3000,img:"https://manualdohomemmoderno.com.br/files/2021/04/360-waves.jpg",desc:"Defined waves finished with a clean edge."},
  "Haircut + Beard":{price:3500,img:"https://static.wixstatic.com/media/f933c8_58f64c71eda64ba9b8063469de4bc72b~mv2.jpeg/v1/crop/x_0%2Cy_872%2Cw_3024%2Ch_2530/fill/w_980%2Ch_820%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/IMG_5567_JPEG.jpeg",desc:"Fresh cut and neatly shaped beard."},
  "High Top Fade":{price:0,img:"https://images.pexels.com/photos/8138146/pexels-photo-8138146.jpeg?auto=compress&cs=tinysrgb&w=1600",desc:"Structured high top with faded sides."},
  "Sponge Twists":{price:0,img:"https://images.pexels.com/photos/28638400/pexels-photo-28638400.jpeg?auto=compress&cs=tinysrgb&w=1600",desc:"Defined sponge twists with a neat taper."},
  "Dreadlock Fade":{price:0,img:"https://images.pexels.com/photos/25365033/pexels-photo-25365033.jpeg?auto=compress&cs=tinysrgb&w=1600",desc:"Locs paired with a clean fade."},
  "Cornrows with Fade":{price:0,img:"https://images.pexels.com/photos/22700213/pexels-photo-22700213.jpeg?auto=compress&cs=tinysrgb&w=1600",desc:"Neat braids with a crisp side fade."},
  "Textured Crop":{price:0,img:"https://images.pexels.com/photos/27685128/pexels-photo-27685128.jpeg?auto=compress&cs=tinysrgb&w=1600",desc:"Short textured crop with a clean taper."},
  "Buzz Cut + Beard":{price:0,img:"https://images.pexels.com/photos/28638400/pexels-photo-28638400.jpeg?auto=compress&cs=tinysrgb&w=1600",desc:"Close buzz cut with a shaped beard."},
 };
 const form=document.getElementById("bookingForm");if(!form)return;
 const select=document.getElementById("serviceSelect"),date=document.getElementById("appointmentDate"),msg=document.getElementById("bookingMessage"),btn=document.getElementById("bookingButton");
 const image=document.getElementById("selectedStyleImage"),title=document.getElementById("selectedStyleName"),description=document.getElementById("selectedStyleDescription");
 const today=new Date();date.min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
 function showStyle(name){const s=styles[name];if(!s)return;title.textContent=name;description.textContent=s.price>0?s.desc+"  Price: ₦"+s.price.toLocaleString("en-NG"):s.desc+"  This style is currently inspiration-only; its service price has not been confirmed.";const xs=["0%","33.333%","66.667%","100%"],ys=["0%","50%","100%"];image.src=s.img;image.alt=name+" haircut inspiration photograph";}
 const requested=new URLSearchParams(location.search).get("service");
 async function loadLivePrices(){
  try{
   const {data,error}=await db.from("services").select("name,price,updated_at").order("updated_at",{ascending:true});
   if(error)throw error;
   (data||[]).forEach(row=>{if(styles[row.name])styles[row.name].price=Number(row.price);});
   Array.from(select.options).forEach(option=>{const style=styles[option.value];if(style&&style.price>0)option.textContent=option.value+" — ₦"+style.price.toLocaleString("en-NG");});
   if(select.value)showStyle(select.value);
  }catch(error){console.error("Could not load live service prices:",error);if(msg)msg.textContent="Prices may be out of date. Please confirm the current price with the barber.";}
 }
 if(requested&&styles[requested]){select.value=requested;showStyle(requested);}
 select.addEventListener("change",()=>showStyle(select.value));
 loadLivePrices();
 form.addEventListener("submit",async e=>{e.preventDefault();btn.disabled=true;msg.textContent="Submitting your appointment…";try{
 const {data:{session},error:sessionError}=await db.auth.getSession();if(sessionError||!session)throw new Error("Your login session has expired. Please sign in again.");
 const service=select.value;if(!styles[service])throw new Error("Please choose a haircut from the collection.");
 if(!date.value||date.value<date.min)throw new Error("Choose today or a future date.");
 const time=document.getElementById("appointmentTime").value;if(!time)throw new Error("Choose an appointment time.");
 const response=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","apikey":"sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH","Authorization":"Bearer "+session.access_token},body:JSON.stringify({service_name:service,date:date.value,time})});
 const result=await response.json().catch(()=>({}));if(!response.ok||!result.success)throw new Error(result.error||result.message||"Booking could not be submitted.");
 const priceBox=document.getElementById("bookingPriceBreakdown");if(priceBox){priceBox.textContent="Original: ₦"+Number(result.original_price||0).toLocaleString("en-NG")+" · Discount: "+Number(result.discount_percent||0)+"% (₦"+Number(result.discount_amount||0).toLocaleString("en-NG")+") · You pay: ₦"+Number(result.final_price||0).toLocaleString("en-NG");}msg.textContent=result.message||"Your appointment has been submitted successfully.";msg.dataset.success="true";form.reset();select.value="";title.textContent="Booking received";description.textContent="Your request is now in BarberPro. Check My Appointments for its status.";image.src=styles["Low Fade"].img;
 }catch(err){msg.textContent=err.message||"Unable to submit your appointment.";msg.dataset.success="false";}finally{btn.disabled=false;}
 });
})();