import { GoogleGenAI, Modality, Type } from "@google/genai";
import { SpellingFeedback, WordMetadata } from "../types";

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
 * Generates audio for a full sentence.
 */
export const pronounceSentence = async (sentence: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: sentence }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Different voice for context
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Sentence TTS Error:", error);
    return null;
  }
};

/**
 * Fetches comprehensive metadata for a given word.
 */
export const getWordMetadata = async (word: string): Promise<WordMetadata> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Provide linguistic details for the English word: "${word}".
        Include:
        1. Part of speech (e.g., Noun, Verb, Adjective).
        2. A simple, student-friendly definition.
        3. An example sentence using the word.
        
        Return the result as JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            partOfSpeech: { type: Type.STRING },
            definition: { type: Type.STRING },
            sentence: { type: Type.STRING }
          },
          required: ["partOfSpeech", "definition", "sentence"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as WordMetadata;
  } catch (error) {
    console.error("Metadata Error:", error);
    return {
      partOfSpeech: "Word",
      definition: "Definition unavailable",
      sentence: `We are practicing the word: ${word}.`
    };
  }
};

/**
 * Checks the spelling by analyzing the user's recorded audio against the target word.
 */
export const checkSpelling = async (targetWord: string, audioBase64: string, mimeType: string): Promise<SpellingFeedback> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
              You are a strict Spelling Bee Judge for Al-Hussan Model School.
              The student was asked to spell the word: "${targetWord.toUpperCase()}".
              
              CRITICAL RULES:
              1. IF THE AUDIO IS SILENT, CONTAINS ONLY NOISE, OR NO LETTERS ARE SPOKEN:
                 - Set "isSilent" to true.
                 - Set "isCorrect" to false.
                 - Set "feedbackText" to "I didn't hear any spelling. Please try again."
              2. The student MUST spell the word letter-by-letter.
              3. Compare the heard letters to "${targetWord.toUpperCase()}".
              4. Provide a letter-by-letter analysis of the TARGET word:
                 - "correct": The letter was spoken in the right order.
                 - "incorrect": A different letter was spoken at this position.
                 - "missing": The letter was skipped.
              
              Return JSON.
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
            isSilent: { type: Type.BOOLEAN },
            heardSpelling: { 
              type: Type.STRING,
              description: "The letters heard from the student, e.g. A-P-L-E"
            },
            letterAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  letter: { type: Type.STRING },
                  status: { 
                    type: Type.STRING,
                    description: "Status: 'correct', 'incorrect', 'missing'"
                  }
                },
                required: ["letter", "status"]
              }
            },
            feedbackText: { 
              type: Type.STRING,
              description: "Encouraging feedback. If silent, ask them to speak clearly."
            }
          },
          required: ["isCorrect", "isSilent", "heardSpelling", "letterAnalysis", "feedbackText"]
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
      isSilent: false,
      heardSpelling: "Error",
      letterAnalysis: [],
      feedbackText: "I'm sorry, I had trouble processing that audio. Please try spelling the word again clearly."
    };
  }
};