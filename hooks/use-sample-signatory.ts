"use client"

import { useEffect, useState } from "react"

export type SampleSignatory = {
  roleCode: string
  name: string
  title: string
  signatureUrl: string | null
}

/** Fallback shown until the configured signatory loads (matches historic letter text). */
const FALLBACK: SampleSignatory = {
  roleCode: "GENERAL_DIRECTOR",
  name: "Eng. Ismail Mohamed Hassan",
  title: "Director General of the Ministry of Energy, Minerals & Water",
  signatureUrl: null,
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
        const data: SampleSignatory = await res.json()
        if (active) setSignatory(data)
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
