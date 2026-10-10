
const LS="taskflow_android_v1";
const $=s=>document.querySelector(s);
let tasks=[],filter="all",editingId=null,deferredPrompt=null;
function load(){
  try{tasks=JSON.parse(localStorage.getItem(LS)||"[]")}catch{tasks=[]}
  if(!tasks.length){
    const t=new Date().toISOString().slice(0,10),tm=new Date(Date.now()+864e5).toISOString().slice(0,10);
    tasks=[{id:uid(),title:"\u0628\u0631\u0631\u0633\u06cc \u0627\u06cc\u0645\u06cc\u0644\u200c\u0647\u0627\u06cc \u0645\u0647\u0645",desc:"\u067e\u0627\u0633\u062e \u0628\u0647 3 \u0627\u06cc\u0645\u06cc\u0644",date:t,time:"09:30",prio:"high",tag:"\u06a9\u0627\u0631\u06cc",repeat:"none",done:false,createdAt:Date.now()},{id:uid(),title:"\u0648\u0631\u0632\u0634 \u0635\u0628\u062d\u06af\u0627\u0647\u06cc",desc:"30 \u062f\u0642\u06cc\u0642\u0647",date:t,time:"07:00",prio:"med",tag:"\u0633\u0644\u0627\u0645\u062a\u06cc",repeat:"daily",done:false,createdAt:Date.now()-1e3},{id:uid(),title:"\u0627\u0631\u0633\u0627\u0644 \u06af\u0632\u0627\u0631\u0634",desc:"",date:tm,time:"16:00",prio:"high",tag:"\u06a9\u0627\u0631\u06cc",repeat:"none",done:false,createdAt:Date.now()-2e3},{id:uid(),title:"\u062e\u0631\u06cc\u062f \u06a9\u062a\u0627\u0628",desc:"",date:t,time:"",prio:"low",tag:"\u0634\u062e\u0635\u06cc",repeat:"none",done:true,createdAt:Date.now()-3e3}];
    save();
  }
  handleRepeats();
}
function save(){localStorage.setItem(LS,JSON.stringify(tasks));if(getSheetUrl())pushDebounced()}
function uid(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3)}
function getSheetUrl(){return(localStorage.getItem("tf_sheet_url")||"").trim()}
function setSheetUrl(v){localStorage.setItem("tf_sheet_url",v)}
function handleRepeats(){
  const today=new Date().toISOString().slice(0,10);let c=false;
  tasks.forEach(t=>{
    if(t.repeat==="none"||t.done)return;
    if(t.date<today){
      const n=nextDate(t.date,t.repeat);
      if(n&&!tasks.some(x=>x.title===t.title&&x.date===n)){tasks.push(Object.assign({},t,{id:uid(),date:n,done:false,createdAt:Date.now()}));c=true}
    }
  });
  if(c)localStorage.setItem(LS,JSON.stringify(tasks));
}
function nextDate(d,r){const dt=new Date(d+"T12:00:00");if(r==="daily")dt.setDate(dt.getDate()+1);else if(r==="weekly")dt.setDate(dt.getDate()+7);else if(r==="weekdays"){do{dt.setDate(dt.getDate()+1)}while(dt.getDay()===5||dt.getDay()===6)}else return null;return dt.toISOString().slice(0,10)}
function render(){renderHero();renderList();renderStats();renderNotifPreview();updateSheetStatus()}
function todayStr(){return new Date().toISOString().slice(0,10)}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}


function renderHero(){
  const today=todayStr();
  const el=document.getElementById("todayLabel");
  if(el) el.textContent=new Date().toLocaleDateString("fa-IR",{weekday:"long",day:"numeric",month:"long"});
  const todayTasks=tasks.filter(t=>t.date===today);
  const done=todayTasks.filter(t=>t.done).length,total=todayTasks.length,pct=total?Math.round(done/total*100):0;
  const pr=document.getElementById("heroProgress"),fi=document.getElementById("heroFill"),co=document.getElementById("heroCount");
  if(pr) pr.textContent=pct+"% \u062a\u06a9\u0645\u06cc\u0644";
  if(fi) fi.style.width=pct+"%";
  if(co) co.textContent=done+" \u0627\u0632 "+total+" \u0627\u0646\u062c\u0627\u0645 \u0634\u062f";
  const c=document.getElementById("heroTasks");
  if(!c) return;
  if(!todayTasks.length){c.innerHTML='<div style="padding:24px;text-align:center;color:#94A3B8;font-size:13px">\u06a9\u0627\u0631\u06cc \u0628\u0631\u0627\u06cc \u0627\u0645\u0631\u0648\u0632 \u0646\u062f\u0627\u0631\u06cc</div>';return;}
  let h="";
  todayTasks.slice(0,5).forEach(t=>{
    h+='<div class="task-row"><div class="check '+(t.done?"done":"")+'" data-toggle="'+t.id+'">'+(t.done?"\u2713":"")+'</div><div class="task-meta"><b>'+esc(t.title)+'</b><small>'+(t.time||"")+' '+(t.tag?"\u00b7 "+esc(t.tag):"")+'</small></div><span class="badge '+(t.date===today?"b-today":"b-tomorrow")+'">'+(t.done?"\u0627\u0646\u062c\u0627\u0645 \u0634\u062f":(t.time||"\u0627\u0645\u0631\u0648\u0632"))+'</span></div>';
  });
  c.innerHTML=h;
}
function renderList(){
  const q=(document.getElementById("search").value||"").trim().toLowerCase();
  const today=todayStr();
  let list=[...tasks];
  if(filter==="today") list=list.filter(t=>t.date===today);
  else if(filter==="pending") list=list.filter(t=>!t.done);
  else if(filter==="done") list=list.filter(t=>t.done);
  else if(filter==="overdue") list=list.filter(t=>!t.done&&t.date<today);
  if(q) list=list.filter(t=>(t.title+t.desc+t.tag).toLowerCase().includes(q));
  const sort=document.getElementById("sortSel").value;
  if(sort==="due") list.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  else if(sort==="priority"){const w={high:0,med:1,low:2};list.sort((a,b)=>w[a.prio]-w[b.prio]);}
  else list.sort((a,b)=>b.createdAt-a.createdAt);
  const sub=document.getElementById("taskSubtitle");
  if(sub) sub.textContent=list.length+" \u06a9\u0627\u0631 \u2014 "+tasks.filter(t=>t.done).length+" \u0627\u0646\u062c\u0627\u0645\u200c\u0634\u062f\u0647\u060c "+tasks.filter(t=>!t.done).length+" \u0628\u0627\u0642\u06cc\u200c\u0645\u0627\u0646\u062f\u0647";
  const el=document.getElementById("taskList");
  if(!list.length){el.innerHTML='<div class="empty"><i>\uD83D\uDD0D</i>\u0686\u06cc\u0632\u06cc \u067e\u06cc\u062f\u0627 \u0646\u0634\u062f<br><small style="font-size:11px">\u0641\u06cc\u0644\u062a\u0631 \u0631\u0627 \u0639\u0648\u0636 \u06a9\u0646</small></div>';return;}
  let html="";
  list.forEach(t=>{
    const overdue=!t.done&&t.date<today;
    const rep=t.repeat!=="none"?" \u00b7 "+(t.repeat==="daily"?"\u0631\u0648\u0632\u0627\u0646\u0647":t.repeat==="weekly"?"\u0647\u0641\u062a\u06af\u06cc":"\u0634\u0646\u0628\u0647-\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647"):"";
    html+='<div class="task-item '+(t.done?"done":"")+'"><div class="prio prio-'+t.prio+'"></div><div class="check '+(t.done?"done":"")+'" data-toggle="'+t.id+'">'+(t.done?"\u2713":"")+'</div><div class="task-info"><b>'+esc(t.title)+' '+(overdue?'<span style="color:#EF4444;font-size:10px">\u2022 \u0639\u0642\u0628\u200c\u0627\u0641\u062a\u0627\u062f\u0647</span>':"")+'</b><small>'+t.date+' '+(t.time?"\u00b7 "+t.time:"")+' '+(t.desc?"\u00b7 "+esc(t.desc.slice(0,40)):"")+rep+'</small></div>'+(t.tag?'<span class="tag">'+esc(t.tag)+'</span>':"")+'<div class="task-actions"><button class="icon-btn" data-edit="'+t.id+'" title="\u0648\u06cc\u0631\u0627\u06cc\u0634" style="width:32px;height:32px;font-size:12px">\u270E</button><button class="icon-btn" data-del="'+t.id+'" title="\u062d\u0630\u0641" style="width:32px;height:32px;font-size:12px">\uD83D\uDDD1</button></div></div>';
  });
  el.innerHTML=html;
}
function renderStats(){
  const today=todayStr();
  const doneToday=tasks.filter(t=>t.done&&t.date===today).length,pending=tasks.filter(t=>!t.done).length,total=tasks.length,rate=total?Math.round(tasks.filter(t=>t.done).length/total*100):0;
  const a=document.getElementById("sDone"),b=document.getElementById("sPending"),c=document.getElementById("sRate"),d=document.getElementById("sDoneSub"),e=document.getElementById("sPendSub");
  if(a) a.textContent=doneToday;
  if(b) b.textContent=pending;
  if(c) c.textContent=rate+"%";
  if(d) d.textContent=doneToday?"\u0639\u0627\u0644\u06cc\u0647!":"\u0647\u0646\u0648\u0632 \u06a9\u0627\u0631\u06cc \u0646\u06a9\u0631\u062f\u06cc";
  if(e) e.textContent=pending?pending+" \u0645\u0627\u0646\u062f\u0647":"\u0647\u0645\u0647 \u062a\u0645\u0627\u0645!";
  const s=document.getElementById("sStreak"); if(s) s.textContent=calcStreak()+" \u0631\u0648\u0632";
  const chart=document.getElementById("chart"); if(!chart) return;
  const days=[];
  for(let i=6;i>=0;i--){
    const d=new Date(Date.now()-i*864e5),iso=d.toISOString().slice(0,10),label=d.toLocaleDateString("fa-IR",{weekday:"short"}),tot=tasks.filter(t=>t.date===iso).length,dn=tasks.filter(t=>t.date===iso&&t.done).length;
    days.push({label,tot,dn});
  }
  const max=Math.max(1,...days.map(d=>d.tot));
  let h="";
  days.forEach(d=>{
    const pct=d.tot?Math.round(d.dn/d.tot*100):0,w=d.tot?Math.round(d.dn/max*100):0,w2=d.tot?Math.round((d.tot-d.dn)/max*100):0;
    h+='<div class="bar-row"><b>'+d.label+'</b><div class="bar" style="display:flex"><i style="width:'+w+'%;background:var(--teal)"></i><i style="width:'+w2+'%;background:var(--gray-200)"></i></div><small style="min-width:56px;text-align:left">'+d.dn+'/'+d.tot+' ('+pct+'%)</small></div>';
  });
  chart.innerHTML=h;
}
function renderNotifPreview(){
  const list=document.getElementById("notifList"); if(!list) return;
  const upcoming=tasks.filter(t=>!t.done&&t.time).slice(0,4);
  if(!upcoming.length){list.innerHTML='<div style="font-size:11px;color:#94A3B8;padding:8px">\u06a9\u0627\u0631\u06cc \u0628\u0627 \u0632\u0645\u0627\u0646 \u06cc\u0627\u062f\u0622\u0648\u0631\u06cc \u0646\u062f\u0627\u0631\u06cc</div>';return;}
  let h=""; upcoming.forEach(t=>{h+='<div class="notif"><b>\u23F0 '+t.time+' \u2014 '+esc(t.title)+'</b><div style="color:#64748B">'+t.date+'</div></div>';}); list.innerHTML=h;
}
function updateSheetStatus(){
  const url=getSheetUrl(),st=document.getElementById("sheetStatus");
  if(st){
    if(!url) st.textContent="\u0648\u0636\u0639\u06cc\u062a: \u062a\u0646\u0638\u06cc\u0645 \u0646\u0634\u062f\u0647";
    else st.textContent="\u0648\u0636\u0639\u06cc\u062a: \u0645\u062a\u0635\u0644 \u2014 "+url.slice(0,52)+"...";
  }
  const inp=document.getElementById("sheetUrl"); if(inp) inp.value=url;
  const codeEl=document.getElementById("appsScriptCode"); if(codeEl) codeEl.textContent=APPS_SCRIPT;
}
function calcStreak(){
  let streak=0;
  for(let i=0;i<30;i++){
    const iso=new Date(Date.now()-i*864e5).toISOString().slice(0,10),dayTasks=tasks.filter(t=>t.date===iso);
    if(!dayTasks.length) break;
    if(dayTasks.every(t=>t.done)) streak++; else break;
  }
  return streak||(tasks.some(t=>t.done)?1:0);
}


