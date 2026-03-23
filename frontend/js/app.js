const App = {

video: null,

async startCamera(){

    this.video = document.getElementById("video");

    const stream = await navigator.mediaDevices.getUserMedia({
        video:true
    });

    this.video.srcObject = stream;

},

async analyzeNow(){

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = App.video.videoWidth;
    canvas.height = App.video.videoHeight;

    ctx.drawImage(App.video,0,0);

    canvas.toBlob(async blob => {

        const form = new FormData();
        form.append("image", blob);

        const res = await fetch("http://localhost:5000/analyze",{
            method:"POST",
            body:form
        });

        const data = await res.json();

        Speech.speak(data.description);

    });

}

}