import { GeneratedImage } from "../types/types";

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://image-generator-seven-zeta.vercel.app/api"
    : "http://localhost:3002/api";

export class DatabaseService {
  async initialize() {
    // No initialization needed for cloud DB
  }

  async saveImage(image: GeneratedImage): Promise<GeneratedImage | undefined> {
    const { prompt, imageUrl, position, id } = image;

    try {
      if (id) {
        // Update existing image
        await fetch(`${API_BASE_URL}/images/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            imageUrl,
            positionX: position.x,
            positionY: position.y,
          }),
        });
        return image;
      } else {
        // Create new image
        const response = await fetch(`${API_BASE_URL}/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            imageUrl,
            positionX: position.x,
            positionY: position.y,
          }),
        });
        const data = await response.json();
        return { ...image, id: data.id };
      }
    } catch (error) {
      console.error("Failed to save image:", error);
      return undefined;
    }
  }

  async getAllImages(): Promise<GeneratedImage[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/images`);
      const data = await response.json();
      return data.map((row: any) => ({
        id: row.id,
        prompt: row.prompt,
        imageUrl: row.imageUrl,
        position: {
          x: row.positionX,
          y: row.positionY,
        },
      }));
    } catch (error) {
      console.error("Failed to get images:", error);
      return [];
    }
  }

  async deleteImage(id: number) {
    try {
      await fetch(`${API_BASE_URL}/images/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  }
}

export const dbService = new DatabaseService();