function openModal(id){
  editingId=id;
  const isEdit=id!=null;
  document.getElementById("modalTitle").textContent=isEdit?"\u0648\u06cc\u0631\u0627\u06cc\u0634 \u06a9\u0627\u0631":"\u06a9\u0627\u0631 \u062c\u062f\u06cc\u062f";
  if(isEdit){
    const t=tasks.find(x=>x.id===id);
    document.getElementById("fTitle").value=t.title;document.getElementById("fDesc").value=t.desc;document.getElementById("fDate").value=t.date;document.getElementById("fTime").value=t.time;document.getElementById("fPrio").value=t.prio;document.getElementById("fTag").value=t.tag;document.getElementById("fRepeat").value=t.repeat;
  } else {
    document.getElementById("fTitle").value="";document.getElementById("fDesc").value="";document.getElementById("fDate").value=todayStr();document.getElementById("fTime").value="";document.getElementById("fPrio").value="med";document.getElementById("fTag").value="";document.getElementById("fRepeat").value="none";
  }
  document.getElementById("modal").classList.add("open");
  setTimeout(()=>document.getElementById("fTitle").focus(),80);
}
function closeModal(){document.getElementById("modal").classList.remove("open");editingId=null}
function saveTask(){
  const title=document.getElementById("fTitle").value.trim();
  if(!title){toast("\u0639\u0646\u0648\u0627\u0646 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646");document.getElementById("fTitle").focus();return;}
  const data={title,desc:document.getElementById("fDesc").value.trim(),date:document.getElementById("fDate").value||todayStr(),time:document.getElementById("fTime").value,prio:document.getElementById("fPrio").value,tag:document.getElementById("fTag").value.trim(),repeat:document.getElementById("fRepeat").value};
  if(editingId){
    const idx=tasks.findIndex(t=>t.id===editingId);
    tasks[idx]=Object.assign({},tasks[idx],data);
    toast("\u06a9\u0627\u0631 \u0648\u06cc\u0631\u0627\u06cc\u0634 \u0634\u062f");
  } else {
    tasks.unshift(Object.assign({id:uid(),done:false,createdAt:Date.now()},data));
    toast("\u06a9\u0627\u0631 \u062c\u062f\u06cc\u062f \u0627\u0636\u0627\u0641\u0647 \u0634\u062f");
  }
  save();closeModal();render();
  if(data.time) ensureNotifyPermission();
}
function ensureNotifyPermission(){if(!("Notification" in window))return; if(Notification.permission==="default") Notification.requestPermission()}
function notify(title,body){
  if(Notification.permission!=="granted") return;
  try{new Notification(title,{body})}catch(e){}
  const el=document.createElement("div"); el.className="notif"; el.innerHTML='<b>\uD83D\uDD14 '+esc(title)+'</b><div style="color:#64748B">'+esc(body)+'</div>';
  const list=document.getElementById("notifList"); if(list) list.prepend(el);
}
let notifInterval=null;
function startNotifLoop(){
  if(notifInterval) clearInterval(notifInterval);
  const enabled=document.getElementById("notifToggle")&&document.getElementById("notifToggle").checked;
  if(!enabled) return;
  notifInterval=setInterval(()=>{
    const now=new Date(),iso=now.toISOString().slice(0,10),hm=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
    tasks.forEach(t=>{
      if(t.done||!t.time) return;
      if(t.date===iso&&t.time===hm){
        const key="notified_"+t.id+"_"+iso+"_"+hm;
        if(localStorage.getItem(key)) return;
        localStorage.setItem(key,"1");
        notify("\u06cc\u0627\u062f\u0622\u0648\u0631\u06cc: "+t.title,(t.desc||"")+" \u2014 "+t.time);
        toast("\u23F0 "+t.title);
      }
    });
    const dailyEl=document.getElementById("dailyTime");
    const dailyTime=dailyEl?dailyEl.value:"09:00";
    if(dailyTime===hm){
      const k="daily_"+iso;
      if(!localStorage.getItem(k)){
        localStorage.setItem(k,"1");
        const pending=tasks.filter(t=>!t.done&&t.date===iso).length,done=tasks.filter(t=>t.done&&t.date===iso).length;
        notify("\u062e\u0644\u0627\u0635\u0647 \u0627\u0645\u0631\u0648\u0632",done+" \u0627\u0646\u062c\u0627\u0645\u200c\u0634\u062f\u0647\u060c "+pending+" \u0628\u0627\u0642\u06cc\u200c\u0645\u0627\u0646\u062f\u0647");
      }
    }
  },30000);
  const everyEl=document.getElementById("remindEvery");
  const every=everyEl?parseInt(everyEl.value,10)*6e4:36e5;
  setTimeout(function loop(){
    const tog=document.getElementById("notifToggle");
    if(!tog||!tog.checked) return;
    const iso=todayStr(),pending=tasks.filter(t=>!t.done&&t.date===iso).length;
    if(pending>0) notify("\u06cc\u0627\u062f\u0622\u0648\u0631\u06cc \u062f\u0648\u0631\u0647\u200c\u0627\u06cc",pending+" \u06a9\u0627\u0631 \u0628\u0631\u0627\u06cc \u0627\u0645\u0631\u0648\u0632 \u0628\u0627\u0642\u06cc \u0645\u0627\u0646\u062f\u0647");
    setTimeout(loop,every);
  },every);
}
let pushTimer=null;
function pushDebounced(){clearTimeout(pushTimer);pushTimer=setTimeout(()=>pushToSheet(),900)}
async function pushToSheet(){
  const url=getSheetUrl(); if(!url) return;
  try{
    await fetch(url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"sync",tasks,exportedAt:new Date().toISOString()})});
    const st=document.getElementById("sheetStatus"); if(st) st.textContent="\u0648\u0636\u0639\u06cc\u062a: \u0627\u0631\u0633\u0627\u0644 \u0634\u062f ("+new Date().toLocaleTimeString("fa-IR")+")";
  }catch(e){
    const st=document.getElementById("sheetStatus"); if(st) st.textContent="\u062e\u0637\u0627 \u062f\u0631 \u0627\u0631\u0633\u0627\u0644: "+e.message;
  }
}
async function pullFromSheet(){
  const url=getSheetUrl(); if(!url){toast("\u0627\u0648\u0644 URL \u0634\u06cc\u062a \u0631\u0627 \u0630\u062e\u06cc\u0631\u0647 \u06a9\u0646");return;}
  try{
    const res=await fetch(url+"?action=get",{method:"GET"});
    const data=await res.json();
    if(Array.isArray(data.tasks)&&data.tasks.length){
      if(confirm(data.tasks.length+" \u06a9\u0627\u0631 \u0627\u0632 \u0634\u06cc\u062a \u062f\u0631\u06cc\u0627\u0641\u062a \u0634\u062f. \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646 \u0634\u0648\u062f\u061f")){tasks=data.tasks;save();render();toast("\u0627\u0632 \u0634\u06cc\u062a \u062f\u0631\u06cc\u0627\u0641\u062a \u0634\u062f");}
    } else toast("\u0634\u06cc\u062a \u062e\u0627\u0644\u06cc \u0627\u0633\u062a");
  }catch(e){toast("\u062e\u0637\u0627 \u062f\u0631 \u062f\u0631\u06cc\u0627\u0641\u062a: "+e.message)}
}
async function testSheet(){
  const url=getSheetUrl()||(document.getElementById("sheetUrl")?document.getElementById("sheetUrl").value.trim():"");
  if(!url){toast("URL \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646");return;}
  try{await fetch(url,{method:"POST",mode:"no-cors",body:JSON.stringify({action:"ping"})});toast("\u062f\u0631\u062e\u0648\u0627\u0633\u062a \u0627\u0631\u0633\u0627\u0644 \u0634\u062f");document.getElementById("sheetStatus").textContent="\u0648\u0636\u0639\u06cc\u062a: \u062a\u0633\u062a \u0627\u0631\u0633\u0627\u0644 \u0634\u062f";}catch(e){toast("\u062e\u0637\u0627: "+e.message)}
}
function exportCsv(){
  const rows=[["title","desc","date","time","priority","tag","repeat","done"].join(",")];
  tasks.forEach(t=>rows.push([t.title,t.desc,t.date,t.time,t.prio,t.tag,t.repeat,t.done?"1":"0"].map(v=>'"'+String(v).replace(/"/g,"''")+'"').join(",")));
  const blob=new Blob([rows.join("\n")],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="taskflow-"+todayStr()+".csv";a.click();
}
function backupJson(){
  const blob=new Blob([JSON.stringify(tasks,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="taskflow-backup-"+todayStr()+".json";a.click();
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;const b=document.getElementById("btnInstall"); if(b) b.style.display="inline-flex"});
function doInstall(){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(()=>deferredPrompt=null);} else toast("\u0627\u0632 \u0645\u0646\u0648\u06cc \u0645\u0631\u0648\u0631\u06af\u0631 \u06af\u0632\u06cc\u0646\u0647 Install \u0631\u0627 \u0628\u0632\u0646")}
let toastTimer=null;
function toast(msg){const t=document.getElementById("toast"); if(!t) return; t.textContent=msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),2600)}
const APPS_SCRIPT="function doPost(e){try{var s=SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();var d=JSON.parse(e.postData.contents);if(d.action===\"ping\"){s.appendRow([new Date(),\"PING\",\"ok\"]);return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);}if(d.action===\"sync\"&&Array.isArray(d.tasks)){s.clear();s.appendRow([\"\\u0639\\u0646\\u0648\\u0627\\u0646\",\"\\u062a\\u0648\\u0636\\u06cc\\u062d\",\"\\u062a\\u0627\\u0631\\u06cc\\u062e\",\"\\u0633\\u0627\\u0639\\u062a\",\"\\u0627\\u0648\\u0644\\u0648\\u06cc\\u062a\",\"\\u0628\\u0631\\u0686\\u0633\\u0628\",\"\\u062a\\u06a9\\u0631\\u0627\\u0631\",\"\\u0627\\u0646\\u062c\\u0627\\u0645\\u200c\\u0634\\u062f\\u0647\",\"\\u0634\\u0646\\u0627\\u0633\\u0647\",\"\\u0628\\u0647\\u200c\\u0631\\u0648\\u0632\\u0631\\u0633\\u0627\\u0646\\u06cc\"]);d.tasks.forEach(function(t){s.appendRow([t.title,t.desc,t.date,t.time,t.prio,t.tag,t.repeat,t.done?\"\\u0628\\u0644\\u0647\":\"\\u062e\\u06cc\\u0631\",t.id,new Date()]);});return ContentService.createTextOutput(JSON.stringify({ok:true,count:d.tasks.length})).setMimeType(ContentService.MimeType.JSON);}return ContentService.createTextOutput(JSON.stringify({ok:false})).setMimeType(ContentService.MimeType.JSON);}catch(err){return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON);}}function doGet(e){try{var s=SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();var rows=s.getDataRange().getValues();if(rows.length<2)return ContentService.createTextOutput(JSON.stringify({tasks:[]})).setMimeType(ContentService.MimeType.JSON);var tasks=[];for(var i=1;i<rows.length;i++){var r=rows[i];if(!r[0])continue;tasks.push({title:r[0],desc:r[1],date:String(r[2]).slice(0,10),time:String(r[3]||\"\"),prio:r[4]||\"med\",tag:r[5]||\"\",repeat:r[6]||\"none\",done:(String(r[7]).indexOf(\"\\u0628\\u0644\\u0647\")>-1),id:String(r[8]||\"\"),createdAt:Date.now()});}return ContentService.createTextOutput(JSON.stringify({tasks:tasks})).setMimeType(ContentService.MimeType.JSON);}catch(err){return ContentService.createTextOutput(JSON.stringify({tasks:[],error:String(err)})).setMimeType(ContentService.MimeType.JSON);}}";



// --- Sound engine (Web Audio, no files, mobile-safe) ---
let audioCtx=null;
function ensureAudio(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==="suspended") audioCtx.resume(); return audioCtx; }
function beep(freq,dur,type,vol,glideTo){ try{ const ac=ensureAudio(),o=ac.createOscillator(),g=ac.createGain(); o.type=type||"sine"; o.frequency.value=freq; o.connect(g); g.connect(ac.destination); const now=ac.currentTime; g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(vol,now+0.015); g.gain.exponentialRampToValueAtTime(0.0001,now+dur); if(glideTo!=null) o.frequency.linearRampToValueAtTime(glideTo,now+dur*0.7); o.start(now); o.stop(now+dur+0.05);}catch(e){} }
function soundEnabled(){ const el=document.getElementById("soundToggle"); return el?el.checked:true; }
function soundVol(){ const el=document.getElementById("soundVol"); const v=el?parseInt(el.value,10):70; return Math.max(0,Math.min(100,v))/100; }
function playSound(kind){ if(!soundEnabled()) return; const v=soundVol()*0.22; if(kind==="done"){ beep(880,0.12,"sine",v); setTimeout(()=>beep(1320,0.18,"sine",v*0.9),90); if(navigator.vibrate) navigator.vibrate(35);} else if(kind==="reminder"){ beep(740,0.22,"triangle",v); setTimeout(()=>beep(640,0.22,"triangle",v),160); setTimeout(()=>beep(880,0.28,"sine",v*0.85),340); if(navigator.vibrate) navigator.vibrate([80,40,80]);} else if(kind==="overdue"){ beep(220,0.35,"sawtooth",v*0.6,180); setTimeout(()=>beep(180,0.4,"sawtooth",v*0.5,160),280); if(navigator.vibrate) navigator.vibrate([120,60,120,60,180]);} else if(kind==="add"){ beep(640,0.10,"sine",v); setTimeout(()=>beep(880,0.12,"sine",v),80);} else if(kind==="delete"){ beep(300,0.18,"triangle",v*0.7,180);} else beep(600,0.14,"sine",v); }
function confettiBurst(x,y){ const emojis=["\uD83C\uDF89","\u2728","\uD83C\uDF1F"]; for(let i=0;i<9;i++){ const s=document.createElement("div"); s.className="confetti"; s.textContent=emojis[Math.floor(Math.random()*emojis.length)]; s.style.left=(x+(Math.random()*120-60))+"px"; s.style.top=(y+(Math.random()*20-10))+"px"; s.style.animationDelay=(Math.random()*120)+"ms"; s.style.fontSize=(14+Math.random()*10)+"px"; document.body.appendChild(s); setTimeout(()=>s.remove(),1000);} }
const _origNotify=notify; notify=function(title,body){ _origNotify(title,body); if(title.includes("\u0639\u0642\u0628")||title.includes("overdue")) playSound("overdue"); else playSound("reminder"); };
// overdue scan
function scanOverdue(){ const today=todayStr(); const overdue=tasks.filter(t=>!t.done&&t.date<today); if(overdue.length){ const key="overdue_day_"+today; if(!localStorage.getItem(key)&&soundEnabled()){ localStorage.setItem(key,"1"); notify("\u23F0 \u06A9\u0627\u0631\u0647\u0627\u06CC \u0639\u0642\u0628\u200C\u0627\u0641\u062A\u0627\u062F\u0647", overdue.length+" \u06A9\u0627\u0631 \u0627\u0632 \u0645\u0648\u0639\u062F \u06AF\u0630\u0634\u062A\u0647"); playSound("overdue"); } } }
const _origRenderList=renderList; renderList=function(){ _origRenderList(); document.querySelectorAll(".task-item").forEach(el=>{ if(el.innerHTML.includes("\u0639\u0642\u0628")) el.classList.add("overdue"); }); };



// ========== 7 FEATURES ==========
// 1. Daily Template
const TPL_KEY="tf_templates";
function getTemplates(){ try{return JSON.parse(localStorage.getItem(TPL_KEY)||"[]")}catch{return[]} }
function saveTemplates(t){ localStorage.setItem(TPL_KEY, JSON.stringify(t)) }
function saveCurrentAsTemplate(){
  const name=(document.getElementById("tplName")?.value||"").trim();
  if(!name){ toast("نام قالب را وارد کن"); return; }
  const tpl={id:uid(), name, tasks: tasks.filter(t=>!t.done).map(t=>({title:t.title,desc:t.desc,prio:t.prio,tag:t.tag,repeat:t.repeat,time:t.time})), createdAt:Date.now()};
  const all=getTemplates(); all.push(tpl); saveTemplates(all); toast("قالب ذخیره شد: "+name); renderTplList();
  const inp=document.getElementById("tplName"); if(inp) inp.value="";
}
function applyTemplate(id){
  const all=getTemplates(); const tpl=all.find(t=>t.id===id);
  if(!tpl) return;
  const today=todayStr();
  let added=0;
  tpl.tasks.forEach(it=>{
    if(!tasks.some(t=>t.title===it.title && t.date===today)){
      tasks.unshift(Object.assign({id:uid(), date:today, done:false, createdAt:Date.now()}, it));
      added++;
    }
  });
  if(added){ save(); render(); toast(added+" کار از قالب اضافه شد"); }
  else toast("همه کارها قبلاً اضافه شده‌اند");
}
function deleteTemplate(id){ if(!confirm("حذف شود؟")) return; const all=getTemplates().filter(t=>t.id!==id); saveTemplates(all); renderTplList(); toast("حذف شد"); }
function renderTplList(){
  const el=document.getElementById("tplList"); if(!el) return;
  const all=getTemplates();
  if(!all.length){ el.innerHTML='<div style="font-size:11px;color:#94A3B8;padding:10px;text-align:center">هیچ قالبی نداری — با «ذخیره به‌عنوان قالب» یک قالب بساز</div>'; return; }
  let h="";
  all.forEach(t=>{
    h+='<div style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--gray-200);border-radius:12px;margin-bottom:8px;background:var(--gray-50)"><div style="flex:1"><b style="font-size:12px">'+esc(t.name)+'</b><small style="display:block;color:var(--gray-500)">'+t.tasks.length+' کار - '+(new Date(t.createdAt).toLocaleDateString("fa-IR"))+'</small></div><button class="btn btn-teal btn-sm" data-tpl-apply="'+t.id+'">اعمال</button><button class="icon-btn" data-tpl-del="'+t.id+'" style="width:30px;height:30px">\uD83D\uDDD1</button></div>';
  });
  el.innerHTML=h;
}
function applyTodayTemplate(){
  // "امروزم را بساز" : اگر قالبی هست آخرین قالب، وگرنه کارهای دیروز را کپی کن
  const all=getTemplates();
  if(all.length){
    applyTemplate(all[all.length-1].id);
  } else {
    // fallback: copy pending tasks from yesterday
    const y=new Date(Date.now()-864e5).toISOString().slice(0,10);
    const yTasks=tasks.filter(t=>t.date===y);
    if(!yTasks.length){ toast("کاری برای دیروز یافت نشد"); return; }
    const today=todayStr(); let added=0;
    yTasks.forEach(t=>{
      if(!tasks.some(x=>x.title===t.title && x.date===today)){
        tasks.unshift(Object.assign({}, t, {id:uid(), date:today, done:false, createdAt:Date.now()}));
        added++;
      }
    });
    if(added){ save(); render(); toast(added+" کار از دیروز کپی شد"); }
    else toast("همه کارها قبلاً اضافه شده‌اند");
  }
}

// 2. Pomodoro
let pomoTimer=null, pomoSec=1500, pomoRunning=false, pomoTaskId=null;
function fmtSec(s){ const m=String(Math.floor(s/60)).padStart(2,"0"), ss=String(s%60).padStart(2,"0"); return m+":"+ss; }
function updatePomoDisplay(){
  const el=document.getElementById("pomoTime"), lab=document.getElementById("pomoLabel");
  if(el) el.textContent=fmtSec(pomoSec);
  if(lab){
    if(pomoRunning) lab.textContent="در حال تمرکز...";
    else if(pomoSec<1500 && pomoSec>0) lab.textContent="متوقف — ادامه بده";
    else lab.textContent="پومودورو — تمرکز ۲۵ دقیقه";
  }
  // update task select
  const sel=document.getElementById("pomoTask");
  if(sel && sel.options.length<=1){
    sel.innerHTML='<option value="">\u2014 انتخاب کار \u2014</option>' + tasks.filter(t=>!t.done).slice(0,20).map(t=>'<option value="'+t.id+'">'+esc(t.title.slice(0,30))+'</option>').join("");
    if(pomoTaskId) sel.value=pomoTaskId;
  }
}
function startPomo(){
  if(pomoRunning) return;
  const sel=document.getElementById("pomoTask");
  if(sel) pomoTaskId=sel.value||null;
  pomoRunning=true;
  document.getElementById("pomoStart").style.display="none";
  document.getElementById("pomoPause").style.display="inline-flex";
  ensureAudio();
  pomoTimer=setInterval(()=>{
    pomoSec--; updatePomoDisplay();
    if(pomoSec<=0){
      clearInterval(pomoTimer); pomoRunning=false; pomoSec=1500;
      document.getElementById("pomoStart").style.display="inline-flex";
      document.getElementById("pomoPause").style.display="none";
      updatePomoDisplay();
      playSound("reminder");
      notify("پومودورو تمام شد!", "۲۵ دقیقه تمام — یک استراحت کوتاه کن");
      // auto mark pomo task as progress?
      if(pomoTaskId){
        toast("پومودورو تمام! استراحت کن");
      }
      if(navigator.vibrate) navigator.vibrate([100,50,100,50,200]);
    }
  },1000);
  updatePomoDisplay();
}
function pausePomo(){
  if(!pomoRunning) return;
  clearInterval(pomoTimer); pomoRunning=false;
  document.getElementById("pomoStart").style.display="inline-flex";
  document.getElementById("pomoPause").style.display="none";
  updatePomoDisplay();
}
function resetPomo(){
  clearInterval(pomoTimer); pomoRunning=false; pomoSec=1500;
  const s=document.getElementById("pomoStart"), pa=document.getElementById("pomoPause");
  if(s) s.style.display="inline-flex";
  if(pa) pa.style.display="none";
  updatePomoDisplay();
}

// 3. Category filter
let activeCat="all";
function applyCatFilter(){
  renderList();
}
const _origRenderList2 = renderList;
renderList = function(){
  // call original logic but also filter by category
  const q=(document.getElementById("search").value||"").trim().toLowerCase();
  const today=todayStr();
  let list=[...tasks];
  const f = (typeof filter!=="undefined"?filter:"all");
  if(f==="today") list=list.filter(t=>t.date===today);
  else if(f==="pending") list=list.filter(t=>!t.done);
  else if(f==="done") list=list.filter(t=>t.done);
  else if(f==="overdue") list=list.filter(t=>!t.done&&t.date<today);
  if(q) list=list.filter(t=>(t.title+t.desc+t.tag).toLowerCase().includes(q));
  // category
  if(activeCat!=="all"){
    if(activeCat==="other") list=list.filter(t=>!["\u06a9\u0627\u0631\u06cc","\u0634\u062e\u0635\u06cc","\u0633\u0644\u0627\u0645\u062a\u06cc"].includes(t.tag));
    else list=list.filter(t=>t.tag===activeCat);
  }
  const sortEl=document.getElementById("sortSel");
  const sort=sortEl?sortEl.value:"newest";
  if(sort==="due") list.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  else if(sort==="priority"){const w={high:0,med:1,low:2};list.sort((a,b)=>w[a.prio]-w[b.prio]);}
  else list.sort((a,b)=>b.createdAt-a.createdAt);
  const sub=document.getElementById("taskSubtitle");
  if(sub) sub.textContent=list.length+" \u06a9\u0627\u0631 \u2014 "+tasks.filter(t=>t.done).length+" \u0627\u0646\u062c\u0627\u0645\u200c\u0634\u062f\u0647\u060c "+tasks.filter(t=>!t.done).length+" \u0628\u0627\u0642\u06cc\u200c\u0645\u0627\u0646\u062f\u0647"+(activeCat!=="all"?" \u00b7 "+activeCat:"");
  const el=document.getElementById("taskList");
  if(!el) return;
  if(!list.length){el.innerHTML='<div class="empty"><i>\uD83D\uDD0D</i>\u0686\u06cc\u0632\u06cc \u067e\u06cc\u062f\u0627 \u0646\u0634\u062f<br><small style="font-size:11px">\u0641\u06cc\u0644\u062a\u0631 \u0631\u0627 \u0639\u0648\u0636 \u06a9\u0646</small></div>';return;}
  let html="";
  list.forEach(t=>{
    const overdue=!t.done&&t.date<today;
    const rep=t.repeat!=="none"?" \u00b7 "+(t.repeat==="daily"?"\u0631\u0648\u0632\u0627\u0646\u0647":t.repeat==="weekly"?"\u0647\u0641\u062a\u06af\u06cc":"\u0634\u0646\u0628\u0647-\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647"):"";
    html+='<div class="task-item '+(t.done?"done":"")+(overdue?" overdue":"")+'"><div class="prio prio-'+t.prio+'"></div><div class="check '+(t.done?"done":"")+'" data-toggle="'+t.id+'">'+(t.done?"\u2713":"")+'</div><div class="task-info"><b>'+esc(t.title)+' '+(overdue?'<span style="color:#EF4444;font-size:10px">\u2022 \u0639\u0642\u0628\u200c\u0627\u0641\u062a\u0627\u062f\u0647</span>':"")+'</b><small>'+t.date+' '+(t.time?"\u00b7 "+t.time:"")+' '+(t.desc?"\u00b7 "+esc(t.desc.slice(0,40)):"")+rep+'</small></div>'+(t.tag?'<span class="tag">'+esc(t.tag)+'</span>':"")+'<div class="task-actions"><button class="icon-btn" data-edit="'+t.id+'" title="\u0648\u06cc\u0631\u0627\u06cc\u0634" style="width:32px;height:32px;font-size:12px">\u270E</button><button class="icon-btn" data-del="'+t.id+'" title="\u062d\u0630\u0641" style="width:32px;height:32px;font-size:12px">\uD83D\uDDD1</button></div></div>';
  });
  el.innerHTML=html;
};

// 4. Voice input
let recognition=null, listening=false;
function initVoice(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    const s=document.getElementById("voiceStatus");
    if(s) s.textContent="تشخیص صدا در این مرورگر پشتیبانی نمی‌شود — از Chrome استفاده کن";
    return null;
  }
  const r=new SR();
  r.lang="fa-IR";
  r.continuous=false; r.interimResults=true; r.maxAlternatives=1;
  return r;
}
function parseVoice(text){
  // simple parser: extract date keywords and time
  const now=new Date();
  let date=todayStr();
  const lower=text;
  // date
  if(lower.includes("فردا")) date=new Date(Date.now()+864e5).toISOString().slice(0,10);
  else if(lower.includes("پس فردا")) date=new Date(Date.now()+1728e5).toISOString().slice(0,10);
  else if(lower.includes("امروز")||lower.includes("امشب")||lower.includes("الان")){ /* keep today */ }
  // time: find HH:MM or ساعت X
  let time="";
  // look for time patterns - safe ascii regex only
  const hm = lower.match(/(\d{1,2}):(\d{2})/);
  if(hm) time=hm[1].padStart(2,"0")+":"+hm[2];
  // look for Persian time keywords via simple string search
  const hasHalf = lower.includes("\u0646\u06cc\u0645");
  let title=text.replace(/\u0641\u0631\u062f\u0627|\u067e\u0633 \u0641\u0631\u062f\u0627|\u0627\u0645\u0631\u0648\u0632/g,"").trim();
  if(!title) title=text.slice(0,40);
  // tag guess
  let tag="";
  if(lower.includes("کار")||lower.includes("جلسه")||lower.includes("گزارش")) tag="\u06a9\u0627\u0631\u06cc";
  else if(lower.includes("ورزش")||lower.includes("باشگاه")||lower.includes("سلامتی")) tag="\u0633\u0644\u0627\u0645\u062a\u06cc";
  else if(lower.includes("خرید")||lower.includes("خانه")||lower.includes("شخصی")) tag="\u0634\u062e\u0635\u06cc";
  return {title, date, time, tag};
}
function startVoice(){
  if(listening) return;
  const r=initVoice();
  if(!r){ toast("تشخیص صدا در این مرورگر فعال نیست"); return; }
  recognition=r;
  listening=true;
  const btn=document.getElementById("voiceBtn"), txt=document.getElementById("voiceText"), st=document.getElementById("voiceStatus");
  if(btn) btn.classList.add("listening");
  if(txt) txt.textContent="گوش می‌دهم...";
  if(st) st.textContent="حرف بزن — مثال: فردا ساعت ۴ گزارش بفرست";
  let finalText="";
  r.onresult=(e)=>{
    let interim="";
    for(let i=e.resultIndex;i<e.results.length;i++){
      const t=e.results[i][0].transcript;
      if(e.results[i].isFinal) finalText=t; else interim=t;
    }
    const show=finalText||interim;
    if(txt) txt.textContent=show||"گوش می‌دهم...";
    if(show){
      const parsed=parseVoice(show);
      const prev=document.getElementById("voicePreview");
      if(prev){
        prev.style.display="block";
        prev.innerHTML='<b>'+esc(parsed.title)+'</b><br><small>'+parsed.date+' '+(parsed.time||"")+' '+(parsed.tag?' \u00b7 '+esc(parsed.tag):"")+'</small><br><button class="btn btn-teal btn-sm" id="voiceConfirm" style="margin-top:8px">\u2713 افزودن همین کار</button> <button class="btn btn-ghost btn-sm" id="voiceDiscard">انصراف</button>';
        const c=document.getElementById("voiceConfirm");
        if(c) c.onclick=()=>{
          tasks.unshift(Object.assign({id:uid(), done:false, createdAt:Date.now()}, parsed, {desc:"", prio:"med", repeat:"none"}));
          save(); render(); toast("🎤 کار اضافه شد"); playSound("add");
          prev.style.display="none"; if(txt) txt.textContent="\u0622\u0645\u0627\u062f\u0647\u200c\u0627\u0645 \u2014 \u0628\u0632\u0646 \u0648 \u062d\u0631\u0641 \u0628\u0632\u0646";
        };
        const d=document.getElementById("voiceDiscard");
        if(d) d.onclick=()=>{ prev.style.display="none"; };
      }
    }
  };
  r.onerror=(e)=>{
    listening=false; if(btn) btn.classList.remove("listening");
    if(st) st.textContent="خطا: "+e.error;
    if(txt) txt.textContent="تشخیص تمام شد";
  };
  r.onend=()=>{
    listening=false; if(btn) btn.classList.remove("listening");
    if(!finalText && txt && txt.textContent==="گوش می‌دهم...") txt.textContent="\u0622\u0645\u0627\u062f\u0647\u200c\u0627\u0645 \u2014 \u0628\u0632\u0646 \u0648 \u062d\u0631\u0641 \u0628\u0632\u0646";
  };
  r.start();
  ensureAudio();
}

// 5. Telegram
function getTg(){ return {token:(localStorage.getItem("tg_token")||"").trim(), chatId:(localStorage.getItem("tg_chat")||"").trim()} }
function saveTg(){
  const t=(document.getElementById("tgToken").value||"").trim(), c=(document.getElementById("tgChatId").value||"").trim();
  localStorage.setItem("tg_token", t); localStorage.setItem("tg_chat", c);
  updateTgStatus();
  toast(t&&c?"\u0631\u0628\u0627\u062a \u0630\u062e\u06cc\u0631\u0647 \u0634\u062f":"\u0631\u0628\u0627\u062a \u067e\u0627\u06a9 \u0634\u062f");
}
function updateTgStatus(){
  const {token, chatId}=getTg();
  const el=document.getElementById("tgStatus");
  if(!el) return;
  if(token && chatId) el.textContent="\u0648\u0636\u0639\u06cc\u062a: \u0645\u062a\u0635\u0644 - "+token.slice(0,10)+"...";
  else el.textContent="\u0648\u0636\u0639\u06cc\u062a: \u062a\u0646\u0638\u06cc\u0645 \u0646\u0634\u062f\u0647";
  const a=document.getElementById("tgToken"), b=document.getElementById("tgChatId");
  if(a) a.value=token; if(b) b.value=chatId;
}
async function tgSend(text){
  const {token, chatId}=getTg();
  if(!token||!chatId){ toast("توکن ربات و Chat ID را وارد کن"); return false; }
  try{
    const url="https://api.telegram.org/bot"+token+"/sendMessage";
    const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chatId, text, parse_mode:"HTML"})});
    const data=await res.json();
    if(data.ok){ toast("\u0628\u0647 \u062a\u0644\u06af\u0631\u0627\u0645 \u0627\u0631\u0633\u0627\u0644 \u0634\u062f"); return true; }
    else { toast("خطای تلگرام: "+(data.description||"")); return false; }
  }catch(e){ toast("خطا: "+e.message); return false; }
}
async function testTg(){ await tgSend("\u2705 \u062a\u0633\u062a TaskFlow Pro - \u067e\u06cc\u0627\u0645 \u0622\u0632\u0645\u0627\u06cc\u0634\u06cc!"); }
async function sendPendingToTg(){
  const today=todayStr();
  const pending=tasks.filter(t=>t.date===today);
  if(!pending.length){ toast("\u0627\u0645\u0631\u0648\u0632 \u06a9\u0627\u0631\u06cc \u0646\u062f\u0627\u0631\u06cc"); return; }
  let txt="<b>\uD83D\uDCCB \u06a9\u0627\u0631\u0647\u0627\u06cc \u0627\u0645\u0631\u0648\u0632 ("+today+")</b>\n";
  pending.forEach((t,i)=>{
    const st=t.done?"\u2705":"?";
    txt+= st+" "+t.title+(t.time?" ? "+t.time:"")+(t.tag?" #"+t.tag:"")+"\n";
  });
  const done=pending.filter(t=>t.done).length;
  txt+="\n\uD83D\uDCCA "+done+"/"+pending.length+" \u0627\u0646\u062c\u0627\u0645 \u0634\u062f";
  await tgSend(txt);
}

