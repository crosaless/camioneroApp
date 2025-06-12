"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface Viatico {
  moneda: string
  monto: number
}

export default function NuevoViajePage() {
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split("T")[0])
  const [viaticos, setViaticos] = useState<Viatico[]>([{ moneda: "ARS", monto: 0 }])
  const router = useRouter()

  const monedas = [
    { codigo: "ARS", nombre: "Pesos Argentinos", simbolo: "$" },
    { codigo: "USD", nombre: "Dólares", simbolo: "US$" },
    { codigo: "CLP", nombre: "Pesos Chilenos", simbolo: "CLP$" },
  ]

  const agregarViatico = () => {
    setViaticos([...viaticos, { moneda: "ARS", monto: 0 }])
  }

  const eliminarViatico = (index: number) => {
    if (viaticos.length > 1) {
      setViaticos(viaticos.filter((_, i) => i !== index))
    }
  }

  const actualizarViatico = (index: number, campo: keyof Viatico, valor: any) => {
    const nuevosViaticos = [...viaticos]
    nuevosViaticos[index] = { ...nuevosViaticos[index], [campo]: valor }
    setViaticos(nuevosViaticos)
  }

  const crearViaje = () => {
    const viaticosValidos = viaticos.filter((v) => v.monto > 0)

    const nuevoViaje = {
      id: Date.now().toString(),
      fechaInicio: fechaInicio, // Ya está en formato correcto YYYY-MM-DD
      viaticos: viaticosValidos,
      finalizado: false,
      registros: [],
      archivado: false,
    }

    const viajesExistentes = JSON.parse(localStorage.getItem("viajes") || "[]")

    // Verificar que no exista ya un viaje con el mismo ID
    const viajeExiste = viajesExistentes.find((v: any) => v.id === nuevoViaje.id)
    if (viajeExiste) {
      // Si existe, generar un nuevo ID
      nuevoViaje.id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const viajesActualizados = [...viajesExistentes, nuevoViaje]
    localStorage.setItem("viajes", JSON.stringify(viajesActualizados))

    router.push(`/viaje/${nuevoViaje.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Viaje</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Información del Viaje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de Inicio</Label>
              <Input
                id="fecha"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Adelantos por Moneda</Label>
                <Button type="button" variant="outline" size="sm" onClick={agregarViatico}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>

              {viaticos.map((viatico, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Moneda</Label>
                    <Select value={viatico.moneda} onValueChange={(value) => actualizarViatico(index, "moneda", value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monedas.map((moneda) => (
                          <SelectItem key={moneda.codigo} value={moneda.codigo}>
                            {moneda.simbolo} {moneda.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Monto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={viatico.monto || ""}
                      onChange={(e) => actualizarViatico(index, "monto", Number.parseFloat(e.target.value) || 0)}
                      className="h-12"
                    />
                  </div>
                  {viaticos.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12"
                      onClick={() => eliminarViatico(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={crearViaje} className="w-full h-14 text-lg mt-6" size="lg">
              Crear Viaje
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
