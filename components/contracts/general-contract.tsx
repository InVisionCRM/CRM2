"use client"

import type React from "react"
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { FileIcon, CheckCircle, Trash2, Building } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ======== SignatureCanvas Component ========
interface SignatureCanvasProps {
  value: string
  onChange: (dataUrl: string) => void
  className?: string
}

function SignatureCanvas({ value, onChange, className }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set line style
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#000"

    // Load existing signature if available
    if (value) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = value
    }

    const handleResize = () => {
      if (!canvas) return

      // Save current drawing
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext("2d")
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0)
      }

      // Resize canvas
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      // Restore drawing
      if (ctx) {
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = "#000"
        ctx.drawImage(tempCanvas, 0, 0)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [value])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)

    // Get coordinates
    let x, y
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.nativeEvent.offsetX
      y = e.nativeEvent.offsetY
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get coordinates
    let x, y
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.nativeEvent.offsetX
      y = e.nativeEvent.offsetY
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(false)

    // Save signature as data URL
    const dataUrl = canvas.toDataURL("image/png")
    onChange(dataUrl)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onChange("")
  }

  return (
    <div className="space-y-2">
      <div className={cn("border rounded-md p-1 relative", className)}>
        <canvas
          ref={canvasRef}
          className="w-full h-32 cursor-crosshair touch-none bg-gray-100"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        <Button
          type="button"
          size="sm"
          className="absolute bottom-2 right-2 bg-[#98D058] hover:bg-[#7db046] text-white border-none shadow-md"
          onClick={clearSignature}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Sign above using mouse or touch</p>
    </div>
  )
}

// ======== InitialsCanvas Component ========
interface InitialsCanvasProps {
  value: string
  onChange: (dataUrl: string) => void
  className?: string
}

function InitialsCanvas({ value, onChange, className }: InitialsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set line style
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#000"

    // Load existing initials if available
    if (value) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = value
    }

    const handleResize = () => {
      if (!canvas) return

      // Save current drawing
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext("2d")
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0)
      }

      // Resize canvas
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      // Restore drawing
      if (ctx) {
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = "#000"
        ctx.drawImage(tempCanvas, 0, 0)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [value])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)

    // Get coordinates
    let x, y
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.nativeEvent.offsetX
      y = e.nativeEvent.offsetY
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get coordinates
    let x, y
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.nativeEvent.offsetX
      y = e.nativeEvent.offsetY
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(false)

    // Save initials as data URL
    const dataUrl = canvas.toDataURL("image/png")
    onChange(dataUrl)
  }

  const clearInitials = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onChange("")
  }

  return (
    <div className="space-y-2">
      <div className={cn("border rounded-md p-1 relative", className)}>
        <canvas
          ref={canvasRef}
          className="w-full h-32 cursor-crosshair touch-none bg-gray-100"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        <Button
          type="button"
          size="sm"
          className="absolute bottom-2 right-2 bg-white hover:bg-gray-100 text-black border border-gray-200 shadow-sm"
          onClick={clearInitials}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Initial above using mouse or touch</p>
    </div>
  )
}

// ======== Main GeneralContract Component ========
// Define the interface for the contract data
export interface ContractData {
  name: string
  date: string
  projectAddress: string
  billingAddress: string
  phone: string
  email: string
  signature: string
}

// Update the GeneralContractProps interface to include leadId
interface GeneralContractProps {
  clientName?: string
  projectAddress?: string
  contractDate?: string
  leadId?: string
  clientData?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    streetAddress?: string
    city?: string
    state?: string
    zipcode?: string
    name?: string
  }
  onContractDataChange?: (data: any) => void
  onSave?: (contractData: ContractData) => void
}

// Define the interface for the imperative handle
export interface GeneralContractHandle {
  getContractData: () => ContractData
}

