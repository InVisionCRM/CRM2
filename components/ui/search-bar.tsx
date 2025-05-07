import React, { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, containerClassName, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isExpanded) {
          setIsExpanded(false);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isExpanded]);

    return (
      <motion.div 
        className={cn("relative w-full", containerClassName)}
        animate={{ width: isExpanded ? "100%" : "10%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="relative w-full" onClick={() => setIsExpanded(true)}>
          <Input
            ref={ref}
            type="search"
            className={cn(
              "w-full py-2 bg-black/50 text-white placeholder-white/50",
              "rounded-full backdrop-blur-sm focus:ring-0 font-extralight",
              "h-10 sm:h-12 pl-8 sm:pl-10 pr-3 sm:pr-4",
              "border border-[#59ff00]",
              "focus:border-[#59ff00]/80",
              "cursor-pointer",
              isExpanded ? "" : "placeholder-transparent",
              className
            )}
            {...props}
            onBlur={() => {
              if (!props.value) {
                setIsExpanded(false);
              }
            }}
          />
          <Search 
            className={cn(
              "h-5 w-5 absolute top-1/2 transform -translate-y-1/2 text-white/50 transition-all duration-300",
              isExpanded ? "left-3" : "left-1/2 -translate-x-1/2"
            )} 
          />
          <AnimatePresence>
            {isExpanded && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-white/50 hover:text-white/80 transition-colors rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }
)

SearchBar.displayName = "SearchBar" 