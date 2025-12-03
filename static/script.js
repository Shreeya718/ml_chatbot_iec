/* Minimal + typed-word bot responses + localStorage chat persistence + timestamps + floating toggle */

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const clearBtn = document.getElementById("clear-btn");
const closeBtn = document.getElementById("close-btn");
const floatToggle = document.getElementById("float-toggle");
const exportBtn = document.getElementById("export-btn");

const STORAGE_KEY = "ml_chatbot_history_v2";
let isShellOpen = true;

// helpers
function nowTimestamp(){
  const d = new Date();
  return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function saveHistory(history){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
function loadHistory(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function pushHistory(item){
  const h = loadHistory();
  h.push(item);
  if (h.length > 200) h.shift(); // cap history
  saveHistory(h);
}

// render message (sender: "user" or "bot"), timestamp optional
function renderMessage(text, sender, ts){
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper";

  const bubble = document.createElement("div");
  bubble.className = `msg ${sender}`;
  bubble.textContent = text;

  wrapper.appendChild(bubble);

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = ts || nowTimestamp();
  wrapper.appendChild(meta);

  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// bot typed-word animation
async function botTypeAndRender(fullText){
  // create empty bubble and meta
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper";
  const bubble = document.createElement("div");
  bubble.className = "msg bot";
  wrapper.appendChild(bubble);
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = nowTimestamp();
  wrapper.appendChild(meta);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  // type word by word
  const words = fullText.split(" ");
  bubble.textContent = "";
  for (let i=0;i<words.length;i++){
    bubble.textContent += (i === 0 ? "" : " ") + words[i];
    chatBox.scrollTop = chatBox.scrollHeight;
    // small delay, slightly longer at punctuation
    const delay = Math.min(120 + Math.random()*80, 250);
    await new Promise(r => setTimeout(r, delay));
  }
  // done
}

// create local UI message and save
function sendUserMessage(text){
  const ts = nowTimestamp();
  renderMessage(text, "user", ts);
  pushHistory({role:"user", text, ts});
}

// send to backend
async function askBot(text){
  // optimistic local typing
  await botTypeAndRender("Thinking...");

  try{
    const res = await fetch("/predict", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({message: text})
    });
    const data = await res.json();
    // remove "Thinking..." bubble (it was added as "Thinking..." full text)
    // remove last bot message and replace with typed real response
    chatBox.lastElementChild.remove();
    await botTypeAndRender(data.response);
    pushHistory({role:"bot", text: data.response, ts: nowTimestamp()});
  }catch(err){
    // remove thinking and show error
    chatBox.lastElementChild.remove();
    renderMessage("⚠️ Error connecting to server.", "bot");
  }
}

// UI handlers
sendBtn.addEventListener("click", onSend);
input.addEventListener("keypress", (e)=>{ if(e.key==="Enter") onSend(); });
clearBtn.addEventListener("click", ()=>{ if(confirm("Clear chat history?")){ localStorage.removeItem(STORAGE_KEY); chatBox.innerHTML=""; }});
closeBtn.addEventListener("click", ()=>{ document.getElementById("chat-shell").classList.add("hidden"); floatToggle.style.display="block"; document.getElementById("chat-shell").setAttribute("aria-hidden","true"); isShellOpen=false; });
floatToggle.addEventListener("click", ()=>{ document.getElementById("chat-shell").classList.toggle("hidden"); floatToggle.style.display="none"; document.getElementById("chat-shell").setAttribute("aria-hidden","false"); isShellOpen=true; });
exportBtn.addEventListener("click", ()=>{ const h = loadHistory(); const blob = new Blob([JSON.stringify(h, null, 2)], {type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="chat-history.json"; a.click(); URL.revokeObjectURL(url); });

// send flow
function onSend(){
  const text = input.value.trim();
  if(!text) return;
  input.value = "";
  sendUserMessage(text);
  askBot(text);
}

// load history on start
(function init(){
  const history = loadHistory();

  if(history.length){
    history.forEach(msg => {
      renderMessage(msg.text, msg.role, msg.ts);
    });
  } else {
    const welcome = "Hi! I can help with placements, resumes, projects, and debugging. What do you want to work on today?";
    renderMessage(welcome, "bot");
    pushHistory({role:"bot", text: welcome, ts: nowTimestamp()});
  }
})();

