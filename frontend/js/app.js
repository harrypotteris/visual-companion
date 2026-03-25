/* ==========================================
   VISUAL COMPANION — APP
   v2.0 — with recognition & name-based save
========================================== */
const App = {
  video: null,
  monitorInterval: null,
  isAnalyzing: false,
  _greetCooldowns: {}, // tracks last greet time per person name

  /* ===============================
     INIT ON PAGE LOAD
  =============================== */
  async init() {
    this.renderCommands();
    await People.load();
    Speech.listen();

    document.getElementById("vbStatus").textContent = "Ready — say a command";
    document.getElementById("statusPill").textContent = "READY";
  },

  /* ===============================
     START CAMERA
  =============================== */
  async startCamera() {
    try {
      if (this.video?.srcObject) return;

      this.video = document.getElementById("video");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.video.srcObject = stream;

      document.getElementById("camPlaceholder").style.display = "none";
      document.getElementById("camBadge").textContent = "LIVE";
      document.getElementById("statusPill").textContent = "CAMERA ON";

      document.getElementById("btnMonitor").disabled = false;
      document.getElementById("btnAnalyze").disabled = false;
      document.getElementById("btnStop").disabled = false;
      document.getElementById("btnStart").disabled = true;

      Speech.speak("Camera started.");
    } catch (err) {
      console.error("Camera error:", err);
      Speech.speak("Please allow camera access.");
    }
  },

  /* ===============================
     START MONITORING
  =============================== */
  startMonitor() {
    if (this.monitorInterval) return;

    this.monitorInterval = setInterval(() => {
      this.analyzeNow();
    }, Config.MONITOR.interval);

    document.getElementById("statusPill").textContent = "MONITORING";
    document.getElementById("scanLine").style.display = "block";

    Speech.speak("Monitoring started.");
  },

  /* ===============================
     ANALYZE CURRENT FRAME
  =============================== */
  async analyzeNow() {
    if (this.isAnalyzing) return;
    if (!this.video?.srcObject) {
      Speech.speak("Start the camera first.");
      return;
    }

    this.isAnalyzing = true;

    try {
      document.getElementById("thinkingIndicator").style.width = "60%";

      const blob = await this._captureBlob();

      const form = new FormData();
      form.append("image", blob);

      const res = await fetch(Config.url("describe"), { method: "POST", body: form });
      const data = await res.json();

      document.getElementById("thinkingIndicator").style.width = "0%";

      if (data?.description) {
        if (Config.AI.speakResults) Speech.speak(data.description);
        this.addLiveFeedCard(data.description);
      }

    } catch (err) {
      console.error("Analyze error:", err);
      document.getElementById("thinkingIndicator").style.width = "0%";
    }

    this.isAnalyzing = false;
  },

  /* ===============================
     RECOGNIZE CURRENT FACE
     Called by: voice "who is this",
     button, or monitor loop
  =============================== */
  async recognizeCurrentFace() {
    if (!this.video?.srcObject) {
      Speech.speak("Start the camera first.");
      return;
    }

    this.showToast("🔍 Recognizing...");

    try {
      const blob = await this._captureBlob();
      const form = new FormData();
      form.append("image", blob);

      // Ask backend — expects { name } or { name: null } or { unknown: true }
      const res = await fetch(Config.url("describe"), { method: "POST", body: form });
      const data = await res.json();

      // If backend returns a name directly
      if (data?.name) {
        this._announceRecognized(data.name);
        return;
      }

      // Fallback: try matching description text against saved people names
      if (data?.description) {
        const matched = People.list.find(p =>
          data.description.toLowerCase().includes(p.name.toLowerCase())
        );
        if (matched) {
          this._announceRecognized(matched.name);
          return;
        }
      }

      // Nobody matched
      const unknown = Config.AI.unknownLabel || "Unknown Person";
      Speech.speak(`I don't recognise this person. ${
        Config.AI.saveUnknownFaces ? "Would you like to save them?" : ""
      }`);
      this.showToast(`❓ ${unknown}`);

    } catch (err) {
      console.error("Recognition error:", err);
      Speech.speak("Sorry, I couldn't identify that person.");
    }
  },

  /* ===============================
     SAVE PERSON — voice prompts name
  =============================== */
  savePerson() {
    if (!this.video?.srcObject) {
      Speech.speak("Start the camera first.");
      return;
    }

    document.getElementById("saveOverlay").style.display = "flex";
    Speech.speak("Say the person's name.");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = Config?.VOICE?.lang || "en-US";

    rec.onresult = async (e) => {
      const name = e.results[0][0].transcript.trim();
      await this._doSave(name);
    };

    rec.onerror = () => {
      document.getElementById("saveOverlay").style.display = "none";
      Speech.speak("Could not hear the name. Please try again.");
    };

    try { rec.start(); } catch (err) { console.warn("rec.start blocked:", err); }
  },

  /* ===============================
     SAVE PERSON — name passed directly
     Called by: "save this person as Rahul"
  =============================== */
  async savePersonWithName(name) {
    if (!name || name.trim() === "") {
      Speech.speak("Please provide a name.");
      return;
    }
    if (!this.video?.srcObject) {
      Speech.speak("Start the camera first.");
      return;
    }

    document.getElementById("saveOverlay").style.display = "flex";
    document.getElementById("saveStatus").textContent = `Saving "${name}"...`;
    document.getElementById("saveVoiceHint").textContent = `Name: "${name}"`;

    await this._doSave(name);
  },

  /* ===============================
     STOP EVERYTHING
  =============================== */
  stopAll() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    if (this.video?.srcObject) {
      this.video.srcObject.getTracks().forEach(t => t.stop());
      this.video.srcObject = null;
    }

    document.getElementById("camPlaceholder").style.display = "flex";
    document.getElementById("camBadge").textContent = "NO CAMERA";
    document.getElementById("scanLine").style.display = "none";
    document.getElementById("statusPill").textContent = "STANDBY";

    document.getElementById("btnStart").disabled = false;
    document.getElementById("btnMonitor").disabled = true;
    document.getElementById("btnAnalyze").disabled = true;
    document.getElementById("btnStop").disabled = true;

    Speech.speak("Stopped.");
  },

  /* ===============================
     LIVE FEED CARD
  =============================== */
  addLiveFeedCard(description) {
    const pane = document.getElementById("pane-live");
    const empty = document.getElementById("emptyLive");

    if (empty) empty.style.display = "none";

    const card = document.createElement("div");
    card.className = "feed-card";
    card.innerHTML = `
      <div class="feed-time">${new Date().toLocaleTimeString()}</div>
      <div class="feed-text">${description}</div>
    `;

    pane.insertBefore(card, pane.firstChild);
  },

  /* ===============================
     TOAST
  =============================== */
  showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.style.opacity = "1";
    setTimeout(() => { toast.style.opacity = "0"; }, 3000);
  },

  /* ===============================
     TAB SWITCH
  =============================== */
  switchTab(tabName) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add("active");
    document.getElementById(`pane-${tabName}`)?.classList.add("active");
  },

  /* ===============================
     COMMAND LIST
  =============================== */
  renderCommands() {
    const grid = document.getElementById("commandsGrid");
    if (!grid) return;

    const commands = [
      { cmd: "start camera",              desc: "Turns on the camera" },
      { cmd: "start monitor",             desc: "Auto-analyzes every few seconds" },
      { cmd: "analyze / describe",        desc: "Describe what's in view now" },
      { cmd: "who is this",               desc: "Identify the person on screen" },
      { cmd: "do you know [name]",        desc: "Check if someone is saved" },
      { cmd: "save this person as [name]",desc: "Save person with a spoken name" },
      { cmd: "save this person",          desc: "Save — then say the name" },
      { cmd: "forget [name]",             desc: "Remove a saved person" },
      { cmd: "who have you seen",         desc: "List all saved people" },
      { cmd: "show people",               desc: "Open saved people tab" },
      { cmd: "live feed",                 desc: "Go to live descriptions" },
      { cmd: "commands / help",           desc: "Show this list" },
      { cmd: "stop",                      desc: "Stop camera and monitoring" },
    ];

    grid.innerHTML = commands.map(c => `
      <div class="command-item">
        <div class="command-phrase">"${c.cmd}"</div>
        <div class="command-desc">${c.desc}</div>
      </div>
    `).join("");
  },

  /* ===============================
     PRIVATE — capture frame as blob
  =============================== */
  async _captureBlob(quality = 0.9) {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width  = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    ctx.drawImage(this.video, 0, 0);
    return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
  },

  /* ===============================
     PRIVATE — shared save logic
  =============================== */
  async _doSave(name) {
    try {
      document.getElementById("saveStatus").textContent = `Saving "${name}"...`;
      document.getElementById("saveVoiceHint").textContent = `Heard: "${name}"`;

      const blob = await this._captureBlob();

      // Show preview
      const canvas = document.getElementById("canvas");
      document.getElementById("savePreviewImg").src = canvas.toDataURL();

      await People.save(name, blob);
    } catch (err) {
      console.error("Save error:", err);
      Speech.speak("Sorry, something went wrong while saving.");
    } finally {
      document.getElementById("saveOverlay").style.display = "none";
    }
  },

  /* ===============================
     PRIVATE — announce a recognised person
     Respects greet cooldown from Config
  =============================== */
  _announceRecognized(name) {
    const cooldown = Config?.PEOPLE?.greetCooldownMs ?? 10000;
    const now = Date.now();
    const last = this._greetCooldowns[name] || 0;

    if (now - last < cooldown) {
      console.log(`Greet cooldown active for ${name}`);
      return;
    }

    this._greetCooldowns[name] = now;

    const person = People.recognize(name);
    if (person && Config?.PEOPLE?.greetOnRecognise !== false) {
      Speech.speak(`Hello, ${name}!`);
      this.showToast(`👋 Hello, ${name}!`);
    }

    // Show on live feed too
    this.addLiveFeedCard(`✅ Recognised: <strong>${name}</strong>`);
    this.switchTab("people");
  }
};

window.App = App;

/* ===============================
   START APP
=============================== */
window.addEventListener("DOMContentLoaded", () => App.init());
