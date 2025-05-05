"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SparklesCore } from "@/components/ui/sparkles"
import { Camera, LogIn, LogOut, Search, User, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useSession, signIn, signOut } from "next-auth/react"
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export const Hero = () => {
  const logoRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = React.useState(0)
  const { data: session, status, update } = useSession()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [userName, setUserName] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize user data from session
  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name)
    }
  }, [session])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const opacity = Math.max(1 - scrollY / 200, 0)

  // Effect to create the dynamic shadow/light effect on the logo
  useEffect(() => {
    if (!logoRef.current) return

    // This creates a subtle movement of the "light" on the logo
    const handleMouseMove = (e: MouseEvent) => {
      if (!logoRef.current) return

      const { clientX, clientY } = e
      const rect = logoRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      // Update the radial gradient position based on mouse movement
      // This creates the effect of light moving across the logo
      logoRef.current.style.setProperty("--x", `${x}px`)
      logoRef.current.style.setProperty("--y", `${y}px`)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const validateImageFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, GIF, WebP)")
      return false
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      setError("Image file is too large. Maximum size is 5MB")
      return false
    }

    setError(null)
    return true
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!validateImageFile(file)) return
      
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleProfileUpdate = async () => {
    if (!session?.user?.id) return

    // Validate form
    if (!userName.trim()) {
      setError("Please enter a display name")
      return
    }

    setError(null)
    setIsUpdating(true)
    try {
      // Create form data for the avatar upload
      const formData = new FormData()
      formData.append("name", userName)
      formData.append("userId", session.user.id)
      
      if (avatarFile) {
        formData.append("avatar", avatarFile)
      }

      // Send the update to the API
      const response = await fetch("/api/user/profile", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile")
      }
      
      // Update the session with the new user data
      await update({
        ...session,
        user: {
          ...session.user,
          name: data.name,
          image: data.image || session.user.image,
        }
      })

      toast.success("Profile updated successfully")
      setIsProfileModalOpen(false)
      
      // Reset form state
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setIsUpdating(false)
    }
  }

  const closeModal = () => {
    setIsProfileModalOpen(false)
    setError(null)
    setAvatarFile(null)
    setAvatarPreview(null)
    
    // Reset name to current value
    if (session?.user?.name) {
      setUserName(session.user.name)
    }
  }

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ opacity }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="h-[50rem] w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md relative"
    >
      {/* User Avatar in top left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute top-8 left-8 z-50"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar className="h-10 w-10 border border-white/20 hover:border-white/40 transition-colors bg-black/50 backdrop-blur-sm">
                {session?.user?.image ? (
                  <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                ) : (
                  <AvatarFallback className="bg-black/50 text-white">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-black/80 backdrop-blur-md border-white/20 text-white" align="start">
            {status === "authenticated" ? (
              <>
                <DropdownMenuLabel>
                  {session.user.name || session.user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-white/10"
                  onClick={() => setIsProfileModalOpen(true)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-white/10"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-white/10"
                onClick={() => signIn()}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Log in
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Profile Edit Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/90 border border-white/20 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
              <button 
                onClick={closeModal}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Close profile modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div className="relative group mb-4">
                <Avatar className="h-24 w-24 border-2 border-white/20 bg-black/50">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Preview" />
                  ) : session?.user?.image ? (
                    <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                  ) : (
                    <AvatarFallback className="bg-black/50 text-white">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div 
                  className="absolute bottom-0 right-0 bg-[#59ff00] rounded-full p-1.5 cursor-pointer"
                  onClick={triggerFileInput}
                >
                  <Camera className="h-4 w-4 text-black" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  aria-label="Upload profile picture"
                  title="Upload profile picture"
                />
              </div>
              <div className="w-full space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm text-white/70 mb-1">
                    Display Name
                  </label>
                  <Input
                    id="name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-black/50 border-white/20 text-white placeholder-white/50 focus:border-[#59ff00]/50"
                    placeholder="Enter your display name"
                  />
                </div>
                
                {error && (
                  <div className="text-red-500 text-sm mt-2 text-center">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeModal}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProfileUpdate}
                disabled={isUpdating}
                className="bg-[#59ff00] text-black hover:bg-[#59ff00]/80 font-medium"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute top-8 w-full max-w-xl px-4 z-50"
      >
        <div className="relative w-full">
          <Input
            type="search"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 h-12 bg-black/50 border-white/20 text-white placeholder-white/50 rounded-full backdrop-blur-sm focus:border-white/50 focus:ring-0 font-extralight"
          />
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
        </div>
      </motion.div>

      {/* Logo in the background with shadow play effect */}
      <motion.div
        ref={logoRef}
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 0.2 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          // This creates the base shadow effect
          maskImage: "radial-gradient(circle at var(--x, 50%) var(--y, 50%), black 10%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(circle at var(--x, 50%) var(--y, 50%), black 10%, transparent 65%)",
        }}
      >
        <div className="relative w-[500px] h-[300px] transform scale-150">
          <Image
            src="/logo.png"
            alt="Purlin Logo"
            fill
            className="object-contain"
            style={{
              filter: "drop-shadow(0 0 15px rgba(190, 242, 100, 0.5))",
            }}
          />
        </div>
      </motion.div>

      {/* Main content */}
      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="text-6xl md:text-7xl lg:text-9xl font-bold text-center relative z-20"
      >
        <span className="text-white">PURL</span>
        <span style={{ color: "#59ff00" }} className="drop-shadow-[0_0_8px_rgba(89,255,0,0.8)]">
          IN
        </span>
      </motion.h1>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
        className="w-[40rem] lg:h-40 h-60 relative"
      >
        {/* Gradients */}
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
          className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-[2px] w-3/4 blur-sm" 
        />
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
          className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-px w-3/4" 
        />
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1, ease: "easeOut" }}
          className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-[5px] w-1/4 blur-sm" 
        />
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1, ease: "easeOut" }}
          className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-px w-1/4" 
        />

        {/* Core component */}
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1200}
          className="w-full h-full"
          particleColor="#59ff00"
        />

        {/* Radial Gradient to prevent sharp edges */}
        <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
      </motion.div>
    </motion.div>
  )
} 