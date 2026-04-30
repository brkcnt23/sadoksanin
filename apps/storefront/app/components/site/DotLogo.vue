<script setup lang="ts">
const props = withDefaults(defineProps<{ ambient?: boolean }>(), {
  ambient: false,
})

interface Dot {
  bx: number
  by: number
  px: number
  py: number
  vx: number
  vy: number
  r: number
  cr: number
  red: number
  green: number
  blue: number
  alpha: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let raf = 0
let resizeObserver: ResizeObserver | null = null
let dots: Dot[] = []
let canvasW = 0
let canvasH = 0
let mx = -9999
let my = -9999

const STIFFNESS = 0.1
const DAMPING = 0.74
const REPEL_R = 88
const REPEL_STR = 7
const GROW_R = 132
const GROW_MAX = 2.1

function drawLogoMask(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height)

  const cx = width / 2
  const logoWidth = props.ambient
    ? Math.min(width * 0.7, height * 0.66)
    : Math.min(width * 0.84, height * 1.55)
  const radius = props.ambient
    ? logoWidth * 0.27
    : Math.min(logoWidth * 0.23, height * 0.29)
  const textSize = props.ambient ? radius * 0.34 : radius * 0.42
  const textGap = radius * 0.14
  const cy = height / 2 - (textGap + textSize * 0.97) / 2

  const circleGradient = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius)
  circleGradient.addColorStop(0, '#00577a')
  circleGradient.addColorStop(0.52, '#007fad')
  circleGradient.addColorStop(1, '#00a8e0')

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = circleGradient
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()

  const mountainBase = cy + radius * 0.04
  ctx.fillStyle = '#f6fbff'
  ctx.beginPath()
  ctx.moveTo(cx - radius * 0.95, mountainBase + radius * 0.08)
  ctx.lineTo(cx - radius * 0.72, mountainBase - radius * 0.07)
  ctx.lineTo(cx - radius * 0.56, mountainBase - radius * 0.46)
  ctx.lineTo(cx - radius * 0.38, mountainBase - radius * 0.22)
  ctx.lineTo(cx - radius * 0.17, mountainBase - radius * 0.79)
  ctx.lineTo(cx - radius * 0.06, mountainBase - radius * 0.2)
  ctx.lineTo(cx + radius * 0.08, mountainBase - radius * 0.92)
  ctx.lineTo(cx + radius * 0.32, mountainBase - radius * 0.42)
  ctx.lineTo(cx + radius * 0.48, mountainBase - radius * 0.36)
  ctx.lineTo(cx + radius * 0.68, mountainBase - radius * 0.12)
  ctx.lineTo(cx + radius * 0.98, mountainBase + radius * 0.04)
  ctx.lineTo(cx + radius * 0.46, mountainBase + radius * 0.13)
  ctx.lineTo(cx - radius * 0.2, mountainBase + radius * 0.14)
  ctx.lineTo(cx - radius * 0.78, mountainBase + radius * 0.14)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = '#00577a'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(1.4, radius * 0.035)

  ctx.beginPath()
  ctx.moveTo(cx - radius * 0.48, mountainBase - radius * 0.2)
  ctx.lineTo(cx - radius * 0.62, mountainBase - radius * 0.02)
  ctx.lineTo(cx - radius * 0.78, mountainBase + radius * 0.08)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx - radius * 0.04, mountainBase - radius * 0.28)
  ctx.lineTo(cx + radius * 0.02, mountainBase - radius * 0.72)
  ctx.lineTo(cx + radius * 0.06, mountainBase - radius * 0.28)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx + radius * 0.23, mountainBase - radius * 0.35)
  ctx.lineTo(cx + radius * 0.35, mountainBase - radius * 0.08)
  ctx.lineTo(cx + radius * 0.55, mountainBase + radius * 0.02)
  ctx.stroke()

  ctx.restore()

  ctx.save()
  ctx.strokeStyle = '#003f5c'
  ctx.lineWidth = Math.max(2, radius * 0.055)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - radius * 1.58, cy + radius * 0.04)
  ctx.bezierCurveTo(
    cx - radius * 0.78, cy + radius * 0.26,
    cx + radius * 0.78, cy - radius * 0.13,
    cx + radius * 1.58, cy + radius * 0.04,
  )
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()
  ctx.strokeStyle = '#f6fbff'
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(1.2, radius * 0.02)

  ctx.beginPath()
  ctx.moveTo(cx - radius * 0.92, cy + radius * 0.34)
  ctx.bezierCurveTo(cx - radius * 0.52, cy + radius * 0.39, cx - radius * 0.22, cy + radius * 0.34, cx + radius * 0.02, cy + radius * 0.37)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx + radius * 0.2, cy + radius * 0.28)
  ctx.bezierCurveTo(cx + radius * 0.46, cy + radius * 0.36, cx + radius * 0.72, cy + radius * 0.3, cx + radius * 1.0, cy + radius * 0.33)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx - radius * 0.12, cy + radius * 0.56)
  ctx.bezierCurveTo(cx + radius * 0.1, cy + radius * 0.61, cx + radius * 0.36, cy + radius * 0.55, cx + radius * 0.56, cy + radius * 0.58)
  ctx.stroke()

  ctx.restore()

  ctx.save()
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.font = `900 ${textSize}px Arial Black, Impact, system-ui, sans-serif`

  const firstWord = 'SAD\u00d6KSAN'
  const secondWord = '\u0130N\u015eAAT'
  const wordGap = textSize * 0.12
  const firstWidth = ctx.measureText(firstWord).width
  const secondWidth = ctx.measureText(secondWord).width
  const totalWidth = firstWidth + wordGap + secondWidth
  const textX = cx - totalWidth / 2
  const textY = cy + radius + textGap + textSize * 0.78

  ctx.strokeStyle = '#00577a'
  ctx.lineWidth = Math.max(2, textSize * 0.16)
  ctx.strokeText(firstWord, textX, textY)
  ctx.fillStyle = '#f8fdff'
  ctx.fillText(firstWord, textX, textY)

  const secondX = textX + firstWidth + wordGap
  ctx.strokeStyle = '#f8fdff'
  ctx.lineWidth = Math.max(1.5, textSize * 0.12)
  ctx.strokeText(secondWord, secondX, textY)
  ctx.fillStyle = '#00aeea'
  ctx.fillText(secondWord, secondX, textY)
  ctx.restore()
}

