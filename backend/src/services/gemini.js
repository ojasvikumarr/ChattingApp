import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY}); 

export const translateText = async (text, targetLang = "English") => {
  try {
    const prompt = `Translate the following sentence to ${targetLang}. Only return the translated text:\n"${text}"`;
    
    const result = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const content = result.candidates[0].content;
      if (content.parts && content.parts[0] && content.parts[0].text) {
        const translatedText = content.parts[0].text.trim();
        // console.log("Translation successful:", translatedText);
        return translatedText;
      }
    }
    
    console.error("unexpected response structure:", result);
    throw new Error("could not extract translated text from response");
    
  } catch (error) {
    console.error("error translating text:", error);
    throw error;
  }
};