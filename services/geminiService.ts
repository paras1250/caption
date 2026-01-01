import { GoogleGenAI, Type } from "@google/genai";
import type { CaptionLine } from '../types';

// Utility to parse "mm:ss.ms" into seconds
const parseTimestamp = (time: string): number => {
  if (!time) return 0;
  const parts = time.split(':');
  if (parts.length < 2) return parseFloat(parts[0]) || 0;
  const minutes = parts[0];
  const seconds = parts[1];
  return parseInt(minutes, 10) * 60 + parseFloat(seconds);
};

// Utility to convert a File object to a GoogleGenerativeAI.Part object
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      mimeType: file.type,
      data: await base64EncodedDataPromise,
    },
  };
};

export const generateCaptions = async (file: File): Promise<CaptionLine[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API Key must be set when running in a browser. Please select a key via the UI.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are a world-class creative assistant specializing in analyzing audio files and generating synchronized song lyrics.
    Your task is to listen to an audio file and create original lyrics that perfectly match the music's mood, genre, and instrumental character.
    You must automatically detect the song's language if vocals are present.
    For each lyric line, you must also provide a single, relevant emoji that captures the line's emotion.
    Your output must be in the specified JSON format.
  `;

  const prompt = `
    A user has uploaded an audio file. Listen to the audio and:
    1. Perform deep analysis of mood, tempo, and instrumentation.
    2. Generate creative synchronized lyrics.
    - Transcription: If vocals exist, transcribe them accurately.
    - Instrumental: If no vocals, create evocative lyrics matching the vibe.
    - Language: Detect language. If Hindi, use Romanized Hindi (Hinglish).
    - Format: Sequential lines with startTime/endTime in "mm:ss.ms".
    - Emoji: Include 1 emoji per line.

    Produce a JSON array of caption line objects.
  `;
  
  const audioPart = await fileToGenerativePart(file);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: [audioPart, {text: prompt}] },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              text: { type: Type.STRING },
              emoji: { type: Type.STRING },
            },
            required: ["startTime", "endTime", "text"],
          },
        },
      },
    });

    const rawJson = response.text?.trim();
    if (!rawJson) throw new Error("Empty response from AI");
    
    const parsedResponse: any[] = JSON.parse(rawJson);

    return parsedResponse.map(line => ({
      startTime: parseTimestamp(line.startTime),
      endTime: parseTimestamp(line.endTime),
      text: line.text,
      emoji: line.emoji,
    }));
  } catch (err: any) {
    console.error("Gemini Service Error:", err);
    throw err;
  }
};