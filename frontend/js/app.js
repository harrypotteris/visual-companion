const App = {

  video: null,

  /* ===============================
     START CAMERA
  =============================== */
  async startCamera(){

    try {

      this.video = document.getElementById("video");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });

      this.video.srcObject = stream;

      console.log("Camera started");

    } catch(err){

      console.error("Camera error:", err);

    }

  },

  /* ===============================
     ANALYZE CURRENT FRAME
  =============================== */
  async analyzeNow(){

    try {

      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = App.video.videoWidth;
      canvas.height = App.video.videoHeight;

      ctx.drawImage(App.video, 0, 0);

      canvas.toBlob(async blob => {

        const form = new FormData();
        form.append("image", blob);

        const res = await fetch(
          "https://visual-companion-backend.onrender.com/describe",
          {
            method: "POST",
            body: form
          }
        );

        const data = await res.json();

        console.log(data);

        if(data.description){
          Speech.speak(data.description);
        }

      });

    } catch(err){

      console.error("Analyze error:", err);

    }

  },

  /* ===============================
     TAB SWITCHING
  =============================== */
  switchTab(tabName){

    document.querySelectorAll(".tab").forEach(tab=>{
      tab.classList.remove("active");
    });

    document.querySelectorAll(".tab-pane").forEach(pane=>{
      pane.classList.remove("active");
    });

    const tab = document.querySelector(`[data-tab="${tabName}"]`);
    const pane = document.getElementById(`pane-${tabName}`);

    if(tab) tab.classList.add("active");
    if(pane) pane.classList.add("active");

  }

};

/* Make global */
window.App = App;
