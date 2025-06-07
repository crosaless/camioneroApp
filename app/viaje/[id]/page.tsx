"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ArrowLeft,
  FileText,
  MapPin,
  Gauge,
  DollarSign,
  Navigation,
  Fuel,
  CheckCircle,
  Clock,
  Calculator,
  Download,
  Edit,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react"
import { RegistroForm } from "@/components/registro-form"
import { CotizacionesForm } from "@/components/cotizaciones-form"
import { generarPDF } from "@/lib/pdf-generator"

interface Registro {
  id: string
  tipo: string
  fecha: string
  hora: string
  datos: any
}

interface Viatico {
  moneda: string
  monto: number
}

interface Cotizacion {
  moneda: string
  valor: number
}

interface Viaje {
  id: string
  fechaInicio: string
  finalizado: boolean
  registros: Registro[]
  viaticos: Viatico[]
  cotizaciones?: Cotizacion[]
}

export default function DetalleViajePage() {
  const params = useParams()
  const router = useRouter()
  const [viaje, setViaje] = useState<Viaje | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarCotizaciones, setMostrarCotizaciones] = useState(false)
  const [tipoRegistro, setTipoRegistro] = useState("")
  const [registroEditando, setRegistroEditando] = useState<Registro | null>(null)
  const [gastosExpandidos, setGastosExpandidos] = useState<{ [moneda: string]: boolean }>({})

  const monedas = [
    { codigo: "ARS", nombre: "Pesos Argentinos", simbolo: "$" },
    { codigo: "USD", nombre: "Dólares", simbolo: "US$" },
    { codigo: "CLP", nombre: "Pesos Chilenos", simbolo: "CLP$" },
  ]

  useEffect(() => {
    const viajes = JSON.parse(localStorage.getItem("viajes") || "[]")
    const viajeEncontrado = viajes.find((v: Viaje) => v.id === params.id)
    if (viajeEncontrado) {
      // Migrar viajes antiguos
      if (typeof viajeEncontrado.viaticos === "number") {
        viajeEncontrado.viaticos = [{ moneda: "ARS", monto: viajeEncontrado.viaticos }]
      } else if (!viajeEncontrado.viaticos) {
        viajeEncontrado.viaticos = []
      }
      if (!viajeEncontrado.cotizaciones) {
        viajeEncontrado.cotizaciones = [
          { moneda: "USD", valor: 1000 },
          { moneda: "CLP", valor: 1.2 },
        ]
      }
      setViaje(viajeEncontrado)
    }
  }, [params.id])

  const guardarViaje = (viajeActualizado: Viaje) => {
    const viajes = JSON.parse(localStorage.getItem("viajes") || "[]")
    const viajesActualizados = viajes.map((v: Viaje) => (v.id === viaje?.id ? viajeActualizado : v))
    localStorage.setItem("viajes", JSON.stringify(viajesActualizados))
    setViaje(viajeActualizado)
  }

  const agregarRegistro = (datosRegistro: any) => {
    if (!viaje) return

    if (registroEditando) {
      // Editar registro existente
      const registroActualizado = {
        ...registroEditando,
        datos: datosRegistro,
      }

      const viajeActualizado = {
        ...viaje,
        registros: viaje.registros.map((r) => (r.id === registroEditando.id ? registroActualizado : r)),
      }

      guardarViaje(viajeActualizado)
      setRegistroEditando(null)
    } else {
      // Crear nuevo registro
      const nuevoRegistro: Registro = {
        id: Date.now().toString(),
        tipo: tipoRegistro,
        fecha: new Date().toLocaleDateString("es-ES"),
        hora: new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        datos: datosRegistro,
      }

      const viajeActualizado = {
        ...viaje,
        registros: [...viaje.registros, nuevoRegistro],
      }

      guardarViaje(viajeActualizado)
    }

    setMostrarFormulario(false)
  }

  const editarRegistro = (registro: Registro) => {
    setRegistroEditando(registro)
    setTipoRegistro(registro.tipo)
    setMostrarFormulario(true)
  }

  const actualizarCotizaciones = (nuevasCotizaciones: Cotizacion[]) => {
    if (!viaje) return

    const viajeActualizado = {
      ...viaje,
      cotizaciones: nuevasCotizaciones,
    }

    guardarViaje(viajeActualizado)
    setMostrarCotizaciones(false)
  }

  const finalizarViaje = () => {
    if (!viaje) return

    const viajeActualizado = { ...viaje, finalizado: true }
    guardarViaje(viajeActualizado)
    router.push("/")
  }

  const tiposRegistro = [
    { tipo: "descripcion", nombre: "Descripción General", icono: FileText },
    { tipo: "origen-destino", nombre: "Origen y Destino", icono: MapPin },
    { tipo: "kilometros", nombre: "Kilómetros", icono: Gauge },
    { tipo: "rendicion", nombre: "Rendición", icono: DollarSign },
    { tipo: "parada", nombre: "Parada Intermedia", icono: Navigation },
    { tipo: "combustible", nombre: "Carga Combustible", icono: Fuel },
    { tipo: "gasto", nombre: "Gasto Varios", icono: DollarSign },
  ]

  const obtenerIconoTipo = (tipo: string) => {
    const tipoEncontrado = tiposRegistro.find((t) => t.tipo === tipo)
    return tipoEncontrado?.icono || FileText
  }

  const obtenerSimboloMoneda = (codigo: string) => {
    return monedas.find((m) => m.codigo === codigo)?.simbolo || "$"
  }

  const convertirAMonedaBase = (monto: number, moneda: string) => {
    if (moneda === "ARS") return monto
    const cotizacion = viaje?.cotizaciones?.find((c) => c.moneda === moneda)
    return cotizacion ? monto * cotizacion.valor : monto
  }

  const calcularTotalesPorMoneda = () => {
    const totales: { [moneda: string]: { viaticos: number; ingresos: number; gastos: number; diferencia: number } } = {}

    // Inicializar con viáticos
    viaje?.viaticos?.forEach((viatico) => {
      if (!totales[viatico.moneda]) {
        totales[viatico.moneda] = { viaticos: 0, ingresos: 0, gastos: 0, diferencia: 0 }
      }
      totales[viatico.moneda].viaticos += viatico.monto
    })

    // Calcular ingresos y gastos por moneda
    viaje?.registros.forEach((registro) => {
      const moneda = registro.datos.moneda || "ARS"

      if (!totales[moneda]) {
        totales[moneda] = { viaticos: 0, ingresos: 0, gastos: 0, diferencia: 0 }
      }

      if (registro.tipo === "rendicion") {
        totales[moneda].ingresos += Number.parseFloat(registro.datos.monto) || 0
      } else if (registro.tipo === "combustible" || registro.tipo === "gasto") {
        const monto =
          registro.tipo === "combustible"
            ? Number.parseFloat(registro.datos.costo) || 0
            : Number.parseFloat(registro.datos.monto) || 0
        totales[moneda].gastos += monto
      }
    })

    // Calcular diferencias
    Object.keys(totales).forEach((moneda) => {
      totales[moneda].diferencia = totales[moneda].viaticos + totales[moneda].ingresos - totales[moneda].gastos
    })

    return totales
  }

  const calcularTotalesConvertidos = () => {
    const totalesPorMoneda = calcularTotalesPorMoneda()
    let viaticosTotal = 0
    let ingresosTotal = 0
    let gastosTotal = 0

    Object.entries(totalesPorMoneda).forEach(([moneda, totales]) => {
      viaticosTotal += convertirAMonedaBase(totales.viaticos, moneda)
      ingresosTotal += convertirAMonedaBase(totales.ingresos, moneda)
      gastosTotal += convertirAMonedaBase(totales.gastos, moneda)
    })

    return {
      viaticos: viaticosTotal,
      ingresos: ingresosTotal,
      gastos: gastosTotal,
      diferencia: viaticosTotal + ingresosTotal - gastosTotal,
    }
  }

  const obtenerGastosPorMoneda = (moneda: string) => {
    return viaje?.registros.filter((r) => {
      const registroMoneda = r.datos.moneda || "ARS"
      return registroMoneda === moneda && (r.tipo === "combustible" || r.tipo === "gasto")
    })
  }

  const scrollToRegistro = (registroId: string) => {
    const elemento = document.getElementById(`registro-${registroId}`)
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "center" })
      elemento.classList.add("ring-2", "ring-blue-500", "ring-opacity-50")
      setTimeout(() => {
        elemento.classList.remove("ring-2", "ring-blue-500", "ring-opacity-50")
      }, 2000)
    }
  }

  const descargarPDF = () => {
    if (viaje) {
      generarPDF(viaje, calcularTotalesPorMoneda(), monedas)
    }
  }

  if (!viaje) {
    return <div className="p-4">Cargando...</div>
  }

  if (mostrarFormulario) {
    return (
      <RegistroForm
        tipo={tipoRegistro}
        registroInicial={registroEditando?.datos}
        onGuardar={agregarRegistro}
        onCancelar={() => {
          setMostrarFormulario(false)
          setRegistroEditando(null)
        }}
      />
    )
  }

  if (mostrarCotizaciones) {
    return (
      <CotizacionesForm
        cotizaciones={viaje.cotizaciones || []}
        onGuardar={actualizarCotizaciones}
        onCancelar={() => setMostrarCotizaciones(false)}
      />
    )
  }

  const totalesPorMoneda = calcularTotalesPorMoneda()
  const totalesConvertidos = calcularTotalesConvertidos()

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Viaje #{viaje.id.slice(-4)}</h1>
            <p className="text-sm text-gray-500">Iniciado: {new Date(viaje.fechaInicio).toLocaleDateString("es-ES")}</p>
          </div>
          <Badge variant={viaje.finalizado ? "default" : "secondary"} className="ml-auto">
            {viaje.finalizado ? "Finalizado" : "En curso"}
          </Badge>
        </div>

        {/* Resumen Financiero */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Resumen Financiero
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setMostrarCotizaciones(true)}>
                  <Settings className="w-4 h-4 mr-1" />
                  Cotizaciones
                </Button>
                <Button variant="outline" size="sm" onClick={descargarPDF}>
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Totales Convertidos */}
            <div className="bg-white p-3 rounded-lg border-2 border-green-200">
              <h4 className="font-semibold text-sm mb-2 text-green-800">💰 Total en Pesos Argentinos</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Viáticos totales:</span>
                  <span className="font-medium">${totalesConvertidos.viaticos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ingresos totales:</span>
                  <span className="font-medium text-green-600">+${totalesConvertidos.ingresos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos totales:</span>
                  <span className="font-medium text-red-600">-${totalesConvertidos.gastos.toFixed(2)}</span>
                </div>
                <hr className="my-1" />
                <div className="flex justify-between font-bold text-base">
                  <span>DIFERENCIA TOTAL:</span>
                  <span className={`${totalesConvertidos.diferencia >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${totalesConvertidos.diferencia.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Desglose por Moneda */}
            {Object.entries(totalesPorMoneda).map(([moneda, totales]) => (
              <div key={moneda} className="border-l-4 border-blue-400 pl-3">
                <h4 className="font-semibold text-sm mb-2">
                  {obtenerSimboloMoneda(moneda)} {monedas.find((m) => m.codigo === moneda)?.nombre}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Viáticos:</span>
                    <span className="font-medium">
                      {obtenerSimboloMoneda(moneda)}
                      {totales.viaticos.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ingresos:</span>
                    <span className="font-medium text-green-600">
                      +{obtenerSimboloMoneda(moneda)}
                      {totales.ingresos.toFixed(2)}
                    </span>
                  </div>

                  {/* Gastos Expandibles */}
                  <Collapsible
                    open={gastosExpandidos[moneda]}
                    onOpenChange={(open) => setGastosExpandidos({ ...gastosExpandidos, [moneda]: open })}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex justify-between items-center cursor-pointer hover:bg-gray-100 p-1 rounded">
                        <span className="flex items-center gap-1">
                          Gastos:
                          {gastosExpandidos[moneda] ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </span>
                        <span className="font-medium text-red-600">
                          -{obtenerSimboloMoneda(moneda)}
                          {totales.gastos.toFixed(2)}
                        </span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-4 mt-1 space-y-1">
                      {obtenerGastosPorMoneda(moneda)?.map((gasto) => (
                        <div
                          key={gasto.id}
                          className="flex justify-between text-xs cursor-pointer hover:bg-gray-100 p-1 rounded"
                          onClick={() => scrollToRegistro(gasto.id)}
                        >
                          <span>{gasto.tipo === "combustible" ? "🚛 Combustible" : "💳 " + gasto.datos.concepto}</span>
                          <span>
                            -{obtenerSimboloMoneda(moneda)}
                            {gasto.tipo === "combustible" ? gasto.datos.costo : gasto.datos.monto}
                          </span>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  <hr className="my-1" />
                  <div className="flex justify-between font-bold">
                    <span>Diferencia:</span>
                    <span className={`${totales.diferencia >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {obtenerSimboloMoneda(moneda)}
                      {totales.diferencia.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {!viaje.finalizado && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {tiposRegistro.map((tipo) => {
                const Icono = tipo.icono
                return (
                  <Button
                    key={tipo.tipo}
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => {
                      setTipoRegistro(tipo.tipo)
                      setRegistroEditando(null)
                      setMostrarFormulario(true)
                    }}
                  >
                    <Icono className="w-6 h-6" />
                    <span className="text-xs text-center">{tipo.nombre}</span>
                  </Button>
                )
              })}
            </div>

            <Button onClick={finalizarViaje} className="w-full h-12 mb-6" variant="destructive">
              <CheckCircle className="w-5 h-5 mr-2" />
              Finalizar Viaje
            </Button>
          </>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Registros ({viaje.registros.length})</h2>

          {viaje.registros.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay registros aún</p>
                <p className="text-sm text-gray-400 mt-2">Agrega tu primer registro usando los botones de arriba</p>
              </CardContent>
            </Card>
          ) : (
            viaje.registros.map((registro) => {
              const Icono = obtenerIconoTipo(registro.tipo)
              return (
                <Card key={registro.id} id={`registro-${registro.id}`} className="transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Icono className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-base">
                        {tiposRegistro.find((t) => t.tipo === registro.tipo)?.nombre}
                      </CardTitle>
                      <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => editarRegistro(registro)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <div className="text-xs text-gray-500">
                          {registro.fecha} - {registro.hora}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm space-y-1">
                      {registro.tipo === "descripcion" && <p>{registro.datos.descripcion}</p>}
                      {registro.tipo === "origen-destino" && (
                        <div>
                          <p>
                            <strong>Origen:</strong> {registro.datos.origen}
                          </p>
                          <p>
                            <strong>Destino:</strong> {registro.datos.destino}
                          </p>
                        </div>
                      )}
                      {registro.tipo === "kilometros" && (
                        <p>
                          <strong>Kilómetros:</strong> {registro.datos.kilometros} km
                        </p>
                      )}
                      {registro.tipo === "rendicion" && (
                        <div>
                          <p>
                            <strong>Monto:</strong> {obtenerSimboloMoneda(registro.datos.moneda || "ARS")}
                            {registro.datos.monto}
                          </p>
                          <p className="text-xs text-gray-500">
                            Moneda: {monedas.find((m) => m.codigo === (registro.datos.moneda || "ARS"))?.nombre}
                          </p>
                        </div>
                      )}
                      {registro.tipo === "parada" && (
                        <div>
                          <p>
                            <strong>Lugar:</strong> {registro.datos.lugar}
                          </p>
                          <p>
                            <strong>Motivo:</strong> {registro.datos.motivo}
                          </p>
                        </div>
                      )}
                      {registro.tipo === "combustible" && (
                        <div>
                          <p>
                            <strong>Litros:</strong> {registro.datos.litros}L
                          </p>
                          <p>
                            <strong>Costo:</strong> {obtenerSimboloMoneda(registro.datos.moneda || "ARS")}
                            {registro.datos.costo}
                          </p>
                          <p>
                            <strong>Lugar:</strong> {registro.datos.lugar}
                          </p>
                          <p className="text-xs text-gray-500">
                            Moneda: {monedas.find((m) => m.codigo === (registro.datos.moneda || "ARS"))?.nombre}
                          </p>
                        </div>
                      )}
                      {registro.tipo === "gasto" && (
                        <div>
                          <p>
                            <strong>Concepto:</strong> {registro.datos.concepto}
                          </p>
                          <p>
                            <strong>Monto:</strong> {obtenerSimboloMoneda(registro.datos.moneda || "ARS")}
                            {registro.datos.monto}
                          </p>
                          <p className="text-xs text-gray-500">
                            Moneda: {monedas.find((m) => m.codigo === (registro.datos.moneda || "ARS"))?.nombre}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
