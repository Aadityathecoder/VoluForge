const SAMPLE_WIDTH = 24
const SAMPLE_HEIGHT = 36

export type MatchFeatures = {
  vector: number[]
  yellowRatio: number
  darkRatio: number
  skinRatio: number
  edgeDensity: number
  leftTextDensity: number
  rightAccentBrightness: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function extractFeaturesFromImageData(imageData: ImageData): MatchFeatures {
  const { data, width, height } = imageData
  const vector: number[] = []
  let yellowPixels = 0
  let darkPixels = 0
  let skinPixels = 0
  let edgeCount = 0
  let leftTextEdges = 0
  let rightAccentBrightnessTotal = 0
  const pixelCount = width * height

  const luminanceGrid: number[] = []

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i] / 255
    const green = data[i + 1] / 255
    const blue = data[i + 2] / 255

    const luminance = 0.299 * red + 0.587 * green + 0.114 * blue
    vector.push(luminance)
    luminanceGrid.push(luminance)

    if (red > 0.58 && green > 0.5 && blue < 0.35) {
      yellowPixels += 1
    }

    if (luminance < 0.28) {
      darkPixels += 1
    }

    if (red > 0.32 && green > 0.2 && blue > 0.12 && red > blue && Math.abs(red - green) < 0.22) {
      skinPixels += 1
    }
  }

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x
      const center = luminanceGrid[index]
      const right = luminanceGrid[index + 1]
      const down = luminanceGrid[index + width]
      const gradient = Math.abs(center - right) + Math.abs(center - down)

      if (gradient > 0.22) {
        edgeCount += 1
        if (x < width * 0.72 && y > height * 0.12 && y < height * 0.9) {
          leftTextEdges += 1
        }
      }

      if (x > width * 0.72) {
        rightAccentBrightnessTotal += center
      }
    }
  }

  const rightAccentPixels = Math.max(1, Math.floor(width * 0.28) * height)

  return {
    vector: normalizeVector(vector),
    yellowRatio: yellowPixels / pixelCount,
    darkRatio: darkPixels / pixelCount,
    skinRatio: skinPixels / pixelCount,
    edgeDensity: edgeCount / pixelCount,
    leftTextDensity: leftTextEdges / pixelCount,
    rightAccentBrightness: rightAccentBrightnessTotal / rightAccentPixels,
  }
}

function normalizeVector(vector: number[]) {
  const mean = vector.reduce((sum, value) => sum + value, 0) / vector.length
  const centered = vector.map((value) => value - mean)
  const magnitude = Math.sqrt(centered.reduce((sum, value) => sum + value * value, 0)) || 1
  return centered.map((value) => value / magnitude)
}

function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length)
  let sum = 0
  for (let i = 0; i < length; i += 1) {
    sum += a[i] * b[i]
  }
  return sum
}

export function calculateBookMatchScore(current: MatchFeatures, reference: MatchFeatures) {
  const structureSimilarity = clamp((cosineSimilarity(current.vector, reference.vector) + 1) / 2, 0, 1)
  const yellowPenalty = Math.abs(current.yellowRatio - reference.yellowRatio)
  const darkPenalty = Math.abs(current.darkRatio - reference.darkRatio)
  const edgePenalty = Math.abs(current.edgeDensity - reference.edgeDensity)
  const textPenalty = Math.abs(current.leftTextDensity - reference.leftTextDensity)
  const accentPenalty = Math.abs(current.rightAccentBrightness - reference.rightAccentBrightness)

  const yellowSimilarity = clamp(1 - yellowPenalty * 10, 0, 1)
  const darkSimilarity = clamp(1 - darkPenalty * 4, 0, 1)
  const edgeSimilarity = clamp(1 - edgePenalty * 10, 0, 1)
  const textSimilarity = clamp(1 - textPenalty * 18, 0, 1)
  const accentSimilarity = clamp(1 - accentPenalty * 4, 0, 1)
  const skinPenalty = clamp(current.skinRatio * 6, 0, 0.55)

  return clamp(
    structureSimilarity * 0.28 +
      yellowSimilarity * 0.14 +
      darkSimilarity * 0.12 +
      edgeSimilarity * 0.18 +
      textSimilarity * 0.18 +
      accentSimilarity * 0.1 -
      skinPenalty,
    0,
    1
  )
}

export function cropForBookFocus(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number
) {
  const targetAspect = SAMPLE_WIDTH / SAMPLE_HEIGHT
  const cropWidth = sourceWidth * 0.46
  const cropHeight = cropWidth / targetAspect
  const fittedCropHeight = Math.min(cropHeight, sourceHeight * 0.86)
  const fittedCropWidth = fittedCropHeight * targetAspect
  const sx = (sourceWidth - fittedCropWidth) / 2
  const sy = (sourceHeight - fittedCropHeight) / 2

  ctx.drawImage(source, sx, sy, fittedCropWidth, fittedCropHeight, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
}

export function getSampleSize() {
  return {
    width: SAMPLE_WIDTH,
    height: SAMPLE_HEIGHT,
  }
}
