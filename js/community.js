/* BarberPro Community: posts, comments and member reviews */
(()=>{
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let db,user,memberName="BarberPro member",ready=false;
 const note=(id,msg)=>{const el=$(id);if(el)el.textContent=msg;};
 const date=s=>{const d=new Date(s);return Number.isNaN(d.getTime())?"":d.toLocaleString();};
 const load=async()=>{
  if(!db||!user)return;
  note("communityMessage","Loading the community…");
  const [postsRes,commentsRes,reviewsRes,myReviewRes]=await Promise.all([
   db.from("community_posts").select("id,author_user_id,author_name,content,created_at").order("created_at",{ascending:false}).limit(40),
   db.from("community_comments").select("id,post_id,author_user_id,author_name,content,created_at").order("created_at",{ascending:true}).limit(300),
   db.from("community_reviews").select("id,author_name,rating,content,created_at").order("created_at",{ascending:false}).limit(50),
   db.from("community_reviews").select("rating,content").eq("author_user_id",user.id).maybeSingle()
  ]);
  const firstError=postsRes.error||commentsRes.error||reviewsRes.error;
  if(firstError)throw firstError;
  const posts=postsRes.data||[],comments=commentsRes.data||[],reviews=reviewsRes.data||[];
  const feed=$("communityFeed");
  if(feed)feed.innerHTML=posts.length?posts.map(p=>{
   const mine=p.author_user_id===user.id;
   const replies=comments.filter(c=>c.post_id===p.id);
   return `<article class="community-post" data-post-id="${esc(p.id)}">
    <div class="community-post-head"><div><strong>${esc(p.author_name)}</strong><small>${esc(date(p.created_at))}</small></div>${mine?'<button class="community-delete" data-delete-post="'+esc(p.id)+'" type="button">Delete</button>':""}</div>
    <p class="community-post-content">${esc(p.content)}</p>
    <div class="community-comments"><h4>Comments (${replies.length})</h4>
    ${replies.map(c=>`<div class="community-comment"><strong>${esc(c.author_name)}</strong><p>${esc(c.content)}</p><small>${esc(date(c.created_at))}</small></div>`).join("")}
    </div>
    <form class="community-comment-form" data-comment-form="${esc(p.id)}"><input name="comment" maxlength="500" required placeholder="Write a helpful comment…" aria-label="Write a comment"><button class="gold-button" type="submit">Comment</button></form>
   </article>`;
  }).join(""):"<div class='panel'><p>No posts yet. Start the conversation with a helpful tip or idea.</p></div>";
  const avg=reviews.length?reviews.reduce((n,r)=>n+Number(r.rating),0)/reviews.length:0;
  note("reviewSummary",reviews.length?`Average rating: ${avg.toFixed(1)} / 5 · ${reviews.length} review(s)`:"No reviews yet. Be the first to review BarberPro.");
  const reviewList=$("reviewList");
  if(reviewList)reviewList.innerHTML=reviews.length?reviews.map(r=>`<article class="community-review"><div><strong>${esc(r.author_name)}</strong><span class="review-stars">${"★".repeat(Number(r.rating))}${"☆".repeat(5-Number(r.rating))}</span></div><p>${esc(r.content)}</p><small>${esc(date(r.created_at))}</small></article>`).join(""):"<p>No member reviews yet.</p>";
  if(myReviewRes.data){$("reviewRating").value=String(myReviewRes.data.rating);$("reviewContent").value=myReviewRes.data.content;}
  note("communityMessage","You're signed in as a BarberPro member.");
 };
 const busy=(form,on)=>{const b=form.querySelector("button[type=submit]");if(b){b.disabled=on;b.dataset.label??=b.textContent;if(on)b.textContent="Please wait…";else b.textContent=b.dataset.label;}};
 document.addEventListener("barberpro:ready",async event=>{
  try{
   user=event.detail.user;db=window.barberProSupabase;
   const profile=await event.detail.customerPromise;
   if(profile?.__error)throw profile.__error;
   memberName=profile?.full_name||user.user_metadata?.full_name||"BarberPro member";
   ready=true;await load();
  }catch(error){note("communityMessage",error?.message||"Could not connect to the community. Refresh and sign in again.");}
 });
 $("postForm")?.addEventListener("submit",async e=>{
  e.preventDefault();if(!ready)return;const form=e.currentTarget,content=$("postContent").value.trim();if(!content)return;
  busy(form,true);
  try{const {error}=await db.from("community_posts").insert({author_user_id:user.id,author_name:memberName,content});if(error)throw error;$("postContent").value="";await load();}
  catch(error){note("communityMessage",error.message||"Your post could not be published.");}
  finally{busy(form,false);}
 });
 $("reviewForm")?.addEventListener("submit",async e=>{
  e.preventDefault();if(!ready)return;const form=e.currentTarget,rating=Number($("reviewRating").value),content=$("reviewContent").value.trim();busy(form,true);
  try{const {error}=await db.from("community_reviews").upsert({author_user_id:user.id,author_name:memberName,rating,content},{onConflict:"author_user_id"});if(error)throw error;note("reviewMessage","Your review has been saved. Thank you.");await load();}
  catch(error){note("reviewMessage",error.message||"Your review could not be saved.");}
  finally{busy(form,false);}
 });
 $("communityFeed")?.addEventListener("submit",async e=>{
  const form=e.target.closest("[data-comment-form]");if(!form)return;e.preventDefault();if(!ready)return;
  const content=new FormData(form).get("comment")?.toString().trim();if(!content)return;busy(form,true);
  try{const {error}=await db.from("community_comments").insert({post_id:form.dataset.commentForm,author_user_id:user.id,author_name:memberName,content});if(error)throw error;await load();}
  catch(error){note("communityMessage",error.message||"Your comment could not be saved.");}
  finally{busy(form,false);}
 });
 $("communityFeed")?.addEventListener("click",async e=>{
  const b=e.target.closest("[data-delete-post]");if(!b||!ready)return;
  if(!confirm("Delete your post and its comments?"))return;
  b.disabled=true;
  try{const {error}=await db.from("community_posts").delete().eq("id",b.dataset.deletePost).eq("author_user_id",user.id);if(error)throw error;await load();}
  catch(error){note("communityMessage",error.message||"The post could not be deleted.");b.disabled=false;}
 });
})();