// 6. Google Calendar
function gcalUrl(task){
  const title=encodeURIComponent(task.title);
  const details=encodeURIComponent(task.desc||"");
  let dates="";
  if(task.date){
    const d=task.date.replace(/-/g,"");
    const start = task.time ? (d+"T"+task.time.replace(":","")+"00") : d;
    const end = task.time ? (d+"T"+String(parseInt(task.time.split(":")[0],10)+1).padStart(2,"0")+task.time.split(":")[1]+"00") : d;
    dates=start+"/"+end;
  }
  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text="+title+"&details="+details+"&dates="+dates;
}
function addTodayToGcal(){
  const today=todayStr();
  const list=tasks.filter(t=>t.date===today);
  if(!list.length){ toast("\u0627\u0645\u0631\u0648\u0632 \u06a9\u0627\u0631\u06cc \u0646\u062f\u0627\u0631\u06cc"); return; }
  // open first task; for multiple, open each with delay
  list.slice(0,3).forEach((t,i)=>{
    setTimeout(()=> window.open(gcalUrl(t), "_blank"), i*600);
  });
  toast(list.length+" \u06a9\u0627\u0631 \u0628\u0647 \u062a\u0642\u0648\u06cc\u0645 \u0641\u0631\u0633\u062a\u0627\u062f\u0647 \u0634\u062f");
}
function addAllToGcal(){
  if(!tasks.length){ toast("\u06a9\u0627\u0631\u06cc \u0646\u062f\u0627\u0631\u06cc"); return; }
  tasks.slice(0,5).forEach((t,i)=>{
    setTimeout(()=> window.open(gcalUrl(t), "_blank"), i*700);
  });
  toast("5 \u06a9\u0627\u0631 \u0627\u0648\u0644 \u0628\u0647 \u062a\u0642\u0648\u06cc\u0645 \u0641\u0631\u0633\u062a\u0627\u062f\u0647 \u0634\u062f");
}

