import { GeneratedImage } from "../types/types";

export const generateImage = async (prompt: string): Promise<string> => {
  const response = await fetch("http://localhost:3002/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to generate image");
  }
  return data.imageUrl;
};

interface VariationResponse {
  prompt: string;
  imageUrl: string;
}

export const generateVariations = async (
  prompt: string
): Promise<VariationResponse[]> => {
  const response = await fetch("http://localhost:3002/api/variations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate variations");
  }

  const { variations } = await response.json();
  return variations;
};
