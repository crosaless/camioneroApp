"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"

interface RegistroFormProps {
  tipo: string
  registroInicial?: any
  onGuardar: (datos: any) => void
  onCancelar: () => void
}

export function RegistroForm({ tipo, registroInicial, onGuardar, onCancelar }: RegistroFormProps) {
  const [datos, setDatos] = useState<any>(registroInicial || {})

  const monedas = [
    { codigo: "ARS", nombre: "Pesos Argentinos", simbolo: "$" },
    { codigo: "USD", nombre: "Dólares", simbolo: "US$" },
    { codigo: "CLP", nombre: "Pesos Chilenos", simbolo: "CLP$" },
  ]

  useEffect(() => {
    if (registroInicial) {
      setDatos(registroInicial)
    }
  }, [registroInicial])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGuardar(datos)
  }

  const actualizarDato = (campo: string, valor: string) => {
    setDatos({ ...datos, [campo]: valor })
  }

  const obtenerTitulo = () => {
    const titulos: { [key: string]: string } = {
      descripcion: "Descripción General",
      "origen-destino": "Origen y Destino",
      kilometros: "Kilómetros Recorridos",
      rendicion: "Rendición Esperada",
      parada: "Parada Intermedia",
      combustible: "Carga de Combustible",
      gasto: "Gasto Varios",
    }
    const titulo = titulos[tipo] || "Nuevo Registro"
    return registroInicial ? `Editar ${titulo}` : titulo
  }

  const requiereMoneda = ["rendicion", "combustible", "gasto"].includes(tipo)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onCancelar}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">{obtenerTitulo()}</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {tipo === "descripcion" && (
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Escribe una descripción del viaje..."
                    className="min-h-24"
                    value={datos.descripcion || ""}
                    onChange={(e) => actualizarDato("descripcion", e.target.value)}
                    required
                  />
                </div>
              )}

              {tipo === "origen-destino" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="origen">Origen</Label>
                    <Input
                      id="origen"
                      placeholder="Ciudad o lugar de origen"
                      className="h-12"
                      value={datos.origen || ""}
                      onChange={(e) => actualizarDato("origen", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destino">Destino</Label>
                    <Input
                      id="destino"
                      placeholder="Ciudad o lugar de destino"
                      className="h-12"
                      value={datos.destino || ""}
                      onChange={(e) => actualizarDato("destino", e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {tipo === "kilometros" && (
                <div className="space-y-2">
                  <Label htmlFor="kilometros">Kilómetros Recorridos</Label>
                  <Input
                    id="kilometros"
                    type="number"
                    placeholder="0"
                    className="h-12"
                    value={datos.kilometros || ""}
                    onChange={(e) => actualizarDato("kilometros", e.target.value)}
                    required
                  />
                </div>
              )}

              {tipo === "rendicion" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="moneda">Moneda</Label>
                    <Select value={datos.moneda || "ARS"} onValueChange={(value) => actualizarDato("moneda", value)}>
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
                  <div className="space-y-2">
                    <Label htmlFor="monto">Monto Esperado</Label>
                    <Input
                      id="monto"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="h-12"
                      value={datos.monto || ""}
                      onChange={(e) => actualizarDato("monto", e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {tipo === "parada" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="lugar">Lugar de la Parada</Label>
                    <Input
                      id="lugar"
                      placeholder="Nombre del lugar"
                      className="h-12"
                      value={datos.lugar || ""}
                      onChange={(e) => actualizarDato("lugar", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo de la Parada</Label>
                    <Input
                      id="motivo"
                      placeholder="Descanso, comida, etc."
                      className="h-12"
                      value={datos.motivo || ""}
                      onChange={(e) => actualizarDato("motivo", e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {tipo === "combustible" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="moneda">Moneda</Label>
                    <Select value={datos.moneda || "ARS"} onValueChange={(value) => actualizarDato("moneda", value)}>
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
                  <div className="space-y-2">
                    <Label htmlFor="litros">Litros Cargados</Label>
                    <Input
                      id="litros"
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      className="h-12"
                      value={datos.litros || ""}
                      onChange={(e) => actualizarDato("litros", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costo">Costo Total</Label>
                    <Input
                      id="costo"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="h-12"
                      value={datos.costo || ""}
                      onChange={(e) => actualizarDato("costo", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lugar">Lugar de Carga</Label>
                    <Input
                      id="lugar"
                      placeholder="Estación de servicio"
                      className="h-12"
                      value={datos.lugar || ""}
                      onChange={(e) => actualizarDato("lugar", e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {tipo === "gasto" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="moneda">Moneda</Label>
                    <Select value={datos.moneda || "ARS"} onValueChange={(value) => actualizarDato("moneda", value)}>
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
                  <div className="space-y-2">
                    <Label htmlFor="concepto">Concepto del Gasto</Label>
                    <Input
                      id="concepto"
                      placeholder="Comida, peaje, reparación, etc."
                      className="h-12"
                      value={datos.concepto || ""}
                      onChange={(e) => actualizarDato("concepto", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monto">Monto</Label>
                    <Input
                      id="monto"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="h-12"
                      value={datos.monto || ""}
                      onChange={(e) => actualizarDato("monto", e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1 h-12" onClick={onCancelar}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 h-12">
                  <Save className="w-5 h-5 mr-2" />
                  {registroInicial ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
