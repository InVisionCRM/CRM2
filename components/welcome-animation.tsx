"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import { Calendar, Sparkles } from "lucide-react"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"

export function WelcomeAnimation() {
  const { data: session } = useSession()
  const [show, setShow] = useState(true)

  // Extract user's name or email without domain
  const displayName = session?.user?.name || (session?.user?.email ? session.user.email.split("@")[0] : "User")

  // Capitalize first letter of each word
  const formattedName = displayName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")

  useEffect(() => {
    // Hide the animation after 3 seconds
    const timer = setTimeout(() => {
      setShow(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 w-full h-full">
            <BackgroundGradientAnimation
              containerClassName="w-full h-full"
              gradientBackgroundStart="rgb(25, 25, 77)"
              gradientBackgroundEnd="rgb(9, 9, 34)"
              firstColor="18, 113, 255"
              secondColor="221, 74, 255"
              thirdColor="100, 220, 255"
              fourthColor="200, 50, 50"
              fifthColor="180, 180, 50"
              interactive={true}
              size="100%"
              blendingValue="screen"
            />
          </div>

          <div className="relative z-10">
            {/* Main content */}
            <motion.div
              className="relative flex flex-col items-center text-white"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div
                className="relative mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.4,
                }}
              >
                <Calendar className="h-16 w-16 text-white" strokeWidth={1.5} />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: 1,
                    repeatType: "reverse",
                  }}
                >
                  <Sparkles className="h-6 w-6 text-yellow-300" />
                </motion.div>
              </motion.div>

              <motion.h2
                className="text-3xl font-bold mb-2 tracking-wide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Welcome Back
              </motion.h2>

              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h3 className="text-xl text-blue-200 font-light">{formattedName}</h3>
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
