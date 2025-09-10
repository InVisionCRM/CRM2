import { useState, useRef } from "react"
import { SignatureCanvas } from "@/components/contracts/signature-canvas"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ScopeOfWorkFormProps {
  prefilledData?: {
    firstName?: string
    lastName?: string
    address?: string
  }
}

const shingleBrands = [
  {
    brand: "TAMKO",
    lines: [
      {
        type: "Heritage",
        colors: ["Olde English Pewter", "Rustic Black", "Rustic Cedar", "Rustic Redwood", "Virginia Slate", "Weathered Wood"]
      },
      {
        type: "Titan XT",
        colors: ["Autumn Brown", "Black Walnut", "Mountain Slate", "Natural Timber", "Painted Desert", "Thunderstorm Grey"]
      },
      {
        type: "Titan XL Classic", 
        colors: ["Antique Slate", "Desert Sand", "Glacier White", "Olde English Pewter", "Oxford Grey", "Rustic Black", "Rustic Cedar", "Rustic Evergreen", "Rustic Hickory", "Rustic Redwood", "Rustic Slate", "Shadow Grey", "Virginia Slate", "Weathered Wood"]
      },
      {
        type: "Stormfighter Flex",
        colors: ["Black Walnut", "Olde English Pewter", "Rustic Black", "Rustic Cedar", "Rustic Slate", "Thunderstorm Grey", "Weathered Wood"]
      }
    ]
  },
  {
    brand: "IKO",
    lines: [
      {
        type: "Dynasty",
        colors: ["Granite Black", "Matte Black", "Cornerstone-Weatherwood", "Glacier", "Shadow Brown", "Frostone Grey", "Biscayne", "Brownstone", "Driftshake", "Emerald Green", "Monaco Red", "Sentinel Slate", "Summit Grey", "Atlantic Blue"]
      }
    ]
  },
  {
    brand: "GAF",
    lines: [
      {
        type: "Timberline AS II",
        colors: ["Slate", "Shakewood", "Weathered Wood", "Hickory", "Pewter Gray", "Barkwood", "Charcoal"]
      },
      {
        type: "Timberline NS",
        colors: ["Charcoal", "Pewter Gray", "Weathered Wood"]
      }
    ]
  }
]

const additionalNotesCategories = [
  {
    category: "Site Access & Logistics",
    items: [
      "Crew Parking: [Specify location]",
      "Driveway Use: Heavy Trucks Prohibited", 
      "Driveway Use: Do Not Block",
      "Gate Code: [Enter Code]",
      "Material Staging Area: [Specify location]",
      "Dumpster Placement: [Specify location]",
      "Trailer Access: Tight Turn/Narrow Street",
      "Shared Driveway: Be Courteous to Neighbor"
    ]
  },
  {
    category: "Property & Landscape Protection", 
    items: [
      "Protect: Japanese Maple Tree",
      "Protect: Home Garden",
      "Protect: Rose Bushes", 
      "Protect: All Flower Beds",
      "Protect: New Landscaping/Sod",
      "Protect: Lawn Ornaments/Statues",
      "Protect: Koi Pond/Water Feature",
      "Cover/Move: Patio Furniture",
      "Caution: Low-Hanging Tree Branches",
      "Caution: Sprinkler Heads"
    ]
  },
  {
    category: "Scheduling",
    items: [
      "Work Start Time: No Work Before 8:00 AM",
      "Work Start Time: No Work Before 9:00 AM"
    ]
  },
  {
    category: "Roof & Structural Details",
    items: [
      "Known Issue: Soft Wood/Decking [Specify location]",
      "Known Issue: Previous Leak [Specify location]", 
      "Known Issue: Water Pools in Valley [Specify location]",
      "Inspect: Skylight Flashing",
      "Inspect: Chimney Flashing",
      "Note: Multiple Shingle Layers Present",
      "Homeowner Concern: Attic Ventilation"
    ]
  },
  {
    category: "Materials & Job Specifics",
    items: [
      "Extra Sold: Underlayment [Specify the extra sold]",
      "Note: Drip Edge Color Mismatch [Specify the drip edge color]"
    ]
  },
  {
    category: "Site Utilities & Features", 
    items: [
      "Location: Septic Tank/Leach Field [Specify area to avoid]",
      "Location: Known Underground Lines [Specify]",
      "Note: Security Cameras on Property",
      "Action: Remove & Reinstall Satellite Dish",
      "Action: Work Around Solar Panels"
    ]
  }
]

