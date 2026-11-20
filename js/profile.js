/* Customer profile — reuse shared profile data and refresh cache after edits */
document.addEventListener("barberpro:ready",async event=>{
 const user=event.detail.user,db=window.barberProSupabase;
 const byId=id=>document.getElementById(id);
 const msg=byId("profileMessage"),form=byId("profileForm");
 const show=(profile)=>{
  const name=profile?.full_name||user.user_metadata?.full_name||"Customer";
  for(const id of ["profileName","profileNameDetail"])if(byId(id))byId(id).textContent=name;
  if(byId("profilePhone"))byId("profilePhone").textContent=profile?.phone||"Not provided";
  if(byId("profileEmail"))byId("profileEmail").textContent=user.email||"Not available";
  if(byId("profileEmailDetail"))byId("profileEmailDetail").textContent=user.email||"Not available";
  if(byId("editProfileName"))byId("editProfileName").value=profile?.full_name||"";
  if(byId("editProfilePhone"))byId("editProfilePhone").value=profile?.phone||"";
 };
 try{
  const data=await event.detail.customerPromise;
  if(data?.__error)throw data.__error;
  if(!data){if(msg)msg.textContent="Your customer profile could not be found.";return;}
  show(data);
  form?.addEventListener("submit",async ev=>{
   ev.preventDefault();
   const full_name=byId("editProfileName").value.trim(),phone=byId("editProfilePhone").value.trim();
   const button=form.querySelector("button[type='submit']");
   if(button){button.disabled=true;button.textContent="Saving…";}
   if(msg)msg.textContent="Saving your profile…";
   const {error}=await db.from("customers").update({full_name,phone}).eq("id",data.id);
   if(button){button.disabled=false;button.textContent="Save profile";}
   if(error){if(msg)msg.textContent="Your profile could not be saved. Please try again.";return;}
   const updated={...data,full_name,phone};
   try{sessionStorage.setItem("barberpro-profile-v1",JSON.stringify({uid:user.id,at:Date.now(),profile:updated}));}catch(_){}
   show(updated);if(msg)msg.textContent="Your profile has been updated.";
  });
 }catch(_){if(msg)msg.textContent="Your profile is temporarily unavailable. Please refresh in a moment.";}
});