const faceapi = require("face-api.js");
const canvas = require("canvas");
const path = require("path");

const { Canvas, Image, ImageData } = canvas;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_PATH = path.join(__dirname, "models");

// 🔥 In-memory face database (later you can move to DB)
let labeledDescriptors = [];

/* ===============================
   LOAD MODELS
=============================== */
async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);

  console.log("✅ Face models loaded");
}

/* ===============================
   EXTRACT FACE DESCRIPTOR
=============================== */
async function getFaceDescriptor(imageBuffer) {
  const img = await canvas.loadImage(imageBuffer);

  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  return detection.descriptor; // Float32Array
}

/* ===============================
   SAVE PERSON (ADD TO MEMORY)
=============================== */
async function saveFace(name, imageBuffer) {
  const descriptor = await getFaceDescriptor(imageBuffer);

  if (!descriptor) {
    throw new Error("No face detected");
  }

  const labeled = new faceapi.LabeledFaceDescriptors(name, [descriptor]);

  labeledDescriptors.push(labeled);

  console.log(`✅ Face saved for ${name}`);
}

/* ===============================
   RECOGNIZE PERSON
=============================== */
async function recognizeFace(imageBuffer) {
  const descriptor = await getFaceDescriptor(imageBuffer);

  if (!descriptor || labeledDescriptors.length === 0) {
    return null;
  }

  const faceMatcher = new faceapi.FaceMatcher(
    labeledDescriptors,
    0.6 // threshold
  );

  const bestMatch = faceMatcher.findBestMatch(descriptor);

  return bestMatch.toString(); // e.g. "Charitha (0.45)"
}

module.exports = {
  loadModels,
  getFaceDescriptor,
  saveFace,
  recognizeFace
};
