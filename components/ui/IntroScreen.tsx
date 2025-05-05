"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TextGenerateEffect } from './text-generate-effect';
import { cn } from '@/lib/utils';

interface IntroScreenProps {
  onComplete: () => void; // Callback when the intro is done
  duration?: number; // How long the intro should be visible in ms
  text?: string; // The text to display
}

const defaultText = "Welcome to In-Vision CRM";
const defaultDuration = 4000; // 4 seconds

export function IntroScreen({ 
  onComplete, 
  duration = defaultDuration,
  text = defaultText 
}: IntroScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Call the onComplete callback slightly after fade-out starts
      setTimeout(onComplete, 500); // Match fade-out duration
    }, duration);

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [duration, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5 }} // Fade-out duration
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black pointer-events-none",
        !isVisible && "pointer-events-none" // Allow clicks through when hidden
      )}
    >
      {isVisible && ( // Only render effect when visible
        <TextGenerateEffect 
          words={text} 
          className="text-3xl md:text-5xl lg:text-6xl text-center text-white" 
        />
      )}
    </motion.div>
  );
} 