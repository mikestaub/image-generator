import { GeneratedImage } from "../types/types";

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://image-generator-seven-zeta.vercel.app/api"
    : "http://localhost:3002/api";

export const generateImage = async (prompt: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/generate`, {
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
  const response = await fetch(`${API_BASE_URL}/variations`, {
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
