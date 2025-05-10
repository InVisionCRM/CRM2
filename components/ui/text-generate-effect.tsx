"use client"
import { useEffect } from "react"
import { motion, stagger, useAnimate } from "framer-motion"
import { cn } from "@/lib/utils"

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}: {
  words: string
  className?: string
  filter?: boolean
  duration?: number
}) => {
  const [scope, animate] = useAnimate()
  const wordsArray = (words || "").split(" ")

  useEffect(() => {
    if (scope.current && wordsArray.length > 0 && wordsArray[0] !== '') {
        animate(
          "span",
          {
            opacity: 1,
            filter: filter ? "blur(0px)" : "none",
          },
          {
            duration: duration,
            delay: stagger(0.2),
          }
        );
    } else {
      // Optional: If no words, ensure spans (if any rendered briefly) are hidden
      // animate("span", { opacity: 0 }, { duration: 0 });
    }
  }, [animate, scope, words]);

  const renderWords = () => {
    if (wordsArray.length === 0 || (wordsArray.length === 1 && wordsArray[0] === '')) {
      return null;
    }
    
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              initial={{ opacity: 0, filter: filter ? "blur(10px)" : "none" }}
              className="dark:text-white text-white opacity-0"
            >
              {word}{" "}
            </motion.span>
          )
        })}
      </motion.div>
    )
  }

  return (
    <div className={cn("font-bold", className)}>
      <div className="mt-4">
        <div className="dark:text-white text-white text-2xl leading-snug tracking-wide">
          {renderWords()}
        </div>
      </div>
    </div>
  )
}
