"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Camera, LogIn, LogOut, User, X } from "lucide-react"
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
import { isValidImage, isValidFileSize, createFilePreview, resizeImage } from "@/lib/upload-helper"
import { Badge } from "@/components/ui/badge"

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
  const isAdmin = session?.user?.role === "ADMIN"

  // Initialize user data from session
  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name)
    }
  }, [session])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const opacity = Math.max(1 - scrollY / 200, 0)

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
        // Use 'avatar' as the key, not 'file'
        formData.append("avatar", avatarFile)
      }

      // Send the update to the API with specific headers
      const response = await fetch("/api/user/profile", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      })

      // Check for non-OK response before parsing JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to upload" }));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }
      
      const data = await response.json()
      
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Client-side validation
    if (!isValidImage(file)) {
      setError("Please upload a valid image file (JPEG, PNG, GIF, WebP)")
      return
    }
    
    if (!isValidFileSize(file, 5)) { // Allow larger upload initially, we'll resize it
      setError("Image file is too large. Maximum size is 5MB")
      return
    }
    
    try {
      setError(null)
      setIsUpdating(true)
      
      // Create a preview from the original image
      const preview = await createFilePreview(file)
      setAvatarPreview(preview)
      
      // Resize the image to reduce file size before sending to server
      const resizedFile = await resizeImage(file, 400, 400, 0.85)
      setAvatarFile(resizedFile)
      
      setIsUpdating(false)
    } catch (err) {
      console.error("Error processing image:", err)
      setError("Failed to process image")
      setIsUpdating(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
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
    <>
      <motion.div 
        ref={containerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ opacity }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-[7.25rem] w-full bg-transparent flex flex-col items-center overflow-hidden rounded-md relative"
      >
        {/* User Avatar in top right */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute top-4 right-8 z-50"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <div className="flex flex-col items-center">
                  <Avatar className="h-10 w-10 bg-black/50 backdrop-blur-sm ring-2 ring-[#59ff00] ring-offset-2 ring-offset-black/50">
                    {session?.user?.image ? (
                      <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                    ) : (
                      <AvatarFallback className="bg-black/50 text-white">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
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

        {/* Main content container with flex layout */}
        <div className="w-full h-full flex flex-col items-start">
          {/* PURLIN text now positioned in the top-left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="absolute top-4 left-8 z-20"
          >
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-left relative">
              <span className="text-white">PURL</span>
              <span style={{ color: "#59ff00" }} className="drop-shadow-[0_0_8px_rgba(89,255,0,0.8)]">
                IN
              </span>
              {/* Neon line under PURLIN */}
              <div className="absolute -bottom-2 left-0 w-[12rem]">
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-[2px] w-full bg-gradient-to-r from-[#59ff00] to-transparent blur-[1px]"
                />
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-px w-full bg-gradient-to-r from-[#59ff00] to-transparent -mt-[1px]"
                />
              </div>
            </h1>
            {/* Version display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
              className="mt-2"
            >
              <span className="text-xs text-white/60 font-mono tracking-wider">
                v1.03
              </span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
} 