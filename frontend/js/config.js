/* ==========================================
   VISUAL COMPANION — CONFIG
========================================== */

window.Config = {

  /* Backend API */
  API_BASE: "http://localhost:3000",

  ENDPOINTS: {
    describe: "/describe",
    savePerson: "/save-person",
    people: "/people"
  },

  /* Face API model path */
  FACE_MODELS: "/backend/models",

  /* AI settings */
  AI: {
    speakResults: true,
    confidenceThreshold: 0.6
  },

  /* Monitoring */
  MONITOR: {
    interval: 4000
  },

  /* Voice */
  VOICE: {
    lang: "en-US",
    continuous: true
  }

};