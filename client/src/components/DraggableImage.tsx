import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import { GeneratedImage } from "../types/types";
import { dbService } from "../services/db";

interface Props {
  image: GeneratedImage;
  onSave: (savedImage: GeneratedImage) => void;
  onGenerateVariations: () => void;
  onDelete: (image: GeneratedImage) => void;
  onDuplicate: (image: GeneratedImage) => void;
  onPositionChange: (
    image: GeneratedImage,
    newPosition: { x: number; y: number }
  ) => void;
}

export const DraggableImage: React.FC<Props> = ({
  image,
  onSave,
  onGenerateVariations,
  onDelete,
  onDuplicate,
  onPositionChange,
}) => {
  const [position, setPosition] = useState(image.position);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setPosition(image.position);
    }
  }, [image.position, isDragging]);

  const handleDrag = (_e: any, data: { x: number; y: number }) => {
    const newPosition = { x: data.x, y: data.y };
    setPosition(newPosition);
    onPositionChange(image, newPosition);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const imageToSave = { ...image, position };
    const savedImage = await dbService.saveImage(imageToSave);
    if (savedImage) {
      onSave(savedImage);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (image.id) {
      await dbService.deleteImage(image.id);
    }
    onDelete(image);
  };

  return (
    <Draggable
      position={position}
      onDrag={handleDrag}
      onStart={() => setIsDragging(true)}
      onStop={() => setIsDragging(false)}
      bounds="parent"
      handle=".drag-handle"
    >
      <div
        className={`absolute ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        } ${isHovered ? "z-50" : "z-0"} ${
          isDragging ? "" : "transition-all duration-500 ease-in-out"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-image-url={image.imageUrl}
      >
        <div className="relative group">
          <img
            src={image.imageUrl}
            alt={image.prompt}
            className="w-[200px] h-[200px] rounded-lg shadow-lg drag-handle select-none border-5 border-white"
            draggable={false}
          />
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white w-7 h-7 rounded-full hover:bg-red-600 select-none font-bold text-lg flex items-center justify-center"
              title="Delete image"
            >
              -
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(image);
              }}
              className="bg-blue-500 text-white w-7 h-7 rounded-full hover:bg-blue-600 select-none font-bold text-lg flex items-center justify-center"
              title="Duplicate image"
            >
              +
            </button>
            <button
              onClick={handleSave}
              className="bg-pink-500 text-white w-7 h-7 rounded-full hover:bg-pink-600 select-none font-bold text-lg flex items-center justify-center"
              title="Save image"
            >
              ♥
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateVariations();
              }}
              className="bg-yellow-500 text-white w-7 h-7 rounded-full hover:bg-yellow-600 select-none font-bold text-lg flex items-center justify-center"
              title="Generate variations"
            >
              !
            </button>
          </div>
          <div className="w-[200px] mt-2 bg-black bg-opacity-50 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity text-sm select-none text-center z-20">
            {image.prompt}
          </div>
        </div>
      </div>
    </Draggable>
  );
};
