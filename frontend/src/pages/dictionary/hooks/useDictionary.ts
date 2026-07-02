import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export type DictionaryAttribute = {
  id: number
  tenantId: string | null
  vendor: string
  attribute: string
  recommendedOp: string
  recommendedType: string
  description: string
}

export function useDictionary() {
  const { user } = useAuth()
  const MySwal = withReactContent(Swal)
  const [attributes, setAttributes] = useState<DictionaryAttribute[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    vendor: "Generic",
    attribute: "",
    recommendedOp: "=",
    recommendedType: "reply",
    description: ""
  })

  const fetchDictionary = async () => {
    try {
      const response = await api.get("/dictionary")
      setAttributes(response.data)
    } catch (error) {
      console.error("Failed to fetch dictionary:", error)
    }
  }

  useEffect(() => {
    fetchDictionary()
  }, [user])

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await api.post("/dictionary", formData)
      setIsDialogOpen(false)
      setFormData({ vendor: "Generic", attribute: "", recommendedOp: "=", recommendedType: "reply", description: "" })
      toast.success("Attribute added successfully!")
      fetchDictionary()
    } catch (error: any) {
      console.error("Failed to create attribute:", error)
      toast.error(error.response?.data?.error || "Failed to create attribute")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAttribute = async (id: number) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete this attribute from the dictionary?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/dictionary?id=${id}`)
        toast.success("Attribute deleted successfully!")
        fetchDictionary()
      } catch (error: any) {
        console.error("Failed to delete attribute:", error)
        toast.error(error.response?.data?.error || "Failed to delete attribute")
      }
    }
  }

  return {
    user,
    attributes,
    isDialogOpen,
    setIsDialogOpen,
    isLoading,
    formData,
    setFormData,
    handleCreateAttribute,
    handleDeleteAttribute
  }
}
