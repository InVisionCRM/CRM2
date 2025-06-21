# Mobile Leads List Mockup - Updated Design

## Compact View (Collapsed State) - REFINED

```
┌─────────────────────────────────────────────────────┐
│ 📱 CRM55 - Leads List                    [🔍] [⚙️] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [JS] John Alexander Smith   [SCHEDULED] [⋮][▼] │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [SA] Sarah Michelle Anderson [COLORS] [⋮][▼]   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [👤] Mark Williams Henderson    [JOB] [⋮][▼]   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [RD] Robert Davis Thompson [COMPLETED] [⋮][▼]  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Show 20 ▼] of 156 leads    Page 1 of 8  [‹‹][‹][›][››] │
└─────────────────────────────────────────────────────┘
```

## Expanded View (When Tapped) - NEW DESIGN

```
┌─────────────────────────────────────────────────────┐
│ 📱 CRM55 - Leads List                    [🔍] [⚙️] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [JS] John Alexander Smith   [SCHEDULED] [⋮][▲] │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ ┌─────────────────┐ ┌─────────────────────────┐ │ │
│ │ │ 🗺️ Street View  │ │ 📝 Quick Note           │ │ │
│ │ │ [Street View    │ │ ┌─────────────────────┐ │ │ │
│ │ │  Image Loading] │ │ │ Add quick note...   │ │ │ │
│ │ │                 │ │ │                     │ │ │ │
│ │ │ 123 Main St     │ │ │                     │ │ │ │
│ │ │ Chicago, IL     │ │ │                     │ │ │ │
│ │ └─────────────────┘ │ │                     │ │ │ │
│ │                     │ └─────────────────────┘ │ │ │
│ │                     │ [💾 Save Note]          │ │ │
│ │                     └─────────────────────────┘ │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 📤 Upload Documents                              │ │
│ │ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐            │ │
│ │ │📄 │ │📊 │ │📋 │ │🦅 │ │📑 │ │🛡️ │            │ │
│ │ │Est│ │ACV│ │Sup│ │EV │ │SOW│ │War│            │ │
│ │ │ ✅ │ │   │ │   │ │ ✅ │ │   │ │   │            │ │
│ │ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘            │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ Insurance Info    │ Location                    │ │
│ │ Company: [+Add]   │ Address: 123 Main St        │ │
│ │ Claim #: [+Add]   │         Chicago, IL 🗺️     │ │
│ │                   │                             │ │
│ │ Important Dates   │                             │ │
│ │ Created: Dec 15   │                             │ │
│ │ Last Change: Dec 20                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Show 20 ▼] of 156 leads    Page 1 of 8  [‹‹][‹][›][››] │
└─────────────────────────────────────────────────────┘
```

## Key Refinements - UPDATED:

### **Compact Row Changes:**

#### **1. Avatar Only (No Salesperson Name)**
- **Smaller avatars**: 32px (8x8) instead of 40px (10x10)
- **Initials only**: "JS", "SA", "RD" for assigned salespersons
- **Default icon**: User circle for unassigned leads
- **No subtitle**: Salesperson name completely removed

#### **2. Full Name Display**
- **No truncation**: Complete lead names always shown
- **Responsive text**: Names wrap to multiple lines if needed
- **Clear hierarchy**: Name is the primary information

#### **3. Icon-Only Actions**
- **Three-dot menu**: Just `⋮` icon, no "Actions" text
- **Compact button**: 32px (8x8) ghost button
- **Screen reader**: "Actions" label in sr-only span
- **Hover state**: Light gray background on hover

#### **4. Better Status Badge Fit**
- **Tighter padding**: px-2 py-1 instead of px-3 py-1
- **Smaller line height**: leading-3 instead of leading-4
- **No wrap**: whitespace-nowrap ensures single line
- **Right alignment**: Keeps badges aligned consistently

### **Layout Improvements:**

```
┌─────────────────────────────────────────────────────┐
│ [Avatar] Full Lead Name Here        [Status] [⋮][▼] │
│                                                     │
│ [JS] → John Smith (assigned to Josh)                │
│ [SA] → Sarah Anderson (assigned to Sally)           │
│ [👤] → Mark Williams (unassigned)                   │
└─────────────────────────────────────────────────────┘
```

### **Space Optimization:**
- **Reduced spacing**: space-x-1 between action buttons
- **Smaller avatars**: More room for names and status
- **Cleaner design**: Less visual clutter
- **Better accessibility**: Larger touch targets where needed

### **Mobile Benefits:**
- **More content visible**: Full names without truncation
- **Cleaner interface**: Less text, more visual cues
- **Faster scanning**: Avatar colors indicate assignment status
- **Touch-friendly**: All interactive elements properly sized

This refined design maximizes information density while maintaining excellent mobile usability and visual clarity. 