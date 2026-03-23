const Speech = {

speak(text){

    const utter = new SpeechSynthesisUtterance(text);

    utter.rate = 1;
    utter.pitch = 1;

    speechSynthesis.speak(utter);

},

listen(){

    const rec = new webkitSpeechRecognition();

    rec.lang = "en-US";
    rec.continuous = true;

    rec.onresult = e => {

        const text = e.results[e.results.length-1][0].transcript;

        console.log(text);

        Speech.process(text);

    };

    rec.start();

},

process(text){

    text = text.toLowerCase();

    if(text.includes("start camera"))
        App.startCamera();

    if(text.includes("analyze"))
        App.analyzeNow();

}

}