import React, { useState, useEffect } from "react";
import { DraggableImage } from "./components/DraggableImage";
import { generateImage, generateVariations } from "./services/imageService";
import { dbService } from "./services/db";
import { GeneratedImage } from "./types/types";

const App: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      await dbService.initialize();
      const savedImages = dbService.getAllImages();
      setImages(savedImages);
    };
    initDb();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const imageUrl = await generateImage(prompt);
      const newImage: GeneratedImage = {
        prompt,
        imageUrl,
        position: { x: 50, y: 50 },
      };
      setImages([...images, newImage]);
      setPrompt("");
    } catch (error) {
      console.error("Failed to generate image:", error);
    }
    setLoading(false);
  };

  const handleGenerateVariations = async (originalPrompt: string) => {
    setLoading(true);
    try {
      const variations = await generateVariations(originalPrompt);

      const originalImage = images.find((img) => img.prompt === originalPrompt);
      if (!originalImage) {
        throw new Error("Original image not found");
      }

      const newImages = variations.map((variation, index) => {
        let xOffset = 0;
        let yOffset = 0;

        switch (index) {
          case 0: // Left
            xOffset = -220;
            yOffset = 0;
            break;
          case 1: // Right
            xOffset = 220;
            yOffset = 0;
            break;
          case 2: // Top
            xOffset = 0;
            yOffset = -220;
            break;
          case 3: // Bottom
            xOffset = 0;
            yOffset = 220;
            break;
        }

        return {
          prompt: variation.prompt,
          imageUrl: variation.imageUrl,
          position: {
            x: originalImage.position.x + xOffset,
            y: originalImage.position.y + yOffset,
          },
        };
      });

      setImages([...images, ...newImages]);
    } catch (error) {
      console.error("Failed to generate variations:", error);
    }
    setLoading(false);
  };

  const handleDeleteImage = (imageToDelete: GeneratedImage) => {
    setImages(images.filter((img) => img.imageUrl !== imageToDelete.imageUrl));
  };

  const handleDuplicateImage = (imageToDuplicate: GeneratedImage) => {
    const duplicate = {
      ...imageToDuplicate,
      id: undefined, // Remove ID so it won't be saved to DB
      position: {
        x: imageToDuplicate.position.x + 20,
        y: imageToDuplicate.position.y + 20,
      },
    };
    setImages([...images, duplicate]);
  };

  const arrangeInGrid = () => {
    const IMAGE_WIDTH = 200;
    const IMAGE_GAP = 10;
    const GRID_SIZE = IMAGE_WIDTH + IMAGE_GAP;
    const RESERVED_TOP_SPACE = 700;

    // Calculate available width and number of columns
    const availableWidth = window.innerWidth - IMAGE_GAP * 2;
    const COLUMNS = Math.floor(availableWidth / GRID_SIZE);

    // Calculate total height needed
    const totalRows = Math.ceil(images.length / COLUMNS);
    const totalHeight = totalRows * GRID_SIZE + RESERVED_TOP_SPACE;

    // Update positions in state
    const arrangedImages = images.map((image, index) => {
      const row = Math.floor(index / COLUMNS);
      const col = index % COLUMNS;

      return {
        ...image,
        position: {
          x: col * GRID_SIZE + IMAGE_GAP,
          y: RESERVED_TOP_SPACE + row * GRID_SIZE + IMAGE_GAP,
        },
      };
    });

    // Batch the updates
    requestAnimationFrame(() => {
      // Update state with new positions
      setImages([...arrangedImages]);

      // Update container height
      const container = document.querySelector(
        ".canvas-container"
      ) as HTMLElement;
      if (container) {
        container.style.minHeight = `${totalHeight}px`;
      }

      // Save positions to database after transition
      setTimeout(() => {
        arrangedImages.forEach((image) => {
          if (image.id) {
            dbService.saveImage(image);
          }
        });
      }, 500); // Match the transition duration
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleGenerate();
    }
  };

  const handlePositionChange = (
    image: GeneratedImage,
    newPosition: { x: number; y: number }
  ) => {
    setImages(
      images.map((img) =>
        img.imageUrl === image.imageUrl
          ? { ...img, position: newPosition }
          : img
      )
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="p-4 bg-transparent z-10 fixed top-0 left-0 right-0">
        <div className="mx-auto w-[600px] flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Live Image Generation
          </h1>
          <div className="flex w-full gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 p-2 border rounded bg-white"
              placeholder="Enter your image prompt and press Enter..."
              disabled={loading}
            />
            <button
              onClick={arrangeInGrid}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded whitespace-nowrap transition-colors"
            >
              Arrange in Grid
            </button>
          </div>
          {loading && (
            <div className="text-blue-500 font-semibold">Generating...</div>
          )}
        </div>
      </div>

      <div>
        <div className="canvas-container relative bg-white min-h-screen w-full overflow-y-auto">
          {/* Visual indicator for reserved space */}
          <div className="absolute top-0 left-0 right-0 h-[1000px] border-b border-gray-200 pointer-events-none" />

          {images.map((image, index) => (
            <DraggableImage
              key={`${image.imageUrl}-${index}`}
              image={image}
              onSave={(savedImage) => {
                setImages(
                  images.map((img) =>
                    img.imageUrl === savedImage.imageUrl ? savedImage : img
                  )
                );
              }}
              onGenerateVariations={() =>
                handleGenerateVariations(image.prompt)
              }
              onDelete={handleDeleteImage}
              onDuplicate={handleDuplicateImage}
              onPositionChange={handlePositionChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
