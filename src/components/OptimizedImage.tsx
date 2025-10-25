"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "onLoadingComplete"> {
  fallbackSrc?: string;
  lowQualitySrc?: string;
  loadingComponent?: React.ReactNode;
  className?: string;
  imgClassName?: string;
}

/**
 * Enhanced Image component with progressive loading, blur-up, and fallback
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
  lowQualitySrc,
  loadingComponent,
  className = "",
  imgClassName = "",
  style,
  ...rest
}: OptimizedImageProps) {
  const sanitizeImageSrc = (value: ImageProps["src"]): ImageProps["src"] => {
    return typeof value === "string" ? value.trim() : value;
  };

  const [isLoading, setIsLoading] = useState(!priority);
  const [_error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<ImageProps["src"]>(
    sanitizeImageSrc(src),
  );

  // Reset state when src changes
  useEffect(() => {
    setImageSrc(sanitizeImageSrc(src));
    setError(false);
    setIsLoading(!priority);
  }, [src, priority, sanitizeImageSrc]);

  // Handle image load error
  const handleError = () => {
    setError(true);
    setImageSrc(sanitizeImageSrc(fallbackSrc));
  };

  // Handle image load complete
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Use blur-up technique if lowQualitySrc is provided
  const blurDataURL =
    (typeof lowQualitySrc === "string"
      ? lowQualitySrc.trim()
      : lowQualitySrc) || undefined;
  const placeholderType = lowQualitySrc ? "blur" : placeholder;

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
        placeholder={placeholderType}
        {...(placeholderType === "blur" && blurDataURL ? { blurDataURL } : {})}
        onLoadingComplete={handleLoadingComplete}
        onError={handleError}
        className={`${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300 ${imgClassName}`}
        {...rest}
      />
    </div>
  );
}
