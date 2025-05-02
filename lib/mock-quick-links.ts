import type { QuickLink } from "@/types/quick-links"

export const mockQuickLinks: QuickLink[] = [
  // Permits - Macomb County
  {
    id: "permit-macomb-1",
    title: "Macomb County Building Department",
    url: "https://www.macombgov.org/departments/planning-economic-development/building",
    description: "Building permits and inspections for Macomb County",
    category: "permits",
    featured: true,
  },
  {
    id: "permit-macomb-2",
    title: "Clinton Township Permits",
    url: "https://www.clintontownship.com/building-department.html",
    description: "Building permits for Clinton Township",
    category: "permits",
  },
  {
    id: "permit-macomb-3",
    title: "Sterling Heights Building",
    url: "https://www.sterling-heights.net/224/Building",
    description: "Building department for Sterling Heights",
    category: "permits",
  },

  // Permits - Oakland County
  {
    id: "permit-oakland-1",
    title: "Oakland County Building Department",
    url: "https://www.oakgov.com/advantageoakland/residents/Pages/permits.aspx",
    description: "Building permits and inspections for Oakland County",
    category: "permits",
    featured: true,
  },
  {
    id: "permit-oakland-2",
    title: "Troy Building Department",
    url: "https://www.troymi.gov/departments/building/index.php",
    description: "Building permits for Troy",
    category: "permits",
  },
  {
    id: "permit-oakland-3",
    title: "Royal Oak Building",
    url: "https://www.romi.gov/272/Building-Department",
    description: "Building department for Royal Oak",
    category: "permits",
  },

  // Safety & OSHA
  {
    id: "safety-1",
    title: "OSHA Guidelines",
    url: "https://www.osha.gov/roofing",
    description: "Official OSHA guidelines for roofing contractors",
    category: "safety",
    featured: true,
  },
  {
    id: "safety-2",
    title: "Fall Protection Standards",
    url: "https://www.osha.gov/fall-protection",
    description: "OSHA standards for fall protection in construction",
    category: "safety",
  },
  {
    id: "safety-3",
    title: "Heat Illness Prevention",
    url: "https://www.osha.gov/heat-exposure",
    description: "Guidelines for preventing heat-related illnesses",
    category: "safety",
  },

  // Suppliers
  {
    id: "supplier-1",
    title: "ABC Supply Co.",
    url: "https://www.abcsupply.com/",
    description: "Roofing, siding, and windows supplier",
    category: "suppliers",
    featured: true,
  },
  {
    id: "supplier-2",
    title: "Beacon Building Products",
    url: "https://www.becn.com/",
    description: "Roofing and building products supplier",
    category: "suppliers",
  },
  {
    id: "supplier-3",
    title: "SRS Distribution",
    url: "https://www.srsdistribution.com/",
    description: "Residential and commercial roofing products",
    category: "suppliers",
  },

  // Insurance
  {
    id: "insurance-1",
    title: "Michigan Workers' Compensation Agency",
    url: "https://www.michigan.gov/leo/bureaus-agencies/wca",
    description: "Workers' compensation information for Michigan",
    category: "insurance",
  },
  {
    id: "insurance-2",
    title: "Liability Insurance Requirements",
    url: "https://www.michigan.gov/lara/bureau-list/bcc/divisions/licensing/contractors",
    description: "Contractor insurance requirements in Michigan",
    category: "insurance",
  },

  // Utilities
  {
    id: "utility-1",
    title: "DTE Energy",
    url: "https://www.dteenergy.com/",
    description: "Electrical utility for Southeast Michigan",
    category: "utilities",
  },
  {
    id: "utility-2",
    title: "Consumers Energy",
    url: "https://www.consumersenergy.com/",
    description: "Natural gas and electricity provider",
    category: "utilities",
  },

  // Government Resources
  {
    id: "gov-1",
    title: "Michigan Department of Licensing",
    url: "https://www.michigan.gov/lara/bureau-list/bcc",
    description: "Contractor licensing information",
    category: "government",
    featured: true,
  },
  {
    id: "gov-2",
    title: "Michigan Building Codes",
    url: "https://www.michigan.gov/lara/bureau-list/bcc/divisions/code-rules",
    description: "Current building codes for Michigan",
    category: "government",
  },

  // Tools & Calculators
  {
    id: "tool-1",
    title: "Roofing Calculator",
    url: "https://www.calculator.net/roofing-calculator.html",
    description: "Calculate roofing materials needed",
    category: "tools",
  },
  {
    id: "tool-2",
    title: "Weather Forecast",
    url: "https://weather.gov",
    description: "National Weather Service forecasts",
    category: "tools",
  },
]
