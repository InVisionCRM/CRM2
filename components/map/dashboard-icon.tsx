"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function DashboardIcon() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  const handleConfirm = () => {
    setIsDialogOpen(false)
    router.push("/")
  }

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md"
        aria-label="Go to Dashboard"
      >
        <img
          src="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/dashboard-TyY1RB6f6GZ0Bf3Z5ph0fpIkFZGS0X.png"
          alt="Dashboard"
          className="w-8 h-8"
        />
      </button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Return to Dashboard?</DialogTitle>
            <DialogDescription>Are you sure you want to leave the map and return to the dashboard?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirm}>
              Go to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
