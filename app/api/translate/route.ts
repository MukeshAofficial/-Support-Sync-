import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const language = (formData.get("language") as string) || "hi-IN"

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log(`Processing audio for language: ${language}`)

    // Create form data for Sarvam API
    const sarvamFormData = new FormData()
    sarvamFormData.append("file", audioFile, "audio.wav")
    sarvamFormData.append("model", "saaras:v2.5")

    console.log("Calling Sarvam AI translation API directly...")

    // Call Sarvam's translation API directly
    const response = await fetch("https://api.sarvam.ai/speech-to-text-translate", {
      method: "POST",
      headers: {
        "api-subscription-key": "3eb1b62e-2cd8-410b-9004-52cd0403bb02",
      },
      body: sarvamFormData,
    })

    console.log("Sarvam API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Sarvam API error:", response.status, errorText)

      let errorMessage = "Translation service error"
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.detail || errorJson.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const result = await response.json()
    console.log("Sarvam successful response:", result)

    // Extract translated text from response
    const translatedText = result.transcript || result.translated_text || result.text || ""
    const originalText = result.original_transcript || result.original_text || ""

    if (!translatedText.trim()) {
      return NextResponse.json({
        translatedText: "",
        originalText: "",
        message: "No speech detected",
      })
    }

    return NextResponse.json({
      translatedText: translatedText,
      originalText: originalText,
      language: language,
      model: "saaras:v2.5",
    })
  } catch (error) {
    console.error("Translation route error:", error)
    return NextResponse.json(
      {
        error: `Server error: ${(error as Error).message}`,
      },
      { status: 500 },
    )
  }
}
