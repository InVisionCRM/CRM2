"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface BackgroundGradientAnimationProps {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  interactive?: boolean;
  containerClassName?: string;
  className?: string;
  children?: React.ReactNode;
}

export const BackgroundGradientAnimation: React.FC<BackgroundGradientAnimationProps> = ({
  gradientBackgroundStart = "rgb(108, 0, 162)",
  gradientBackgroundEnd = "rgb(0, 17, 82)",
  firstColor = "18, 113, 255",
  secondColor = "221, 74, 255",
  thirdColor = "100, 220, 255",
  fourthColor = "200, 50, 50",
  fifthColor = "180, 180, 50",
  pointerColor = "140, 100, 255", // Default pointer color
  size = "80%",
  blendingValue = "hard-light",
  interactive = true,
  containerClassName,
  className,
  children,
}) => {
  const interactiveRef = useRef<HTMLDivElement>(null);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  const PADDING = "0px"; // No padding by default

  const styles = {
    "--gradient-background-start": gradientBackgroundStart,
    "--gradient-background-end": gradientBackgroundEnd,
    "--first-color": firstColor,
    "--second-color": secondColor,
    "--third-color": thirdColor,
    "--fourth-color": fourthColor,
    "--fifth-color": fifthColor,
    "--pointer-color": pointerColor,
    "--size": size,
    "--blending-value": blendingValue,
  } as React.CSSProperties;

  return (
    <div className={cn("relative w-full h-full", containerClassName)}>
      <style>
        {`
          @keyframes AnimateBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
      <div
        ref={interactiveRef}
        style={styles}
        className={cn(
          "absolute inset-0 w-full h-full z-0 overflow-hidden bg-gradient-to-r from-[--gradient-background-start] to-[--gradient-background-end] [animation:AnimateBG_15s_ease_infinite_alternate]",
          className
        )}
      >
        {/* The moving gradient blobs will be pseudo-elements handled purely in CSS for performance */}
        {/* Or, if you prefer divs, you'd add them here with absolute positioning and animations */}
      </div>
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}; 