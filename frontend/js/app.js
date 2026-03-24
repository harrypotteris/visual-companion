/* ==========================================
   VISUAL COMPANION — APP
========================================== */
const App = {
  video: null,
  monitorInterval: null,
  descriptionCount: 0,

  /* ===============================
     INIT ON PAGE LOAD
  =============================== */
  async init() {
    // Load commands list
    App.renderCommands();
    // Load saved people
    await People.load();
    // Start voice
    Speech.listen();
    // Update status
    document.getElementById("vbStatus").textContent = "Ready — say a command";
    document.getElementById("statusPill").textContent = "READY";
  },

  /* ===============================
     START CAMERA
  =============================== */
  async startCamera() {
    try {
      this.video = document.getElementById("video");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.video.srcObject = stream;

      // Hide placeholder, show camera
      document.getElementById("camPlaceholder").style.display = "none";
      document.getElementById("camBadge").textContent = "LIVE";
      document.getElementById("statusPill").textContent = "CAMERA ON";

      // Enable buttons
      document.getElementById("btnMonitor").disabled = false;
      document.getElementById("btnAnalyze").disabled = false;
      document.getElementById("btnStop").disabled = false;
      document.getElementById("btnStart").disabled = true;

      Speech.speak("Camera started.");
      console.log("Camera started ✅");
    } catch (err) {
      console.error("Camera error:", err);
      Speech.speak("Could not access camera. Please allow camera permission.");
    }
  },

  /* ===============================
     START MONITORING (AUTO ANALYZE)
  =============================== */
  startMonitor() {
    if (this.monitorInterval) return;
    this.monitorInterval = setInterval(() => {
      App.analyzeNow();
    }, Config.MONITOR.interval);
    document.getElementById("statusPill").textContent = "MONITORING";
    document.getElementById("scanLine").style.display = "block";
    Speech.speak("Monitoring started.");
    console.log("Monitoring started ✅");
  },

  /* ===============================
     ANALYZE CURRENT FRAME
  =============================== */
  async analyzeNow() {
    if (!this.video || !this.video.srcObject) {
      Speech.speak("Please start the camera first.");
      return;
    }

    try {
      document.getElementById("thinkingIndicator").style.width = "60%";

      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = this.video.videoWidth;
      canvas.height = this.video.videoHeight;
      ctx.drawImage(this.video, 0, 0);

      canvas.toBlob(async blob => {
        const form = new FormData();
        form.append("image", blob);

        const res = await fetch(
          Config.API_BASE + Config.ENDPOINTS.describe,
          { method: "POST", body: form }
        );

        const data = await res.json();
        console.log("Description:", data);
        document.getElementById("thinkingIndicator").style.width = "0%";

        if (data.description) {
          Speech.speak(data.description);
          App.addLiveFeedCard(data.description);
        }
      }, "image/jpeg", 0.9);

    } catch (err) {
      console.error("Analyze error:", err);
      document.getElementById("thinkingIndicator").style.width = "0%";
    }
  },

  /* ===============================
     SAVE CURRENT PERSON
  =============================== */
  savePerson() {
    if (!this.video || !this.video.srcObject) {
      Speech.speak("Please start the camera first.");
      return;
    }
    document.getElementById("saveOverlay").style.display = "flex";
    Speech.speak("Please say the person's name.");

    // Listen for a name via one-shot recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = Config.VOICE.lang;
    rec.onresult = async (e) => {
      const name = e.results[0][0].transcript.trim();
      document.getElementById("saveStatus").textContent = `Saving "${name}"...`;
      document.getElementById("saveVoiceHint").textContent = `Heard: "${name}"`;

      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = this.video.videoWidth;
      canvas.height = this.video.videoHeight;
      ctx.drawImage(this.video, 0, 0);
      document.getElementById("savePreviewImg").src = canvas.toDataURL();

      canvas.toBlob(async blob => {
        await People.save(name, blob);
        document.getElementById("saveOverlay").style.display = "none";
      }, "image/jpeg", 0.9);
    };
    rec.start();
  },

  /* ===============================
     STOP EVERYTHING
  =============================== */
  stopAll() {
    // Stop monitor
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    // Stop camera
    if (this.video && this.video.srcObject) {
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
     ADD CARD TO LIVE FEED
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
     SHOW TOAST
  =============================== */
  showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.opacity = "1";
    setTimeout(() => { toast.style.opacity = "0"; }, 3000);
  },

  /* ===============================
     TAB SWITCHING
  =============================== */
  switchTab(tabName) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    const tab = document.querySelector(`[data-tab="${tabName}"]`);
    const pane = document.getElementById(`pane-${tabName}`);
    if (tab) tab.classList.add("active");
    if (pane) pane.classList.add("active");
  },

  /* ===============================
     RENDER COMMANDS LIST
  =============================== */
  renderCommands() {
    const grid = document.getElementById("commandsGrid");
    const commands = [
      { cmd: "start camera", desc: "Turns on the camera" },
      { cmd: "start monitoring", desc: "Auto-analyzes every few seconds" },
      { cmd: "analyze", desc: "Describe what's in view now" },
      { cmd: "save this person", desc: "Save the person on screen" },
      { cmd: "show people", desc: "View saved people" },
      { cmd: "live feed", desc: "Go to live descriptions" },
      { cmd: "commands", desc: "Show this list" },
      { cmd: "stop", desc: "Stop camera and monitoring" },
    ];
    grid.innerHTML = commands.map(c => `
      <div class="command-item">
        <div class="command-phrase">"${c.cmd}"</div>
        <div class="command-desc">${c.desc}</div>
      </div>
    `).join("");
  }
};

window.App = App;

// ✅ Start app when page loads
window.addEventListener("DOMContentLoaded", () => App.init());