// 7. Weekly PDF Report (uses print + also email via mailto)
function buildWeeklyHtml(){
  const days=[];
  for(let i=6;i>=0;i--){
    const d=new Date(Date.now()-i*864e5), iso=d.toISOString().slice(0,10), label=d.toLocaleDateString("fa-IR",{weekday:"long", month:"short", day:"numeric"});
    const tot=tasks.filter(t=>t.date===iso).length, dn=tasks.filter(t=>t.date===iso&&t.done).length;
    days.push({label, iso, tot, dn});
  }
  const total=tasks.length, done=tasks.filter(t=>t.done).length, rate=total?Math.round(done/total*100):0;
  let rows=days.map(d=>'<tr><td>'+d.label+'</td><td>'+d.iso+'</td><td>'+d.dn+'</td><td>'+d.tot+'</td><td>'+(d.tot?Math.round(d.dn/d.tot*100):0)+'%</td></tr>').join("");
  let list=tasks.slice(0,30).map(t=>'<tr><td>'+esc(t.title)+'</td><td>'+t.date+' '+(t.time||"")+'</td><td>'+(t.tag||"")+'</td><td>'+(t.done?"\u2705":"?")+'</td></tr>').join("");
  return '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>گزارش هفتگی TaskFlow</title><style>body{font-family:"Vazirmatn",Tahoma,sans-serif;padding:24px;color:#0F172A}h1{color:#0D9488}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #E2E8F0;padding:8px;text-align:right;font-size:12px}th{background:#F0FDFA;color:#0F766E}.badge{display:inline-block;padding:4px 10px;border-radius:999px;background:#CCFBF1;color:#0F766E;font-weight:700}</style></head><body><h1>TaskFlow Pro - گزارش هفتگی</h1><p>تاریخ: '+(new Date().toLocaleDateString("fa-IR"))+' <span class="badge">'+done+'/'+total+' ('+rate+'%)</span></p><h3>عملکرد ۷ روز</h3><table><tr><th>روز</th><th>تاریخ</th><th>انجام‌شده</th><th>کل</th><th>درصد</th></tr>'+rows+'</table><h3>فهرست کارها</h3><table><tr><th>عنوان</th><th>تاریخ</th><th>برچسب</th><th>وضعیت</th></tr>'+list+'</table><script>window.onload=()=>window.print()<'+'/script></body></html>';
}
function openWeeklyPdf(){
  const html=buildWeeklyHtml();
  const w=window.open("", "_blank");
  if(!w){ toast("پاپ‌آپ مسدود شد — اجازه بده"); return; }
  w.document.write(html); w.document.close();
}
function sendEmailReport(){
  const total=tasks.length, done=tasks.filter(t=>t.done).length;
  const subject=encodeURIComponent("\u06af\u0632\u0627\u0631\u0634 \u0647\u0641\u062a\u06af\u06cc TaskFlow - "+done+"/"+total+" \u0627\u0646\u062c\u0627\u0645 \u0634\u062f");
  let body="\u06af\u0632\u0627\u0631\u0634 TaskFlow Pro\n\n";
  for(let i=6;i>=0;i--){
    const d=new Date(Date.now()-i*864e5), iso=d.toISOString().slice(0,10);
    const tot=tasks.filter(t=>t.date===iso).length, dn=tasks.filter(t=>t.date===iso&&t.done).length;
    body+= iso+" : "+dn+"/"+tot+" ("+(tot?Math.round(dn/tot*100):0)+"%)\n";
  }
  body+="\n---\n";
  tasks.slice(0,15).forEach(t=>{ body+= (t.done?"[x] ":"[ ] ")+t.title+" - "+t.date+" "+(t.time||"")+"\n"; });
  const url="mailto:?subject="+subject+"&body="+encodeURIComponent(body);
  window.location.href=url;
  toast("ایمیل باز شد — ارسال کن");
}

