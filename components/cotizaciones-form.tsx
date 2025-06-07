"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, DollarSign } from "lucide-react"

interface Cotizacion {
  moneda: string
  valor: number
}

interface CotizacionesFormProps {
  cotizaciones: Cotizacion[]
  onGuardar: (cotizaciones: Cotizacion[]) => void
  onCancelar: () => void
}

export function CotizacionesForm({ cotizaciones, onGuardar, onCancelar }: CotizacionesFormProps) {
  const [cotizacionesState, setCotizacionesState] = useState<Cotizacion[]>(cotizaciones)

  const monedas = [
    { codigo: "USD", nombre: "Dólares", simbolo: "US$" },
    { codigo: "CLP", nombre: "Pesos Chilenos", simbolo: "CLP$" },
  ]

  const actualizarCotizacion = (moneda: string, valor: number) => {
    const nuevasCotizaciones = cotizacionesState.map((c) => (c.moneda === moneda ? { ...c, valor } : c))
    setCotizacionesState(nuevasCotizaciones)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGuardar(cotizacionesState)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onCancelar}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Cotizaciones</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Configurar Cotizaciones
            </CardTitle>
            <p className="text-sm text-gray-600">
              Ingresa cuántos pesos argentinos equivale cada unidad de moneda extranjera
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {monedas.map((moneda) => {
                const cotizacion = cotizacionesState.find((c) => c.moneda === moneda.codigo)
                return (
                  <div key={moneda.codigo} className="space-y-2">
                    <Label htmlFor={moneda.codigo}>1 {moneda.simbolo} = ? Pesos Argentinos</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{moneda.simbolo} 1 =</span>
                      <Input
                        id={moneda.codigo}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-12 flex-1"
                        value={cotizacion?.valor || ""}
                        onChange={(e) => actualizarCotizacion(moneda.codigo, Number.parseFloat(e.target.value) || 0)}
                        required
                      />
                      <span className="text-lg">$ ARS</span>
                    </div>
                    <p className="text-xs text-gray-500">Ejemplo: Si 1 {moneda.simbolo} = $1000 ARS, ingresa 1000</p>
                  </div>
                )
              })}

              <div className="bg-blue-50 p-3 rounded-lg mt-4">
                <h4 className="font-semibold text-sm mb-2">💡 Ejemplos de uso:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Si el dólar está a $1000, ingresa 1000 para USD</li>
                  <li>• Si 1000 pesos chilenos = $1200 ARS, ingresa 1.2 para CLP</li>
                  <li>• Las cotizaciones se usan para convertir todo a pesos argentinos</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1 h-12" onClick={onCancelar}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 h-12">
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Cotizaciones
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
