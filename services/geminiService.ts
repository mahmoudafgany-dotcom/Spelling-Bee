
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { SpellingFeedback } from "../types";

/**
 * Generates audio pronunciation for a word using Gemini TTS.
 */
export const pronounceWord = async (word: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `The word is: ${word}.` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

/**
 * Checks the spelling by analyzing the user's recorded audio against the target word.
 */
export const checkSpelling = async (targetWord: string, audioBase64: string, mimeType: string): Promise<SpellingFeedback> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview as it supports audio file input via generateContent
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: audioBase64
            }
          },
          { 
            text: `
              You are a Spelling Bee Judge for Al-Hussan Model School.
              The student was asked to spell the word: "${targetWord}".
              Listen to the audio. The student should be spelling the word letter-by-letter.
              
              Tasks:
              1. Transcribe the letters spoken.
              2. Check if the sequence of letters matches the correct spelling of "${targetWord}".
              3. Provide encouraging feedback.
              
              Return the result in JSON format with: isCorrect (boolean), heardSpelling (string), and feedbackText (string).
            ` 
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            heardSpelling: { 
              type: Type.STRING,
              description: "The letters heard from the student, e.g. A-P-P-L-E"
            },
            feedbackText: { 
              type: Type.STRING,
              description: "Encouraging feedback explaining if they were right or wrong."
            }
          },
          required: ["isCorrect", "heardSpelling", "feedbackText"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as SpellingFeedback;

  } catch (error) {
    console.error("Spelling Check Error:", error);
    return {
      isCorrect: false,
      heardSpelling: "Could not hear clearly",
      feedbackText: "I'm sorry, I had trouble processing that audio. Please try spelling the word again clearly."
    };
  }
};
