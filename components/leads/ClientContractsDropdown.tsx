"use client"

import React, { useState } from "react"
import { ChevronDown, FileSignature, PenTool, ClipboardList, FileText, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import ThirdPartyAuthDialog from "@/components/leads/ThirdPartyAuthDialog"

interface ClientContractsDropdownProps {
  onSendContract: () => void
  onSignInPerson: () => void
  onScopeOfWork: () => void
  isSendingContract: boolean
  isSigningInPerson: boolean
  disabled?: boolean
  lead: any // Pass the lead object for prefill
}

export const ClientContractsDropdown: React.FC<ClientContractsDropdownProps> = ({
  onSendContract,
  onSignInPerson,
  onScopeOfWork,
  isSendingContract,
  isSigningInPerson,
  disabled = false,
  lead,
}) => {
  const [thirdPartyDialogOpen, setThirdPartyDialogOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "relative flex h-16 flex-1 items-center justify-center backdrop-blur-lg p-1 text-sm font-bold text-white",
              "first:border-l-0 transition-all duration-300",
              "bg-gradient-to-br from-purple-700/90 via-purple-600/90 to-purple-700/90 border-l border-purple-500/50 hover:from-purple-600/90 hover:via-purple-500/90 hover:to-purple-600/90 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/20",
              "hover:scale-[1.02] active:scale-[0.98]",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
            disabled={disabled}
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="p-1 bg-white/10 rounded-md">
                <FileSignature className="h-4 w-4 text-purple-200" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs leading-tight font-semibold text-purple-100">Client Contracts</span>
                <ChevronDown className="h-3 w-3 text-purple-200 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-72 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-slate-600/50 backdrop-blur-xl shadow-2xl shadow-black/50 rounded-xl overflow-hidden"
          side="bottom"
          align="center"
          sideOffset={8}
        >
          <div className="p-2">
            <DropdownMenuItem
              onClick={onSendContract}
              disabled={disabled || isSendingContract}
              className="flex items-center gap-4 text-white hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-purple-500/20 focus:bg-gradient-to-r focus:from-purple-600/20 focus:to-purple-500/20 cursor-pointer py-4 px-5 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 border border-transparent hover:border-purple-500/30"
            >
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg border border-purple-500/30">
                <FileSignature className="h-5 w-5 text-purple-300" />
              </div>
              <span className="text-base font-semibold text-gray-100">
                {isSendingContract ? "Sending..." : "Send Contract"}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onSignInPerson}
              disabled={disabled || isSigningInPerson}
              className="flex items-center gap-4 text-white hover:bg-gradient-to-r hover:from-orange-600/20 hover:to-orange-500/20 focus:bg-gradient-to-r focus:from-orange-600/20 focus:to-orange-500/20 cursor-pointer py-4 px-5 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/20 border border-transparent hover:border-orange-500/30"
            >
              <div className="p-2 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg border border-orange-500/30">
                <PenTool className="h-5 w-5 text-orange-300" />
              </div>
              <span className="text-base font-semibold text-gray-100">
                {isSigningInPerson ? "Creating..." : "Sign in Person"}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onScopeOfWork}
              disabled={disabled}
              className="flex items-center gap-4 text-white hover:bg-gradient-to-r hover:from-emerald-600/20 hover:to-emerald-500/20 focus:bg-gradient-to-r focus:from-emerald-600/20 focus:to-emerald-500/20 cursor-pointer py-4 px-5 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20 border border-transparent hover:border-emerald-500/30"
            >
              <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg border border-emerald-500/30">
                <ClipboardList className="h-5 w-5 text-emerald-300" />
              </div>
              <span className="text-base font-semibold text-gray-100">Scope of Work</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem
              onClick={() => setThirdPartyDialogOpen(true)}
              disabled={disabled}
              className="flex items-center gap-4 text-white hover:bg-gradient-to-r hover:from-indigo-600/20 hover:to-indigo-500/20 focus:bg-gradient-to-r focus:from-indigo-600/20 focus:to-indigo-500/20 cursor-pointer py-4 px-5 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 border border-transparent hover:border-indigo-500/30"
            >
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-lg border border-indigo-500/30">
                <FileText className="h-5 w-5 text-indigo-300" />
              </div>
              <span className="text-base font-semibold text-gray-100">3rd Party Auth</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <ThirdPartyAuthDialog
        open={thirdPartyDialogOpen}
        onOpenChange={setThirdPartyDialogOpen}
        lead={lead}
      />
    </>
  )
} 