import { useState } from "react"
import { SignatureCanvas } from "@/components/contracts/signature-canvas"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

interface ScopeOfWorkFormProps {
  prefilledData?: {
    firstName?: string
    lastName?: string
    address?: string
  }
}

export default function ScopeOfWorkForm({ prefilledData }: ScopeOfWorkFormProps = {}) {
  const [signature, setSignature] = useState("")

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
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  name="firstName" 
                  placeholder="First Name" 
                  required 
                  className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" 
                  defaultValue={prefilledData?.firstName || ''}
                />
                <input 
                  type="text" 
                  name="lastName" 
                  placeholder="Last Name" 
                  required 
                  className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" 
                  defaultValue={prefilledData?.lastName || ''}
                />
                <input type="text" name="address" placeholder="Address" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm md:col-span-2" defaultValue={prefilledData?.address || ''} />
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
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="roofSpec" placeholder="Roof Specification" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm md:col-span-2" />
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
              <textarea name="roofingSpecAdditionalInfo" placeholder="Additional Roofing Info" className="textarea textarea-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm"></textarea>
            </div>
          </AccordionContent>
        </AccordionItem>

      {/* Gutters */}
        <AccordionItem value="gutters" className="border-blue-200 bg-white">
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-blue-50 rounded-t-lg">
            Gutter Specification
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
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
              <input type="text" name="gutterColor" placeholder="Gutter Color" className="input input-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" />
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
              <textarea name="gutterAdditionalInfo" placeholder="Additional Gutter Info" className="textarea textarea-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm"></textarea>
            </div>
          </AccordionContent>
        </AccordionItem>

      {/* Siding */}
        <AccordionItem value="siding" className="border-blue-200 bg-white">
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-blue-50 rounded-t-lg">
            Siding
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="sidingSpec" placeholder="Siding Spec" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" />
                <input type="text" name="sidingColor" placeholder="Siding Color" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" />
                <input type="text" name="cornerColor" placeholder="Corner Color" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" />
                <input type="text" name="gabelVentColor" placeholder="Gable Vent Color" className="input input-bordered text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" />
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
              <input type="text" name="faciaSoffitWrapColor" placeholder="Facia/Soffit/Wrap Color" className="input input-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm" />
              <textarea name="sidingAdditionalInfo" placeholder="Additional Siding Info" className="textarea textarea-bordered w-full mt-4 text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm"></textarea>
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
          <AccordionTrigger className="text-gray-800 hover:text-blue-700 font-medium px-4 py-3 hover:bg-blue-50 rounded-t-lg">
            Additional Notes
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <textarea name="miscAdditionalNotes" placeholder="Additional Notes" className="textarea textarea-bordered w-full text-gray-900 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-md shadow-sm"></textarea>
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
