/* Admin dashboard — restricted to the configured admin UID */
(async()=>{
 const db=window.supabase.createClient("https://plokfuphzuyqtlbkjchp.supabase.co","sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH"),ADMIN="00969825-e0d5-4a9b-9b83-81ec1bce6063";
 const $=id=>document.getElementById(id),money=n=>"₦"+Number(n||0).toLocaleString("en-NG");
 const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const {data,error}=await db.auth.getSession();if(error||!data.session||data.session.user.id!==ADMIN){location.replace("../index.html");return;}
 $("status").textContent="Administrator access verified.";
 $("logout").onclick=async()=>{await db.auth.signOut();location.replace("../index.html");};
 async function load(){
 const [a,e,c]=await Promise.all([db.from("appointments").select("id,customer_id,service_name,appointment_date,appointment_time,price,status,final_price,customers(full_name,phone)").order("appointment_date",{ascending:false}),db.from("expenses").select("*").order("expense_date",{ascending:false}),db.from("customers").select("id,full_name,phone,created_at").order("created_at",{ascending:false})]);
 const failure=a.error||e.error||c.error;if(failure){$("status").textContent=failure.message;return;}
 const ap=a.data||[],ex=e.data||[],cu=c.data||[];$("total").textContent=ap.length;
 const sales=ap.filter(x=>x.status==="completed").reduce((s,x)=>s+Number(x.final_price??x.price??0),0),cost=ex.reduce((s,x)=>s+Number(x.amount||0),0);
 $("sales").textContent=money(sales);$("expenses").textContent=money(cost);$("net").textContent=money(sales-cost);
 $("rows").innerHTML=ap.map(x=>'<tr><td>'+safe(x.customers?.full_name)+'</td><td>'+safe(x.customers?.phone)+'</td><td>'+safe(x.service_name)+'</td><td>'+safe(x.appointment_date)+'</td><td>'+safe(x.appointment_time)+'</td><td>'+money(x.final_price??x.price)+'</td><td>'+safe(x.status)+'</td><td><select data-id="'+safe(x.id)+'" class="status-select"><option '+(x.status==="pending"?"selected":"")+' value="pending">pending</option><option '+(x.status==="confirmed"?"selected":"")+' value="confirmed">confirmed</option><option '+(x.status==="completed"?"selected":"")+' value="completed">completed</option><option '+(x.status==="cancelled"?"selected":"")+' value="cancelled">cancelled</option></select></td></tr>').join("")||'<tr><td colspan="8">No appointments yet.</td></tr>';
 $("expenseRows").innerHTML=ex.map(x=>'<p>'+safe(x.description)+' — '+money(x.amount)+'</p>').join("")||"<p>No expenses recorded.</p>";
 $("customers").innerHTML=cu.map(x=>'<p>'+safe(x.full_name)+' · '+safe(x.phone)+'</p>').join("")||"<p>No customers yet.</p>";
 document.querySelectorAll("[data-id]").forEach(sel=>sel.onchange=async()=>{const {error}=await db.from("appointments").update({status:sel.value}).eq("id",sel.dataset.id);if(error){$("status").textContent=error.message;return;}load();});
 }
 $("expenseForm").onsubmit=async ev=>{ev.preventDefault();const {error}=await db.from("expenses").insert({description:$("description").value.trim(),amount:Number($("amount").value),expense_date:new Date().toISOString().slice(0,10)});if(error){$("status").textContent=error.message;return;}ev.target.reset();load();};
 await load();
})();