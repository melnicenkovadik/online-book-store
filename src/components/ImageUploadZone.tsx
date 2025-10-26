"use client";
import { ImageIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import React from "react";
import { useDropzone } from "react-dropzone";

interface ImageUploadZoneProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  onUpload?: (files: File[]) => Promise<string[]>;
}

export default function ImageUploadZone({
  images,
  onImagesChange,
  onUpload,
}: ImageUploadZoneProps) {
  const [uploading, setUploading] = React.useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    multiple: true,
    onDrop: async (acceptedFiles) => {
      if (!onUpload || acceptedFiles.length === 0) return;

      setUploading(true);
      try {
        const newUrls = await onUpload(acceptedFiles);
        onImagesChange([...images, ...newUrls]);
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Помилка завантаження файлів");
      } finally {
        setUploading(false);
      }
    },
  });

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const addUrlManually = () => {
    const url = prompt("Введіть URL зображення:");
    if (url?.trim()) {
      onImagesChange([...images, url.trim()]);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Превью существующих изображений */}
      {images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 12,
          }}
        >
          {images.map((url, index) => (
            <button
              key={`image-${url}`}
              type="button"
              style={{
                ...imagePreviewStyle,
                padding: 0,
                cursor: "pointer",
                border: "none",
                background: "none",
              }}
              aria-label={`Зображення ${index + 1}`}
              onMouseEnter={(e) => {
                const overlay = e.currentTarget.querySelector(
                  "[data-overlay]",
                ) as HTMLElement;
                if (overlay) overlay.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                const overlay = e.currentTarget.querySelector(
                  "[data-overlay]",
                ) as HTMLElement;
                if (overlay) overlay.style.opacity = "0";
              }}
            >
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                fill
                sizes="120px"
                style={{ objectFit: "cover" }}
                onError={() => {
                  const el = document.querySelector(
                    `[data-overlay][data-idx="${index}"]`,
                  ) as HTMLElement | null;
                  if (el) el.style.display = "flex";
                }}
              />
              <div data-overlay style={overlayStyle}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  style={deleteButtonStyle}
                  title="Видалити зображення"
                >
                  <TrashIcon />
                </button>
              </div>
              <div data-broken style={brokenImageStyle}>
                Битий лінк
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Drag & Drop зона */}
      <div
        {...getRootProps()}
        style={{
          ...dropzoneStyle,
          ...(isDragActive ? activeDropzoneStyle : {}),
          ...(uploading ? uploadingDropzoneStyle : {}),
        }}
      >
        <input {...getInputProps()} />
        <ImageIcon style={{ width: 32, height: 32, color: "#9ca3af" }} />

        {uploading ? (
          <div style={textStyle}>
            <div>Завантажуємо файли...</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Будь ласка, зачекайте
            </div>
          </div>
        ) : isDragActive ? (
          <div style={textStyle}>
            <div>Відпустіть файли для завантаження</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Підтримуються: JPG, PNG, WebP, GIF
            </div>
          </div>
        ) : (
          <div style={textStyle}>
            <div>Перетягніть зображення або натисніть для вибору</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Підтримуються: JPG, PNG, WebP, GIF
            </div>
          </div>
        )}
      </div>

      {/* Кнопка для добавления URL */}
      <button
        type="button"
        onClick={addUrlManually}
        style={urlButtonStyle}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.backgroundColor = "#f9fafb";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.backgroundColor = "white";
        }}
      >
        <PlusIcon style={{ width: 16, height: 16 }} />
        Додати за URL
      </button>
    </div>
  );
}

// Стили
const dropzoneStyle: React.CSSProperties = {
  border: "2px dashed #d1d5db",
  borderRadius: 12,
  padding: 32,
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  background: "#fafafa",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  minHeight: 120,
};

const activeDropzoneStyle: React.CSSProperties = {
  borderColor: "#3b82f6",
  backgroundColor: "#eff6ff",
  transform: "scale(1.02)",
};

const uploadingDropzoneStyle: React.CSSProperties = {
  borderColor: "#f59e0b",
  backgroundColor: "#fffbeb",
  pointerEvents: "none",
};

const textStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  color: "#374151",
};

const imagePreviewStyle: React.CSSProperties = {
  position: "relative",
  aspectRatio: "1",
  borderRadius: 8,
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
};

// Removed unused style
// const imageStyle: React.CSSProperties = {
//   width: "100%",
//   height: "100%",
//   objectFit: "cover",
// };

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0,
  transition: "opacity 0.2s ease",
};

const deleteButtonStyle: React.CSSProperties = {
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: 8,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const brokenImageStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "none",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  color: "#ef4444",
  background: "#fef2f2",
};

const urlButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "white",
  color: "#374151",
  cursor: "pointer",
  fontSize: 14,
  justifySelf: "start",
};