document.addEventListener("DOMContentLoaded",()=>{
  load();
  const nt=document.getElementById("notifToggle"),dt=document.getElementById("dailyTime"),re=document.getElementById("remindEvery"),su=document.getElementById("sheetUrl");
  if(nt) nt.checked=localStorage.getItem("tf_notif")==="1";
  if(dt) dt.value=localStorage.getItem("tf_daily")||"09:00";
  if(re) re.value=localStorage.getItem("tf_every")||"60";
  if(su) su.value=getSheetUrl();
  render(); startNotifLoop(); scanOverdue(); setInterval(scanOverdue, 60000); const _st=document.getElementById("soundToggle"),_sv=document.getElementById("soundVol"); if(_st){ _st.checked=localStorage.getItem("tf_sound")!=="0"; _st.onchange=e=>{ localStorage.setItem("tf_sound",e.target.checked?"1":"0"); if(e.target.checked) playSound("add"); }; } if(_sv){ _sv.value=localStorage.getItem("tf_vol")||"70"; _sv.oninput=e=>localStorage.setItem("tf_vol",e.target.value); } const _ts=document.getElementById("testSound"); if(_ts) _ts.onclick=()=>{ ensureAudio(); playSound("reminder"); toast("\u266B \u0635\u062F\u0627 \u062A\u0633\u062A \u0634\u062F"); }; ["click","touchstart","keydown"].forEach(ev=> window.addEventListener(ev, ()=>{ try{ ensureAudio(); }catch(e){} }, {once:true}));
  const bind=(id,fn)=>{const e=document.getElementById(id); if(e) e.onclick=fn};
  bind("newTaskBtn",()=>openModal(null));
  bind("addTask2",()=>openModal(null));
  bind("heroAdd",()=>openModal(null));
  bind("heroSync",()=>{if(!getSheetUrl()){toast("\u0627\u0648\u0644 \u0627\u062a\u0635\u0627\u0644 \u0634\u06cc\u062a \u0631\u0627 \u062a\u0646\u0638\u06cc\u0645 \u06a9\u0646");document.getElementById("sheet").scrollIntoView({behavior:"smooth"})}else pushToSheet()});
  bind("closeModal",closeModal); bind("cancelModal",closeModal);
  const modal=document.getElementById("modal"); if(modal) modal.addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
  bind("saveTask",saveTask);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal(); if(e.key==="Enter"&&e.ctrlKey&&document.getElementById("modal").classList.contains("open")) saveTask()});
  document.querySelectorAll(".filter-btn").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.f;renderList()});
  const search=document.getElementById("search"); if(search) search.oninput=()=>renderList();
  const sort=document.getElementById("sortSel"); if(sort) sort.onchange=()=>renderList();
  const tl=document.getElementById("taskList");
  if(tl) tl.onclick=e=>{
    const tgl=e.target.closest("[data-toggle]"); if(tgl){const id=tgl.dataset.toggle,idx=tasks.findIndex(x=>x.id===id); if(idx>-1){tasks[idx].done=!tasks[idx].done;save();render();const __isDone=tasks[idx].done; toast(__isDone?"\u0627\u0646\u062C\u0627\u0645 \u0634\u062F":"\u0628\u0631\u06AF\u0634\u062A \u0628\u0647 \u0644\u06CC\u0633\u062A"); if(__isDone){ playSound("done"); try{ const r=e.target.getBoundingClientRect(); confettiBurst(r.left+r.width/2,r.top); const row=e.target.closest(".task-item"); if(row){ row.classList.add("justDone"); setTimeout(()=>row.classList.remove("justDone"),600);} }catch(e){} } else try{ playSound("add"); }catch(e){}; if(Notification.permission==="granted"&&tasks[idx].done) notify("\u0622\u0641\u0631\u06cc\u0646!",tasks[idx].title+" \u0627\u0646\u062c\u0627\u0645 \u0634\u062f");} return;}
    const ed=e.target.closest("[data-edit]"); if(ed){openModal(ed.dataset.edit);return;}
    const del=e.target.closest("[data-del]"); if(del){if(confirm("\u062d\u0630\u0641 \u0634\u0648\u062f\u061f")){tasks=tasks.filter(x=>x.id!==del.dataset.del);save();render();toast("\u062d\u0630\u0641 \u0634\u062f")} return;}
  };
  const ht=document.getElementById("heroTasks");
  if(ht) ht.onclick=e=>{const tgl=e.target.closest("[data-toggle]"); if(tgl){const id=tgl.dataset.toggle,idx=tasks.findIndex(x=>x.id===id); if(idx>-1){tasks[idx].done=!tasks[idx].done;save();render()}}};
  bind("saveSheet",()=>{const v=document.getElementById("sheetUrl").value.trim(); setSheetUrl(v); updateSheetStatus(); toast(v?"\u0627\u062a\u0635\u0627\u0644 \u0630\u062e\u06cc\u0631\u0647 \u0634\u062f":"\u0627\u062a\u0635\u0627\u0644 \u062d\u0630\u0641 \u0634\u062f"); if(v) pushToSheet()});
  bind("testSheet",testSheet); bind("pullSheet",pullFromSheet);
  bind("pushSheet",()=>{if(!getSheetUrl()) return toast("URL \u0634\u06cc\u062a \u062a\u0646\u0638\u06cc\u0645 \u0646\u06cc\u0633\u062a"); pushToSheet(); toast("\u062f\u0631 \u062d\u0627\u0644 \u0627\u0631\u0633\u0627\u0644...")});
  bind("exportCsv",exportCsv);
  bind("notifBtn",()=>{ensureNotifyPermission(); if(Notification.permission==="granted"){toast("\u06cc\u0627\u062f\u0622\u0648\u0631\u06cc \u0641\u0639\u0627\u0644 \u0627\u0633\u062a");const c=document.getElementById("notifToggle"); if(c){c.checked=true;localStorage.setItem("tf_notif","1");} startNotifLoop();} else if(Notification.permission==="denied") toast("\u062f\u0633\u062a\u0631\u0633\u06cc \u0646\u0627\u062a\u06cc\u0641\u06cc\u06a9\u06cc\u0634\u0646 \u0645\u0633\u062f\u0648\u062f \u0627\u0633\u062a"); else Notification.requestPermission().then(p=>toast(p==="granted"?"\u0641\u0639\u0627\u0644 \u0634\u062f":"\u0631\u062f \u0634\u062f"))});
  bind("testNotif",()=>{ensureNotifyPermission(); if(Notification.permission!=="granted") return toast("\u0627\u0648\u0644 \u0627\u062c\u0627\u0632\u0647 \u0646\u0627\u062a\u06cc\u0641\u06cc\u06a9\u06cc\u0634\u0646 \u0628\u062f\u0647"); notify("\u062a\u0633\u062a \u06cc\u0627\u062f\u0622\u0648\u0631\u06cc","\u0627\u06cc\u0646 \u06cc\u06a9 \u0646\u0627\u062a\u06cc\u0641\u06cc\u06a9\u06cc\u0634\u0646 \u0622\u0632\u0645\u0627\u06cc\u0634\u06cc \u0627\u0633\u062a"); toast("\u0646\u0627\u062a\u06cc\u0641\u06cc\u06a9\u06cc\u0634\u0646 \u062a\u0633\u062a \u0627\u0631\u0633\u0627\u0644 \u0634\u062f")});
  const tog=document.getElementById("notifToggle"); if(tog) tog.onchange=e=>{localStorage.setItem("tf_notif",e.target.checked?"1":"0"); if(e.target.checked) ensureNotifyPermission(); startNotifLoop(); toast(e.target.checked?"\u06cc\u0627\u062f\u0622\u0648\u0631\u06cc \u0641\u0639\u0627\u0644 \u0634\u062f":"\u06cc\u0627\u062f\u0622\u0648\u0631\u06cc \u062e\u0627\u0645\u0648\u0634 \u0634\u062f")};
  const dti=document.getElementById("dailyTime"); if(dti) dti.onchange=e=>localStorage.setItem("tf_daily",e.target.value);
  const rem=document.getElementById("remindEvery"); if(rem) rem.onchange=e=>{localStorage.setItem("tf_every",e.target.value); startNotifLoop()};
  bind("btnInstall",doInstall); bind("btnBackup",backupJson);
  bind("btnRestore",()=>{const f=document.getElementById("restoreFile"); if(f) f.click()});
  const rf=document.getElementById("restoreFile");
  if(rf) rf.onchange=e=>{const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{try{const d=JSON.parse(r.result); if(Array.isArray(d)){tasks=d;save();render();toast("\u0628\u0627\u0632\u06cc\u0627\u0628\u06cc \u0634\u062f")} else toast("\u0641\u0631\u0645\u062a \u0646\u0627\u0645\u0639\u062a\u0628\u0631")}catch{toast("\u0641\u0627\u06cc\u0644 \u062e\u0631\u0627\u0628 \u0627\u0633\u062a")}}; r.readAsText(f)};
  bind("btnClear",()=>{if(confirm("\u0647\u0645\u0647 \u06a9\u0627\u0631\u0647\u0627 \u062d\u0630\u0641 \u0634\u0648\u0646\u062f\u061f")){tasks=[];save();render();toast("\u067e\u0627\u06a9 \u0634\u062f")}});
  bind("btnDemo",()=>{localStorage.removeItem(LS);load();render();toast("\u062f\u0627\u062f\u0647 \u0646\u0645\u0648\u0646\u0647 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0634\u062f")});
  bind("btnShare",()=>{
    const done=tasks.filter(t=>t.done).length,total=tasks.length;
    const txt="\u06af\u0632\u0627\u0631\u0634 TaskFlow \u2014 "+done+"/"+total+" \u0627\u0646\u062c\u0627\u0645\u200c\u0634\u062f\u0647 ("+(total?Math.round(done/total*100):0)+"%)\n"+tasks.filter(t=>t.done).slice(0,8).map(t=>"\u2713 "+t.title).join("\n");
    if(navigator.share) navigator.share({title:"TaskFlow",text:txt}).catch(()=>{});
    else if(navigator.clipboard) navigator.clipboard.writeText(txt).then(()=>toast("\u0622\u0645\u0627\u0631 \u06a9\u067e\u06cc \u0634\u062f"));
    else toast(txt);
  });
  bind("btnResetWeek",()=>{if(confirm("\u0622\u0645\u0627\u0631 \u0647\u0641\u062a\u0647 \u0631\u06cc\u0633\u062a \u0634\u0648\u062f\u061f")) toast("\u0646\u0645\u0648\u062f\u0627\u0631 \u0628\u0631 \u0627\u0633\u0627\u0633 \u062f\u0627\u062f\u0647 \u0641\u0639\u0644\u06cc \u0627\u0633\u062a")});
  document.addEventListener("keydown",e=>{if(e.key.toLowerCase()==="n"&&!document.getElementById("modal").classList.contains("open")&&e.target.tagName!=="INPUT"&&e.target.tagName!=="TEXTAREA") openModal(null)});
  
  // -- 7 features wiring --
  renderTplList();
  updatePomoDisplay();
  updateTgStatus();
  // template buttons
  const _bTpl=document.getElementById("btnTplToday"); if(_bTpl) _bTpl.onclick=applyTodayTemplate;
  const _bSaveTpl=document.getElementById("btnSaveTpl"); if(_bSaveTpl) _bSaveTpl.onclick=()=>{ document.getElementById("tplModal").classList.add("open"); renderTplList(); };
  const _bTplManage=document.getElementById("btnTplManage"); if(_bTplManage) _bTplManage.onclick=()=>{ document.getElementById("tplModal").classList.add("open"); renderTplList(); };
  const _closeTpl=document.getElementById("closeTplModal"); if(_closeTpl) _closeTpl.onclick=()=> document.getElementById("tplModal").classList.remove("open");
  const _cancelTpl=document.getElementById("cancelTpl"); if(_cancelTpl) _cancelTpl.onclick=()=> document.getElementById("tplModal").classList.remove("open");
  const _saveTplBtn=document.getElementById("saveTplBtn"); if(_saveTplBtn) _saveTplBtn.onclick=saveCurrentAsTemplate;
  const _tplModal=document.getElementById("tplModal"); if(_tplModal) _tplModal.addEventListener("click",e=>{ if(e.target.id==="tplModal") _tplModal.classList.remove("open"); });
  const _tplList=document.getElementById("tplList"); if(_tplList) _tplList.onclick=e=>{
    const a=e.target.closest("[data-tpl-apply]"); if(a){ applyTemplate(a.dataset.tplApply); document.getElementById("tplModal").classList.remove("open"); return; }
    const d=e.target.closest("[data-tpl-del]"); if(d){ deleteTemplate(d.dataset.tplDel); return; }
  };
  // pomo
  const _pStart=document.getElementById("pomoStart"); if(_pStart) _pStart.onclick=startPomo;
  const _pPause=document.getElementById("pomoPause"); if(_pPause) _pPause.onclick=pausePomo;
  const _pReset=document.getElementById("pomoReset"); if(_pReset) _pReset.onclick=resetPomo;
  // voice
  const _vBtn=document.getElementById("voiceBtn"); if(_vBtn) _vBtn.onclick=startVoice;
  // category tabs
  document.querySelectorAll(".cat-tab").forEach(b=> b.onclick=()=>{
    document.querySelectorAll(".cat-tab").forEach(x=>x.classList.remove("active"));
    b.classList.add("active"); activeCat=b.dataset.cat; renderList();
  });
  // telegram
  const _tgSave=document.getElementById("btnTgSave"); if(_tgSave) _tgSave.onclick=saveTg;
  const _tgTest=document.getElementById("btnTgTest"); if(_tgTest) _tgTest.onclick=testTg;
  const _tgSend=document.getElementById("btnTgSendPending"); if(_tgSend) _tgSend.onclick=sendPendingToTg;
  // gcal
  const _gToday=document.getElementById("btnGcalToday"); if(_gToday) _gToday.onclick=addTodayToGcal;
  const _gAll=document.getElementById("btnGcalAll"); if(_gAll) _gAll.onclick=addAllToGcal;
  // weekly pdf / email
  let pdfBtn=document.getElementById("btnWeeklyPdf")||document.querySelector("[id*=\"WeeklyPdf\"]");
  if(!pdfBtn){
    // find by text
    const allBtns=[...document.querySelectorAll("button")];
    pdfBtn=allBtns.find(b=>b.textContent.includes("PDF"));
  }
  if(pdfBtn) pdfBtn.onclick=openWeeklyPdf;
  const _email=document.getElementById("btnEmailReport"); if(_email) _email.onclick=sendEmailReport;

  
