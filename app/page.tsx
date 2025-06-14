import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardContent } from "@/components/dashboard-content"
import { ConstructionChatDrawer } from "@/components/ConstructionChatDrawer"
import { Button } from "@/components/ui/button"
import { Bot, Wrench } from "lucide-react"

export default function DashboardPage() {
  return (
      <div className="flex-1 overflow-auto">
        <DashboardContent />
        
        {/* AI Assistant Quick Access - Only visible on larger screens */}
        <div className="hidden lg:block fixed bottom-24 right-6 z-30">
          <ConstructionChatDrawer>
            <Button
              size="lg"
              className="bg-[#59ff00] hover:bg-[#59ff00]/90 text-black shadow-lg border-2 border-white/20 backdrop-blur-sm"
            >
              <div className="p-1 rounded-md bg-black/20 mr-2">
                <Wrench className="h-4 w-4" />
              </div>
              AI Assistant
            </Button>
          </ConstructionChatDrawer>
        </div>
    </div>
  )
}
