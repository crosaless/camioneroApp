"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Truck, Calendar, MapPin, Archive, ArchiveRestore, Eye, Trash2 } from "lucide-react"

interface Viaje {
  id: string
  fechaInicio: string
  viaticos?: any[]
  finalizado: boolean
  registros: any[]
  archivado?: boolean
}

export default function HomePage() {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [mostrarArchivados, setMostrarArchivados] = useState(false)

  useEffect(() => {
    // Cargar viajes solo una vez al montar el componente
    const viajesGuardados = localStorage.getItem("viajes")
    if (viajesGuardados) {
      try {
        const viajesParsed = JSON.parse(viajesGuardados)
        setViajes(viajesParsed)
      } catch (error) {
        console.error("Error parsing viajes:", error)
        setViajes([])
      }
    }
  }, []) // Array de dependencias vacío para que solo se ejecute una vez

  const formatearFecha = (fecha: string) => {
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const obtenerUltimoDestino = (viaje: Viaje) => {
    const registroDestino = viaje.registros.filter((r) => r.tipo === "origen-destino").pop()
    return registroDestino?.datos?.destino || "Sin destino"
  }

  const archivarViaje = (viajeId: string) => {
    const viajesActualizados = viajes.map((viaje) => (viaje.id === viajeId ? { ...viaje, archivado: true } : viaje))
    setViajes(viajesActualizados)
    localStorage.setItem("viajes", JSON.stringify(viajesActualizados))
  }

  const desarchivarViaje = (viajeId: string) => {
    const viajesActualizados = viajes.map((viaje) => (viaje.id === viajeId ? { ...viaje, archivado: false } : viaje))
    setViajes(viajesActualizados)
    localStorage.setItem("viajes", JSON.stringify(viajesActualizados))
  }

  const eliminarViajeArchivado = (viajeId: string) => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar permanentemente este viaje? Esta acción no se puede deshacer.",
      )
    ) {
      const viajesActualizados = viajes.filter((viaje) => viaje.id !== viajeId)
      setViajes(viajesActualizados)
      localStorage.setItem("viajes", JSON.stringify(viajesActualizados))
    }
  }

  const viajesActivos = viajes.filter((viaje) => !viaje.archivado)
  const viajesArchivados = viajes.filter((viaje) => viaje.archivado)
  const viajesAMostrar = mostrarArchivados ? viajesArchivados : viajesActivos

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Truck className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Mis Viajes</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarArchivados(!mostrarArchivados)}
            className="flex items-center gap-1"
          >
            {mostrarArchivados ? (
              <>
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Activos</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span className="hidden sm:inline">Archivados</span>
              </>
            )}
          </Button>
        </div>

        {!mostrarArchivados && (
          <Link href="/nuevo-viaje">
            <Button className="w-full mb-6 h-14 text-lg" size="lg">
              <Plus className="w-6 h-6 mr-2" />
              Nuevo Viaje
            </Button>
          </Link>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{mostrarArchivados ? "Viajes Archivados" : "Viajes Activos"}</h2>
          <span className="text-sm text-gray-500">
            {viajesAMostrar.length} {viajesAMostrar.length === 1 ? "viaje" : "viajes"}
          </span>
        </div>

        <div className="space-y-4">
          {viajesAMostrar.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                {mostrarArchivados ? (
                  <>
                    <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tienes viajes archivados</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Los viajes finalizados aparecerán aquí cuando los archives
                    </p>
                  </>
                ) : (
                  <>
                    <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tienes viajes activos</p>
                    <p className="text-sm text-gray-400 mt-2">Crea tu primer viaje para comenzar</p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            viajesAMostrar.map((viaje) => (
              <Card key={viaje.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/viaje/${viaje.id}`} className="flex-1">
                      <CardTitle className="text-lg">Viaje #{viaje.id.slice(-4)}</CardTitle>
                    </Link>
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          viaje.finalizado ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {viaje.finalizado ? "Finalizado" : "En curso"}
                      </div>
                      {viaje.finalizado && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              if (mostrarArchivados) {
                                desarchivarViaje(viaje.id)
                              } else {
                                archivarViaje(viaje.id)
                              }
                            }}
                          >
                            {mostrarArchivados ? (
                              <ArchiveRestore className="w-4 h-4" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
                          </Button>
                          {mostrarArchivados && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                eliminarViajeArchivado(viaje.id)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <Link href={`/viaje/${viaje.id}`}>
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
                          Adelantos:{" "}
                          {viaje.viaticos
                            .map((v) => {
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
                </Link>
              </Card>
            ))
          )}
        </div>

        {/* Información sobre archivado */}
        {!mostrarArchivados && viajesArchivados.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📁 Viajes Archivados</h3>
            <p className="text-sm text-blue-800">
              Tienes {viajesArchivados.length} {viajesArchivados.length === 1 ? "viaje archivado" : "viajes archivados"}
              . Usa el botón de archivo para verlos.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
