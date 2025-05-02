"use client"

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
  if (!visits || visits.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No visit history available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
  )
}
