/* Chatbot UI with:
   - Word-by-word typing
   - LocalStorage history
   - Timestamps
   - Floating toggle
*/

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const clearBtn = document.getElementById("clear-btn");
const closeBtn = document.getElementById("close-btn");
const floatToggle = document.getElementById("float-toggle");

const STORAGE_KEY = "ml_chatbot_history_v2";

// ---- Helpers ---- //
function timestamp() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function loadHistory() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveHistory(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function addHistory(entry) {
  const h = loadHistory();
  h.push(entry);
  if (h.length > 200) h.shift();
  saveHistory(h);
}

// Basic message renderer
function renderMessage(text, sender, ts = timestamp()) {
  const wrap = document.createElement("div");
  wrap.className = "message-wrapper";

  const bubble = document.createElement("div");
  bubble.className = `msg ${sender}`;
  bubble.textContent = text;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = ts;

  wrap.appendChild(bubble);
  wrap.appendChild(meta);
  chatBox.appendChild(wrap);
  chatBox.scrollTop = chatBox.scrollHeight;

  return wrap; // return for deletions
}

// Bot typing animation
async function typeBotMessage(fullText) {
  const wrap = document.createElement("div");
  wrap.className = "message-wrapper";

  const bubble = document.createElement("div");
  bubble.className = "msg bot";
  bubble.textContent = "";

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = timestamp();

  wrap.appendChild(bubble);
  wrap.appendChild(meta);
  chatBox.appendChild(wrap);

  chatBox.scrollTop = chatBox.scrollHeight;

  const words = fullText.split(" ");
  for (let i = 0; i < words.length; i++) {
    bubble.textContent += (i === 0 ? "" : " ") + words[i];
    chatBox.scrollTop = chatBox.scrollHeight;
    await new Promise((r) => setTimeout(r, 110));
  }
}

// ---- Message Sending ---- //
function sendUser(text) {
  const ts = timestamp();
  renderMessage(text, "user", ts);
  addHistory({ role: "user", text, ts });
}

// Backend call
async function askBot(text) {
  // temporary "Thinking..."
  const thinkingBubble = renderMessage("Thinking...", "bot");

  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    // remove temporary bubble
    thinkingBubble.remove();

    await typeBotMessage(data.response);
    addHistory({ role: "bot", text: data.response, ts: timestamp() });

  } catch (err) {
    thinkingBubble.remove();
    renderMessage("⚠️ Error connecting to server.", "bot");
  }
}

// ---- Events ---- //
sendBtn.addEventListener("click", sendFlow);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendFlow();
});

function sendFlow() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  sendUser(text);
  askBot(text);
}

// Clear chat history
clearBtn.addEventListener("click", () => {
  if (confirm("Clear chat history?")) {
    localStorage.removeItem(STORAGE_KEY);
    chatBox.innerHTML = "";
  }
});

// Floating widget toggle
closeBtn.addEventListener("click", () => {
  document.getElementById("chat-shell").classList.add("hidden");
  floatToggle.style.display = "block";
});
floatToggle.addEventListener("click", () => {
  document.getElementById("chat-shell").classList.remove("hidden");
  floatToggle.style.display = "none";
});

// ---- Initialize ---- //
(function init() {
  const history = loadHistory();
  if (history.length) {
    history.forEach((msg) => {
      renderMessage(msg.text, msg.role, msg.ts);
    });
  } else {
    const welcome =
      "Hi! I can help with placements, resumes, projects, and debugging. What do you want to work on today?";
    renderMessage(welcome, "bot");
    addHistory({ role: "bot", text: welcome, ts: timestamp() });
  }
})();
