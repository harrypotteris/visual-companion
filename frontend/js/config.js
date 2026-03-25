/* ==========================================
   VISUAL COMPANION — CONFIG
   v2.0 — aligned with People Manager v2
========================================== */
window.Config = {

  /* ===============================
     Backend API
  =============================== */
  API_BASE: "https://visual-companion-backend.onrender.com",
  ENDPOINTS: {
    describe:   "/describe",
    savePerson: "/save-person",
    people:     "/people"
  },

  /* ===============================
     Face API model path
  =============================== */
  FACE_MODELS: "/models",

  /* ===============================
     AI / Recognition settings
  =============================== */
  AI: {
    speakResults:          true,
    confidenceThreshold:   0.6,   // minimum score to accept a face match
    maxResults:            5,     // max faces shown per frame
    unknownLabel:          "Unknown Person",   // spoken when face not recognised
    saveUnknownFaces:      false  // set true to auto-prompt saving unrecognised faces
  },

  /* ===============================
     People / Recognition behaviour
  =============================== */
  PEOPLE: {
    storageKey:      "visual_companion_people",  // must match People.STORAGE_KEY
    maxImageSizeKB:  200,          // base64 images larger than this won't be cached locally
    greetOnRecognise: true,        // speak name when a known person is detected
    greetCooldownMs:  10000        // don't re-greet the same person within 10 seconds
  },

  /* ===============================
     Monitoring (live camera scan)
  =============================== */
  MONITOR: {
    interval:    4000,   // ms between each scan frame
    autoStart:   true    // start scanning as soon as camera is ready
  },

  /* ===============================
     Voice / Speech
  =============================== */
  VOICE: {
    lang:       "en-US",
    continuous: true,
    rate:       1,
    pitch:      1
  },

  /* ===============================
     HELPER — is backend reachable?
     Call Config.backendAvailable() before
     any fetch to avoid uncaught errors
  =============================== */
  backendAvailable() {
    return (
      typeof this.API_BASE === "string" &&
      this.API_BASE.trim() !== "" &&
      typeof this.ENDPOINTS === "object"
    );
  },

  /* ===============================
     HELPER — full URL builder
     Usage: Config.url("savePerson")
  =============================== */
  url(endpoint) {
    const path = this.ENDPOINTS[endpoint];
    if (!path) {
      console.warn(`Config.url: unknown endpoint "${endpoint}"`);
      return null;
    }
    return this.API_BASE + path;
  }
};