function buildDots(width: number, height: number): Dot[] {
  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height

  const offscreenCtx = offscreen.getContext('2d')
  if (!offscreenCtx) return []

  drawLogoMask(offscreenCtx, width, height)

  const imageData = offscreenCtx.getImageData(0, 0, width, height).data
  const gap = props.ambient
    ? Math.max(4, Math.round(Math.min(width, height) / 132))
    : Math.max(2, Math.round(Math.min(width, height) / 42))
  const radius = props.ambient ? gap * 0.34 : gap * 0.38
  const result: Dot[] = []

  for (let y = gap * 0.5; y < height; y += gap) {
    for (let x = gap * 0.5; x < width; x += gap) {
      const xi = Math.min(Math.floor(x), width - 1)
      const yi = Math.min(Math.floor(y), height - 1)
      const index = (yi * width + xi) * 4
      const alpha = imageData[index + 3] ?? 0

      if (alpha < 24) continue

      result.push({
        bx: x,
        by: y,
        px: x,
        py: y,
        vx: 0,
        vy: 0,
        r: radius,
        cr: radius,
        red: imageData[index] ?? 0,
        green: imageData[index + 1] ?? 0,
        blue: imageData[index + 2] ?? 0,
        alpha: (alpha / 255) * (props.ambient ? 0.92 : 1),
      })
    }
  }

  return result
}

function tick(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvasW, canvasH)

  for (const dot of dots) {
    dot.vx = (dot.vx + (dot.bx - dot.px) * STIFFNESS) * DAMPING
    dot.vy = (dot.vy + (dot.by - dot.py) * STIFFNESS) * DAMPING

    const dx = dot.px - mx
    const dy = dot.py - my
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < REPEL_R && distance > 0.1) {
      const force = ((REPEL_R - distance) / REPEL_R) ** 1.5 * REPEL_STR
      dot.vx += (dx / distance) * force
      dot.vy += (dy / distance) * force
    }

    dot.px += dot.vx
    dot.py += dot.vy

    const targetRadius = distance < GROW_R
      ? dot.r * (1 + (1 - distance / GROW_R) * (GROW_MAX - 1))
      : dot.r
    dot.cr += (targetRadius - dot.cr) * 0.14

    ctx.beginPath()
    ctx.arc(dot.px, dot.py, Math.max(0.45, dot.cr), 0, Math.PI * 2)
    ctx.fillStyle = `rgb(${dot.red}, ${dot.green}, ${dot.blue})`
    ctx.globalAlpha = dot.alpha
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

function resetCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return null

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const rect = canvas.getBoundingClientRect()
  const width = Math.round(rect.width)
  const height = Math.round(rect.height)

  if (!width || !height) return null

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvasW = width
  canvasH = height
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  dots = buildDots(width, height)

  return ctx
}

function startLoop(ctx: CanvasRenderingContext2D) {
  cancelAnimationFrame(raf)

  function loop() {
    tick(ctx)
    raf = requestAnimationFrame(loop)
  }

  loop()
}

function onMouseMove(event: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  mx = event.clientX - rect.left
  my = event.clientY - rect.top
}

function clearMouse() {
  mx = -9999
  my = -9999
}

onMounted(async () => {
  await nextTick()

  const ctx = resetCanvas()
  if (!ctx) return

  startLoop(ctx)

  resizeObserver = new ResizeObserver(() => {
    const nextCtx = resetCanvas()
    if (nextCtx) startLoop(nextCtx)
  })

  if (canvasRef.value) {
    resizeObserver.observe(canvasRef.value)
  }

  if (!props.ambient) {
    canvasRef.value?.addEventListener('mousemove', onMouseMove)
    canvasRef.value?.addEventListener('mouseleave', clearMouse)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  resizeObserver?.disconnect()
  canvasRef.value?.removeEventListener('mousemove', onMouseMove)
  canvasRef.value?.removeEventListener('mouseleave', clearMouse)
})

function setMouse(clientX: number, clientY: number) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  mx = clientX - rect.left
  my = clientY - rect.top
}

defineExpose({ setMouse, clearMouse })
</script>

<template>
  <canvas
    v-if="ambient"
    ref="canvasRef"
    class="pointer-events-none absolute top-0 bottom-0 block h-full max-w-none"
    style="right: 0; width: 100vw;"
  />

  <NuxtLink
    v-else
    to="/"
    aria-label="Sadoksan Insaat ana sayfa"
    class="block relative"
    style="width: 160px; height: 68px;"
  >
    <canvas ref="canvasRef" class="absolute inset-0 h-full w-full" />
  </NuxtLink>
</template>
