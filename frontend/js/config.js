/* ==========================================
   VISUAL COMPANION — CONFIG
========================================== */

window.Config = {

  /* ===============================
     Backend API
  =============================== */
  API_BASE: "https://visual-companion-backend.onrender.com",

  ENDPOINTS: {
    describe: "/describe",
    savePerson: "/save-person",
    people: "/people"
  },

  /* ===============================
     Face API model path
     (IMPORTANT: must match deployment)
  =============================== */
  FACE_MODELS: "/models", 
  // ⚠️ Changed from "/backend/models"
  // This avoids 404 in production unless you actually host at /backend/models

  /* ===============================
     AI settings
  =============================== */
  AI: {
    speakResults: true,
    confidenceThreshold: 0.6,   // good default for recognition
    maxResults: 5               // 🔥 prevents UI overload (safe addition)
  },

  /* ===============================
     Monitoring
  =============================== */
  MONITOR: {
    interval: 4000,             // 4 sec scan
    autoStart: true             // 🔥 useful for deployment
  },

  /* ===============================
     Voice
  =============================== */
  VOICE: {
    lang: "en-US",
    continuous: true,
    rate: 1,
    pitch: 1
  }

};
