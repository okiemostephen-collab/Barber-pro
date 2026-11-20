/* BarberPro administrator dashboard */
(async()=>{
 const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH");
 const ADMIN="00969825-e0d5-4a9b-9b83-81ec1bce6063";
 const $=id=>document.getElementById(id);
 const money=n=>"₦"+Number(n||0).toLocaleString("en-NG");
 const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const {data:sessionData,error:sessionError}=await db.auth.getSession();
 if(sessionError||!sessionData.session||sessionData.session.user.id!==ADMIN){location.replace("../index.html");return;}
 $("status").textContent="Administrator access verified.";
 $("logout").addEventListener("click",async()=>{await db.auth.signOut();location.replace("../index.html");});
 async function load(){
  $("status").textContent="Refreshing business records…";
  // Load each section independently so one optional panel cannot hide appointments.
  const [a,e,cResult,s]=await Promise.all([
   db.from("appointments").select("id,customer_id,service_name,appointment_date,appointment_time,price,discount_percent,discount_amount,final_price,status,customers(full_name,phone)").order("appointment_date",{ascending:false}).order("appointment_time",{ascending:false}),
   db.from("expenses").select("id,description,amount,expense_date").order("expense_date",{ascending:false}),
   db.from("customers").select("id,full_name,phone,created_at").order("created_at",{ascending:false}),
   db.from("services").select("id,name,description,price,updated_at").order("name").order("updated_at")
  ]);
  const errors=[];
  if(a.error){errors.push("Appointments: "+a.error.message);$("rows").innerHTML='<tr><td colspan="10">Could not load appointments: '+safe(a.error.message)+'</td></tr>';}
  else{
   const ap=a.data||[];$("total").textContent=ap.length;
   const sales=ap.filter(x=>x.status==="completed").reduce((sum,x)=>sum+Number(x.final_price??x.price??0),0);
   $("sales").textContent=money(sales);
   $("rows").innerHTML=ap.map(x=>'<tr><td>'+safe(x.customers?.full_name||"Customer")+'</td><td>'+safe(x.customers?.phone||"—")+'</td><td>'+safe(x.service_name)+'</td><td>'+safe(x.appointment_date)+'</td><td>'+safe(x.appointment_time)+'</td><td>'+money(Number(x.final_price??x.price??0)+Number(x.discount_amount||0))+'</td><td>'+safe(x.discount_percent||0)+'% ('+money(x.discount_amount||0)+')</td><td>'+money(x.final_price??x.price)+'</td><td>'+safe(x.status)+'</td><td><select data-status-id="'+safe(x.id)+'"><option value="pending" '+(x.status==="pending"?"selected":"")+'>Pending</option><option value="confirmed" '+(x.status==="confirmed"?"selected":"")+'>Confirmed</option><option value="completed" '+(x.status==="completed"?"selected":"")+'>Completed</option><option value="cancelled" '+(x.status==="cancelled"?"selected":"")+'>Cancelled</option></select></td></tr>').join("")||'<tr><td colspan="10">No appointments yet.</td></tr>';
   document.querySelectorAll("[data-status-id]").forEach(sel=>sel.addEventListener("change",async()=>{sel.disabled=true;const {error}=await db.from("appointments").update({status:sel.value}).eq("id",sel.dataset.statusId);if(error){$("status").textContent="Appointment update failed: "+error.message;sel.disabled=false;return;}await load();}));
  }
  if(e.error){errors.push("Expenses: "+e.error.message);$("expenseRows").textContent="Expenses could not load: "+e.error.message;}
  else{const ex=e.data||[];const cost=ex.reduce((sum,x)=>sum+Number(x.amount||0),0);$("expenses").textContent=money(cost);$("net").textContent=money(Number($("sales").textContent.replace(/[^0-9.-]/g,""))-cost);$("expenseRows").innerHTML=ex.map(x=>'<article class="profile-detail"><strong>'+safe(x.description)+'</strong><p>'+money(x.amount)+'</p><small>'+safe(x.expense_date)+'</small></article>').join("")||"<p>No expenses recorded.</p>";}
  if(cResult.error){errors.push("Customers: "+cResult.error.message);$("customers").textContent="Customers could not load: "+cResult.error.message;}
  else{const cu=cResult.data||[];$("customers").innerHTML=cu.map(x=>'<article class="profile-detail"><strong>'+safe(x.full_name)+'</strong><p>'+safe(x.phone)+'</p><small>Joined '+safe(String(x.created_at||"").slice(0,10))+'</small></article>').join("")||"<p>No customers yet.</p>";}
  if(s.error){errors.push("Services: "+s.error.message);$("serviceManager").textContent="Services could not load: "+s.error.message;}
  else{const sv=[...new Map((s.data||[]).map(x=>[x.name,x])).values()];$("serviceManager").innerHTML=sv.map(x=>'<form class="product-card service-edit" data-service-name="'+safe(x.name)+'"><h3>'+safe(x.name)+'</h3><label>Price (₦)<input type="number" min="0" step="50" name="price" value="'+Number(x.price)+'" required></label><button class="gold-button">Save price</button></form>').join("")||"<p>No services configured.</p>";
   document.querySelectorAll(".service-edit").forEach(form=>form.addEventListener("submit",async ev=>{ev.preventDefault();const price=Number(new FormData(form).get("price"));const {error}=await db.from("services").update({price,updated_at:new Date().toISOString()}).eq("name",form.dataset.serviceName);if(error){$("status").textContent="Service update failed: "+error.message;return;}await load();}));
  }
  $("status").textContent=errors.length?errors.join(" · "):"Business records are up to date.";
 }
 $("expenseForm").addEventListener("submit",async ev=>{ev.preventDefault();const {error}=await db.from("expenses").insert({description:$("description").value.trim(),amount:Number($("amount").value),expense_date:new Date().toISOString().slice(0,10)});if(error){$("status").textContent=error.message;return;}ev.target.reset();await load();});
 await load();
})();