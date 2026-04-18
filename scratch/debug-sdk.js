const { GoogleGenAI } = require("@google/genai");
const apiKey = "AIzaSyDw7O3zGhJB6aNaWDg9qfUvH2GTTaPMKYI";

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey });
    console.log("AI Keys:", Object.keys(ai));
    if (ai.models) {
        console.log("Models Keys:", Object.keys(ai.models));
    }
  } catch (e) {
    console.error(e);
  }
}

test();
