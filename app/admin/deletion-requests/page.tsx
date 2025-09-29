import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DeletionRequestsPanel } from "@/components/deletion-requests/deletion-requests-panel"
import { canApproveDeletions } from "@/lib/services/deletion-approval"

export default async function DeletionRequestsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Check if user can approve deletions
  const canApprove = await canApproveDeletions(session.user.id)
  if (!canApprove) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deletion Requests</h1>
          <p className="text-muted-foreground">
            Review and manage lead deletion requests
          </p>
        </div>
      </div>

      <DeletionRequestsPanel />
    </div>
  )
} 