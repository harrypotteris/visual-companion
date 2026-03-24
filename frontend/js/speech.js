/* ==========================================
   VISUAL COMPANION — SPEECH
========================================== */
window.Speech = {
  recognition: null,

  /* ===============================
     TEXT TO SPEECH
  =============================== */
  speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = Config.VOICE.lang;
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  },

  /* ===============================
     START LISTENING
  =============================== */
  listen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported");
      document.getElementById("vbStatus").textContent = "Voice not supported in this browser";
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = Config.VOICE.lang;
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      document.getElementById("vbStatus").textContent = "Listening...";
      document.getElementById("micOrb").style.opacity = "1";
      document.getElementById("micOrb2").style.opacity = "1";
    };

    this.recognition.onresult = (e) => {
      const text = e.results[e.results.length - 1][0].transcript.trim();
      document.getElementById("vbHeard").textContent = `"${text}"`;
      console.log("Heard:", text);
      Speech.process(text);
    };

    this.recognition.onerror = (e) => {
      console.error("Speech error:", e.error);
      document.getElementById("vbStatus").textContent = "Voice error — retrying...";
      setTimeout(() => Speech.listen(), 2000);
    };

    this.recognition.onend = () => {
      // Auto-restart to keep listening
      setTimeout(() => Speech.listen(), 500);
    };

    this.recognition.start();
  },

  /* ===============================
     PROCESS VOICE COMMANDS
  =============================== */
  process(text) {
    text = text.toLowerCase();

    if (text.includes("start camera")) {
      App.startCamera();
    } else if (text.includes("start monitor")) {
      App.startMonitor();
    } else if (text.includes("analyze") || text.includes("analyse") || text.includes("describe")) {
      App.analyzeNow();
    } else if (text.includes("stop")) {
      App.stopAll();
    } else if (text.includes("save this person") || text.includes("save person")) {
      App.savePerson();
    } else if (text.includes("saved people") || text.includes("show people")) {
      App.switchTab("people");
    } else if (text.includes("commands") || text.includes("help")) {
      App.switchTab("commands");
    } else if (text.includes("live feed") || text.includes("live view")) {
      App.switchTab("live");
    }
  }
};
