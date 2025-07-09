import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// const getLearningLanguage = () => {
//   return localStorage.getItem("learningLanguage") || "english"; // fallback default
// };
// console.log(getLearningLanguage());
export const translateText = async (text, targetLang = "English") => {
  try {
    // const prompt = `Translate the following sentence to ${targetLang}. Only return the translated text:\n"${text}"`;
    const prompt = `Translate the following sentence to ${targetLang}. Do not include any explanation or formatting. Only return the translated sentence as plain text:\n\n${text}`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });
    if (
      result.candidates &&
      result.candidates[0] &&
      result.candidates[0].content
    ) {
      const content = result.candidates[0].content;
      if (content.parts && content.parts[0] && content.parts[0].text) {
        const translatedText = content.parts[0].text.trim();
        // console.log("Translation successful:", translatedText);
        return translatedText;
      }
    }

    console.error("Unexpected response structure:", result);
    throw new Error("Could not extract translated text from response");
  } catch (error) {
    console.error("Error translating text:", error);
    throw error;
  }
};
