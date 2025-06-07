"use client"

declare global {
  interface Window {
    gapi: any
    google: any
    Dropbox: any
  }
}

export class BackupService {
  private static googleDriveInitialized = false
  private static dropboxInitialized = false
  private static autoSyncInterval: NodeJS.Timeout | null = null

  // Configuración de Google Drive
  private static readonly GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "your-google-client-id"
  private static readonly GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "your-google-api-key"
  private static readonly GOOGLE_DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
  private static readonly GOOGLE_SCOPES = "https://www.googleapis.com/auth/drive.file"

  // Configuración de Dropbox
  private static readonly DROPBOX_APP_KEY = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || "your-dropbox-app-key"

  static async connectGoogleDrive(): Promise<void> {
    try {
      // Cargar Google API si no está cargado
      if (!window.gapi) {
        await this.loadGoogleAPI()
      }

      if (!this.googleDriveInitialized) {
        await window.gapi.load("auth2", async () => {
          await window.gapi.auth2.init({
            client_id: this.GOOGLE_CLIENT_ID,
          })
        })

        await window.gapi.load("client", async () => {
          await window.gapi.client.init({
            apiKey: this.GOOGLE_API_KEY,
            clientId: this.GOOGLE_CLIENT_ID,
            discoveryDocs: [this.GOOGLE_DISCOVERY_DOC],
            scope: this.GOOGLE_SCOPES,
          })
        })

        this.googleDriveInitialized = true
      }

      // Autenticar usuario
      const authInstance = window.gapi.auth2.getAuthInstance()
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn()
      }

      localStorage.setItem("backup_provider", "google")
      localStorage.setItem("google_access_token", authInstance.currentUser.get().getAuthResponse().access_token)
    } catch (error) {
      console.error("Error connecting to Google Drive:", error)
      throw new Error("No se pudo conectar con Google Drive")
    }
  }

  static async connectDropbox(): Promise<void> {
    try {
      // Cargar Dropbox API si no está cargado
      if (!window.Dropbox) {
        await this.loadDropboxAPI()
      }

      if (!this.dropboxInitialized) {
        window.Dropbox.appKey = this.DROPBOX_APP_KEY
        this.dropboxInitialized = true
      }

      // Autenticar usuario
      const accessToken = await new Promise<string>((resolve, reject) => {
        window.Dropbox.authenticate({ success: resolve, error: reject })
      })

      localStorage.setItem("backup_provider", "dropbox")
      localStorage.setItem("dropbox_access_token", accessToken)
    } catch (error) {
      console.error("Error connecting to Dropbox:", error)
      throw new Error("No se pudo conectar con Dropbox")
    }
  }

  static disconnect(): void {
    localStorage.removeItem("backup_provider")
    localStorage.removeItem("google_access_token")
    localStorage.removeItem("dropbox_access_token")
    this.disableAutoSync()
  }

  static async uploadData(data: string, provider: "google" | "dropbox"): Promise<void> {
    const fileName = `camionero-backup-${new Date().toISOString().split("T")[0]}.json`
    const encryptedData = this.encryptData(data)

    if (provider === "google") {
      await this.uploadToGoogleDrive(fileName, encryptedData)
    } else if (provider === "dropbox") {
      await this.uploadToDropbox(fileName, encryptedData)
    }
  }

  static async downloadData(provider: "google" | "dropbox"): Promise<string | null> {
    let encryptedData: string

    if (provider === "google") {
      encryptedData = await this.downloadFromGoogleDrive()
    } else if (provider === "dropbox") {
      encryptedData = await this.downloadFromDropbox()
    } else {
      throw new Error("Proveedor no válido")
    }

    return encryptedData ? this.decryptData(encryptedData) : null
  }

  static enableAutoSync(provider: "google" | "dropbox"): void {
    this.disableAutoSync() // Limpiar cualquier intervalo existente

    this.autoSyncInterval = setInterval(
      async () => {
        try {
          const viajesData = localStorage.getItem("viajes") || "[]"
          await this.uploadData(viajesData, provider)
          console.log("Auto-sync completed successfully")
        } catch (error) {
          console.error("Auto-sync failed:", error)
        }
      },
      5 * 60 * 1000,
    ) // Cada 5 minutos
  }

  static disableAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval)
      this.autoSyncInterval = null
    }
  }

  private static async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Google API"))
      document.head.appendChild(script)
    })
  }

  private static async loadDropboxAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://www.dropbox.com/static/api/2/dropins.js"
      script.setAttribute("data-app-key", this.DROPBOX_APP_KEY)
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Dropbox API"))
      document.head.appendChild(script)
    })
  }

  private static async uploadToGoogleDrive(fileName: string, data: string): Promise<void> {
    const accessToken = localStorage.getItem("google_access_token")
    if (!accessToken) throw new Error("No access token for Google Drive")

    const metadata = {
      name: fileName,
      parents: ["appDataFolder"], // Carpeta privada de la app
    }

    const form = new FormData()
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
    form.append("file", new Blob([data], { type: "application/json" }))

    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    })

    if (!response.ok) {
      throw new Error("Failed to upload to Google Drive")
    }
  }

  private static async downloadFromGoogleDrive(): Promise<string> {
    const accessToken = localStorage.getItem("google_access_token")
    if (!accessToken) throw new Error("No access token for Google Drive")

    // Buscar archivos de backup
    const searchResponse = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=name contains 'camionero-backup' and parents in 'appDataFolder'&orderBy=createdTime desc",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    const searchData = await searchResponse.json()
    if (!searchData.files || searchData.files.length === 0) {
      throw new Error("No backup files found")
    }

    // Descargar el archivo más reciente
    const fileId = searchData.files[0].id
    const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return await downloadResponse.text()
  }

  private static async uploadToDropbox(fileName: string, data: string): Promise<void> {
    const accessToken = localStorage.getItem("dropbox_access_token")
    if (!accessToken) throw new Error("No access token for Dropbox")

    const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          path: `/${fileName}`,
          mode: "overwrite",
        }),
      },
      body: data,
    })

    if (!response.ok) {
      throw new Error("Failed to upload to Dropbox")
    }
  }

  private static async downloadFromDropbox(): Promise<string> {
    const accessToken = localStorage.getItem("dropbox_access_token")
    if (!accessToken) throw new Error("No access token for Dropbox")

    // Listar archivos para encontrar el más reciente
    const listResponse = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "",
        recursive: false,
      }),
    })

    const listData = await listResponse.json()
    const backupFiles = listData.entries?.filter((file: any) => file.name.includes("camionero-backup")) || []

    if (backupFiles.length === 0) {
      throw new Error("No backup files found")
    }

    // Ordenar por fecha y tomar el más reciente
    backupFiles.sort((a: any, b: any) => new Date(b.client_modified).getTime() - new Date(a.client_modified).getTime())
    const latestFile = backupFiles[0]

    // Descargar el archivo
    const downloadResponse = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: latestFile.path_lower,
        }),
      },
    })

    return await downloadResponse.text()
  }

  private static encryptData(data: string): string {
    // Cifrado simple usando Base64 (en producción usar algo más seguro)
    return btoa(unescape(encodeURIComponent(data)))
  }

  private static decryptData(encryptedData: string): string {
    // Descifrado simple usando Base64
    return decodeURIComponent(escape(atob(encryptedData)))
  }
}
