"use client";

import React from "react";
import { Blobatar } from "blobatar/react";
import "blobatar/motion.css";
import { cn } from "@/lib/utils";

interface BlobatarAvatarProps {
  name: string;
  size?: "sm" | "default" | "lg";
  animate?: "hover" | "always";
  className?: string;
}

export function BlobatarAvatar({
  name,
  size = "default",
  animate = "hover",
  className,
}: BlobatarAvatarProps) {
  const sizeMap = {
    sm: "size-6",
    default: "size-8",
    lg: "size-10",
  };

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center select-none",
        sizeMap[size],
        className,
      )}
    >
      <Blobatar name={name} animate={animate} />
    </div>
  );
}
