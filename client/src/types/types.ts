export interface GeneratedImage {
  id?: number;
  prompt: string;
  imageUrl: string;
  position: {
    x: number;
    y: number;
  };
}

export interface DatabaseSchema {
  images: GeneratedImage[];
}
