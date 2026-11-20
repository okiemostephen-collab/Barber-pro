/* Display live BarberPro service prices on the haircut gallery */
(()=>{
 if(!window.supabase?.createClient)return;
 const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH");
 db.from("services").select("name,price,updated_at").order("updated_at",{ascending:true}).then(({data,error})=>{
  if(error){console.warn("Live haircut prices unavailable:",error.message);return;}
  const prices=new Map((data||[]).map(x=>[x.name,Number(x.price)]));
  document.querySelectorAll(".gallery-card").forEach(card=>{
   const name=card.querySelector("h3")?.textContent?.trim(),price=prices.get(name),el=card.querySelector(".style-price");
   if(el&&Number.isFinite(price))el.textContent="₦"+price.toLocaleString("en-NG");
  });
 });
})();