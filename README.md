# Visual Companion

A voice-controlled web app for visually impaired users. It uses the camera to describe the scene aloud and to recognize people you have saved.

**Live demo:** https://visual-companion.vercel.app

## Features

- **Scene description:** a vision-language model (GPT-4o or Llama-3.2-11B-Vision) describes each camera frame, and the result is spoken aloud.
- **Face recognition:** enroll people by name, then ask "who is this?". Matching uses face-api.js descriptors and Euclidean distance with a 0.6 threshold.
- **Hands-free voice control:** commands such as "start camera", "who is this" and "stop", using the Web Speech API for recognition and speech output.
- **Live monitoring:** the camera is scanned automatically every 4 seconds.
- **Safe error handling:** duplicate names are rejected, and frames with no face return a clear message.

## How it works

```
Browser (camera + voice)  ->  Express API  ->  Vision-language model (describe)
                                          ->  face-api.js (recognize / enroll)
```

`/describe` runs scene description and face recognition in parallel, so one request returns both.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/describe` | Describe an image and name a recognized person, if any |
| POST | `/save-person` | Enroll a face (`name` + `image`); 409 on duplicate name, 422 if no face |
| POST | `/recognize` | Identify the face in an image |
| GET | `/people` | List saved people |
| DELETE | `/people/:name` | Remove a saved person |

## Run locally

**Backend**

```bash
cd backend
npm install
# create backend/.env
#   AI_PROVIDER=openai          # or nvidia
#   OPENAI_API_KEY=...          # or NVIDIA_API_KEY=...
#   FACE_THRESHOLD=0.6          # optional
npm start                       # http://localhost:5000
```

**Frontend**

Set `API_BASE` in `frontend/js/config.js` to your backend URL, then serve the `frontend/` folder with any static server and open it in a browser. Allow camera and microphone access when asked.

## Tech stack

Node.js, Express, face-api.js, node-canvas, multer, OpenAI SDK (OpenAI-compatible, also used for NVIDIA), vanilla JavaScript, Web Speech API. Deployed on Vercel (frontend) and Render (backend).

## Known limitations

- Saved faces are stored in a single shared file on the server, so they are not private per user. Do not enroll real people on a public deployment.
- Face data may be lost when the host restarts if its disk is not persistent.
- No authentication or rate limiting yet.
