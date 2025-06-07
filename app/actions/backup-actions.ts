"use server"

interface BackupResult {
  success: boolean
  data?: string
  error?: string
}

// Configuración del servidor (variables de entorno seguras)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET

export async function getAuthUrl(provider: "google" | "dropbox"): Promise<string> {
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/${provider}`

  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/drive.file",
      access_type: "offline",
      prompt: "consent",
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  } else if (provider === "dropbox") {
    const params = new URLSearchParams({
      client_id: DROPBOX_APP_KEY!,
      redirect_uri: redirectUri,
      response_type: "code",
    })

    return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`
  }

  throw new Error("Proveedor no válido")
}

export async function uploadToCloud(
  data: string,
  provider: "google" | "dropbox",
  accessToken: string,
): Promise<BackupResult> {
  try {
    const fileName = `camionero-backup-${new Date().toISOString().split("T")[0]}.json`
    const encryptedData = encryptData(data)

    if (provider === "google") {
      await uploadToGoogleDrive(fileName, encryptedData, accessToken)
    } else if (provider === "dropbox") {
      await uploadToDropbox(fileName, encryptedData, accessToken)
    }

    return { success: true }
  } catch (error) {
    console.error("Error uploading to cloud:", error)
    return { success: false, error: "Error al subir datos a la nube" }
  }
}

export async function downloadFromCloud(provider: "google" | "dropbox", accessToken: string): Promise<BackupResult> {
  try {
    let encryptedData: string

    if (provider === "google") {
      encryptedData = await downloadFromGoogleDrive(accessToken)
    } else if (provider === "dropbox") {
      encryptedData = await downloadFromDropbox(accessToken)
    } else {
      throw new Error("Proveedor no válido")
    }

    const data = decryptData(encryptedData)
    return { success: true, data }
  } catch (error) {
    console.error("Error downloading from cloud:", error)
    return { success: false, error: "Error al descargar datos de la nube" }
  }
}

async function uploadToGoogleDrive(fileName: string, data: string, accessToken: string): Promise<void> {
  const metadata = {
    name: fileName,
    parents: ["appDataFolder"],
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

async function downloadFromGoogleDrive(accessToken: string): Promise<string> {
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

async function uploadToDropbox(fileName: string, data: string, accessToken: string): Promise<void> {
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

async function downloadFromDropbox(accessToken: string): Promise<string> {
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

function encryptData(data: string): string {
  // Cifrado simple usando Base64 (en producción usar algo más seguro)
  return Buffer.from(data, "utf-8").toString("base64")
}

function decryptData(encryptedData: string): string {
  // Descifrado simple usando Base64
  return Buffer.from(encryptedData, "base64").toString("utf-8")
}
