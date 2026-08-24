/**
 * Shared payload builder for the Scope of Work form.
 *
 * Two screens submit this form - the lead-detail dialog and the standalone
 * /contracts/scope-of-work page. They used to build the payload separately and
 * drifted apart, so the standalone page silently posted names that no longer
 * existed. Both now call buildScopeOfWorkPayload.
 *
 * The strings below are the `name=` attributes on ScopeOfWorkForm.tsx. They are
 * also the field names in the DocuSeal template - DocuSeal matches on the exact
 * string, and a mismatch fails silently. Changing a name means changing it in
 * all three places.
 */

export const SCOPE_OF_WORK_CHECKBOXES: readonly string[] = [
  'addingYes',
  'critterNo',
  'critterUnknown',
  'critterYes',
  'detachedNo',
  'detachedWorkNo',
  'detachedWorkTBD',
  'detachedWorkYes',
  'detachedYes',
  'dishDispose',
  'dishKeep',
  'dishNone',
  'drivewayNo',
  'drivewayYes',
  'facia',
  'gutterGuardsNo',
  'gutterGuardsYes',
  'gutterSizeOverSized',
  'gutterSizeStandard',
  'guttersDownspouts',
  'guttersNone',
  'shutterNA',
  'shutterRemove',
  'shutterReplace',
  'shutterReset',
  'sidingNo',
  'soffit',
  'solarLeased',
  'solarOwned',
  'ventilation_existing',
  'warrantyNo',
  'warrantyYes',
  'wraps',
]

export function buildScopeOfWorkPayload(
  form: HTMLFormElement,
  leadId?: string,
): Record<string, unknown> {
  const formData = new FormData(form)
  const data: Record<string, unknown> = {}

  for (const [key, value] of formData.entries()) {
    if (key in data) {
      throw new Error(
        `Duplicate form field "${key}" - two controls share a name= attribute. ` +
          'Give them distinct names; DocuSeal cannot accept an array for one field.',
      )
    }
    data[key] = value
  }

  // An unchecked box is absent from FormData, so send an explicit false.
  for (const field of SCOPE_OF_WORK_CHECKBOXES) {
    data[field] = formData.has(field)
  }

  const panels = data.numberPanels
  data.numberPanels = typeof panels === 'string' && panels.trim() !== '' ? parseInt(panels, 10) : null

  if (leadId) data.leadId = leadId

  return data
}
