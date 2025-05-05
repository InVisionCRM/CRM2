"use client"
import { useEffect, useState } from "react"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import combinedQuotes from "@/data/combined-quotes.json"

export default function TextGenerateEffectDemo() {
  const [randomQuote, setRandomQuote] = useState("")

  useEffect(() => {
    // Select a random quote from the combined array
    const randomIndex = Math.floor(Math.random() * combinedQuotes.length)
    setRandomQuote(combinedQuotes[randomIndex])
  }, [])

  return (
    <div className="max-w-2xl mx-auto py-8">
      <TextGenerateEffect words={randomQuote} className="text-xl" />
    </div>
  )
}
