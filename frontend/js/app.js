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
    // Load face-api models for client-side detection (used by AI.analyzeFrame)
    try { await AI.loadModels(); } catch(e) { console.warn("Face models unavailable:", e.message); }
    await People.load();
    Speech.listen();

    document.getElementById("vbStatus").textContent = "Ready — say a command";
    document.getElementById("statusPill").textContent = "READY";

    // Show welcome intro after a short delay so the page settles
    setTimeout(() => this._showWelcomeIntro(), 800);
  },

  /* ===============================
     WELCOME INTRO — popup + voice
  =============================== */
  _showWelcomeIntro() {
    // ── Build the popup ──────────────────────────────────────────
    const overlay = document.createElement("div");
    overlay.id = "welcomeOverlay";
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.72);backdrop-filter:blur(4px);
      animation:vcFadeIn .35s ease;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      background:#0d0e14;border:1px solid #2a2d3e;border-radius:16px;
      padding:32px 36px;max-width:480px;width:90%;text-align:center;
      font-family:inherit;color:#e8eaf0;position:relative;
      animation:vcSlideUp .4s ease;
    `;

    box.innerHTML = `
      <div style="font-size:2.2rem;margin-bottom:12px">👁</div>
      <h2 style="font-size:1.3rem;font-weight:600;margin:0 0 6px;letter-spacing:.04em;color:#fff">
        Welcome to Visual Companion
      </h2>
      <p style="font-size:.85rem;color:#8a8fa8;margin:0 0 20px;line-height:1.6">
        Your AI-powered eye — it sees, describes, and recognises people around you in real time.
      </p>

      <div id="wcProgress" style="height:3px;border-radius:3px;background:#1e2130;margin-bottom:20px;overflow:hidden">
        <div id="wcBar" style="height:100%;width:0%;background:linear-gradient(90deg,#4f6ef7,#7c3aed);transition:width .15s linear"></div>
      </div>

      <div style="text-align:left;background:#13141d;border-radius:10px;padding:14px 16px;margin-bottom:20px">
        <div style="font-size:.72rem;letter-spacing:.1em;color:#4f6ef7;margin-bottom:10px;font-weight:600">VOICE COMMANDS</div>
        <div id="wcCmdList" style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;font-size:.78rem"></div>
      </div>

      <p id="wcFooter" style="font-size:.78rem;color:#5a5f78;margin:0 0 16px">
        Closing automatically in <span id="wcCountdown">8</span>s…
      </p>
      <button id="wcDismiss" style="
        background:transparent;border:1px solid #2a2d3e;color:#8a8fa8;
        padding:7px 22px;border-radius:8px;font-size:.8rem;cursor:pointer;
        transition:border-color .2s,color .2s;
      " onmouseover="this.style.borderColor='#4f6ef7';this.style.color='#fff'"
         onmouseout="this.style.borderColor='#2a2d3e';this.style.color='#8a8fa8'">
        Got it — dismiss
      </button>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Inject keyframe animations once
    if (!document.getElementById("vcIntroStyles")) {
      const style = document.createElement("style");
      style.id = "vcIntroStyles";
      style.textContent = `
        @keyframes vcFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes vcSlideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      `;
      document.head.appendChild(style);
    }

    // ── Populate command pills ─────────────────────────────────
    const featured = [
      ["start camera",     "Turn on camera"],
      ["start monitor",    "Auto-describe scene"],
      ["describe",         "Describe what's in view"],
      ["who is this",      "Identify a face"],
      ["save this person", "Enroll someone new"],
      ["forget [name]",    "Remove a saved person"],
      ["show people",      "Open face registry"],
      ["help / commands",  "List all commands"],
    ];
    const list = document.getElementById("wcCmdList");
    featured.forEach(([cmd, desc]) => {
      const item = document.createElement("div");
      item.style.cssText = "display:flex;flex-direction:column;gap:1px";
      item.innerHTML = `
        <span style="color:#c8cadc;font-weight:500">"${cmd}"</span>
        <span style="color:#5a5f78;font-size:.7rem">${desc}</span>
      `;
      list.appendChild(item);
    });

    // ── Dismiss logic ──────────────────────────────────────────
    const DURATION = 8000; // ms before auto-close
    let remaining = DURATION;
    const interval = 80;

    const dismiss = () => {
      clearInterval(timer);
      overlay.style.transition = "opacity .3s";
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 320);
    };

    document.getElementById("wcDismiss").addEventListener("click", dismiss);

    const timer = setInterval(() => {
      remaining -= interval;
      const pct = ((DURATION - remaining) / DURATION) * 100;
      const bar = document.getElementById("wcBar");
      if (bar) bar.style.width = pct + "%";

      const secs = Math.ceil(remaining / 1000);
      const cd = document.getElementById("wcCountdown");
      if (cd) cd.textContent = secs;

      if (remaining <= 0) dismiss();
    }, interval);

    // ── Voice narration ────────────────────────────────────────
    const lines = [
      "Welcome to Visual Companion.",
      "I am your AI-powered eye. I can see what's in front of the camera, describe scenes, and recognise people.",
      "Here are the commands you can start using now: " +
      "Say start camera to turn on the camera. " +
      "Say start monitor to auto-describe the scene every few seconds. " +
      "Say describe to get an instant description. " +
      "Say who is this to identify a face. " +
      "Say save this person to enroll someone new. " +
      "Say forget followed by a name to remove them. " +
      "And say help or commands to see the full list.",
      "I'm ready whenever you are. Go ahead and say start camera to begin."
    ];

    // Chain utterances cleanly (speechSynthesis queue)
    window.speechSynthesis.cancel();
    lines.forEach(line => {
      const u = new SpeechSynthesisUtterance(line);
      u.lang  = Config?.VOICE?.lang  || "en-US";
      u.rate  = Config?.VOICE?.rate  ? Math.min(Config.VOICE.rate, 0.95) : 0.92;
      u.pitch = Config?.VOICE?.pitch || 1;
      window.speechSynthesis.speak(u);
    });
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
    document.getElementById("scanLine").classList.add("active");

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
      document.getElementById("thinkingIndicator").classList.add("show");

      const blob = await this._captureBlob();

      const form = new FormData();
      form.append("image", blob);

      const res = await fetch(Config.url("describe"), { method: "POST", body: form });
      const data = await res.json();

      document.getElementById("thinkingIndicator").classList.remove("show");

      if (data?.description) {
        if (Config.AI.speakResults) Speech.speak(data.description);
        this.addLiveFeedCard(data.description);
      }

    } catch (err) {
      console.error("Analyze error:", err);
      document.getElementById("thinkingIndicator").classList.remove("show");
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

      // Ask the dedicated /recognize endpoint
      const res = await fetch(Config.url("recognize"), { method: "POST", body: form });
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

    // Capture the frame NOW while camera is live
    this._captureBlob().then(blob => {
      this._pendingBlob = blob;

      // Show preview immediately
      const canvas = document.getElementById("canvas");
      document.getElementById("savePreviewImg").src = canvas.toDataURL();

      // Show overlay and prompt
      document.getElementById("saveOverlay").style.display = "flex";
      document.getElementById("saveStatus").textContent = "Listening for name...";
      document.getElementById("saveVoiceHint").textContent = "Say the person\'s name or type below";
      document.getElementById("saveNameInput").value = "";
      document.getElementById("saveNameInput").style.display = "block";
      document.getElementById("saveConfirmBtn").style.display = "inline-block";

      // Stop main speech recognition to avoid conflicts
      Speech.stop();
      Speech.speak("Say the person\'s name.");

      // Start a fresh one-shot recogniser
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = Config?.VOICE?.lang || "en-US";
        rec.maxAlternatives = 1;

        rec.onresult = (e) => {
          const name = e.results[0][0].transcript.trim();
          document.getElementById("saveNameInput").value = name;
          document.getElementById("saveStatus").textContent = `Heard: "${name}" — confirm or edit below`;
        };

        rec.onerror = () => {
          document.getElementById("saveStatus").textContent = "Couldn\'t hear — type the name below";
        };

        rec.onend = () => {
          // Restart main listener after short delay
          setTimeout(() => Speech.listen(), 1000);
        };

        try { rec.start(); } catch (err) {
          console.warn("rec.start blocked:", err);
          setTimeout(() => Speech.listen(), 500);
        }
      }
    });
  },

  // Called by the Confirm button in the overlay
  confirmSave() {
    const nameInput = document.getElementById("saveNameInput");
    const name = nameInput?.value?.trim();
    if (!name) {
      document.getElementById("saveStatus").textContent = "Please enter a name first";
      Speech.speak("Please say or type a name.");
      return;
    }
    this._doSave(name);
  },

  cancelSave() {
    this._pendingBlob = null;
    document.getElementById("saveOverlay").style.display = "none";
    document.getElementById("saveNameInput").style.display = "none";
    document.getElementById("saveConfirmBtn").style.display = "none";
    setTimeout(() => Speech.listen(), 500);
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
    document.getElementById("scanLine").classList.remove("active");
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
    const statusEl = document.getElementById("saveStatus");
    try {
      if (statusEl) statusEl.textContent = `Saving "${name}"...`;

      // Use pre-captured blob if available, otherwise capture now
      const blob = this._pendingBlob || await this._captureBlob();
      this._pendingBlob = null;

      await People.save(name, blob);

      if (statusEl) statusEl.textContent = `✅ Saved: ${name}`;
      setTimeout(() => {
        document.getElementById("saveOverlay").style.display = "none";
        document.getElementById("saveNameInput").style.display = "none";
        document.getElementById("saveConfirmBtn").style.display = "none";
      }, 800);

    } catch (err) {
      console.error("Save error:", err);
      if (statusEl) statusEl.textContent = "❌ Save failed — try again";
      Speech.speak("Sorry, something went wrong while saving.");
      setTimeout(() => {
        document.getElementById("saveOverlay").style.display = "none";
      }, 1500);
    } finally {
      setTimeout(() => Speech.listen(), 1200);
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
