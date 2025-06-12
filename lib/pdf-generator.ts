import jsPDF from "jspdf"

interface Viaje {
  id: string
  fechaInicio: string
  finalizado: boolean
  registros: any[]
  viaticos: any[]
}

interface TotalesPorMoneda {
  [moneda: string]: {
    viaticos: number
    ingresos: number
    gastos: number
    diferencia: number
  }
}

interface TotalesConvertidos {
  adelantos: number
  ingresos: number
  gastos: number
  diferencia: number
}

interface Moneda {
  codigo: string
  nombre: string
  simbolo: string
}

export function generarPDF(
  viaje: Viaje,
  totalesPorMoneda: TotalesPorMoneda,
  monedas: Moneda[],
  totalesConvertidos: TotalesConvertidos,
) {
  const doc = new jsPDF()
  let yPosition = 20

  // Función para agregar texto con salto de línea automático
  const addText = (text: string, x: number, y: number, maxWidth?: number) => {
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth)
      doc.text(lines, x, y)
      return y + lines.length * 7
    } else {
      doc.text(text, x, y)
      return y + 7
    }
  }

  // Título
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  yPosition = addText(`REPORTE DE VIAJE #${viaje.id.slice(-4)}`, 20, yPosition)

  yPosition += 5
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  yPosition = addText(
    `Fecha de inicio: ${new Date(viaje.fechaInicio + "T00:00:00").toLocaleDateString("es-ES")}`,
    20,
    yPosition,
  )
  yPosition = addText(`Estado: ${viaje.finalizado ? "Finalizado" : "En curso"}`, 20, yPosition)
  yPosition = addText(`Fecha de reporte: ${new Date().toLocaleDateString("es-ES")}`, 20, yPosition)

  yPosition += 10

  // Total en Pesos Argentinos
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  yPosition = addText("💰 TOTAL EN PESOS ARGENTINOS", 20, yPosition)
  yPosition += 5

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  yPosition = addText(`Adelantos totales: $${totalesConvertidos.adelantos.toFixed(2)}`, 20, yPosition)
  yPosition = addText(`Ingresos totales: $${totalesConvertidos.ingresos.toFixed(2)}`, 20, yPosition)
  yPosition = addText(`Gastos totales: $${totalesConvertidos.gastos.toFixed(2)}`, 20, yPosition)

  doc.setFont("helvetica", "bold")
  yPosition = addText(`DESCONTAR DEL SUELDO: $${Math.abs(totalesConvertidos.diferencia).toFixed(2)}`, 20, yPosition)
  doc.setFont("helvetica", "normal")
  yPosition += 5

  // Resumen Financiero por Moneda
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  yPosition = addText("RESUMEN POR MONEDA", 20, yPosition)
  yPosition += 5

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  Object.entries(totalesPorMoneda).forEach(([moneda, totales]) => {
    const monedaInfo = monedas.find((m) => m.codigo === moneda)
    const simbolo = monedaInfo?.simbolo || "$"

    yPosition = addText(`${simbolo} ${monedaInfo?.nombre || moneda}:`, 20, yPosition)
    yPosition = addText(`  Adelantos iniciales: ${simbolo}${totales.viaticos.toFixed(2)}`, 25, yPosition)
    yPosition = addText(`  Ingresos: ${simbolo}${totales.ingresos.toFixed(2)}`, 25, yPosition)
    yPosition = addText(`  Gastos varios: ${simbolo}${totales.gastos.toFixed(2)}`, 25, yPosition)

    doc.setFont("helvetica", "bold")
    const diferencia =
      totales.diferencia >= 0
        ? `+${simbolo}${totales.diferencia.toFixed(2)}`
        : `-${simbolo}${Math.abs(totales.diferencia).toFixed(2)}`
    yPosition = addText(`  DIFERENCIA: ${diferencia}`, 25, yPosition)
    doc.setFont("helvetica", "normal")
    yPosition += 5
  })

  yPosition += 10

  // Detalle de Registros
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  yPosition = addText("DETALLE DE ACTIVIDADES", 20, yPosition)
  yPosition += 5

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")

  const tiposRegistro: { [key: string]: string } = {
    descripcion: "Descripción General",
    "origen-destino": "Origen y Destino",
    kilometros: "Kilómetros Recorridos",
    ingreso: "Ingreso de Dinero",
    parada: "Parada Intermedia",
    combustible: "Carga de Combustible",
    gasto: "Gasto Varios",
  }

  viaje.registros.forEach((registro, index) => {
    // Verificar si necesitamos una nueva página
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    const tipoNombre = tiposRegistro[registro.tipo] || registro.tipo

    doc.setFont("helvetica", "bold")
    yPosition = addText(`${index + 1}. ${tipoNombre}`, 20, yPosition)
    doc.setFont("helvetica", "normal")
    yPosition = addText(`   Fecha: ${registro.fecha} - ${registro.hora}`, 25, yPosition)

    // Detalles específicos por tipo
    switch (registro.tipo) {
      case "descripcion":
        yPosition = addText(`   Descripción: ${registro.datos.descripcion}`, 25, yPosition, 150)
        break
      case "origen-destino":
        yPosition = addText(`   Origen: ${registro.datos.origen}`, 25, yPosition)
        yPosition = addText(`   Destino: ${registro.datos.destino}`, 25, yPosition)
        break
      case "kilometros":
        yPosition = addText(`   Kilómetros: ${registro.datos.kilometros} km`, 25, yPosition)
        break
      case "ingreso":
        const simboloIngreso = monedas.find((m) => m.codigo === (registro.datos.moneda || "ARS"))?.simbolo || "$"
        yPosition = addText(`   Monto: ${simboloIngreso}${registro.datos.monto}`, 25, yPosition)
        yPosition = addText(
          `   Moneda: ${monedas.find((m) => m.codigo === (registro.datos.moneda || "ARS"))?.nombre}`,
          25,
          yPosition,
        )
        break
      case "parada":
        yPosition = addText(`   Lugar: ${registro.datos.lugar}`, 25, yPosition)
        yPosition = addText(`   Motivo: ${registro.datos.motivo}`, 25, yPosition)
        break
      case "combustible":
        const simboloCombustible = monedas.find((m) => m.codigo === (registro.datos.moneda || "ARS"))?.simbolo || "$"
        yPosition = addText(`   Litros: ${registro.datos.litros}L`, 25, yPosition)
        yPosition = addText(`   Costo: ${simboloCombustible}${registro.datos.costo}`, 25, yPosition)
        yPosition = addText(`   Lugar: ${registro.datos.lugar}`, 25, yPosition)
        yPosition = addText(
          `   Moneda: ${monedas.find((m) => m.codigo === (registro.datos.moneda || "ARS"))?.nombre}`,
          25,
          yPosition,
        )
        break
      case "gasto":
        const simboloGasto = monedas.find((m) => m.codigo === (registro.datos.moneda || "ARS"))?.simbolo || "$"
        yPosition = addText(`   Concepto: ${registro.datos.concepto}`, 25, yPosition)
        yPosition = addText(`   Monto: ${simboloGasto}${registro.datos.monto}`, 25, yPosition)
        yPosition = addText(
          `   Moneda: ${monedas.find((m) => m.codigo === (registro.datos.moneda || "ARS"))?.nombre}`,
          25,
          yPosition,
        )
        break
    }

    yPosition += 5
  })

  // Pie de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`Página ${i} de ${pageCount}`, 20, 285)
    doc.text(`Generado el ${new Date().toLocaleString("es-ES")}`, 120, 285)
  }

  // Descargar el PDF
  doc.save(`viaje-${viaje.id.slice(-4)}-${new Date().toISOString().split("T")[0]}.pdf`)
}
