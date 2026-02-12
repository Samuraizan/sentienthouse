import { GoogleGenerativeAI } from "@google/genai";

/**
 * Nano Banana Service (Gemini Image Generation)
 * 
 * Wrapper for Google's Gemini 2.5/3.0 image generation models.
 * Used for generating textures, skyboxes, and other assets in the 3D scene.
 */

// Initialize client
// Expects VITE_GOOGLE_GENAI_KEY in .env
const apiKey = import.meta.env.VITE_GOOGLE_GENAI_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// The "Nano Banana" model (Gemini 2.5 Flash Image or similar)
// Updating to specific model name when confirmed, mostly likely "gemini-2.0-flash-exp" or similar for now until 2.5 is public
const MODEL_NAME = "gemini-2.0-flash-exp"; 

export const isConfigured = () => !!apiKey;

/**
 * Generate an image from a text prompt.
 * @param {string} prompt - Description of the image to generate.
 * @returns {Promise<string>} - Base64 data URL of the generated image.
 */
export async function generateImage(prompt) {
  if (!genAI) {
    throw new Error("Missing VITE_GOOGLE_GENAI_KEY in .env");
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Nano Banana / Gemini Image Generation parameters
    // Note: Actual API shape depends on specific SDK version for image gen
    // This is a placeholder structure based on common GenAI patterns
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      // specific generation config if needed
    });

    const response = await result.response;
    // Assuming text response for now, but image models return headers/links or base64
    // We will debug the exact response shape in the browser
    return response.text(); 
  } catch (error) {
    console.error("Nano Banana generation failed:", error);
    throw error;
  }
}

/**
 * Generate a seamless texture for 3D use.
 * @param {string} type - e.g., "floor", "wall", "carpet"
 * @param {string} style - e.g., "cyberpunk", "marble", "shag"
 */
export async function generateTexture(type, style) {
  const prompt = `Seamless repeatable texture of ${style} ${type}, top-down view, flat lighting, high resolution, 4k`;
  return generateImage(prompt);
}
