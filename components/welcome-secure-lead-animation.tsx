"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LockKeyhole, Sparkles } from "lucide-react"

/** 
 * Lime-green on black secure-lead welcome.
 * Hides itself after 2.5 s.  Tailwind colors can be tweaked via config.
 */
export function WelcomeSecureLeadAnimation() {
  const [show, setShow] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence onExitComplete={() => setShow(false)}>
      {show && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black ${isExiting ? 'pointer-events-none' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onAnimationComplete={() => {
            if (isExiting) {
            }
          }}
        >
          {/* pulsing backdrop glow */}
          <motion.div
            className="absolute inset-0 bg-lime-500/10 blur-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, scale: [1, 1.1, 1] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />

          {/* foreground content */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-lime-400"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="relative mb-4"
            >
              <LockKeyhole className="h-16 w-16" strokeWidth={1.3} />
              <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-lime-300 animate-spin-slow" />
            </motion.div>

            <h2 className="text-2xl font-semibold tracking-wide text-center">
              Entering Secure Lead Page&nbsp;<span className="animate-pulse">now</span>
            </h2>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
