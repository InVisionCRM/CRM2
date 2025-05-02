"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { mockQuickLinks } from "@/lib/mock-quick-links"
import type { LinkCategoryInfo, LinkCategory } from "@/types/quick-links"
import { LinkCategoryCard } from "@/components/quick-links/link-category-card"
import { LinkCard } from "@/components/quick-links/link-card"
import { ArrowLeft, Building2, FileWarning, HardHat, Search, ShieldCheck, Truck, Wrench, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const categories: LinkCategoryInfo[] = [
  {
    id: "permits",
    name: "Permits & Building",
    description: "Building permits for Macomb and Oakland counties",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    id: "safety",
    name: "Safety & OSHA",
    description: "Safety guidelines and OSHA regulations",
    icon: <HardHat className="h-4 w-4" />,
  },
  {
    id: "suppliers",
    name: "Suppliers",
    description: "Roofing material suppliers and distributors",
    icon: <Truck className="h-4 w-4" />,
  },
  {
    id: "insurance",
    name: "Insurance",
    description: "Insurance requirements and providers",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    id: "utilities",
    name: "Utilities",
    description: "Local utility companies and services",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: "government",
    name: "Government",
    description: "Government resources and regulations",
    icon: <FileWarning className="h-4 w-4" />,
  },
  {
    id: "tools",
    name: "Tools & Resources",
    description: "Calculators and helpful resources",
    icon: <Wrench className="h-4 w-4" />,
  },
]

export default function QuickLinksPage() {
  const [activeCategory, setActiveCategory] = useState<LinkCategory>("permits")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredLinks = useMemo(() => {
    return mockQuickLinks.filter((link) => {
      const matchesSearch =
        searchQuery === "" ||
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (link.description && link.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = searchQuery === "" ? link.category === activeCategory : true

      return matchesSearch && (searchQuery !== "" || matchesCategory)
    })
  }, [searchQuery, activeCategory])

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Dashboard</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Quick Links</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for links..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {searchQuery === "" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {categories.map((category) => (
            <LinkCategoryCard
              key={category.id}
              category={category}
              isActive={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            />
          ))}
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-medium">
          {searchQuery
            ? `Search Results (${filteredLinks.length})`
            : categories.find((c) => c.id === activeCategory)?.name}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLinks.map((link) => (
          <LinkCard key={link.id} link={link} />
        ))}

        {filteredLinks.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-muted-foreground">No links found. Try adjusting your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
