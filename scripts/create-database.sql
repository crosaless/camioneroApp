-- Script para crear las tablas en Neon PostgreSQL

-- Crear tabla de viajes
CREATE TABLE IF NOT EXISTS viajes (
    id TEXT PRIMARY KEY,
    fecha_inicio DATE NOT NULL,
    finalizado BOOLEAN DEFAULT FALSE,
    viaticos JSONB DEFAULT '[]',
    cotizaciones JSONB DEFAULT '[]',
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de registros
CREATE TABLE IF NOT EXISTS registros (
    id TEXT PRIMARY KEY,
    viaje_id TEXT NOT NULL REFERENCES viajes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    datos JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_viajes_user_id ON viajes(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_viaje_id ON registros(viaje_id);
CREATE INDEX IF NOT EXISTS idx_viajes_created_at ON viajes(created_at);

-- Insertar datos de ejemplo (opcional)
-- INSERT INTO viajes (id, fecha_inicio, user_id) 
-- VALUES ('ejemplo_123', '2024-01-15', 'user_ejemplo');
