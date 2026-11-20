/* BarberPro Loyalty Club — shared profile cache, same four-visit reward rules */
document.addEventListener("barberpro:ready",async event=>{
 const byId=id=>document.getElementById(id);
 try{
  const customer=await event.detail.customerPromise;
  if(customer?.__error)throw customer.__error;
  if(!customer?.id)throw new Error("Customer profile unavailable");
  const {data:rows,error}=await window.barberProSupabase.from("appointments").select("created_at,status,loyalty_reward_redeemed").eq("customer_id",customer.id).order("created_at",{ascending:true});
  if(error)throw error;
  const all=rows||[];let last=-1;
  for(let i=0;i<all.length;i++)if(all[i].loyalty_reward_redeemed&&all[i].status!=="cancelled")last=i;
  const completed=all.slice(last+1).filter(x=>x.status==="completed").length;
  const count=Math.min(completed,4),ready=completed>=4,remaining=4-count;
  byId("loyaltyTitle").textContent=ready?"Your 25% reward is unlocked!":count+" of 4 completed haircuts";
  byId("loyaltyMessage").textContent=ready?"Your next eligible booking will automatically receive 25% off.":"Complete "+remaining+" more "+(remaining===1?"haircut":"haircuts")+" to unlock your reward.";
  byId("loyaltyBar").style.width=(count/4*100)+"%";
  byId("loyaltyProgress").setAttribute("aria-valuenow",String(count));
  document.querySelectorAll("#loyaltyStamps span").forEach((x,i)=>x.classList.toggle("complete",i<count));
  byId("loyaltyRewardText").textContent=ready?"Available on your next booking. Once used, a new four-visit cycle begins.":"Every four completed visits unlock 25% off your next haircut.";
 }catch(_){byId("loyaltyTitle").textContent="Progress temporarily unavailable";byId("loyaltyMessage").textContent="Please refresh in a moment to check your rewards.";}
});