"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Truck, Calendar, MapPin } from "lucide-react"

interface Viaje {
  id: string
  fechaInicio: string
  viaticos?: any[]
  finalizado: boolean
  registros: any[]
}

export default function HomePage() {
  const [viajes, setViajes] = useState<Viaje[]>([])

  useEffect(() => {
    const viajesGuardados = localStorage.getItem("viajes")
    if (viajesGuardados) {
      setViajes(JSON.parse(viajesGuardados))
    }
  }, [])

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const obtenerUltimoDestino = (viaje: Viaje) => {
    const registroDestino = viaje.registros.filter((r) => r.tipo === "origen-destino").pop()
    return registroDestino?.destino || "Sin destino"
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Truck className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Mis Viajes</h1>
          </div>
        </div>

        <Link href="/nuevo-viaje">
          <Button className="w-full mb-6 h-14 text-lg" size="lg">
            <Plus className="w-6 h-6 mr-2" />
            Nuevo Viaje
          </Button>
        </Link>

        <div className="space-y-4">
          {viajes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tienes viajes registrados</p>
                <p className="text-sm text-gray-400 mt-2">Crea tu primer viaje para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            viajes.map((viaje) => (
              <Link key={viaje.id} href={`/viaje/${viaje.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Viaje #{viaje.id.slice(-4)}</CardTitle>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          viaje.finalizado ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {viaje.finalizado ? "Finalizado" : "En curso"}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatearFecha(viaje.fechaInicio)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {obtenerUltimoDestino(viaje)}
                      </div>
                      <div className="text-sm text-gray-500">{viaje.registros.length} registros</div>
                      {viaje.viaticos && viaje.viaticos.length > 0 && (
                        <div className="text-sm text-gray-500">
                          Viáticos:{" "}
                          {viaje.viaticos
                            .map((v, i) => {
                              const monedaInfo = [
                                { codigo: "ARS", simbolo: "$" },
                                { codigo: "USD", simbolo: "US$" },
                                { codigo: "CLP", simbolo: "CLP$" },
                              ].find((m) => m.codigo === v.moneda)
                              return `${monedaInfo?.simbolo || "$"}${v.monto.toFixed(2)}`
                            })
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