export const GeneralContract = forwardRef<GeneralContractHandle, GeneralContractProps>(
  (
    {
      clientName = "[Client Name]",
      projectAddress = "[Project Address]",
      contractDate = new Date().toLocaleDateString(),
      leadId,
      clientData,
      onContractDataChange,
      onSave,
    }: GeneralContractProps,
    ref,
  ) => {
    // Format current date as MM/DD/YYYY
    const formatDate = () => {
      const now = new Date()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const day = String(now.getDate()).padStart(2, "0")
      const year = now.getFullYear()
      return `${month}/${day}/${year}`
    }

    // Add a saving state and success message state
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Update the useState initialization to include client data if available
    const [formData, setFormData] = useState<Record<string, any>>(() => {
      // Initialize with current date and client data if available
      const initialData: Record<string, any> = {
        date: formatDate(),
        agreesDate: formatDate(),
      }

      // Add client data if available
      if (clientData) {
        initialData.name = clientData.name || `${clientData.firstName || ""} ${clientData.lastName || ""}`.trim()
        initialData.email = clientData.email || ""
        initialData.phone = clientData.phone || ""
        initialData.projectAddress =
          clientData.address ||
          [clientData.streetAddress, clientData.city, clientData.state, clientData.zipcode].filter(Boolean).join(", ")
        initialData.billingAddress = initialData.projectAddress
      }

      return initialData
    })

    // Initialize contract data state
    const [contractData, setContractData] = useState<ContractData>({
      name: clientData?.name || formData.name || "",
      date: format(new Date(), "MM/dd/yyyy"),
      projectAddress: clientData?.address || formData.projectAddress || "",
      billingAddress: clientData?.address || formData.billingAddress || "",
      phone: clientData?.phone || formData.phone || "",
      email: clientData?.email || formData.email || "",
      signature: "",
    })

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
    const contractRef = useRef<HTMLDivElement>(null)
    const finalParagraphsRef = useRef<HTMLDivElement>(null)

    // Store master signature and initials
    const [masterSignature, setMasterSignature] = useState<string>("")
    const [masterInitials, setMasterInitials] = useState<string>("")
    const [hasSetupSignature, setHasSetupSignature] = useState(false)

    // Add this near the top of the component, with other state declarations
    const isInitialRender = useRef(true)
    const prevFormDataRef = useRef<Record<string, any>>({})

    // Set the current date when component mounts
    useEffect(() => {
      const currentDate = formatDate()
      setFormData((prev) => ({
        ...prev,
        date: currentDate,
        agreesDate: currentDate,
      }))
    }, [])

    // Update contract data when client data changes
    useEffect(() => {
      if (clientData) {
        setContractData((prev) => ({
          ...prev,
          name: clientData.name || prev.name,
          projectAddress: clientData.address || prev.projectAddress,
          billingAddress: clientData.address || prev.billingAddress,
          phone: clientData.phone || prev.phone,
          email: clientData.email || prev.email,
        }))
        setFormData((prev) => ({
          ...prev,
          name: clientData.name || prev.name,
          projectAddress: clientData.address || prev.projectAddress,
          billingAddress: clientData.address || prev.billingAddress,
          phone: clientData.phone || prev.phone,
          email: clientData.email || prev.email,
        }))
      }
    }, [clientData])

    const handleInputChange = (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSignatureSetup = (signature: string) => {
      setMasterSignature(signature)
      if (signature && masterInitials) {
        setHasSetupSignature(true)
      }
    }

    const handleInitialsSetup = (initials: string) => {
      setMasterInitials(initials)
      if (initials && masterSignature) {
        setHasSetupSignature(true)
      }
    }

    const applySignature = (field: string) => {
      if (masterSignature) {
        handleInputChange(field, masterSignature)
      }
    }

    const applyInitials = (field: string) => {
      if (masterInitials) {
        handleInputChange(field, masterInitials)
      }
    }

    // Updated function to save the contract - UI only version
    const handleSaveContract = async () => {
      try {
        setIsSaving(true)

        // Simulate saving delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Prepare contract data from formData
        const contractData = {
          // Basic information
          name: formData.name || "",
          date: formData.date || formatDate(),
          projectAddress: formData.projectAddress || "",
          billingAddress: formData.billingAddress || "",
          phone: formData.phone || "",
          email: formData.email || "",

          // Signatures and initials
          agreesSignature: formData.agreesSignature || "",
          agreesDate: formData.agreesDate || formatDate(),
          homeOwnerInitials1: formData.homeOwnerInitials1 || "",
          homeOwnerInitials2: formData.homeOwnerInitials2 || "",
          homeOwnerInitials3: formData.homeOwnerInitials3 || "",
          homeOwnerInitials4: formData.homeOwnerInitials4 || "",
          homeOwnerInitials5: formData.homeOwnerInitials5 || "",

          // Additional fields
          emailFacsimile: formData.emailFacsimile || "",
        }

        // UI-only version - just show success toast
        toast.success("Contract saved successfully")
        setSaveSuccess(true)

        // Call onSave if provided
        if (onSave) {
          onSave(contractData as ContractData)
        }
      } catch (error) {
        console.error("Error saving contract:", error)
        toast.error("An error occurred while saving the contract")
      } finally {
        setIsSaving(false)
      }
    }

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setContractData((prev) => ({ ...prev, [name]: value }))
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Handle save button click
    const handleSave = () => {
      if (onSave) {
        onSave(contractData)
      }
    }

    const handleGeneratePdf = async () => {
      try {
        setIsGeneratingPdf(true)

        // Import required libraries
        const html2canvas = (await import("html2canvas")).default
        const { jsPDF } = await import("jspdf")

        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        })

        // Define margins (in mm)
        const margin = {
          top: 20,
          bottom: 20,
          left: 15,
          right: 15,
        }

        // Calculate content area dimensions
        const pageWidth = 210 // A4 width in mm
        const pageHeight = 297 // A4 height in mm
        const contentWidth = pageWidth - margin.left - margin.right

        if (!contractRef.current) return

        // Get all pages except the final paragraphs
        const pages = contractRef.current.querySelectorAll(".contract-page")

        // Process each page
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i] as HTMLElement

          // Capture the page as an image
          const canvas = await html2canvas(page, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
          })

          // Calculate dimensions for this page
          const imgWidth = contentWidth
          const imgHeight = (canvas.height * imgWidth) / canvas.width

          // Add a new page if not the first page
          if (i > 0) {
            doc.addPage()
          }

          // Add the page to the PDF
          doc.addImage(canvas.toDataURL("image/png"), "PNG", margin.left, margin.top, imgWidth, imgHeight)
        }

        // Add a new page for the final paragraphs
        if (finalParagraphsRef.current) {
          // Add a new page
          doc.addPage()

          // Capture the final paragraphs section
          const finalCanvas = await html2canvas(finalParagraphsRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
          })

          // Calculate dimensions
          const finalImgWidth = contentWidth
          const finalImgHeight = (finalCanvas.height * finalImgWidth) / finalCanvas.width

          // Add the final paragraphs to the PDF
          doc.addImage(
            finalCanvas.toDataURL("image/png"),
            "PNG",
            margin.left,
            margin.top,
            finalImgWidth,
            finalImgHeight,
          )
        }

        // Save the PDF
        doc.save("General-Contract.pdf")
      } catch (error) {
        console.error("Error generating PDF:", error)
        toast.error("Failed to generate PDF. Please try again.")
      } finally {
        setIsGeneratingPdf(false)
      }
    }

    // Add this function inside the GeneralContract component
    const getContractData = () => {
      return {
        name: formData.name || "",
        date: formData.date || formatDate(),
        projectAddress: formData.projectAddress || "",
        billingAddress: formData.billingAddress || "",
        phone: formData.phone || "",
        email: formData.email || "",
        agreesSignature: formData.agreesSignature || "",
        agreesDate: formData.agreesDate || formatDate(),
        homeOwnerInitials1: formData.homeOwnerInitials1 || "",
        homeOwnerInitials2: formData.homeOwnerInitials2 || "",
        homeOwnerInitials3: formData.homeOwnerInitials3 || "",
        homeOwnerInitials4: formData.homeOwnerInitials4 || "",
        homeOwnerInitials5: formData.homeOwnerInitials5 || "",
        emailFacsimile: formData.emailFacsimile || "",
      }
    }

    // Replace the existing useEffect that calls onContractDataChange with this:
    useEffect(() => {
      // Skip the first render
      if (isInitialRender.current) {
        isInitialRender.current = false
        prevFormDataRef.current = { ...formData }
        return
      }

      // Check if data has actually changed
      const hasChanged = JSON.stringify(prevFormDataRef.current) !== JSON.stringify(formData)

      if (hasChanged && onContractDataChange) {
        // Update the ref with current data
        prevFormDataRef.current = { ...formData }
        // Call the callback with current data
        onContractDataChange(getContractData())
      }
    }, [formData, onContractDataChange])

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        getContractData,
      }),
      [formData],
    )

    return (
      <div className="w-full overflow-x-hidden px-2 sm:px-4">
        <div className="contract-container w-full max-w-full sm:max-w-3xl mx-auto bg-white rounded-md">
          <div className="mb-6 flex flex-col sm:flex-row justify-end gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSaveContract}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {isSaving ? "Saving..." : "Save Contract"}
              </Button>
              <Button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <FileIcon className="h-4 w-4" />
                {isGeneratingPdf ? "Generating..." : "Generate PDF"}
              </Button>
            </div>
          </div>

          {/* Signature Setup Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Setup Your Signature & Initials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="masterSignature">Your Signature (sign once)</Label>
                <SignatureCanvas value={masterSignature} onChange={handleSignatureSetup} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="masterInitials">Your Initials (write once)</Label>
                {/* Removed max-width constraint to match signature canvas width */}
                <InitialsCanvas value={masterInitials} onChange={handleInitialsSetup} />
              </div>

              {hasSetupSignature && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="text-xs sm:text-sm">
                    Signature and initials ready! Click on any signature or initial field in the contract to apply.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <div ref={contractRef} className="space-y-8">
            {/* Page 1 */}
            <div className="contract-page pt-6 sm:pt-10 pb-4 sm:pb-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2 relative bg-gray-200 rounded-full flex items-center justify-center">
                  <Building className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold">In-Vision Construction</h1>
                <p className="text-xs sm:text-sm">36712 Chatham Ct, Clinton Township, MI 48035</p>
                <p className="text-xs sm:text-sm">(313) 574-2319</p>
                <p className="text-xs sm:text-sm">License #2424d1266</p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <span className="w-20 text-sm">Name:</span>
                    <Input
                      className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow bg-gray-100 text-sm"
                      value={formData.name || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <span className="w-20 text-sm">Date:</span>
                    <Input
                      className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow bg-gray-100 text-sm"
                      value={formData.date || ""}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      readOnly
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="w-32 text-sm">Project Address:</span>
                  <Input
                    className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow bg-gray-100 text-sm"
                    value={formData.projectAddress || ""}
                    onChange={(e) => handleInputChange("projectAddress", e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="w-32 text-sm">Billing Address:</span>
                  <Input
                    className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow bg-gray-100 text-sm"
                    value={formData.billingAddress || ""}
                    onChange={(e) => handleInputChange("billingAddress", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <span className="w-20 text-sm">Phone:</span>
                    <Input
                      className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow bg-gray-100 text-sm"
                      value={formData.phone || ""}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <span className="w-20 text-sm">Email:</span>
                    <Input
                      className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow bg-gray-100 text-sm"
                      value={formData.email || ""}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs sm:text-sm mb-6 break-words whitespace-normal">
                <p>
                  The Agreement does not obligate Home Owner or in line construction in any way until a Scope of Work is
                  approved by Insurance Co. and accepted by In-Vision Construction LLC. Home Owner authorizes In-Vision
                  Construction LLC to use Home Owner's best interest for roof/siding/gutter replacement at a "Price
                  Agreeable" to Insurance Co. and In-Vision Construction LLC with no additional cost to Home Owner
                  except for the Home Owner's deductible. When Price Agreeable is reached, In-Vision Construction LLC
                  will contract labor and Home Owner authorizes In-Vision Construction LLC to obtain labor and material
                  in accordance with the Price Agreeable and the specifications herein.
                </p>
              </div>

              <div className="mb-6">
                <h2 className="font-bold underline mb-2 text-sm sm:text-base">
                  CUSTOMER'S RIGHT TO CANCEL (MCL 445.113)
                </h2>
                <p className="text-xs sm:text-sm font-bold break-words whitespace-normal">
                  You, the buyer, may cancel this transaction at any time prior to midnight of the third business day
                  after the date of this transaction. See the attached notice of cancellation form for an explanation of
                  this right. Additionally, the seller is prohibited from having an independent courier service or other
                  third party pick up your payment at your residence before the end of the 3-business-day period in
                  which you can cancel the transaction.
                </p>
              </div>

              <div className="mb-6">
                <p className="text-xs sm:text-sm font-bold break-words whitespace-normal">
                  THIS AGREEMENT CONTAINS MANDATORY ARBITRATION PROVISIONS WHICH MAY BE ENFORCED BY THE PARTIES. THIS
                  AGREEMENT CONTAINS A CLASS ACTION WAIVER. BY SIGNING BELOW, YOU ACKNOWLEDGE THAT YOU HAVE READ AND
                  UNDERSTAND THESE TERMS.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-8 gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto">
                  <span className="mr-2 text-sm">AgreestoTerms:</span>
                  <div
                    className="cursor-pointer border border-dashed border-gray-300 p-1 min-h-[60px] sm:min-h-[80px] min-w-[150px] sm:min-w-[200px] w-full sm:w-auto"
                    onClick={() => applySignature("agreesSignature")}
                  >
                    {formData.agreesSignature ? (
                      <img src={formData.agreesSignature || "/placeholder.svg"} alt="Signature" className="max-h-16" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                        Click to sign
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <span className="mr-2 text-sm">Date:</span>
                  <Input
                    className="w-full sm:w-32 border-b border-t-0 border-l-0 border-r-0 rounded-none bg-gray-100 text-sm"
                    value={formData.agreesDate || ""}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Page 2 */}
            <div className="contract-page pt-6 sm:pt-10 pb-4 sm:pb-6">
              <div className="text-center mb-6">
                <h2 className="font-bold text-sm sm:text-base">NOTICE TO OWNER</h2>
                <p className="text-xs sm:text-sm break-words whitespace-normal">
                  A RESIDENTIAL BUILDER OR A RESIDENTIAL MAINTENANCE AND ALTERATION CONTRACTOR IS REQUIRED TO BE
                  LICENSED UNDER ARTICLE 24 OF THE OCCUPATIONAL CODE, 1980 PA 299, MCL339.2401 TO 339.2412. AN
                  ELECTRICIAN IS REQUIRED TO BE LICENSED UNDER ARTICLE 7 OF THE SKILLED TRADES REGULATION ACT, MCL
                  339.5701 TO 339.5739. A PLUMBING CONTRACTOR IS REQUIRED TO BE LICENSED UNDER ARTICLE 11 OF THE SKILLED
                  TRADES REGULATION ACT, MCL 339.6101 TO 339.6133. A MECHANICAL CONTRACTOR IS LICENSED TO BE LICENSED
                  UNDER ARTICLE 8 OF THE SKILLED TRADES REGULATION ACT, MCL 339.5801 TO 339.5819.
                </p>
                <p className="text-xs sm:text-sm font-bold mt-4">
                  IN-VISION CONSTRUCTION LLC IS A LICENSED CONTRACTOR. CONTRACTOR'S LICENSE #2424d1266
                </p>
                <h2 className="font-bold underline mt-4 text-sm sm:text-base">TERMS AND CONDITIONS</h2>
              </div>

              <div className="text-xs sm:text-sm space-y-4 break-words whitespace-normal">
                <p>
                  1) By signing his or her name to this Agreement and Terms and Conditions(this: "Agreement"), Home
                  Owner authorizes In-Vision Construction LLC ("In-Vision Construction LLC") to communicate with Home
                  Owner's Insurance Company ("Insurance Co.") regarding the damage to Home Owner's residence and the
                  repairs related thereto. In-Vision Construction LLC shall consult with Home Owner's Insurance Company
                  to determine extent of damage caused by a storm event and the repairs required to restore the
                  residence to its pre-storm condition ("Scope of Work"). The Scope of Work shall be coordinated and
                  performed by In-Vision Construction LLC and its contractors for the payment of a price agreeable to
                  Insurance Co. (the "Price Agreeable"). In-Vision Construction LLC shall provide Home Owner with the
                  final, approved Scope of Work and Price Agreeable prior to commencing any work. The final approved
                  Scope of Work shall be attached hereto and incorporated herein by this reference. In-Vision
                  Construction LLC hereby agrees to be bound to repair Scope of Work approved by Insurance Co. If
                  In-Vision Construction LLC rejects a Scope of Work, or if the parties hereto cannot agree on a Scope
                  of Work, this Agreement shall be deemed terminated that the parties shall have no further obligation
                  to each other unless expressly set forth herein.
                </p>
                <p>
                  2) In-Vision Construction LLC shall commence Work after your insurance company has approved the claim,
                  and complete the Work within a build period starting from approximately April 1 and ending
                  approximately October 31, subject to the remaining terms of this agreement, including but not limited
                  to any force majeure events.
                </p>
                <p>
                  3) Home Owner acknowledges that In-Vision Construction LLC as a general contractor and hereby
                  authorizes Insurance Co. and/or Mortgage Co. above to make any checks payable jointly. In-Vision
                  Construction LLC shall retain payment only for those items that Home Owner and In-Vision Construction
                  LLC have agreed upon, regardless of damages for which Home Owner receives compensation from Insurance
                  Co. Insurance Co. may include, offer, or reimburse Home Owner for certain repairs which are not
                  included in the Scope of Work (the "Foregone Repairs"). Any Forgone Repairs are solely the
                  responsibility of the Home Owner. In the event that the total amount of payment by Insurance Co. the
                  exceeds the Price Agreeable, includes items not set forth in the Scope of Work, or includes any
                  Foregone Repairs, In-Vision Construction LLC shall first apply any overage to Home Owner's out of
                  pocket expenses and then shall pay the remaining amount of the overage, if any, to Home Owner upon
                  completion of the Scope of Work. Home Owner authorizes Home Owner's Insurance Co. to release to
                  In-Vision Construction LLC and/or AC Supplementing and Invoicing LLC In-Vision Construction LLC
                  construction (In-Vision Construction LLC), upon In-Vision Construction LLC's request, any and all
                  documents and information with regards to the insurance claim submitted for any work to be performed
                  per this Agreement, including but not limited to any payment information regarding any funds paid by
                  the Insurance Co. for said insurance claim and any documentation regarding the Insurance Co.'s
                  adjuster reports, inspections and/or summaries. Home Owner authorizes In-Vision Construction LLC to
                  communicate directly with Home Owner's Insurance Co. regarding the insurance claim, any work performed
                  or to be performed per this Agreement, and any payment information regarding any funds to be paid by
                  the Insurance Co. for said insurance claim.
                </p>
                <p>
                  4) Home Owner acknowledges and agrees that In-Vision Construction LLC has not, at any time,
                  advertised, offered to pay or promised to pay or rebate all or any portion of Home Owner's insurance
                  deductible as an inducement to enter into this Agreement and that In-Vision Construction LLC has not
                  represented or negotiated or offered or advertised to represent or negotiate on behalf of Home Owner
                  on Home Owner's insurance claim in connection with the work to be performed by In-Vision Construction
                  LLC.
                </p>
                <p>
                  5) Home Owner and In-Vision Construction LLC warrant and represent that no person has offered or
                  promised to pay or rebate Home Owner's insurance deductible or any credit to Home Owner as
                  compensation or reward for the procurement of this Agreement, nor has any person offered, delivered,
                  paid, credited or allowed to Home Owner any gift, bonus, award, merchandise, trading stamps, or cash
                  loan for the procurement of this Agreement.
                </p>
              </div>
            </div>

            {/* Page 3 */}
            <div className="contract-page pt-6 sm:pt-10 pb-4 sm:pb-6">
              <div className="text-xs sm:text-sm space-y-4 break-words whitespace-normal">
                <p>
                  6) Electronic Communication:As an alternative to physical delivery of this agreement,the parties agree
                  that this Agreement, and any modification or amendment thereto may be delivered to the Home Owner via
                  electronic mail or facsimile to the email/facsimile address below. Any such communication shall be
                  deemed delivered at the time that it is transmitted. The Home Owner represents that Home Owner has the
                  authority to sign this Agreement, and that by signing this Agreement the Home Owner is bound by its
                  terms. The Home Owner agrees that electronic signatures and initials shall be deemed to be valid and
                  binding upon the Home Owner as if the original signatures or initials were present on this Agreement
                  in the handwriting of the Home Owner.
                </p>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center my-4 gap-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <span className="mr-2 text-sm">Email/facsimile/Address:</span>
                    <Input
                      className="w-full sm:w-64 border-b border-t-0 border-l-0 border-r-0 rounded-none bg-gray-100 text-sm"
                      value={formData.emailFacsimile || ""}
                      onChange={(e) => handleInputChange("emailFacsimile", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <span className="mr-2 text-sm">HomeOwnerInitials:</span>
                    <div
                      className="cursor-pointer border border-dashed border-gray-300 p-1 min-h-[40px] min-w-[80px] flex items-center justify-center"
                      onClick={() => applyInitials("homeOwnerInitials1")}
                    >
                      {formData.homeOwnerInitials1 ? (
                        <img
                          src={formData.homeOwnerInitials1 || "/placeholder.svg"}
                          alt="Initials"
                          className="max-h-10"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs sm:text-sm">Click to initial</span>
                      )}
                    </div>
                  </div>
                </div>
                <p>
                  7) Should Home Owner In-Vision Construction LLC receive notification from Insurance Co. that the Scope
                  of Work, or any portion thereof, is not covered by insurance proceeds from which Home Owner intends to
                  pay In-Vision Construction LLC, or if the insurance claim is denied, the party receiving such notice
                  shall immediately notify the other of such conditions. Home Owner authorizes In-Vision Construction
                  LLC to evaluate the reasons insurance coverage was refused, and to submit to the insurance company any
                  and all supplementary scopes of work and to request additional inspections as In-Vision Construction
                  LLC may deem necessary. If, after the submission of such supplementary scopes of work and additional
                  inspections are completed, Insurance Co. continues to deny coverage, this Agreement shall be null and
                  void, and the parties shall have no further obligation to each other except as specifically set forth
                  herein.
                </p>
                <p>
                  8) Home Owner is responsible for bringing and maintaining any liability for property damage insurance
                  as may be necessary, including rain, fire, tornado, windstorm and hail, to protect all property
                  against claims for damages for personal injury, accidental death, and to property, arising from the
                  work performed under this Agreement.
                </p>
                <p>
                  9) The HomeOwner shall provide In-Vision Construction LLC complete and accurate information for the
                  purpose of securing any license, permit or other authorization to provide work, labor or services.
                  In-Vision Construction LLC assumes no responsibility for the accuracy of information provided by the
                  Home Owner. The Home Owner shall be responsible for any additional fees, charges, or other costs
                  incurred resulting from the provision of incomplete or inaccurate information.
                </p>
                <p>
                  10) All materials supplied by In-Vision Construction LLC will be new and ofgood quality (unless any
                  used materials are specified in this Agreement), and that all work performed by In-Vision Construction
                  LLC will be performed in a good and workmanlike manner.
                </p>
                <p>
                  11) If during the course of ln-Vision Construction LLC's work,concealed or unknown conditions that
                  affect the performance of the work are encountered ("Hidden Conditions"), In-Vision Construction LLC
                  shall promptly notify the Home Owner and Insurance Co., and shall submit any supplementary materials
                  to the Insurance Co. as may be required. In the event that the correction of such Hidden Conditions
                  are not covered by the Home Owner's insurance policy, and the correction of such Hidden Conditions
                  involves additional cost, In-Vision Construction LLC and Home Owner shall execute a written change
                  order signed by both parties and the cost of such change shall be paid by the Home Owner. In the event
                  that the Home Owner does not agree to execute a change order authorizing the correction of a Hidden
                  Condition, the Home Owner shall be solely liable for any and all damages which may be attributable to
                  the continued existence of the Hidden Condition, and Home Owner shall hold In-Vision Construction LLC
                  harmless from all liability of any nature or kind arising out of a Hidden Condition which Home Owner
                  elected not to correct and which continues following the completion of In-Vision Construction LLC's
                  work.
                </p>
                <p>
                  12) Home Owner is responsible for the cost of any work authorized by Home Owner but not paid by
                  Insurance Co.,including without limitation, Home Owner's deductible, any work which is not approved by
                  Insurance Co., or any work which exceeds the Scope of Work approved by Insurance Co.
                </p>
                <p>
                  13) In-Vision Construction LLC will not be liable for delays or damages caused by civil unrest,
                  vandalism, riot, war, act of enemies (including terrorism within the continental United States),
                  national emergency, government acts or orders, epidemics, pandemics, or outbreaks of communicable
                  diseases, quarantines, fire, flood, acts of God, adverse weather conditions, earthquakes or other
                  natural disasters, material shortages or labor disputes, work stoppages or industry wide strike,
                  changes in work or other conditions beyond the control of In-Vision Construction LLC.
                </p>
              </div>
            </div>

            {/* Page 4 */}
            <div className="contract-page pt-6 sm:pt-10 pb-4 sm:pb-6">
              <div className="text-xs sm:text-sm space-y-4 break-words whitespace-normal">
                <p>
                  14) In-Vision Construction LLC is not responsible for damage to any items in a Home Owner's attic or
                  other parts of the home where work is performed: any valuables should be covered or moved by Home
                  Owner.
                </p>
                <p>
                  15) In-Vision Construction LLC shall use reasonable efforts to protect existing landscaping, exterior
                  siding, gutters and other building components from damage; however, In-Vision Construction LLC will
                  not be responsible for damage to the aforementioned which occurs during normal course of work
                  performed.
                </p>
                <p>
                  16) All materials guaranteed to be as specified in information as obtained through manufacturer.
                  In-Vision Construction LLC reserves the right to change manufacturers and/or suppliers of material due
                  to market or macroeconomic conditions that may change after the execution of this Agreement and/or
                  Scope of Work. Home Owner acknowledges and agrees that In-Vision Construction LLC may change
                  manufacturers and/or suppliers of material for the Work, and does not need approval from Home Owner
                  for any such change. Home Owner agrees that in the event In-Vision Construction LLC does change
                  manufacturers and/or suppliers of material for the Work, that said change does not constitute a basis
                  for the cancellation of this Agreement and/or the Scope of not constitute a basis for the cancellation
                  of this Agreement and/or the Scope of Work, and does not constitute a basis for the withholding or
                  nonpayment of any amounts due to In-Vision Construction LLC for the Work.
                </p>
                <p>
                  17) In-Vision Construction LLC will provide Home Owner a limited warranty against leakage, the terms,
                  conditions, and limitations of which shall be set forth in its standard Limited Warranty provided to
                  Home Owner upon Home Owner's compliance with the terms of this Agreement, including complete and
                  prompt payment of all amounts due. The Limited Warranty is in lieu of all other warranties or
                  guarantees, express, implied, or statutory, and In-Vision Construction LLC disclaims all other
                  warranties. No oral or written information or advice given by In-Vision Construction LLC, its agents,
                  reps, or employees shall create a warranty or in any way increase the scope of the Limited Warranty.
                </p>
                <p>
                  18) Scope of Work:Home Owner agrees to allow In-Vision Construction LLC to use all onsite utilities,
                  e.g., water & electric, reasonably necessary to complete
                </p>
                <p>
                  19) This Agreement:In-Vision Construction LLC's maximum liability under this Agreement, regardless of
                  the form of action, shall not exceed the amount paid by Home Owner to In-Vision Construction LLC under
                  this Agreement.
                </p>
                <p>
                  20) If the Home Owner cancels this Agreement as set forth in the atached cancellation notice, any
                  payments made by Home Owner except for certain emergency work already performed will be returned to
                  the Home Owner.
                </p>
                <p>
                  21) Not withstanding anything herein to the contrary lf Home Owner cancels this Agreement after an
                  insurance settlement for the work described in this Agreement is procured, but before actual
                  commencement of roof or siding repair/replacement work by In-Vision Construction LLC's agents, Home
                  Owner will be responsible for the cost of In-Vision Construction LLC's inspections, labor, supplies
                  and material, and shall pay to In-Vision Construction LLC the lesser of $5,000.00 or 33.3% of the
                  total Price Agreeable as liquidated damages, and not as a penalty; it is declared and agreed by Home
                  Owner and In-Vision Construction LLC that this sum shall, without proof, represents the damages
                  actually sustained by In-Vision Construction LLC by reason of Home Owner's actions. If Home Owner
                  breaches any promise or covenant contained in this Agreement following the commencement of roof or
                  siding repair/replacement work by In-Vision Construction LLC's agents, in addition to liquidated
                  damages, Home Owner will pay to In-Vision Construction LLC the proportion of the total Price Agreeable
                  as the amount of labor and materials furnished bears to the total amount of labor and materials
                  required to complete the work.
                </p>
                <p>
                  22) In-Vision Construction LLC shall not be liable for any damage to the interior of the Home Owner's
                  residence or its contents resulting from leaks in the roof or siding during the period of time between
                  the date of this Agreement and the date of completion of the work, unless such damage is caused by the
                  negligence of In-Vision Construction LLC or its agents.
                </p>
                <p>
                  23) In-Vision Construction LLC shall not be liable for any damage to the Home Owner's residence or its
                  contents resulting from leaks in the roof or siding during the period of time between the date of this
                  Agreement and the date of completion of the work, unless such damage is caused by the negligence of
                  In-Vision Construction LLC or its agents.
                </p>
              </div>
            </div>

            {/* Page 5 - Final Paragraphs */}
            <div ref={finalParagraphsRef} className="contract-page pt-6 sm:pt-10 pb-4 sm:pb-6">
              <div className="text-xs sm:text-sm space-y-4 break-words whitespace-normal">
                <p>
                  24) In-Vision Construction LLC shall not be liable for any damage to the Home Owner's residence or its
                  contents resulting from leaks in the roof or siding during the period of time between the date of this
                  Agreement and the date of completion of the work, unless such damage is caused by the negligence of
                  In-Vision Construction LLC or its agents.
                </p>
                <p>
                  25) In the event that In-Vision Construction LLC is required to file a lawsuit to enforce any of the
                  terms of this Agreement, Home Owner agrees to pay all costs of collection, including reasonable
                  attorney's fees and court costs.
                </p>
                <p>
                  26) This Agreement shall be binding upon and inure to the benefit of the parties hereto and their
                  respective heirs, executors, administrators, legal representatives, successors and assigns.
                </p>
                <p>
                  27) This Agreement constitutes the entire agreement between the parties hereto with respect to the
                  subject matter hereof and supersedes all prior agreements, understandings, negotiations and
                  discussions, whether oral or written, of the parties.
                </p>
                <p>
                  28) This Agreement may be executed in counterparts, each of which shall be deemed an original, but all
                  of which together shall be deemed to be one and the same agreement. A signed copy of this Agreement
                  delivered by facsimile, email or other means of electronic transmission shall be deemed to have the
                  same legal effect as delivery of an original signed copy of this Agreement.
                </p>
                <p>
                  29) If any term or provision of this Agreement is invalid, illegal or unenforceable in any
                  jurisdiction, such invalidity, illegality or unenforceability shall not affect any other term or
                  provision of this Agreement or invalidate or render unenforceable such term or provision in any other
                  jurisdiction.
                </p>
                <p>
                  30) This Agreement shall be governed by and construed in accordance with the laws of the State of
                  Michigan without giving effect to any choice or conflict of law provision or rule.
                </p>
                <p>
                  31) ARBITRATION: Any controversy or claim arising out of or relating to this Agreement, or the breach
                  thereof, shall be settled by arbitration administered by the American Arbitration Association in
                  accordance with its Construction Industry Arbitration Rules, and judgment on the award rendered by the
                  arbitrator(s) may be entered in any court having jurisdiction thereof.
                </p>
                <p>
                  32) CLASS ACTION WAIVER: Home Owner agrees that any arbitration or other legal action or proceeding
                  between In-Vision Construction LLC and Home Owner shall be brought by Home Owner in Home Owner's
                  individual capacity, and not as a plaintiff or class member in any purported class or representative
                  proceeding.
                </p>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-8 gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto">
                    <span className="mr-2 text-sm">Home Owner Signature:</span>
                    <div
                      className="cursor-pointer border border-dashed border-gray-300 p-1 min-h-[60px] sm:min-h-[80px] min-w-[150px] sm:min-w-[200px] w-full sm:w-auto"
                      onClick={() => applySignature("homeOwnerSignature")}
                    >
                      {formData.homeOwnerSignature ? (
                        <img
                          src={formData.homeOwnerSignature || "/placeholder.svg"}
                          alt="Signature"
                          className="max-h-16"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                          Click to sign
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <span className="mr-2 text-sm">Date:</span>
                    <Input
                      className="w-full sm:w-32 border-b border-t-0 border-l-0 border-r-0 rounded-none bg-gray-100 text-sm"
                      value={formData.homeOwnerDate || formData.date || ""}
                      readOnly
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-8 gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto">
                    <span className="mr-2 text-sm">Contractor Signature:</span>
                    <div
                      className="cursor-pointer border border-dashed border-gray-300 p-1 min-h-[60px] sm:min-h-[80px] min-w-[150px] sm:min-w-[200px] w-full sm:w-auto"
                      onClick={() => applySignature("contractorSignature")}
                    >
                      {formData.contractorSignature ? (
                        <img
                          src={formData.contractorSignature || "/placeholder.svg"}
                          alt="Signature"
                          className="max-h-16"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                          Click to sign
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <span className="mr-2 text-sm">Date:</span>
                    <Input
                      className="w-full sm:w-32 border-b border-t-0 border-l-0 border-r-0 rounded-none bg-gray-100 text-sm"
                      value={formData.contractorDate || formData.date || ""}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
)