// === ANDROID MOBILE ENHANCERS ===
(function(){
  const drawer=document.getElementById("drawer"), hb=document.getElementById("hamburgerBtn"), close=document.getElementById("drawerClose"), back=document.getElementById("drawerBackdrop");
  function openDrawer(){ if(drawer) drawer.classList.add("open"); try{ if(navigator.vibrate) navigator.vibrate(12);}catch(e){} }
  function closeDrawer(){ if(drawer) drawer.classList.remove("open"); }
  if(hb) hb.onclick=openDrawer;
  if(close) close.onclick=closeDrawer;
  if(back) back.onclick=closeDrawer;
  document.querySelectorAll("[data-drawer]").forEach(a=> a.addEventListener("click",()=>{ closeDrawer(); const href=a.getAttribute("href"); if(href && href.startsWith("#")){ const el=document.querySelector(href); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); } }));
  const fab=document.getElementById("fabAdd");
  if(fab) fab.onclick=()=>{ try{ openModal(null); if(navigator.vibrate) navigator.vibrate(18);}catch(e){ openModal(null);} };
  const navLinks=document.querySelectorAll(".bottom-nav a");
  function setActive(hash){
    navLinks.forEach(x=> x.classList.toggle("active", x.getAttribute("href")===hash));
    document.querySelectorAll(".drawer-panel a").forEach(x=> x.classList.toggle("active", x.getAttribute("href")===hash));
  }
  navLinks.forEach(a=> a.addEventListener("click", e=>{
    const href=a.getAttribute("href");
    if(href.startsWith("#")){ e.preventDefault(); const el=document.querySelector(href); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); history.replaceState(null,"",href); setActive(href); try{ if(navigator.vibrate) navigator.vibrate(10);}catch(e){} }
    else { setActive("#"); }
  }));
  window.addEventListener("hashchange", ()=> setActive(location.hash||"#"));
  setActive(location.hash||"#");
  const stDrawer=document.getElementById("sheetStatusDrawer");
  setTimeout(()=>{ const st=document.getElementById("sheetStatus"); if(st&&stDrawer) stDrawer.textContent=st.textContent; }, 600);
  const origUpdate=window.updateSheetStatus;
  // patch after load
  setTimeout(()=>{
    if(typeof window.updateSheetStatus==="function"){
      const orig=window.updateSheetStatus;
      window.updateSheetStatus=function(){ orig(); const st=document.getElementById("sheetStatus"); if(st&&stDrawer) stDrawer.textContent=st.textContent; };
    }
  }, 900);
  window.addEventListener("keydown", e=>{ if(e.key==="Escape" && drawer && drawer.classList.contains("open")){ closeDrawer(); e.preventDefault(); }});
})();

  
// === CAPACITOR NATIVE BRIDGE ===
let nativeReady=false;
let capPlugins={};
async function initNative(){
  try{
    if(!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) return;
    nativeReady=true;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    const { Keyboard } = await import("@capacitor/keyboard");
    const { Preferences } = await import("@capacitor/preferences");
    capPlugins={ LocalNotifications, Haptics, ImpactStyle, StatusBar, Style, Keyboard, Preferences };
    console.log("Native plugins loaded");
    // Status bar
    try{ await StatusBar.setOverlaysWebView({overlay:false}); await StatusBar.setBackgroundColor({color:"#0D9488"}); await StatusBar.setStyle({style:Style.Light}); }catch(e){}
    // Keyboard
    try{ Keyboard.addListener("keyboardWillShow", info=>{ document.body.style.setProperty("--kb-height", info.keyboardHeight+"px"); }); Keyboard.addListener("keyboardWillHide", ()=>{ document.body.style.removeProperty("--kb-height"); }); }catch(e){}
    // Request notification permission
    try{
      let perm = await LocalNotifications.checkPermissions();
      if(perm.display !== "granted"){ await LocalNotifications.requestPermissions(); }
    }catch(e){}
    // Sync sheet URL via Preferences as well (mirror)
    try{
      const r = await Preferences.get({key:"tf_sheet_url"});
      if(r.value && !getSheetUrl()) setSheetUrl(r.value);
      // Watch for changes and mirror
      const origSet = setSheetUrl;
      window.setSheetUrl = function(v){ origSet(v); Preferences.set({key:"tf_sheet_url", value:v}); };
    }catch(e){}
    // Override notify to use LocalNotifications when native
    const _origNotify = window.notify;
    window.notify = async function(title, body){
      try{
        await LocalNotifications.schedule({
          notifications:[{ title, body, id: Math.floor(Math.random()*2147483647), schedule:{ at: new Date(Date.now()+300) }, smallIcon:"ic_launcher", sound:"default"}]
        });
      }catch(e){ if(typeof _origNotify==="function") _origNotify(title,body); }
      try{ await Haptics.vibrate({duration:80}); }catch(e){}
      // also keep web notification as fallback
      try{ if(typeof _origNotify==="function") _origNotify(title,body); }catch(e){}
    };
    // Haptics for key actions
    window.nativeHaptic = async function(style){
      try{ await Haptics.impact({style: (ImpactStyle && ImpactStyle[style]) || ImpactStyle.Medium}); }catch(e){ try{ await Haptics.vibrate({duration:22}); }catch(e2){} }
    };
    // Make fab/hamburger use native haptics
    setTimeout(()=>{
      document.querySelectorAll("#fabAdd, #hamburgerBtn, .bottom-nav a, .filter-btn, [data-toggle]").forEach(el=>{
        el.addEventListener("click", ()=>{ try{ Haptics.impact({style:ImpactStyle.Light}); }catch(e){} }, {passive:true});
      });
    }, 800);
    console.log("Native bridge ready");
  }catch(e){ console.log("Native init fail", e.message); }
}
// call after DOMContentLoaded setup; if native already present, init now
if(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) initNative();
else window.addEventListener("DOMContentLoaded", ()=> setTimeout(initNative, 900));

  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
});
