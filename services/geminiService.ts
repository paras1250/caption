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
  /**
   * CRITICAL: We instantiate GoogleGenAI inside the function rather than at the top level.
   * This prevents the application from crashing with a blank screen during initial script load
   * if the environment variable process.env.API_KEY is not yet available or is injected 
   * asynchronously (a common issue in browser environments and certain deployment platforms).
   */
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const systemInstruction = `
    You are a world-class creative assistant specializing in analyzing audio files and generating synchronized song lyrics.
    Your task is to listen to an audio file and create original lyrics that perfectly match the music's mood, genre, and instrumental character.
    You must automatically detect the song's language if vocals are present.
    For each lyric line, you must also provide a single, relevant emoji that captures the line's emotion.
    Your output must be in the specified JSON format.
  `;

  const prompt = `
    A user has uploaded an audio file.
    Please perform a deep analysis of this audio file. Your analysis should cover its mood, tempo, rhythm, and instrumentation.
    Based ONLY on your analysis of the audio, generate original, creative, and synchronized lyrics.
    - If you detect vocals, transcribe them accurately and time them.
    - If the song is instrumental, create lyrics that evoke the feeling and story of the music.
    - Language Detection: If vocals are present, automatically detect the language. If the detected language is Hindi, the output lyrics MUST be written using English characters (Romanized Hindi/Hinglish). For all other languages, use the detected language.
    - The lyrics must be broken down into lines with accurate "startTime" and "endTime" timestamps ("mm:ss.ms" format).
    - Timestamps must be sequential and accurately reflect the timing within the song.
    - For each line, include a suitable emoji that captures the emotion of the lyric.

    Produce a JSON array of caption line objects with "startTime", "endTime", "text", and "emoji" properties.
  `;
  
  const audioPart = await fileToGenerativePart(file);

  // Using gemini-3-pro-preview for complex reasoning and creative tasks like music analysis and lyric generation.
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
            startTime: {
              type: Type.STRING,
              description: "The start time of the lyric line in mm:ss.ms format.",
            },
            endTime: {
              type: Type.STRING,
              description: "The end time of the lyric line in mm:ss.ms format.",
            },
            text: {
              type: Type.STRING,
              description: "The text of the lyric line.",
            },
            emoji: {
              type: Type.STRING,
              description: "A single emoji that best represents the emotion of the lyric line.",
            },
          },
          required: ["startTime", "endTime", "text"],
        },
      },
    },
  });

  const rawJson = response.text.trim();
  const parsedResponse: { startTime: string; endTime: string; text: string; emoji?: string }[] = JSON.parse(rawJson);

  return parsedResponse.map(line => ({
    startTime: parseTimestamp(line.startTime),
    endTime: parseTimestamp(line.endTime),
    text: line.text,
    emoji: line.emoji,
  }));
};