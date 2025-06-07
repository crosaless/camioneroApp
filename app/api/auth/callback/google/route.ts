import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(new URL(`/auth-result?type=AUTH_ERROR&provider=google&error=${error}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth-result?type=AUTH_ERROR&provider=google&error=no_code", request.url))
  }

  try {
    // Intercambiar código por token de acceso
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error)
    }

    return NextResponse.redirect(
      new URL(`/auth-result?type=AUTH_SUCCESS&provider=google&token=${tokenData.access_token}`, request.url),
    )
  } catch (error) {
    console.error("Error exchanging code for token:", error)
    return NextResponse.redirect(
      new URL("/auth-result?type=AUTH_ERROR&provider=google&error=token_exchange_failed", request.url),
    )
  }
}
