"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Cloud, Download, Upload, CheckCircle, AlertCircle, Loader2, Smartphone } from "lucide-react"
import { BackupService } from "@/lib/backup-service"

interface BackupStatus {
  connected: boolean
  provider: "google" | "dropbox" | null
  lastSync: string | null
  autoSync: boolean
}

export default function BackupPage() {
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    connected: false,
    provider: null,
    lastSync: null,
    autoSync: false,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [viajes, setViajes] = useState<any[]>([])

  useEffect(() => {
    // Cargar estado del backup
    const savedStatus = localStorage.getItem("backupStatus")
    if (savedStatus) {
      setBackupStatus(JSON.parse(savedStatus))
    }

    // Cargar viajes locales
    const viajesLocales = JSON.parse(localStorage.getItem("viajes") || "[]")
    setViajes(viajesLocales)
  }, [])

  const saveBackupStatus = (status: BackupStatus) => {
    setBackupStatus(status)
    localStorage.setItem("backupStatus", JSON.stringify(status))
  }

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const conectarGoogleDrive = async () => {
    setLoading(true)
    try {
      await BackupService.connectGoogleDrive()
      const newStatus = {
        ...backupStatus,
        connected: true,
        provider: "google" as const,
      }
      saveBackupStatus(newStatus)
      showMessage("success", "Conectado a Google Drive exitosamente")
    } catch (error) {
      showMessage("error", "Error al conectar con Google Drive")
    }
    setLoading(false)
  }

  const conectarDropbox = async () => {
    setLoading(true)
    try {
      await BackupService.connectDropbox()
      const newStatus = {
        ...backupStatus,
        connected: true,
        provider: "dropbox" as const,
      }
      saveBackupStatus(newStatus)
      showMessage("success", "Conectado a Dropbox exitosamente")
    } catch (error) {
      showMessage("error", "Error al conectar con Dropbox")
    }
    setLoading(false)
  }

  const desconectar = () => {
    BackupService.disconnect()
    const newStatus = {
      connected: false,
      provider: null,
      lastSync: null,
      autoSync: false,
    }
    saveBackupStatus(newStatus)
    showMessage("success", "Desconectado del servicio de backup")
  }

  const subirDatos = async () => {
    if (!backupStatus.connected || !backupStatus.provider) return

    setLoading(true)
    try {
      const viajesData = localStorage.getItem("viajes") || "[]"
      await BackupService.uploadData(viajesData, backupStatus.provider)

      const newStatus = {
        ...backupStatus,
        lastSync: new Date().toISOString(),
      }
      saveBackupStatus(newStatus)
      showMessage("success", "Datos subidos exitosamente a la nube")
    } catch (error) {
      showMessage("error", "Error al subir datos a la nube")
    }
    setLoading(false)
  }

  const descargarDatos = async () => {
    if (!backupStatus.connected || !backupStatus.provider) return

    setLoading(true)
    try {
      const data = await BackupService.downloadData(backupStatus.provider)
      if (data) {
        // Mostrar confirmación antes de sobrescribir
        const confirmar = window.confirm(
          "¿Estás seguro de que quieres reemplazar tus datos locales con los datos de la nube? Esta acción no se puede deshacer.",
        )

        if (confirmar) {
          localStorage.setItem("viajes", data)
          setViajes(JSON.parse(data))
          const newStatus = {
            ...backupStatus,
            lastSync: new Date().toISOString(),
          }
          saveBackupStatus(newStatus)
          showMessage("success", "Datos descargados exitosamente desde la nube")
        }
      } else {
        showMessage("error", "No se encontraron datos en la nube")
      }
    } catch (error) {
      showMessage("error", "Error al descargar datos desde la nube")
    }
    setLoading(false)
  }

  const toggleAutoSync = () => {
    const newStatus = {
      ...backupStatus,
      autoSync: !backupStatus.autoSync,
    }
    saveBackupStatus(newStatus)

    if (newStatus.autoSync) {
      showMessage("success", "Sincronización automática activada")
      // Configurar sincronización automática cada 5 minutos
      BackupService.enableAutoSync(newStatus.provider!)
    } else {
      showMessage("success", "Sincronización automática desactivada")
      BackupService.disableAutoSync()
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-ES")
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Backup en la Nube</h1>
            <p className="text-sm text-gray-500">Sincroniza tus datos de viajes</p>
          </div>
        </div>

        {message && (
          <Alert
            className={`mb-4 ${message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
          >
            {message.type === "error" ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Estado de Conexión */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Estado de Conexión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Estado:</span>
                <Badge variant={backupStatus.connected ? "default" : "secondary"}>
                  {backupStatus.connected ? "Conectado" : "Desconectado"}
                </Badge>
              </div>

              {backupStatus.connected && (
                <>
                  <div className="flex items-center justify-between">
                    <span>Proveedor:</span>
                    <Badge variant="outline">{backupStatus.provider === "google" ? "Google Drive" : "Dropbox"}</Badge>
                  </div>

                  {backupStatus.lastSync && (
                    <div className="flex items-center justify-between">
                      <span>Última sincronización:</span>
                      <span className="text-sm text-gray-600">{formatearFecha(backupStatus.lastSync)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span>Sincronización automática:</span>
                    <Button variant="outline" size="sm" onClick={toggleAutoSync} disabled={loading}>
                      {backupStatus.autoSync ? "Activada" : "Desactivada"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conectar Servicios */}
        {!backupStatus.connected && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Conectar Servicio</CardTitle>
              <p className="text-sm text-gray-600">Elige un servicio para sincronizar tus datos</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={conectarGoogleDrive}
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Cloud className="w-4 h-4 mr-2" />}
                Conectar con Google Drive
              </Button>

              <Button
                onClick={conectarDropbox}
                disabled={loading}
                variant="outline"
                className="w-full h-12 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Cloud className="w-4 h-4 mr-2" />}
                Conectar con Dropbox
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Acciones de Sincronización */}
        {backupStatus.connected && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sincronización Manual</CardTitle>
              <p className="text-sm text-gray-600">Sube o descarga tus datos manualmente</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={subirDatos} disabled={loading} className="w-full h-12">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Subir Datos a la Nube
              </Button>

              <Button onClick={descargarDatos} disabled={loading} variant="outline" className="w-full h-12">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Descargar Datos de la Nube
              </Button>

              <Button onClick={desconectar} variant="destructive" className="w-full h-12">
                Desconectar Servicio
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Información de Datos Locales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Datos Locales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Viajes guardados:</span>
                <Badge variant="outline">{viajes.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Tamaño aproximado:</span>
                <span className="text-sm text-gray-600">{Math.round(JSON.stringify(viajes).length / 1024)} KB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Seguridad */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🔒 Seguridad y Privacidad</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Tus datos se cifran antes de subirse a la nube</li>
            <li>• Solo tú tienes acceso a tus archivos de backup</li>
            <li>• Puedes desconectar el servicio en cualquier momento</li>
            <li>• Los datos se guardan como archivos JSON en tu carpeta personal</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
