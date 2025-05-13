"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

// Define the Visit type
export interface Visit {
  id: string
  status: string
  notes?: string
  timestamp: string
  salesPersonId?: string
  salesPersonName?: string
}

interface VisitHistoryProps {
  visits: Visit[]
}

export default function VisitHistory({ visits = [] }: VisitHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!visits || visits.length === 0) {
    return (
      <div className="text-center py-2 text-gray-400">
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-between text-gray-400"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>No visit history available</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button 
        variant="ghost" 
        className="w-full flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Visit History ({visits.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>
      
      {isExpanded && (
        <div className="space-y-2 mt-2">
          {[...visits].reverse().map((visit) => (
            <div key={visit.id} className="border border-green-400 rounded-md p-3 bg-gray-800">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-white">{visit.status}</span>
                <span className="text-xs text-gray-300">{new Date(visit.timestamp).toLocaleDateString()}</span>
              </div>
              {visit.notes && <p className="text-sm whitespace-pre-wrap text-gray-300">{visit.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
