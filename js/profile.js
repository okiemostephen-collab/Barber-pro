/* Profile: render cached details first and report refresh failures clearly */
document.addEventListener("barberpro:ready",event=>{
 const user=event.detail.user,byId=id=>document.getElementById(id),form=byId("profileForm"),msg=byId("profileMessage");
 const show=profile=>{
  const name=profile?.full_name||user.user_metadata?.full_name||user.email||"Customer";
  ["profileName","profileNameDetail"].forEach(id=>{if(byId(id))byId(id).textContent=name;});
  if(byId("profilePhone"))byId("profilePhone").textContent=profile?.phone||"Not provided";
  if(byId("profileEmail"))byId("profileEmail").textContent=user.email||"Not available";
  if(byId("profileEmailDetail"))byId("profileEmailDetail").textContent=user.email||"Not available";
  if(byId("editProfileName"))byId("editProfileName").value=profile?.full_name||"";
  if(byId("editProfilePhone"))byId("editProfilePhone").value=profile?.phone||"";
 };
 const cached=(()=>{try{const v=JSON.parse(localStorage.getItem("barberpro-profile-v2")||"null");return v&&v.uid===user.id?v.data:null;}catch(_){return null;}})();
 if(cached)show(cached);
 event.detail.customerPromise.then(data=>{
  if(data?.__error){if(!cached&&msg)msg.textContent=data.__error.message||"Profile details are temporarily unavailable.";return;}
  if(data)show(data);
 }).catch(error=>{if(msg)msg.textContent=error?.message||"Could not load your profile.";});
 document.addEventListener("barberpro:profile-updated",e=>show(e.detail.profile));
 document.addEventListener("barberpro:profile-error",e=>{if(!cached&&msg)msg.textContent=e.detail.error?.message||"Profile details are temporarily unavailable.";});
 form?.addEventListener("submit",async ev=>{
  ev.preventDefault();const full_name=byId("editProfileName").value.trim(),phone=byId("editProfilePhone").value.trim(),button=form.querySelector("button[type='submit']");
  if(button){button.disabled=true;button.textContent="Saving…";}if(msg)msg.textContent="Saving…";
  try{
   const customer=await event.detail.customerPromise;
   if(customer?.__error||!customer?.id)throw new Error(customer?.__error?.message||"Could not verify your profile. Please refresh.");
   const {error}=await window.barberProSupabase.from("customers").update({full_name,phone}).eq("id",customer.id);
   if(error)throw error;
   const updated={...customer,full_name,phone};try{localStorage.setItem("barberpro-profile-v2",JSON.stringify({uid:user.id,at:Date.now(),data:updated}));}catch(_){}
   show(updated);if(msg)msg.textContent="Profile updated.";
  }catch(error){if(msg)msg.textContent=error?.message||"Could not save your profile. Please try again.";}
  finally{if(button){button.disabled=false;button.textContent="Save profile";}}
 });
});
