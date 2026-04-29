<script setup lang="ts">
const props = defineProps<{ ambient?: boolean }>()

const canvasRef = ref<HTMLCanvasElement>()
let raf = 0
let dots: Dot[] = []
let canvasW = 0
let canvasH = 0
let mx = -9999
let my = -9999

// ── Fizik sabitleri ───────────────────────────────────
const STIFFNESS = 0.10
const DAMPING   = 0.74
const REPEL_R   = 80
const REPEL_STR = 7
const GROW_R    = 120
const GROW_MAX  = 2.2

interface Dot {
  bx: number; by: number
  px: number; py: number
  vx: number; vy: number
  r: number; cr: number
  R: number; G: number; B: number
  alpha: number
}

// ── Logoyu offscreen canvas'a çiz ────────────────────
function drawLogo(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.clearRect(0, 0, W, H)

  const cx   = W * 0.5
  const cy   = H * 0.48
  const rad  = Math.min(W, H) * 0.40

  // Daire — üst yarı koyu
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, rad, Math.PI, 0)
  ctx.closePath()
  ctx.fillStyle = '#005b7c'
  ctx.fill()
  ctx.restore()

  // Daire — alt yarı açık mavi
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, rad, 0, Math.PI)
  ctx.closePath()
  ctx.fillStyle = '#009fe3'
  ctx.fill()
  ctx.restore()

  // Dağ silüeti — 3 tepe, daire ile kırp
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, rad, 0, Math.PI * 2)
  ctx.clip()

  const base = cy + rad * 0.10
  ctx.beginPath()
  ctx.moveTo(cx - rad * 0.85, base)
  ctx.lineTo(cx - rad * 0.62, base - rad * 0.28)  // sol omuz
  ctx.lineTo(cx - rad * 0.40, base - rad * 0.70)  // sol tepe
  ctx.lineTo(cx - rad * 0.20, base - rad * 0.38)  // vadi 1
  ctx.lineTo(cx + rad * 0.02, base - rad * 1.02)  // orta tepe (en yüksek)
  ctx.lineTo(cx + rad * 0.22, base - rad * 0.42)  // vadi 2
  ctx.lineTo(cx + rad * 0.42, base - rad * 0.72)  // sağ tepe
  ctx.lineTo(cx + rad * 0.62, base - rad * 0.28)  // sağ omuz
  ctx.lineTo(cx + rad * 0.85, base)
  ctx.lineTo(cx + rad * 0.85, cy + rad + 5)
  ctx.lineTo(cx - rad * 0.85, cy + rad + 5)
  ctx.closePath()
  ctx.fillStyle = '#012e42'
  ctx.fill()
  ctx.restore()

  // Dalga 1 — daire ekvatorundan geçip dışına taşıyor
  ctx.save()
  ctx.strokeStyle = '#005b7c'
  ctx.lineWidth = rad * 0.10
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - W * 0.48, cy + rad * 0.06)
  ctx.bezierCurveTo(
    cx - rad * 0.4, cy - rad * 0.06,
    cx + rad * 0.4, cy + rad * 0.18,
    cx + W * 0.48, cy + rad * 0.04,
  )
  ctx.stroke()
  ctx.restore()

  // Dalga 2 — dairenin alt yarısında
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, rad, 0, Math.PI * 2)
  ctx.clip()
  ctx.strokeStyle = '#0088c7'
  ctx.lineWidth = rad * 0.08
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - rad * 0.88, cy + rad * 0.44)
  ctx.bezierCurveTo(
    cx - rad * 0.3, cy + rad * 0.28,
    cx + rad * 0.3, cy + rad * 0.56,
    cx + rad * 0.88, cy + rad * 0.42,
  )
  ctx.stroke()
  ctx.restore()

  // Dalga 3 — küçük iç dalga
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, rad, 0, Math.PI * 2)
  ctx.clip()
  ctx.strokeStyle = '#e0f4ff'
  ctx.lineWidth = rad * 0.06
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - rad * 0.38, cy + rad * 0.72)
  ctx.bezierCurveTo(
    cx - rad * 0.12, cy + rad * 0.60,
    cx + rad * 0.12, cy + rad * 0.76,
    cx + rad * 0.38, cy + rad * 0.68,
  )
  ctx.stroke()
  ctx.restore()
}

