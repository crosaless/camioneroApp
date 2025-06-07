"use server"

import { neon } from "@neondatabase/serverless"

// Configurar conexión a Neon (PostgreSQL)
const sql = neon(process.env.DATABASE_URL!)

interface Viaje {
  id: string
  fecha_inicio: string
  finalizado: boolean
  viaticos: any[]
  cotizaciones: any[]
  user_id: string
}

interface Registro {
  id: string
  viaje_id: string
  tipo: string
  fecha: string
  hora: string
  datos: any
}

// Inicializar tablas si no existen
export async function initializeDatabase() {
  try {
    // Crear tabla de viajes
    await sql`
      CREATE TABLE IF NOT EXISTS viajes (
        id TEXT PRIMARY KEY,
        fecha_inicio DATE NOT NULL,
        finalizado BOOLEAN DEFAULT FALSE,
        viaticos JSONB DEFAULT '[]',
        cotizaciones JSONB DEFAULT '[]',
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Crear tabla de registros
    await sql`
      CREATE TABLE IF NOT EXISTS registros (
        id TEXT PRIMARY KEY,
        viaje_id TEXT NOT NULL REFERENCES viajes(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        datos JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Crear índices para mejor rendimiento
    await sql`CREATE INDEX IF NOT EXISTS idx_viajes_user_id ON viajes(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_registros_viaje_id ON registros(viaje_id)`

    return { success: true }
  } catch (error) {
    console.error("Error initializing database:", error)
    return { success: false, error: "Error al inicializar la base de datos" }
  }
}

// Obtener ID único del dispositivo/usuario
function getUserId(): string {
  // En una implementación real, usarías autenticación
  // Por ahora, generamos un ID único por dispositivo
  if (typeof window !== "undefined") {
    let userId = localStorage.getItem("user_id")
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("user_id", userId)
    }
    return userId
  }
  return "server_user"
}

// Guardar viaje en la base de datos
export async function saveViaje(viaje: any) {
  try {
    await sql`
      INSERT INTO viajes (id, fecha_inicio, finalizado, viaticos, cotizaciones, user_id)
      VALUES (${viaje.id}, ${viaje.fechaInicio}, ${viaje.finalizado}, ${JSON.stringify(viaje.viaticos)}, ${JSON.stringify(viaje.cotizaciones || [])}, ${viaje.user_id})
      ON CONFLICT (id) 
      DO UPDATE SET 
        finalizado = ${viaje.finalizado},
        viaticos = ${JSON.stringify(viaje.viaticos)},
        cotizaciones = ${JSON.stringify(viaje.cotizaciones || [])},
        updated_at = NOW()
    `
    return { success: true }
  } catch (error) {
    console.error("Error saving viaje:", error)
    return { success: false, error: "Error al guardar el viaje" }
  }
}

// Obtener todos los viajes del usuario
export async function getViajes(userId: string) {
  try {
    const viajes = await sql`
      SELECT v.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', r.id,
                   'tipo', r.tipo,
                   'fecha', r.fecha,
                   'hora', r.hora,
                   'datos', r.datos
                 ) ORDER BY r.created_at
               ) FILTER (WHERE r.id IS NOT NULL), 
               '[]'
             ) as registros
      FROM viajes v
      LEFT JOIN registros r ON v.id = r.viaje_id
      WHERE v.user_id = ${userId}
      GROUP BY v.id, v.fecha_inicio, v.finalizado, v.viaticos, v.cotizaciones, v.user_id, v.created_at, v.updated_at
      ORDER BY v.created_at DESC
    `

    return {
      success: true,
      data: viajes.map((v) => ({
        id: v.id,
        fechaInicio: v.fecha_inicio,
        finalizado: v.finalizado,
        viaticos: v.viaticos,
        cotizaciones: v.cotizaciones,
        registros: v.registros,
      })),
    }
  } catch (error) {
    console.error("Error getting viajes:", error)
    return { success: false, error: "Error al obtener los viajes" }
  }
}

// Guardar registro en la base de datos
export async function saveRegistro(registro: any) {
  try {
    await sql`
      INSERT INTO registros (id, viaje_id, tipo, fecha, hora, datos)
      VALUES (${registro.id}, ${registro.viaje_id}, ${registro.tipo}, ${registro.fecha}, ${registro.hora}, ${JSON.stringify(registro.datos)})
      ON CONFLICT (id)
      DO UPDATE SET 
        tipo = ${registro.tipo},
        fecha = ${registro.fecha},
        hora = ${registro.hora},
        datos = ${JSON.stringify(registro.datos)}
    `
    return { success: true }
  } catch (error) {
    console.error("Error saving registro:", error)
    return { success: false, error: "Error al guardar el registro" }
  }
}

// Eliminar registro
export async function deleteRegistro(registroId: string) {
  try {
    await sql`DELETE FROM registros WHERE id = ${registroId}`
    return { success: true }
  } catch (error) {
    console.error("Error deleting registro:", error)
    return { success: false, error: "Error al eliminar el registro" }
  }
}

// Sincronizar datos locales con la base de datos
export async function syncLocalData(localData: any[], userId: string) {
  try {
    // Obtener datos de la base de datos
    const dbResult = await getViajes(userId)
    if (!dbResult.success) {
      throw new Error(dbResult.error)
    }

    const dbViajes = dbResult.data || []

    // Combinar datos locales y de la base de datos
    const allViajes = new Map()

    // Agregar viajes de la base de datos
    dbViajes.forEach((viaje) => {
      allViajes.set(viaje.id, viaje)
    })

    // Agregar/actualizar con datos locales
    for (const localViaje of localData) {
      const existingViaje = allViajes.get(localViaje.id)

      if (!existingViaje || new Date(localViaje.updated_at || 0) > new Date(existingViaje.updated_at || 0)) {
        // Guardar viaje local en la base de datos
        await saveViaje({ ...localViaje, user_id: userId })

        // Guardar registros
        for (const registro of localViaje.registros || []) {
          await saveRegistro({ ...registro, viaje_id: localViaje.id })
        }

        allViajes.set(localViaje.id, localViaje)
      }
    }

    return {
      success: true,
      data: Array.from(allViajes.values()),
    }
  } catch (error) {
    console.error("Error syncing data:", error)
    return { success: false, error: "Error al sincronizar datos" }
  }
}