export default function ScopeOfWorkForm({ prefilledData }: ScopeOfWorkFormProps = {}) {
  const [signature, setSignature] = useState("")
  const [selectedShingle, setSelectedShingle] = useState("")
  const [roofSpec, setRoofSpec] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("TAMKO")
  const [selectedNotesCategory, setSelectedNotesCategory] = useState("Site Access & Logistics")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const selectTriggerRef = useRef<HTMLButtonElement>(null)
  const shingleSelectRef = useRef<HTMLButtonElement>(null)

  const handleShingleSelection = (value: string) => {
    setSelectedShingle(value)
    setRoofSpec(value)
  }

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand)
    setSelectedShingle("")
    // Automatically open the dropdown after a short delay
    setTimeout(() => {
      if (shingleSelectRef.current) {
        shingleSelectRef.current.click()
      }
    }, 100)
  }

  const handleNotesCategoryChange = (category: string) => {
    setSelectedNotesCategory(category)
    // Automatically open the dropdown after a short delay
    setTimeout(() => {
      if (selectTriggerRef.current) {
        selectTriggerRef.current.click()
      }
    }, 100)
  }

  const handleNoteSelection = (note: string) => {
    // Append the selected note to existing notes with a line break
    const newNote = additionalNotes ? `${additionalNotes}\n• ${note}` : `• ${note}`
    setAdditionalNotes(newNote)
  }

  const getShingleColor = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      // TAMKO Colors - More vibrant
      "Olde English Pewter": "#8B8F9A",
      "Rustic Black": "#0F172A",
      "Rustic Cedar": "#C2410C",
      "Rustic Redwood": "#A52A2A",
      "Virginia Slate": "#374151",
      "Weathered Wood": "#A8A29E",
      "Autumn Brown": "#B45309",
      "Black Walnut": "#1C1917",
      "Mountain Slate": "#475569",
      "Natural Timber": "#D97706",
      "Painted Desert": "#F59E0B",
      "Thunderstorm Grey": "#4B5563",
      "Antique Slate": "#64748B",
      "Desert Sand": "#FDE047",
      "Glacier White": "#FFFFFF",
      "Oxford Grey": "#6B7280",
      "Rustic Evergreen": "#047857",
      "Rustic Hickory": "#92400E",
      "Rustic Slate": "#475569",
      "Shadow Grey": "#4B5563",
      
      // IKO Colors - More vibrant
      "Granite Black": "#111827",
      "Matte Black": "#000000",
      "Cornerstone-Weatherwood": "#A8A29E",
      "Glacier": "#F8FAFC",
      "Shadow Brown": "#7C2D12",
      "Frostone Grey": "#D1D5DB",
      "Biscayne": "#FEF08A",
      "Brownstone": "#B45309",
      "Driftshake": "#D6D3D1",
      "Emerald Green": "#10B981",
      "Monaco Red": "#DC2626",
      "Sentinel Slate": "#374151",
      "Summit Grey": "#9CA3AF",
      "Atlantic Blue": "#2563EB",
      
      // GAF Colors - More vibrant
      "Slate": "#64748B",
      "Shakewood": "#A8A29E",
      "Hickory": "#B45309",
      "Pewter Gray": "#9CA3AF",
      "Barkwood": "#B45309",
      "Charcoal": "#374151"
    }
    
    return colorMap[colorName] || "#9CA3AF"
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <Accordion 
        type="multiple" 
        defaultValue={["general-info"]} 
        className="space-y-4 [&>*]:bg-white [&>*]:border-blue-200 [&>*]:rounded-lg [&>*]:shadow-sm"
      >
      {/* General Info */}
        <AccordionItem value="general-info" className="border-blue-200 bg-white">
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-blue-50 rounded-t-lg">
            General Info
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-slate-500 rounded-sm p-4 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  name="firstName" 
                  placeholder="First Name" 
                  required 
                  className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm" 
                  defaultValue={prefilledData?.firstName || ''}
                />
                <input 
                  type="text" 
                  name="lastName" 
                  placeholder="Last Name" 
                  required 
                  className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm" 
                  defaultValue={prefilledData?.lastName || ''}
                />
                <input type="text" name="address" placeholder="Address" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm md:col-span-2" defaultValue={prefilledData?.address || ''} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      {/* Roofing */}
        <AccordionItem value="roofing" className="border-blue-200 bg-white">
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-blue-50 rounded-t-lg">
            Roofing Specification
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-gray-50 rounded-sm p-4 border border-gray-100">
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Quick Select Roof Specification</label>
                  <Tabs value={selectedBrand} onValueChange={handleBrandChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-sm">
                      {shingleBrands.map((brand) => (
                        <TabsTrigger 
                          key={brand.brand} 
                          value={brand.brand}
                          className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-sm transition-all"
                        >
                          {brand.brand}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {shingleBrands.map((brand) => (
                      <TabsContent key={brand.brand} value={brand.brand} className="mt-3">
                        <Select value="" onValueChange={handleShingleSelection}>
                          <SelectTrigger 
                            ref={shingleSelectRef}
                            className="w-full bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm"
                          >
                            <SelectValue placeholder={`Select ${brand.brand} shingle...`} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {brand.lines.map((line) => (
                              <div key={line.type}>
                                {line.colors.map((color) => (
                                  <SelectItem key={`${brand.brand}-${line.type}-${color}`} value={`${brand.brand} ${line.type} ${color}`}>
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-green-500 font-medium">[{line.type}]</span>
                                        <span>{color}</span>
                                      </div>
                                      <div className="ml-6">
                                        <div 
                                          className="w-5 h-5 rounded-sm border-2 border-gray-400 shadow-sm"
                                          style={{ backgroundColor: getShingleColor(color) }}
                                        />
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    name="roofSpec" 
                    placeholder="Roof Specification" 
                    value={roofSpec}
                    onChange={(e) => setRoofSpec(e.target.value)}
                    className="input input-bordered text-black bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm md:col-span-2" 
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="ventilation_existing" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Pre-Existing Ventilation
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="addingYes" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Adding Ventilation
                </label>
              </div>
              <textarea name="roofingSpecAdditionalInfo" placeholder="Additional Roofing Info" className="textarea textarea-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm"></textarea>
            </div>
          </AccordionContent>
        </AccordionItem>

      {/* Gutters */}
        <AccordionItem value="gutters" className="border-blue-200 bg-white">
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-blue-50 rounded-t-lg">
            Gutter Specification
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-gray-50 rounded-sm p-4 border border-gray-100">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="guttersDownspouts" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Gutters/Downspouts
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="guttersNone" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  None
                </label>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="text-gray-600 font-medium">Gutter Size:</span>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="gutterSizeStandard" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Standard Size
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="gutterSizeOverSized" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Oversized
                </label>
              </div>
              <input type="text" name="gutterColor" placeholder="Gutter Color" className="input input-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm" />
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="text-gray-600 font-medium">Gutter Guards:</span>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="gutterGuardsYes" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="gutterGuardsNo" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  No
                </label>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="text-gray-600 font-medium">Gutter Guards Warranty:</span>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="warrantyYes" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="warrantyNo" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  No
                </label>
              </div>
              <textarea name="gutterAdditionalInfo" placeholder="Additional Gutter Info" className="textarea textarea-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm"></textarea>
            </div>
          </AccordionContent>
        </AccordionItem>

      {/* Siding */}
        <AccordionItem value="siding" className="border-blue-200 bg-white">
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-blue-50 rounded-t-lg">
            Siding
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-gray-50 rounded-sm p-4 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="sidingSpec" placeholder="Siding Spec" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm" />
                <input type="text" name="sidingColor" placeholder="Siding Color" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-msmshadow-sm" />
                <input type="text" name="cornerColor" placeholder="Corner Color" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm" />
                <input type="text" name="gabelVentColor" placeholder="Gable Vent Color" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm" />
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="text-gray-600 font-medium">Shutters:</span>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="shutterReset" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Detach & Reset Existing
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="shutterReplace" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Replace with New
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="shutterRemove" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Remove & Discard
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="shutterNA" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  N/A
                </label>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="text-gray-600 font-medium">Scope:</span>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="facia" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Facia
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="soffit" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Soffit
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="wraps" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Wraps
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="sidingNo" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  None
                </label>
              </div>
              <input type="text" name="faciaSoffitWrapColor" placeholder="Facia/Soffit/Wrap Color" className="input input-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm" />
              <textarea name="sidingAdditionalInfo" placeholder="Additional Siding Info" className="textarea textarea-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-sm shadow-sm"></textarea>
            </div>
          </AccordionContent>
        </AccordionItem>

      {/* Solar */}
        <AccordionItem value="solar" className="border-blue-200 bg-white">
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-blue-50 rounded-t-lg">
            Solar
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="solarCompany" placeholder="Solar Company" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" />
                <input type="number" name="numberPanels" placeholder="# of Panels" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" />
                <input type="text" name="solarContactInfo" placeholder="Solar Contact Info" className="input input-bordered md:col-span-2 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" />
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="text-gray-600 font-medium">Ownership:</span>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="solarOwned" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Owned
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="solarLeased" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Leased
                </label>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="text-gray-600 font-medium">Critter Cage:</span>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="critterYes" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="critterNo" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  No
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="critterUnknown" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Unknown
                </label>
              </div>
              <textarea name="solarAdditionalInfo" placeholder="Additional Solar Info" className="textarea textarea-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm"></textarea>
            </div>
          </AccordionContent>
        </AccordionItem>

      {/* HOA */}
        <AccordionItem value="hoa" className="border-blue-200 bg-white">
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-blue-50 rounded-t-lg">
            Homeowners Association
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <input type="text" name="hoalInfo" placeholder="HOA Contact Info" className="input input-bordered w-full text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" />
            </div>
          </AccordionContent>
        </AccordionItem>

      {/* Misc */}
        <AccordionItem value="misc" className="border-blue-200 bg-white">
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-blue-50 rounded-t-lg">
            Miscellaneous
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex flex-wrap gap-4">
                <span className="text-gray-600 font-medium">Satellite:</span>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="dishKeep" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Keep
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="dishDispose" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Dispose
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="dishNone" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  No Dish Exists
                </label>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="text-gray-600 font-medium">Detached Structure:</span>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="detachedYes" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="detachedNo" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  No
                </label>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="text-gray-600 font-medium">Work on Detached Structure:</span>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="detachedWorkYes" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="detachedWorkNo" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  No
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="detachedWorkTBD" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  TBD
                </label>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="text-gray-600 font-medium">Driveway Damage:</span>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="drivewayDamage" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="miscDescription" className="checkbox checkbox-sm border-gray-400 bg-white" />
                  No
                </label>
              </div>
              <textarea name="miscDescription" placeholder="Detached Structure Description" className="textarea textarea-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm"></textarea>
              <textarea name="drivewayDamage" placeholder="Driveway Damage Description" className="textarea textarea-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm"></textarea>
              <textarea name="miscAdditionalNotes" placeholder="Landscaping Protection Notes" className="textarea textarea-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm"></textarea>
            </div>
          </AccordionContent>
        </AccordionItem>

      {/* Final Notes */}
        <AccordionItem value="notes" className="border-blue-200 bg-white">
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-green-500/30 hover:text-black rounded-t-lg">
            Additional Notes
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-white rounded-sm p-4 border border-gray-100">
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm text-black">Quick Add Notes</label>
                  <Tabs value={selectedNotesCategory} onValueChange={handleNotesCategoryChange} className="w-full bg-white">
                    <TabsList className="grid w-full grid-cols-3 !bg-white p-1 rounded-sm border border-gray-300">
                      {additionalNotesCategories.slice(0, 3).map((category) => (
                        <TabsTrigger 
                          key={category.category} 
                          value={category.category}
                          className="text-sm !text-black !bg-white data-[state=active]:!bg-gray-100 data-[state=active]:!text-black rounded-md hover:!bg-green-500/30 hover:!text-black"
                        >
                          {category.category.split(' ')[0]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <TabsList className="grid w-full grid-cols-3 !bg-white p-1 rounded-lg border border-gray-300 mt-2">
                      {additionalNotesCategories.slice(3, 6).map((category) => (
                        <TabsTrigger 
                          key={category.category} 
                          value={category.category}
                          className="text-sm !text-black !bg-white data-[state=active]:!bg-gray-100 data-[state=active]:!text-black rounded-md hover:!bg-green-500/30 hover:!text-black"
                        >
                          {category.category.includes('&') ? category.category.split(' & ')[0] + ' & ' + category.category.split(' & ')[1].split(' ')[0] : category.category.split(' ')[0] + ' ' + category.category.split(' ')[1]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {additionalNotesCategories.map((category) => (
                      <TabsContent key={category.category} value={category.category} className="mt-3 !bg-white p-2 rounded-md">
                        <Select value="" onValueChange={handleNoteSelection}>
                          <SelectTrigger 
                            ref={selectTriggerRef}
                            className="w-full !bg-white !text-black border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm"
                          >
                            <SelectValue placeholder={`Select ${category.category} note...`} className="!text-black" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 !bg-white border border-gray-300 shadow-lg">
                            {category.items.map((item, index) => (
                              <SelectItem 
                                key={`${category.category}-${index}`} 
                                value={item}
                                className="!bg-white hover:!bg-gray-100 !text-black"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="!text-black">{item}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                  <textarea 
                    name="miscAdditionalNotes" 
                    placeholder="Additional Notes" 
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="textarea textarea-bordered w-full text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm h-32"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Sender Signature Section */}
        <AccordionItem value="signature" className="border-blue-200 bg-white">
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-blue-50 rounded-t-lg">
            Sender Signature <span className="text-red-500 text-sm font-normal">(REQUIRED)</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <SignatureCanvas value={signature} onChange={setSignature} />
              <input type="hidden" name="invisionSignature" value={signature} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
