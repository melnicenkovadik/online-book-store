"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "onLoadingComplete"> {
  fallbackSrc?: string;
  loadingComponent?: React.ReactNode;
  className?: string;
  imgClassName?: string;
}

/**
 * Спрощений Image component без useEffect
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  quality,
  placeholder = "empty",
  fallbackSrc = "/placeholder-image.svg",
  loadingComponent,
  className = "",
  imgClassName = "",
  style,
  ...rest
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(!priority);
  const [imageSrc, setImageSrc] = useState<ImageProps["src"]>(
    typeof src === "string" ? src.trim() : src,
  );

  // Handle image load error
  const handleError = () => {
    setImageSrc(
      typeof fallbackSrc === "string" ? fallbackSrc.trim() : fallbackSrc,
    );
  };

  // Handle image load complete
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <div
      className={`relative ${className}`}
      style={{ position: "relative", ...style }}
    >
      {isLoading && loadingComponent && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {loadingComponent}
        </div>
      )}

      <Image
        src={imageSrc}
        alt={alt}
        {...(typeof width !== "undefined" ? { width } : {})}
        {...(typeof height !== "undefined" ? { height } : {})}
        sizes={sizes}
        quality={quality || 80}
        priority={priority}
        placeholder={placeholder}
        onLoad={handleLoadingComplete}
        onError={handleError}
        className={`${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300 ${imgClassName}`}
        {...rest}
      />
    </div>
  );
}
