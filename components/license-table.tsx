"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Search } from "lucide-react"
import config from "@/lib/config/config"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { getStatusColorClass, getStatusDisplayText } from "@/types/license-schema"

interface License {
  id: string
  full_name: string
  company_name: string
  mobile_number: string
  license_category: string
  status: "PENDING" | "REVIEW" | "APPROVED" | "REJECTED"
  created_at: string
}

export default function LicenseTable() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("Newest")
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    async function fetchLicenses() {
      try {
        const res = await fetch(`${config.env.apiEndpoint}/api/licenses`, {
          cache: "no-cache",
        })
        const data = await res.json()
        setLicenses(data)
      } catch (error) {
        console.error("Failed to fetch licenses", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLicenses()
  }, [])

  const filteredLicenses = licenses
    .filter(
      (license) =>
        license.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        license.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        license.license_category.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "Newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === "Oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === "Company") {
        return a.company_name.localeCompare(b.company_name)
      } else if (sortBy === "License Type") {
        return a.license_category.localeCompare(b.license_category)
      }
      return 0
    })

  // Get only the latest 5 licenses if not showing all and not searching
  const displayedLicenses = !showAll && searchQuery === "" ? filteredLicenses.slice(0, 5) : filteredLicenses

  return (
    <div className="w-full my-5 rounded-md border p-5">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200">
          {!showAll && searchQuery === "" ? "Latest Licenses" : `Licenses (${filteredLicenses.length})`}
        </h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search"
              className="pl-10 w-[240px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "outline", className: "w-[140px] justify-between" })}>
              Sort by: {sortBy}
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("Newest")}>Newest</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("Oldest")}>Oldest</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("Company")}>Company</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("License Type")}>License Type</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading licenses...</div>
      ) : (
        <>
          <Table>
            <TableHeader className="bg-primary">
              <TableRow>
                <TableHead className="w-[120px] text-indigo-50 font-medium rounded-l-md">Name</TableHead>
                <TableHead className="text-indigo-50 font-medium">Company</TableHead>
                <TableHead className="text-indigo-50 font-medium">Phone Number</TableHead>
                <TableHead className="text-indigo-50 font-medium">License Type</TableHead>
                <TableHead className="text-indigo-50 font-medium">Status</TableHead>
                <TableHead className="text-indigo-50 font-medium">Issue Date</TableHead>
                <TableHead className="text-right text-indigo-50 font-medium rounded-r-md">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedLicenses.map((license) => (
                <TableRow key={license.id} className="capitalize">
                  <TableCell className="font-medium">{license.full_name}</TableCell>
                  <TableCell>{license.company_name}</TableCell>
                  <TableCell>{license.mobile_number}</TableCell>
                  <TableCell>{license.license_category}</TableCell>
                  <TableCell className={`py-4 rounded-full w-fit flex items-center p-0 px-2 my-4 ${getStatusColorClass(license.status)}`}>
                    {getStatusDisplayText(license.status)}
                  </TableCell>
                  <TableCell>{formatDate(license.created_at)}</TableCell>
                  <TableCell className="text-right py-4">
                    <Link href={`/licenses/${license.id}`}
                      className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 border-0 px-4 py-2 rounded-md my-2"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!showAll && searchQuery === "" && filteredLicenses.length > 5 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAll(true)}
                className="text-indigo-600 hover:text-indigo-700"
              >
                View All Licenses
              </Button>
            </div>
          )}

          {showAll && searchQuery === "" && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAll(false)}
                className="text-indigo-600 hover:text-indigo-700"
              >
                Show Only Latest 5
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
