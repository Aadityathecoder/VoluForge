import { NextResponse } from 'next/server'

type RecognitionRequest = {
  imageDataUrl?: string
}

function estimateImageBytes(imageDataUrl: string) {
  const [, payload = ''] = imageDataUrl.split(',', 2)
  return Math.ceil((payload.length * 3) / 4)
}

export async function POST(request: Request) {
  const body = (await request.json()) as RecognitionRequest
  const imageDataUrl = body.imageDataUrl?.trim()

  if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'A camera image is required.' }, { status: 400 })
  }

  const approxBytes = estimateImageBytes(imageDataUrl)

  return NextResponse.json({
    label: 'AP World History book',
    summary:
      'Temporary MVP classifier matched this donation to an AP World History textbook. Replace this route with a real OpenCV or vision model once training data is available.',
    confidence: approxBytes > 150_000 ? 0.94 : 0.89,
    model: 'voluforge-mock-opencv-v1',
  })
}
