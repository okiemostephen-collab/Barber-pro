/* BarberPro profile page: wait for the portal promise, not a timing-sensitive DOM event. */
(async()=>{
 const byId=id=>document.getElementById(id);
 const message=byId("profileMessage");
 const say=text=>{if(message)message.textContent=text;};
 const show=(user,profile)=>{
  const name=profile?.full_name||user.user_metadata?.full_name||user.user_metadata?.name||user.email?.split("@")[0]||"BarberPro Customer";
  ["profileName","profileNameDetail"].forEach(id=>{const el=byId(id);if(el)el.textContent=name;});
  const email=user.email||"Not available";
  ["profileEmail","profileEmailDetail"].forEach(id=>{const el=byId(id);if(el)el.textContent=email;});
  if(byId("profilePhone"))byId("profilePhone").textContent=profile?.phone||"Not provided";
  if(byId("editProfileName"))byId("editProfileName").value=profile?.full_name||name;
  if(byId("editProfilePhone"))byId("editProfilePhone").value=profile?.phone&&profile.phone!=="Not provided"?profile.phone:"";
 };
 try{
  if(!window.barberProReady)throw new Error("The account service did not start. Refresh this page and try again.");
  const ready=await Promise.race([
   window.barberProReady,
   new Promise((_,reject)=>setTimeout(()=>reject(new Error("Account check timed out. Refresh the page and try again.")),12000))
  ]);
  if(ready?.error||!ready?.user)throw ready?.error||new Error("Please sign in to view your profile.");
  const {user,customerPromise}=ready;
  show(user,null);
  const cached=(()=>{try{const item=JSON.parse(localStorage.getItem("barberpro-profile-v2")||"null");return item?.uid===user.id?item.data:null;}catch(_){return null;}})();
  if(cached)show(user,cached);
  let customer;
  try{
   customer=await Promise.race([
    customerPromise,
    new Promise((_,reject)=>setTimeout(()=>reject(new Error("Your customer details are taking too long to load. Refresh and try again.")),15000))
   ]);
  }catch(error){
   say(error?.message||"Your account is signed in, but profile details could not be loaded.");
  }
  if(customer?.__error){
   say(customer.__error.message||"Your profile details could not be loaded. Please refresh.");
  }else if(customer){
   show(user,customer);
   say("");
  }else if(!cached){
   say("Your account is signed in, but no customer profile was returned.");
  }
  const form=byId("profileForm");
  form?.addEventListener("submit",async event=>{
   event.preventDefault();
   const nameInput=byId("editProfileName"),phoneInput=byId("editProfilePhone");
   const full_name=nameInput?.value.trim()||"",phone=phoneInput?.value.trim()||"";
   const button=form.querySelector("button[type='submit']");
   if(full_name.length<2||full_name.length>80){say("Enter a name between 2 and 80 characters.");nameInput?.focus();return;}
   if(phone.length<7||phone.length>25){say("Enter a valid phone number (7–25 characters).");phoneInput?.focus();return;}
   if(!customer?.id){say("Your customer profile is not ready yet. Refresh the page before saving.");return;}
   if(button){button.disabled=true;button.textContent="Saving…";}
   say("Saving your profile…");
   try{
    const {data,error}=await window.barberProSupabase
     .from("customers")
     .update({full_name,phone})
     .eq("auth_user_id",user.id)
     .select("id,full_name,phone")
     .single();
    if(error)throw error;
    if(!data)throw new Error("The profile was not updated. Please try again.");
    customer=data;
    try{localStorage.setItem("barberpro-profile-v2",JSON.stringify({uid:user.id,at:Date.now(),data}));}catch(_){}
    show(user,data);
    say("Profile updated successfully.");
   }catch(error){
    console.error("BarberPro profile save failed:",error);
    say(error?.message||"Could not save your profile. Please try again.");
   }finally{
    if(button){button.disabled=false;button.textContent="Save profile";}
   }
  });
 }catch(error){
  console.error("BarberPro profile initialization failed:",error);
  say(error?.message||"Could not load your profile. Refresh the page and try again.");
 }
})();