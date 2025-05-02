"use client"

import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface LoadingAnimationProps {
  message?: string
}

export default function LoadingAnimation({ message = "Loading..." }: LoadingAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white/90 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-6 border border-gray-100"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
          />
          <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium text-gray-700"
        >
          {message}
        </motion.p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full"
        />
      </motion.div>
    </motion.div>
  )
} 