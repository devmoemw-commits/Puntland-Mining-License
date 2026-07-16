"use client"

import { useEffect, useState } from "react"

export type SampleSignatory = {
  roleCode: string
  name: string
  title: string
  signatureUrl: string | null
  contact: {
    tel: string
    email: string
    website: string
  }
}

/** Empty placeholder while the configured signatory loads — all real values come from settings. */
const FALLBACK: SampleSignatory = {
  roleCode: "",
  name: "",
  title: "",
  signatureUrl: null,
  contact: {
    tel: "",
    email: "",
    website: "",
  },
}

/** The configured signatory for sample analysis letters (see Settings > System Settings). */
export function useSampleSignatory(): SampleSignatory {
  const [signatory, setSignatory] = useState<SampleSignatory>(FALLBACK)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch("/api/sample-signatory")
        if (!res.ok) throw new Error("Failed to load signatory")
        const data: Partial<SampleSignatory> = await res.json()
        if (active) {
          setSignatory({
            ...FALLBACK,
            ...data,
            contact: { ...FALLBACK.contact, ...(data.contact ?? {}) },
          })
        }
      } catch (error) {
        console.error("Failed to fetch sample signatory:", error)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return signatory
}
