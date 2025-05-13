"use client";

import { DriveFileManager } from "../components/DriveFileManager";
import { Toaster } from "@/components/ui/toaster";
import { motion, useDragControls, PanInfo } from "framer-motion";
import { useState } from "react";

// TODO: Build out the DriveFileManage component and integrate useGoogleDrive hook
// For now, this is a placeholder page.

export default function DrivePage() {
  const [isOpen, setIsOpen] = useState(false);
  const dragControls = useDragControls();

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      setIsOpen(true); // Open sidebar if dragged right enough
    } else if (info.offset.x < -50) {
      setIsOpen(false); // Close sidebar if dragged left enough
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 mt-10">
      <h1 className="text-3xl font-bold mb-6 text-white"></h1>
      <DriveFileManager />
      <Toaster />
      <motion.div 
        className="fixed left-0 top-0 w-12 h-full z-30 md:hidden"
        drag="x"
        dragControls={dragControls}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
      />
      <motion.div
        className="fixed inset-y-0 left-0 z-40 flex md:hidden"
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        drag="x"
        dragConstraints={{ left: -300, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        {/* Sidebar content */}
      </motion.div>
    </div>
  );
} 