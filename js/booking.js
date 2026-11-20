/* BarberPro booking — preselects haircut from gallery and authenticates Edge Function request */
(() => {
 const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH");
 const ENDPOINT="https://plokfuphzuyqtlbkjchp.supabase.co/functions/v1/barberpro-booking";
 const styles={
 "Low Fade":{price:3000,col:0,row:0,desc:"Clean low fade with a sharp natural line-up."},
 "Mid Fade":{price:3500,col:1,row:0,desc:"A balanced mid fade with defined natural texture."},
 "Burst Fade":{price:4000,col:2,row:0,desc:"A curved burst fade with a textured top."},
 "Afro Shape-up":{price:2500,col:3,row:0,desc:"A shaped afro with a crisp forehead and temple line."},
 "Waves & Line-up":{price:3000,col:0,row:1,desc:"Defined 360 waves finished with a clean edge."},
 "Haircut + Beard":{price:5000,col:1,row:1,desc:"A complete cut and beard detail for a polished finish."},
 "High Top Fade":{price:3500,img:"https://thelighteousness.files.wordpress.com/2020/03/cc6d32c00dea51ca510c390a66d02dd3347354126.jpg?w=1108",desc:"A structured high top with a smooth skin fade."},
 "Sponge Twists":{price:4000,img:"https://i.pinimg.com/564x/8e/16/aa/8e16aab181e9e5029f795d9f8703ec0c.jpg",desc:"Defined sponge twists with a sharp taper."},
 "Dreadlock Fade":{price:5000,img:"https://i.pinimg.com/736x/34/f9/7c/34f97c5bd6e91738a9f9d6543bb59571.jpg",desc:"Longer locs paired with a clean high fade."},
 "Cornrows with Fade":{price:5000,img:"https://www.petitssoins.fr/media/2026/07/tresse-collee-fade.jpg",desc:"Neat cornrows with a crisp side fade."},
 "Textured Crop":{price:3500,img:"https://i.pinimg.com/736x/1d/85/e6/1d85e66b9e52c5884f2af483f115f15c.jpg",desc:"A short textured crop with a clean taper."},
 "Buzz Cut + Beard":{price:5000,img:"https://images.pexels.com/photos/28638400/pexels-photo-28638400.jpeg?auto=compress&cs=tinysrgb&w=900",desc:"A close buzz cut with a shaped beard finish."}
 };
 const form=document.getElementById("bookingForm");if(!form)return;
 const select=document.getElementById("serviceSelect"),date=document.getElementById("appointmentDate"),msg=document.getElementById("bookingMessage"),btn=document.getElementById("bookingButton");
 const image=document.getElementById("selectedStyleImage"),title=document.getElementById("selectedStyleName"),description=document.getElementById("selectedStyleDescription");
 const today=new Date();date.min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
 function showStyle(name){const s=styles[name];if(!s)return;title.textContent=name;description.textContent=s.desc+"  Price: ₦"+s.price.toLocaleString("en-NG");image.style.setProperty("--col",s.col);image.style.setProperty("--row",s.row);image.setAttribute("aria-label",name+" on a Black male model");}
 const requested=new URLSearchParams(location.search).get("service");if(requested&&styles[requested]){select.value=requested;showStyle(requested);}
 select.addEventListener("change",()=>showStyle(select.value));
 form.addEventListener("submit",async e=>{e.preventDefault();btn.disabled=true;msg.textContent="Submitting your appointment…";try{
 const {data:{session},error:sessionError}=await db.auth.getSession();if(sessionError||!session)throw new Error("Your login session has expired. Please sign in again.");
 const service=select.value;if(!styles[service])throw new Error("Please choose a haircut from the collection.");
 if(!date.value||date.value<date.min)throw new Error("Choose today or a future date.");
 const time=document.getElementById("appointmentTime").value;if(!time)throw new Error("Choose an appointment time.");
 const response=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","apikey":"sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH","Authorization":"Bearer "+session.access_token},body:JSON.stringify({service_name:service,date:date.value,time})});
 const result=await response.json().catch(()=>({}));if(!response.ok||!result.success)throw new Error(result.error||result.message||"Booking could not be submitted.");
 msg.textContent=result.message||"Your appointment has been submitted successfully.";msg.dataset.success="true";form.reset();select.value="";title.textContent="Booking received";description.textContent="Your request is now in BarberPro. Check My Appointments for its status.";image.style.setProperty("--col",0);image.style.setProperty("--row",0);
 }catch(err){msg.textContent=err.message||"Unable to submit your appointment.";msg.dataset.success="false";}finally{btn.disabled=false;}
 });
})();