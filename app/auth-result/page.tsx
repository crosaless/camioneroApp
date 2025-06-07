"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export default function AuthResultPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const type = searchParams.get("type")
    const provider = searchParams.get("provider")
    const token = searchParams.get("token")
    const error = searchParams.get("error")

    if (window.opener) {
      // Enviar mensaje a la ventana padre
      window.opener.postMessage(
        {
          type,
          provider,
          token,
          error,
        },
        window.location.origin,
      )
      window.close()
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Procesando autenticación...</h1>
        <p className="text-gray-600">Esta ventana se cerrará automáticamente.</p>
      </div>
    </div>
  )
}
