"use client"

import { MessageFab } from "./message-fab"
import { MessagePanel } from "./message-panel"
import { useMessage } from "@/contexts/message-context"
import { useEffect } from "react"

export function MessageWidget() {
  const { isOpen, closeMessagePanel } = useMessage()

  // Handle click outside to close panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const panel = document.getElementById("message-panel")
      const fab = document.getElementById("message-fab")

      if (isOpen && panel && !panel.contains(event.target as Node) && fab && !fab.contains(event.target as Node)) {
        closeMessagePanel()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, closeMessagePanel])

  return (
    <>
      <div id="message-fab">
        <MessageFab />
      </div>
      <div id="message-panel">
        <MessagePanel />
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 sm:hidden" onClick={closeMessagePanel} aria-hidden="true" />
      )}
    </>
  )
}
