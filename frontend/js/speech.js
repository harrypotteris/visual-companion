/* ==========================================
   VISUAL COMPANION — SPEECH
========================================== */
window.Speech = {
  recognition: null,
  isListening: false,

  /* ===============================
     TEXT TO SPEECH
  =============================== */
  speak(text) {
    if (!text) return;

    // 🔥 Prevent overlapping speech
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = Config.VOICE.lang;
    utter.rate = Config.VOICE.rate || 1;
    utter.pitch = Config.VOICE.pitch || 1;

    window.speechSynthesis.speak(utter);
  },

  /* ===============================
     START LISTENING
  =============================== */
  listen() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported");
      document.getElementById("vbStatus").textContent =
        "Voice not supported in this browser";
      return;
    }

    // 🔥 Prevent multiple instances
    if (this.isListening) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = Config.VOICE.lang;
    this.recognition.continuous = Config.VOICE.continuous ?? true;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.isListening = true;

      document.getElementById("vbStatus").textContent = "Listening...";
      document.getElementById("micOrb").style.opacity = "1";
      document.getElementById("micOrb2").style.opacity = "1";
    };

    this.recognition.onresult = (e) => {
      const text =
        e.results[e.results.length - 1][0].transcript.trim();

      document.getElementById("vbHeard").textContent = `"${text}"`;
      console.log("Heard:", text);

      this.process(text);
    };

    this.recognition.onerror = (e) => {
      console.error("Speech error:", e.error);

      document.getElementById("vbStatus").textContent =
        "Voice error — retrying...";

      this.isListening = false;

      // 🔥 Restart safely
      setTimeout(() => this.listen(), 2000);
    };

    this.recognition.onend = () => {
      this.isListening = false;

      // 🔥 Auto-restart (stable)
      setTimeout(() => this.listen(), 800);
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn("Recognition start blocked:", err);
    }
  },

  /* ===============================
     PROCESS VOICE COMMANDS
  =============================== */
  process(text) {
    text = text.toLowerCase();

    console.log("Processing command:", text);

    if (text.includes("start camera")) {
      App.startCamera();
      this.speak("Starting camera");

    } else if (text.includes("start monitor")) {
      App.startMonitor();
      this.speak("Monitoring started");

    } else if (
      text.includes("analyze") ||
      text.includes("analyse") ||
      text.includes("describe")
    ) {
      App.analyzeNow();
      this.speak("Analyzing");

    } else if (text.includes("stop")) {
      App.stopAll();
      this.speak("Stopping everything");

    } else if (
      text.includes("save this person") ||
      text.includes("save person")
    ) {
      App.savePerson();
      this.speak("Saving person");

    } else if (
      text.includes("saved people") ||
      text.includes("show people")
    ) {
      App.switchTab("people");

    } else if (
      text.includes("commands") ||
      text.includes("help")
    ) {
      App.switchTab("commands");

    } else if (
      text.includes("live feed") ||
      text.includes("live view")
    ) {
      App.switchTab("live");
    }
  }
};
