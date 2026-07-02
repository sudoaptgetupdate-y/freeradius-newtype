import { useState, useCallback } from "react"
import api from "@/lib/api"
import type { VoucherBatch } from "@/types/voucher"

export function useVouchers() {
  const [batches, setBatches] = useState<VoucherBatch[]>([])
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all")

  const fetchBatches = useCallback(async () => {
    try {
      const response = await api.get("/vouchers")
      setBatches(response.data)
    } catch (error) {
      console.error("Failed to fetch voucher batches:", error)
    }
  }, [])

  const filteredBatches = batches.filter(batch => {
    const matchesTenant = selectedTenantFilter === "all" || batch.tenantId === selectedTenantFilter;
    return matchesTenant;
  })

  return {
    batches,
    filteredBatches,
    selectedTenantFilter,
    setSelectedTenantFilter,
    fetchBatches
  }
}
