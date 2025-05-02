"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SignatureCanvas from "./signature-canvas"
import InitialsCanvas from "./initials-canvas"
import { FileIcon, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import LoadingAnimation from "./loading-animation"

interface ClientData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
}

interface GeneralContractProps {
  clientData?: ClientData
  onSave?: () => void
}

export interface GeneralContractRef {
  getContractData: () => Record<string, any>
}

const GeneralContract = forwardRef<GeneralContractRef, GeneralContractProps>(({ clientData, onSave }, ref) => {
  // Format current date as MM/DD/YYYY
  const formatDate = () => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const year = now.getFullYear()
    return `${month}/${day}/${year}`
  }

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    // Initialize with current date
    return {
      date: formatDate(),
      agreesDate: formatDate(),
    }
  })

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const contractRef = useRef<HTMLDivElement>(null)
  const finalParagraphsRef = useRef<HTMLDivElement>(null)

  // Store master signature and initials
  const [masterSignature, setMasterSignature] = useState<string>("")
  const [masterInitials, setMasterInitials] = useState<string>("")
  const [hasSetupSignature, setHasSetupSignature] = useState(false)

  // Set the current date when component mounts
  useEffect(() => {
    const currentDate = formatDate()
    setFormData((prev) => ({
      ...prev,
      date: currentDate,
      agreesDate: currentDate,
    }))
  }, [])

  // Update form data when clientData changes
  useEffect(() => {
    if (clientData) {
      setFormData(prev => ({
        ...prev,
        name: `${clientData.firstName} ${clientData.lastName}`,
        projectAddress: clientData.address,
        billingAddress: clientData.address,
        phone: clientData.phone,
        email: clientData.email
      }))
    }
  }, [clientData])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignatureSetup = (signature: string) => {
    setMasterSignature(signature)
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

  const handleGeneratePdf = async () => {
    try {
      setIsGeneratingPdf(true)

      // Import required libraries
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      // Create a fixed-width container for consistent PDF generation
      const fixedContainer = document.createElement("div")
      fixedContainer.style.position = "absolute"
      fixedContainer.style.left = "-9999px"
      fixedContainer.style.width = "1024px" // Fixed desktop width
      fixedContainer.style.overflow = "visible"
      document.body.appendChild(fixedContainer)

      // Clone the contract content into the fixed container
      if (contractRef.current) {
        const clone = contractRef.current.cloneNode(true) as HTMLElement
        fixedContainer.appendChild(clone)
      }

      // Clone the final paragraphs if they exist
      if (finalParagraphsRef.current) {
        const finalClone = finalParagraphsRef.current.cloneNode(true) as HTMLElement
        fixedContainer.appendChild(finalClone)
      }

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
      const contentWidth = pageWidth - margin.left - margin.right

      // Get all pages from the fixed container
      const pages = fixedContainer.querySelectorAll(".contract-page")

      // Process each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement

        // Capture the page as an image
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          // Add these options to improve text rendering
          letterRendering: true,
          allowTaint: true,
          height: page.scrollHeight + 20, // Add extra height to prevent cutoff
          onclone: (clonedDoc) => {
            // Remove any text-decoration from all elements in the cloned document
            const elements = clonedDoc.querySelectorAll("*")
            elements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.textDecoration = "none"
                el.style.borderBottom = "none"
              }
            })
          },
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

      // Get the final paragraphs from the fixed container
      const finalParagraphsElement = fixedContainer.querySelector('[class*="bg-white"]:not(.contract-page)')

      if (finalParagraphsElement) {
        // Add a new page
        doc.addPage()

        // Capture the final paragraphs section
        const finalCanvas = await html2canvas(finalParagraphsElement as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          letterRendering: true,
          allowTaint: true,
          height: finalParagraphsElement.scrollHeight + 20,
        })

        // Calculate dimensions
        const finalImgWidth = contentWidth
        const finalImgHeight = (finalCanvas.height * finalImgWidth) / finalCanvas.width

        // Add the final paragraphs to the PDF
        doc.addImage(finalCanvas.toDataURL("image/png"), "PNG", margin.left, margin.top, finalImgWidth, finalImgHeight)
      }

      // Clean up - remove the fixed container
      document.body.removeChild(fixedContainer)

      // Save the PDF
      doc.save("General-Contract.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getContractData: () => formData
  }))

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg text-black">
      {isGeneratingPdf && <LoadingAnimation message="Assembling your contract..." />}

      <div className="mb-6 flex justify-between">
        <Link href="/">
          <Button variant="outline">Back to Contracts</Button>
        </Link>
        <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf} className="flex items-center gap-2">
          <FileIcon className="h-4 w-4" />
          {isGeneratingPdf ? "Generating PDF..." : "Generate PDF"}
        </Button>
      </div>

      {/* Signature Setup Section */}
      <Card className="mb-8 text-black bg-white">
        <CardHeader>
          <CardTitle>Setup Your Signature & Initials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="masterSignature" className="text-black">Your Signature (sign once)</Label>
            <SignatureCanvas value={masterSignature} onChange={handleSignatureSetup} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="masterInitials" className="text-black">Your Initials (write once)</Label>
            <InitialsCanvas value={masterInitials} onChange={handleInitialsSetup} />
          </div>

          {hasSetupSignature && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>
                Signature and initials ready! Click on any signature or initial field in the contract to apply.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div ref={contractRef} className="space-y-8 text-black">
        {/* Page 1 */}
        <div className="contract-page pt-10 pb-6 text-black">
          <div className="text-center mb-4 text-black">
            {/* BEFORE: CSS-based logo */}
            {/* 
    <div className="w-24 h-24 mx-auto mb-2 relative">
      <div className="w-full h-full bg-lime-300 rotate-45 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3/4 h-3/4 border-4 border-black border-t-0 border-r-0"></div>
        </div>
      </div>
    </div>
    */}

            {/* AFTER: Image-based logo */}
            <img
              src="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/in-vision-logo-UJNZxvzrwPs8WsZrFbI7Z86L8TWcc5.png"
              alt="In-Vision Construction Logo"
              className="w-48 h-auto mx-auto mb-2"
            />

            <h1 className="text-xl font-bold text-black">In-Vision Construction</h1>
            <p className="text-sm text-black" style={{ textDecoration: "none", borderBottom: "none" }}>
              36712 Chatham Ct, Clinton Township, MI 48035
            </p>
            <p className="text-sm text-black" style={{ textDecoration: "none", borderBottom: "none" }}>
              (313) 574-2319
            </p>
            <p className="text-sm text-black" style={{ textDecoration: "none", borderBottom: "none" }}>
              License #2424d1266
            </p>
          </div>

          <div className="space-y-2 mb-6 text-black">
            <div className="flex">
              <span className="w-20 text-black">Name:</span>
              <Input
                className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow min-h-[28px] leading-relaxed py-1 bg-white text-black"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              <span className="w-20 ml-4 text-black">Date:</span>
              <Input
                className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow min-h-[28px] leading-relaxed py-1 bg-white text-black"
                value={formData.date || ""}
                onChange={(e) => handleInputChange("date", e.target.value)}
                readOnly
              />
            </div>
            <div className="flex">
              <span className="w-32 text-black">Project Address:</span>
              <Input
                className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow min-h-[28px] leading-relaxed py-1 bg-white text-black"
                value={formData.projectAddress || ""}
                onChange={(e) => handleInputChange("projectAddress", e.target.value)}
              />
            </div>
            <div className="flex">
              <span className="w-32 text-black">Billing Address:</span>
              <Input
                className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow min-h-[28px] leading-relaxed py-1 bg-white text-black"
                value={formData.billingAddress || ""}
                onChange={(e) => handleInputChange("billingAddress", e.target.value)}
              />
            </div>
            <div className="flex">
              <span className="w-20 text-black">Phone:</span>
              <Input
                className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow min-h-[28px] leading-relaxed py-1 bg-white text-black"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
              <span className="w-20 ml-4 text-black">Email:</span>
              <Input
                className="border-b border-t-0 border-l-0 border-r-0 rounded-none flex-grow min-h-[28px] leading-relaxed py-1 bg-white text-black"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

          <div className="text-sm mb-6 text-black">
            <p>
              The Agreement does not obligate Home Owner or In-Vision Construction in any way until a Scope of Work is
              approved by Insurance Co. and accepted by In-Vision Construction LLC. Home Owner authorizes In-Vision
              Construction LLC to use Home Owner's best interest for roof/siding/gutter replacement at a "Price
              Agreeable" to Insurance Co. and In-Vision Construction LLC with no additional cost to Home Owner except
              for the Home Owner's deductible. When Price Agreeable is reached, In-Vision Construction LLC will contract
              labor and Home Owner authorizes In-Vision Construction LLC to obtain labor and material in accordance with
              the Price Agreeable and the specifications herein.
            </p>
          </div>

          <div className="mb-6 text-black">
            <h2 className="font-bold underline mb-2 text-black">CUSTOMER'S RIGHT TO CANCEL (MCL 445.113)</h2>
            <p className="text-sm font-bold text-black">
              You, the buyer, may cancel this transaction at any time prior to midnight of the third business day after
              the date of this transaction. See the attached notice of cancellation form for an explanation of this
              right. Additionally, the seller is prohibited from having an independent courier service or other third
              party pick up your payment at your residence before the end of the 3-business-day period in which you can
              cancel the transaction.
            </p>
          </div>

          <div className="mb-6 text-black">
            <p className="text-sm font-bold text-black">
              THIS AGREEMENT CONTAINS MANDATORY ARBITRATION PROVISIONS WHICH MAY BE ENFORCED BY THE PARTIES. THIS
              AGREEMENT CONTAINS A CLASS ACTION WAIVER. BY SIGNING BELOW, YOU ACKNOWLEDGE THAT YOU HAVE READ AND
              UNDERSTAND THESE TERMS.
            </p>
          </div>

          <div className="flex justify-between items-center mt-8 text-black">
            <div className="flex items-center text-black">
              <span className="mr-2 text-black">AgreestoTerms:</span>
              <div
                className="cursor-pointer border border-dashed border-gray-300 p-1 min-h-[80px] min-w-[200px]"
                onClick={() => applySignature("agreesSignature")}
              >
                {formData.agreesSignature ? (
                  <img src={formData.agreesSignature || "/placeholder.svg"} alt="Signature" className="max-h-16" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-black">Click to sign</div>
                )}
              </div>
            </div>
            <div className="flex items-center text-black">
              <span className="mr-2 text-black">Date:</span>
              <Input
                className="w-32 border-b border-t-0 border-l-0 border-r-0 rounded-none min-h-[28px] leading-relaxed py-1 bg-white text-black"
                value={formData.agreesDate || ""}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Page 2 */}
        <div className="contract-page pt-10 pb-6 text-black">
          <div className="text-center mb-6 text-black">
            <h2 className="font-bold text-black">NOTICE TO OWNER</h2>
            <p className="text-sm text-black">
              A RESIDENTIAL BUILDER OR A RESIDENTIAL MAINTENANCE AND ALTERATION CONTRACTOR IS REQUIRED TO BE LICENSED
              UNDER ARTICLE 24 OF THE OCCUPATIONAL CODE, 1980 PA 299, MCL339.2401 TO 339.2412. AN ELECTRICIAN IS
              REQUIRED TO BE LICENSED UNDER ARTICLE 7 OF THE SKILLED TRADES REGULATION ACT, MCL 339.5701 TO 339.5739. A
              PLUMBING CONTRACTOR IS REQUIRED TO BE LICENSED UNDER ARTICLE 11 OF THE SKILLED TRADES REGULATION ACT, MCL
              339.6101 TO 339.6133. A MECHANICAL CONTRACTOR IS LICENSED TO BE LICENSED UNDER ARTICLE 8 OF THE SKILLED
              TRADES REGULATION ACT, MCL 339.5801 TO 339.5819.
            </p>
            <p className="text-sm font-bold mt-4 text-black">
              IN-VISION CONSTRUCTION LLC IS A LICENSED CONTRACTOR. CONTRACTOR'S LICENSE #2424d1266
            </p>
            <h2 className="font-bold underline mt-4 text-black">TERMS AND CONDITIONS</h2>
          </div>

          <div className="text-sm space-y-4 text-black">
            <p>
              1) By signing his or her name to this Agreement and Terms and Conditions(this: "Agreement"), Home Owner
              authorizes In-Vision Construction LLC ("In-Vision Construction LLC") to communicate with Home Owner's
              Insurance Company ("Insurance Co.") regarding the damage to Home Owner's residence and the repairs related
              thereto. In-Vision Construction LLC shall consult with Home Owner's Insurance Company to determine extent
              of damage caused by a storm event and the repairs required to restore the residence to its pre-storm
              condition ("Scope of Work"). The Scope of Work shall be coordinated and performed by In-Vision
              Construction LLC and its contractors for the payment of a price agreeable to Insurance Co. (the "Price
              Agreeable"). In-Vision Construction LLC shall provide Home Owner with the final, approved Scope of Work
              and Price Agreeable prior to commencing any work. The final approved Scope of Work shall be attached
              hereto and incorporated herein by this reference. In-Vision Construction LLC hereby agrees to be bound to
              repair Scope of Work approved by Insurance Co. If In-Vision Construction LLC rejects a Scope of Work, or
              if the parties hereto cannot agree on a Scope of Work, this Agreement shall be deemed terminated that the
              parties shall have no further obligation to each other unless expressly set forth herein.
            </p>
            <p>
              2) In-Vision Construction LLC shall commence Work after your insurance company has approved the claim, and
              complete the Work within a build period starting from approximately April 1 and ending approximately
              October 31, subject to the remaining terms of this agreement, including but not limited to any force
              majeure events.
            </p>
            <p>
              3) Home Owner acknowledges that In-Vision Construction LLC as a general contractor and hereby authorizes
              Insurance Co. and/or Mortgage Co. above to make any checks payable jointly. In-Vision Construction LLC
              shall retain payment only for those items that Home Owner and In-Vision Construction LLC have agreed upon,
              regardless of damages for which Home Owner receives compensation from Insurance Co. Insurance Co. may
              include, offer, or reimburse Home Owner for certain repairs which are not included in the Scope of Work
              (the "Foregone Repairs"). Any Forgone Repairs are solely the responsibility of the Home Owner. In the
              event that the total amount of payment by Insurance Co. the exceeds the Price Agreeable, includes items
              not set forth in the Scope of Work, or includes any Foregone Repairs, In-Vision Construction LLC shall
              first apply any overage to Home Owner's out of pocket expenses and then shall pay the remaining amount of
              the overage, if any, to Home Owner upon completion of the Scope of Work. Home Owner authorizes Home
              Owner's Insurance Co. to release to In-Vision Construction LLC and/or AC Supplementing and Invoicing LLC
              In-Vision Construction LLC construction (In-Vision Construction LLC), upon In-Vision Construction LLC's
              request, any and all documents and information with regards to the insurance claim submitted for any work
              to be performed per this Agreement, including but not limited to any payment information regarding any
              funds paid by the Insurance Co. for said insurance claim and any documentation regarding the Insurance
              Co.'s adjuster reports, inspections and/or summaries. Home Owner authorizes In-Vision Construction LLC to
              communicate directly with Home Owner's Insurance Co. regarding the insurance claim, any work performed or
              to be performed per this Agreement, and any payment information regarding any funds to be paid by the
              Insurance Co. for said insurance claim.
            </p>
            <p>
              4) Home Owner acknowledges and agrees that In-Vision Construction LLC has not, at any time, advertised,
              offered to pay or promised to pay or rebate all or any portion of Home Owner's insurance deductible as an
              inducement to enter into this Agreement and that In-Vision Construction LLC has not represented or
              negotiated or offered or advertised to represent or negotiate on behalf of Home Owner on Home Owner's
              insurance claim in connection with the work to be performed by In-Vision Construction LLC.
            </p>
            <p>
              5) Home Owner and In-Vision Construction LLC warrant and represent that no person has offered or promised
              to pay or rebate Home Owner's insurance deductible or any credit to Home Owner as compensation or reward
              for the procurement of this Agreement, nor has any person offered, delivered, paid, credited or allowed to
              Home Owner any gift, bonus, award, merchandise, trading stamps, or cash loan for the procurement of this
              Agreement.
            </p>
          </div>
        </div>

        {/* Page 3 */}
        <div className="contract-page pt-10 pb-6 text-black">
          <div className="text-sm space-y-4 text-black">
            <p>
              6) Electronic Communication:As an alternative to physical delivery of this agreement,the parties agree
              that this Agreement, and any modification or amendment thereto may be delivered to the Home Owner via
              electronic mail or facsimile to the email/facsimile address below. Any such communication shall be deemed
              delivered at the time that it is transmitted. The Home Owner represents that Home Owner has the authority
              to sign this Agreement, and that by signing this Agreement the Home Owner is bound by its terms. The Home
              Owner agrees that electronic signatures and initials shall be deemed to be valid and binding upon the Home
              Owner as if the original signatures or initials were present on this Agreement in the handwriting of the
              Home Owner.
            </p>

            <div className="flex justify-between items-center my-4 text-black">
              <div className="flex items-center text-black">
                <span className="mr-2 text-black">Email/facsimile/Address:</span>
                <Input
                  className="w-64 border-b border-t-0 border-l-0 border-r-0 rounded-none min-h-[28px] leading-relaxed py-1 bg-white text-black"
                  value={formData.emailFacsimile || ""}
                  onChange={(e) => handleInputChange("emailFacsimile", e.target.value)}
                />
              </div>
              <div className="flex items-center text-black">
                <span className="mr-2 text-black">HomeOwnerInitials:</span>
                <div
                  className="cursor-pointer border border-dashed border-gray-300 p-1 min-h-[40px] min-w-[80px] flex items-center justify-center"
                  onClick={() => applyInitials("homeOwnerInitials1")}
                >
                  {formData.homeOwnerInitials1 ? (
                    <img src={formData.homeOwnerInitials1 || "/placeholder.svg"} alt="Initials" className="max-h-10" />
                  ) : (
                    <span className="text-gray-400 text-sm text-black">Click to initial</span>
                  )}
                </div>
              </div>
            </div>
            <p>
              7) Should Home Owner In-Vision Construction LLC receive notification from Insurance Co. that the Scope of
              Work, or any portion thereof, is not covered by insurance proceeds from which Home Owner intends to pay
              In-Vision Construction LLC, or if the insurance claim is denied, the party receiving such notice shall
              immediately notify the other of such conditions. Home Owner authorizes In-Vision Construction LLC to
              evaluate the reasons insurance coverage was refused, and to submit to the insurance company any and all
              supplementary scopes of work and to request additional inspections as In-Vision Construction LLC may deem
              necessary. If, after the submission of such supplementary scopes of work and additional inspections are
              completed, Insurance Co. continues to deny coverage, this Agreement shall be null and void, and the
              parties shall have no further obligation to each other except as specifically set forth herein.
            </p>
            <p>
              8) Home Owner is responsible for bringing and maintaining any liability for property damage insurance as
              may be necessary, including rain, fire, tornado, windstorm and hail, to protect all property against
              claims for damages for personal injury, accidental death, and to property, arising from the work performed
              under this Agreement.
            </p>
            <p>
              9) The HomeOwner shall provide In-Vision Construction LLC complete and accurate information for the
              purpose of securing any license, permit or other authorization to provide work, labor or services.
              In-Vision Construction LLC assumes no responsibility for the accuracy of information provided by the Home
              Owner. The Home Owner shall be responsible for any additional fees, charges, or other costs incurred
              resulting from the provision of incomplete or inaccurate information.
            </p>
            <p>
              10) All materials supplied by In-Vision Construction LLC will be new and ofgood quality (unless any used
              materials are specified in this Agreement), and that all work performed by In-Vision Construction LLC will
              be performed in a good and workmanlike manner.
            </p>
            <p>
              11) If during the course of ln-Vision Construction LLC's work,concealed or unknown conditions that affect
              the performance of the work are encountered ("Hidden Conditions"), In-Vision Construction LLC shall
              promptly notify the Home Owner and Insurance Co., and shall submit any supplementary materials to the
              Insurance Co. as may be required. In the event that the correction of such Hidden Conditions are not
              covered by the Home Owner's insurance policy, and the correction of such Hidden Conditions involves
              additional cost, In-Vision Construction LLC and Home Owner shall execute a written change order signed by
              both parties and the cost of such change shall be paid by the Home Owner. In the event that the Home Owner
              does not agree to execute a change order authorizing the correction of a Hidden Condition, the Home Owner
              shall be solely liable for any and all damages which may be attributable to the continued existence of the
              Hidden Condition, and Home Owner shall hold In-Vision Construction LLC harmless from all liability of any
              nature or kind arising out of a Hidden Condition which Home Owner elected not to correct and which
              continues following the completion of In-Vision Construction LLC's work.
            </p>
            <p>
              12) Home Owner is responsible for the cost of any work authorized by Home Owner but not paid by Insurance
              Co.,including without limitation, Home Owner's deductible, any work which is not approved by Insurance
              Co., or any work which exceeds the Scope of Work approved by Insurance Co.
            </p>
            <p>
              13) In-Vision Construction LLC will not be liable for delays or damages caused by civil unrest, vandalism,
              riot, war, act of enemies (including terrorism within the continental United States), national emergency,
              government acts or orders, epidemics, pandemics, or outbreaks of communicable diseases, quarantines, fire,
              flood, acts of God, adverse weather conditions, earthquakes or other natural disasters, material shortages
              or labor disputes, work stoppages or industry wide strike, changes in work or other conditions beyond the
              control of In-Vision Construction LLC.
            </p>
          </div>
        </div>

        {/* Page 4 */}
        <div className="contract-page pt-10 pb-6 text-black">
          <div className="text-sm space-y-4 text-black">
            <p>
              14) In-Vision Construction LLC is not responsible for damage to any items in a Home Owner's attic or other
              parts of the home where work is performed: any valuables should be covered or moved by Home Owner.
            </p>
            <p>
              15) In-Vision Construction LLC shall use reasonable efforts to protect existing landscaping, exterior
              siding, gutters and other building components from damage; however, In-Vision Construction LLC will not be
              responsible for damage to the aforementioned which occurs during normal course of work performed.
            </p>
            <p>
              16) All materials guaranteed to be as specified in information as obtained through manufacturer. In-Vision
              Construction LLC reserves the right to change manufacturers and/or suppliers of material due to market or
              macroeconomic conditions that may change after the execution of this Agreement and/or Scope of Work. Home
              Owner acknowledges and agrees that In-Vision Construction LLC may change manufacturers and/or suppliers of
              material for the Work, and does not need approval from Home Owner for any such change. Home Owner agrees
              that in the event In-Vision Construction LLC does change manufacturers and/or suppliers of material for
              the Work, that said change does not constitute a basis for the cancellation of this Agreement and/or the
              Scope of Work, and does not constitute a basis for the withholding or nonpayment of any amounts due to
              In-Vision Construction LLC for the Work.
            </p>
            <p>
              17) In-Vision Construction LLC will provide Home Owner a limited warranty against leakage, the terms,
              conditions, and limitations of which shall be set forth in its standard Limited Warranty provided to Home
              Owner upon Home Owner's compliance with the terms of this Agreement, including complete and prompt payment
              of all amounts due. The Limited Warranty is in lieu of all other warranties or guarantees, express,
              implied, or statutory, and In-Vision Construction LLC disclaims all other warranties. No oral or written
              information or advice given by In-Vision Construction LLC, its agents, reps, or employees shall create a
              warranty or in any way increase the scope of the Limited Warranty.
            </p>
            <p>
              18) Scope of Work:Home Owner agrees to allow In-Vision Construction LLC to use all onsite utilities, e.g.,
              water & electric, reasonably necessary to complete
            </p>
            <p>
              19) This Agreement:In-Vision Construction LLC's maximum liability under this Agreement, regardless of the
              form of action, shall not exceed the amount paid by Home Owner to In-Vision Construction LLC under this
              Agreement.
            </p>
            <p>
              20) If the Home Owner cancels this Agreement as set forth in the atached cancellation notice, any payments
              made by Home Owner except for certain emergency work already performed will be returned to the Home Owner.
            </p>
            <p>
              21) Not withstanding anything herein to the contrary lf Home Owner cancels this Agreement after an
              insurance settlement for the work described in this Agreement is procured, but before actual commencement
              of roof or siding repair/replacement work by In-Vision Construction LLC's agents, Home Owner will be
              responsible for the cost of In-Vision Construction LLC's inspections, labor, supplies and material, and
              shall pay to In-Vision Construction LLC the lesser of $5,000.00 or 33.3% of the total Price Agreeable as
              liquidated damages, and not as a penalty; it is declared and agreed by Home Owner and In-Vision
              Construction LLC that this sum shall, without proof, represents the damages actually sustained by
              In-Vision Construction LLC by reason of Home Owner's actions. If Home Owner breaches any promise or
              covenant contained in this Agreement following the commencement of roof or siding repair/replacement work
              by In-Vision Construction LLC's agents, in addition to liquidated damages, Home Owner will pay to
              In-Vision Construction LLC the proportion of the total Price Agreeable as the amount of labor and
              materials furnished bears to the total amount of labor and materials agreed upon to be furnished under
              this Agreement, payable within 5 days from the date of Home Owner's breach.
            </p>
          </div>
        </div>

        {/* Page 5 - First Part */}
        <div className="contract-page pt-10 pb-6 text-black">
          <div className="text-sm space-y-4 text-black">
            <p>
              22) The failure of Home Owner to make payments when due shall be a breach of Home Owner's obligations
              under this Agreement, and In-Vision Construction LLC shall be entitled to any and all remedies available
              under this Agreement, at law or in equity.
            </p>
            <p>
              23) By signing this Agreement Home Owner agrees "OptIn" to calls,texts,and faxes from In-Vision
              Construction LLC and In-Vision Construction LLC's affiliates, agents, and service providers ("In-Vision
              Construction LLC"), including regarding this Agreement, the Work, to collect any amounts potentially owed,
              and to offer In-Vision Construction LLC's products and services. "Opt In" means that Home Owner (i) grants
              In-Vision Construction LLC express permission to contact it via telephone, text message, cellular phone,
              and fax, unless and until such permission is revoked in accordance with these Terms; (ii) agrees to
              receive communications from In-Vision Construction LLC, as described above, using autodialer and
              non-autodialer technology as well as live and prerecorded calls; (iii) authorizes In-Vision Construction
              LLC to include marketing content in any (iii) authorizes In-Vision Construction LLC to include marketing
              content in any such communications; (iv) expressly consents to In-Vision Construction LLC's use of Home
              Owner's phone number regardless of whether the telephone number is on any federal state, local, or other
              do not call list; and, (v) certifies that it is an authorized user of any telephone numbers that provided
              to In-Vision Construction LLC. Home Owner acknowledges that consent to receive marketing, autodialed, and
              prerecorded calls and texts is not required to purchase In-Vision Construction LLC's products or services. Home Owner further acknowledges that its consent may be revoked by emailing
              info@in-visionconstruction.com, agrees that other methods are not valid means for revoking consent and may
              not be recognized by In-Vision Construction LLC, and, releases In-Vision Construction LLC from any
              liability related to Home Owner's efforts to revoke its prior express consent by other methods or means.
            </p>
            <p>
              24) MANDATORY INDIVIDUAL ARBITRATION PROVISIONS:Home Owner and In-Vision Construction LLC will resolve
              claims relating to this Agreement, these Provisions, and threshold questions of arbitrability, through
              final, binding, and individual arbitration to a single arbitrator, in the county where the dispute is
              located, administered by the American Arbitration Association (AAA) in accordance with its Commercial
              Arbitration Rules and the Supplementary Procedures for Consumer Related Disputes, which will control all
              arbitration fees and incentives. Except as otherwise provided by this Agreement, each party shall bear
              their own costs and expenses and all administrative expenses, including the arbitrator's fees, shall be
              split equally. In-Vision Construction LLC will pay Home Owner an additional $500 if it receive an
              arbitration reward that is more favorable than In-Vision Construction LLC's highest offer. These
              Provisions do not apply to: (1) qualifying claims brought in small-claims court; and, (2) lawsuits brought
              to enforce payment.
            </p>
            <p>
              25) CLASSASSERTIONS: Home Owner agrees that by accepting this Agreement, and not opting-out of the
              Mandatory Individual Arbitration Provisions, Home Owner and In-Vision Construction LLC each waive the
              right to participate in a class action or class arbitration of any claims relating to this Agreement. Home
              Owner is not allowed to bring or participate, in class actions, consolidated actions, representative
              actions, class arbitrations, class actions, general actions against In-Vision Construction LLC. The
              arbitrator does not have the power modify this provision. If this prohibition is found to be
              unenforceable, all of the Mandatory Individual Arbitration Provisions are null and void.
            </p>
            <p>
              26) TO OPT OUT OF THE MANDATORY INDIVIDUAL ARBITRATION PROVISIONS AND CLASS ACTION WAIVER, notify
              In-Vision Construction LLC, in writing, within thirty (30) days of the effective date of this Agreement.
            </p>
          </div>
        </div>
      </div>

      {/* Final Paragraphs Section - Separate for PDF generation */}
      <div ref={finalParagraphsRef} className="pt-10 pb-6 bg-white text-black">
        <div className="text-sm space-y-4 text-black">
          <p>
            27) This Agreement shall be governed and construed according to the laws of the State of Michigan, without
            giving effect to any choice or conflict of law provision or rule. If the Mandatory Individual Arbitration
            Provisions are found not to apply, disputes related to this Agreement shall be resolved through litigation
            in the circuit court in which the property is located. In the event legal action is required to enforce
            payment (including, without limitation, the filing of a lien) Home Owner will be responsible for all of
            In-Vision Construction LLC's costs of collection incurred by In-Vision Construction LLC, including, without
            limitation, recording costs, court costs, attorney fees and any other costs, plus interest at the legal
            rate of 5% per annum or the highest amount of interest allowed by law from the date of accrual of such fees
            and costs, all of which shall be deemed to have accrued upon the commencement of such action and shall be
            paid whether or not such action is prosecuted to judgment. Any judgment or order entered in such action
            shall contain a specific provision providing for the recovery of attorney fees and costs incurred in
            enforcing judgment.
          </p>
          <p>
            28) In-Vision Construction LLC rights and remedies are cumulative and not altermative. Waiver of any default
            will not constitute waiver of any subsequent default. Any provision found to be invalid under applicable law
            will be invalid only with respect to the offending provision. In the event that any provision or any portion
            thereof of this Agreement is determined by competent judicial, legislative or administrative authority to be
            unenforceable or prohibited by law, then such provision or part thereof shall be ineffective only to the
            extent of such determination or prohibition, without invalidating the remaining provisions of this
            Agreement. All words used herein will be construed to be of such gender and number as the circumstance
            requires. This Agreement will be binding upon and will inure to the benefit of the parties and upon any
            parties who may in the future succeed to their interests.
          </p>
          <p>
            29) This Agreement contains the entire Agreement between the parties hereto.HomeOwner agrees that no
            representation, promise, express or implied have been made to Home Owner with respect to the materials and
            services covered by this Agreement, except as contained herein and that no modification or alteration of
            this Agreement will be binding, unless endorsed in writing by the parties hereto.
          </p>
          <p>
            30) Upon singature of this Agreement the Home Owner agrees that he/she has read and received a copy of this
            Agreement. Home Owner also understands that any form of payment on the subject insurance claim from the
            Insurance Co. (e.g. ACV, depreciation, hold-back, supplements, and overhead and profit) shall be endorsed by
            the Home Owner and rendered to In-Vision Construction LLC immediately upon receipt of said payment, to be
            applied to the Price Agreeable subject to Paragraph 3 above.
          </p>

          <div className="flex justify-between items-center mt-4 text-black">
            <div className="flex items-center text-black">
              <span className="mr-2 text-black">HomeOwnerInitials:</span>
              <div
                className="cursor-pointer border border-dashed border-gray-300 p-1 min-h-[40px] min-w-[80px] flex items-center justify-center"
                onClick={() => applyInitials("homeOwnerInitials2")}
              >
                {formData.homeOwnerInitials2 ? (
                  <img src={formData.homeOwnerInitials2 || "/placeholder.svg"} alt="Initials" className="max-h-10" />
                ) : (
                  <span className="text-gray-400 text-sm text-black">Click to initial</span>
                )}
              </div>
            </div>
            <div className="flex items-center text-black">
              <span className="mr-2 text-black">HomeOwnerInitials:</span>
              <div
                className="cursor-pointer border border-dashed border-gray-300 p-1 min-h-[40px] min-w-[80px] flex items-center justify-center"
                onClick={() => applyInitials("homeOwnerInitials3")}
              >
                {formData.homeOwnerInitials3 ? (
                  <img src={formData.homeOwnerInitials3 || "/placeholder.svg"} alt="Initials" className="max-h-10" />
                ) : (
                  <span className="text-gray-400 text-sm text-black">Click to initial</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm space-y-4 mt-4 text-black">
            <p>
              31) In-Vision Construction LLC is an independent GENERAL CONTRACTOR and is not governed by any collective
              price agreement with Home Owner's insurance company that would reduce Price Agreeable from market pricing
              for labor, material, and overhead costs. Home Owner acknowledges and agree that In-Vision Construction LLC
              is entitled to reasonable overhead and profit as part of the scope of work for line items in determining
              the Price Agreeable, and that such overhead and profit is agreed upon for In-Vision Construction LLC'S
              managing of the complexity of the scope of work, managing the safety of employees and contractors,
              employee benefits such as medical, dental, vision, 401k, quality control, invoicing and supplementing,
              record keeping, maintenance of the limited warranty, provided by In-Vision Construction LLC, rent,
              utilities, fuel as well as any and all other costs related to being a general contractor.
            </p>
          </div>

          <div className="flex justify-between items-center mt-4 text-black">
            <div className="flex items-center text-black">
              <span className="mr-2 text-black">HomeOwnerInitials:</span>
              <div
                className="cursor-pointer border border-dashed border-gray-300 p-1 min-h-[40px] min-w-[80px] flex items-center justify-center"
                onClick={() => applyInitials("homeOwnerInitials2")}
              >
                {formData.homeOwnerInitials2 ? (
                  <img src={formData.homeOwnerInitials2 || "/placeholder.svg"} alt="Initials" className="max-h-10" />
                ) : (
                  <span className="text-gray-400 text-sm text-black">Click to initial</span>
                )}
              </div>
            </div>
            <div className="flex items-center text-black">
              <span className="mr-2 text-black">HomeOwnerInitials:</span>
              <div
                className="cursor-pointer border border-dashed border-gray-300 p-1 min-h-[40px] min-w-[80px] flex items-center justify-center"
                onClick={() => applyInitials("homeOwnerInitials3")}
              >
                {formData.homeOwnerInitials3 ? (
                  <img src={formData.homeOwnerInitials3 || "/placeholder.svg"} alt="Initials" className="max-h-10" />
                ) : (
                  <span className="text-gray-400 text-sm text-black">Click to initial</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

GeneralContract.displayName = "GeneralContract"

export default GeneralContract