// ── Dot grid oluştur ─────────────────────────────────
function buildDots(W: number, H: number): Dot[] {
  // Offscreen canvas — logoyu çiz, pikselleri örnekle
  const off = document.createElement('canvas')
  off.width  = W
  off.height = H
  const offCtx = off.getContext('2d')!
  drawLogo(offCtx, W, H)
  const imgData = offCtx.getImageData(0, 0, W, H).data

  const GAP = Math.max(6, Math.round(Math.min(W, H) / 52))
  const result: Dot[] = []

  for (let y = GAP * 0.5; y < H; y += GAP) {
    for (let x = GAP * 0.5; x < W; x += GAP) {
      const xi  = Math.min(Math.floor(x), W - 1)
      const yi  = Math.min(Math.floor(y), H - 1)
      const idx = (yi * W + xi) * 4
      const R   = imgData[idx]
      const G   = imgData[idx + 1]
      const B   = imgData[idx + 2]
      const a   = imgData[idx + 3]

      if (a < 15) continue // logo dışı → atla

      result.push({
        bx: x, by: y, px: x, py: y, vx: 0, vy: 0,
        r: GAP * 0.27, cr: GAP * 0.27, R, G, B, alpha: 0.88,
      })
    }
  }

  return result
}

// ── Render loop ───────────────────────────────────────
function tick(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvasW, canvasH)

  for (const d of dots) {
    // Spring → base pozisyona
    d.vx = (d.vx + (d.bx - d.px) * STIFFNESS) * DAMPING
    d.vy = (d.vy + (d.by - d.py) * STIFFNESS) * DAMPING

    // Mouse repulsion
    const dx   = d.px - mx
    const dy   = d.py - my
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < REPEL_R && dist > 0.1) {
      const f = ((REPEL_R - dist) / REPEL_R) ** 1.5 * REPEL_STR
      d.vx += (dx / dist) * f
      d.vy += (dy / dist) * f
    }

    d.px += d.vx
    d.py += d.vy

    // Proximity grow
    const tr = dist < GROW_R
      ? d.r * (1 + (1 - dist / GROW_R) * (GROW_MAX - 1))
      : d.r
    d.cr += (tr - d.cr) * 0.14

    // Çiz
    ctx.beginPath()
    ctx.arc(d.px, d.py, Math.max(0.4, d.cr), 0, Math.PI * 2)
    ctx.fillStyle = `rgb(${d.R},${d.G},${d.B})`
    ctx.globalAlpha = d.alpha
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

// ── Mount ─────────────────────────────────────────────
onMounted(async () => {
  await nextTick()
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!

  // CSS boyutlarını al
  const dpr = window.devicePixelRatio || 1
  canvasW    = canvas.clientWidth  || canvas.offsetWidth
  canvasH    = canvas.clientHeight || canvas.offsetHeight

  if (!canvasW || !canvasH) return

  canvas.width  = canvasW * dpr
  canvas.height = canvasH * dpr
  ctx.scale(dpr, dpr)

  dots = buildDots(canvasW, canvasH)

  function loop() {
    tick(ctx)
    raf = requestAnimationFrame(loop)
  }
  loop()

  // Interactive modda kendi mouse'unu dinle
  if (!props.ambient) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect()
      mx = e.clientX - rect.left
      my = e.clientY - rect.top
    })
    canvas.addEventListener('mouseleave', () => { mx = -9999; my = -9999 })
  }
})

onBeforeUnmount(() => cancelAnimationFrame(raf))

// Hero'dan mouse koordinatı almak için
function setMouse(clientX: number, clientY: number) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  mx = clientX - rect.left
  my = clientY - rect.top
}
function clearMouse() { mx = -9999; my = -9999 }
defineExpose({ setMouse, clearMouse })
</script>

<template>
  <!-- Ambient: hero arkaplanı -->
  <canvas
    v-if="ambient"
    ref="canvasRef"
    class="absolute inset-0 w-full h-full block"
    style="pointer-events: none;"
  />

  <!-- Interactive: link olarak -->
  <NuxtLink
    v-else
    to="/"
    aria-label="Sadöksan İnşaat ana sayfa"
    class="block relative"
    style="width: 160px; height: 68px;"
  >
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full" />
  </NuxtLink>
</template>
