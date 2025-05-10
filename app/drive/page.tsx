"use client";

import { DriveFileManager } from "../components/DriveFileManager";
import { Toaster } from "@/components/ui/toaster";

// TODO: Build out the DriveFileManage component and integrate useGoogleDrive hook
// For now, this is a placeholder page.

export default function DrivePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-white">Google Drive Files</h1>
      <DriveFileManager />
      <Toaster />
    </div>
  );
} 