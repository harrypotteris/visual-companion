const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function analyzeImage(buffer){

    const base64 = buffer.toString("base64");

    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        {type:"text", text:"Describe this scene for a blind person."},
                        {
                            type:"image_url",
                            image_url:{ url:`data:image/jpeg;base64,${base64}` }
                        }
                    ]
                }
            ]
        },
        {
            headers:{
                Authorization:`Bearer ${OPENAI_API_KEY}`
            }
        }
    );

    return {
        description: response.data.choices[0].message.content
    };
}

module.exports = { analyzeImage };