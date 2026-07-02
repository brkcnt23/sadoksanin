<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth', title: 'İçerik Yönetimi | Sadöksan Admin' })

const api = useApi()
const toast = useToast()

interface CmsPage { id: string; title: string; slug: string; content: string; isActive: boolean; seoTitle?: string | null; seoMeta?: string | null; updatedAt: string }

const pages = ref<CmsPage[]>([])
const loading = ref(true)

const load = async () => {
  loading.value = true
  try { pages.value = await api.get<CmsPage[]>('/cms/pages') } catch { /* */ }
  loading.value = false
}

// ─── Hero Banner ─────────────────────────────────────────────────────
interface Hero { headline: string; subheading: string; imageUrl?: string; ctaText: string; ctaLink: string }
const hero = ref<Hero>({ headline: '', subheading: '', ctaText: '', ctaLink: '' })
const heroLoading = ref(false)

const loadHero = async () => {
  try { hero.value = await api.get<Hero>('/cms/hero') } catch { /* */ }
}

// ─── Sayfa Form ──────────────────────────────────────────────────────
const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ title: '', slug: '', content: '', isActive: true, seoTitle: '', seoMeta: '' })
const contentTextarea = ref<HTMLTextAreaElement | null>(null)

function wrapSelection(tag: string) {
  const ta = contentTextarea.value
  if (!ta) return
  const s = ta.selectionStart, e = ta.selectionEnd
  const before = form.value.content.slice(0, s)
  const selected = form.value.content.slice(s, e)
  const after = form.value.content.slice(e)
  const tags: Record<string, [string, string]> = {
    b: ['<strong>', '</strong>'],
    i: ['<em>', '</em>'],
    h2: ['<h2>', '</h2>'],
    h3: ['<h3>', '</h3>'],
    a: ['<a href="https://">', '</a>'],
    ul: ['<ul>\n  <li>', '</li>\n</ul>'],
    p: ['<p>', '</p>'],
  }
  const [open, close] = tags[tag] || ['<' + tag + '>', '</' + tag + '>']
  form.value.content = before + open + selected + close + after
  nextTick(() => {
    ta.focus()
    ta.setSelectionRange(s + open.length, e + open.length)
  })
}
const saving = ref(false)
const formError = ref('')

const openNew = () => {
  editingId.value = null; form.value = { title: '', slug: '', content: '', isActive: true, seoTitle: '', seoMeta: '' }; formError.value = ''; showForm.value = true
}

const openEdit = (p: CmsPage) => {
  editingId.value = p.id
  form.value = { title: p.title, slug: p.slug, content: p.content, isActive: p.isActive, seoTitle: p.seoTitle || '', seoMeta: p.seoMeta || '' }
  formError.value = ''; showForm.value = true
}

const slugify = (t: string) => t.toLowerCase().replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')

const save = async () => {
  if (!form.value.title || !form.value.slug) { formError.value = 'Başlık ve slug zorunlu'; return }
  saving.value = true; formError.value = ''
  try {
    if (editingId.value) {
      await api.patch(`/cms/pages/${editingId.value}`, form.value)
      toast.push?.('Sayfa güncellendi', 'success')
    } else {
      await api.post('/cms/pages', form.value)
      toast.push?.('Sayfa oluşturuldu', 'success')
    }
    showForm.value = false; await load()
  } catch (err: any) { formError.value = err.message || 'Kaydedilemedi' }
  finally { saving.value = false }
}

const deletePage = async (p: CmsPage) => {
  if (!confirm(`"${p.title}" silinsin mi?`)) return
  try { await api.delete(`/cms/pages/${p.id}`); toast.push?.('Silindi', 'success'); await load() }
  catch { /* */ }
}

const saveHero = async () => {
  heroLoading.value = true
  try { await api.patch('/cms/hero', hero.value); toast.push?.('Hero güncellendi', 'success') }
  catch { /* */ }
  finally { heroLoading.value = false }
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })

// ─── SEO Redirects ───────────────────────────────────────────────────
interface Redirect { id: string; oldUrl: string; newUrl: string; isActive: boolean; createdAt: string }
const redirects = ref<Redirect[]>([])
const redirectLoading = ref(false)
const newRedirect = ref({ oldUrl: '', newUrl: '' })
const csvText = ref('')

const loadRedirects = async () => {
  redirectLoading.value = true
  try { redirects.value = await api.get<Redirect[]>('/cms/redirects') } catch { /* */ }
  redirectLoading.value = false
}

const addRedirect = async () => {
  if (!newRedirect.value.oldUrl || !newRedirect.value.newUrl) return
  try { await api.post('/cms/redirects', newRedirect.value); newRedirect.value = { oldUrl: '', newUrl: '' }; toast.push?.('Yönlendirme eklendi', 'success'); await loadRedirects() }
  catch { /* */ }
}

const removeRedirect = async (r: Redirect) => {
  try { await api.delete(`/cms/redirects/${r.id}`); toast.push?.('Silindi', 'success'); await loadRedirects() }
  catch { /* */ }
}

const importCsv = async () => {
  const items = csvText.value.split('\n').filter(l => l.trim()).map(line => {
    const [oldUrl, newUrl] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
    return { oldUrl, newUrl }
  }).filter(i => i.oldUrl && i.newUrl)
  if (!items.length) return
  try { const r = await api.post<{ created: number; updated: number }>('/cms/redirects/import', { items }); toast.push?.(`${r.created} eklendi, ${r.updated} güncellendi`, 'success'); csvText.value = ''; await loadRedirects() }
  catch { /* */ }
}

onMounted(() => { load(); loadHero(); loadRedirects() })
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="İçerik Yönetimi" description="Sayfalar ve ana sayfa hero banner." />

    <!-- Hero Banner -->
    <div class="bg-white rounded-xl border border-ink-200 p-6">
      <h3 class="font-semibold text-ink-900 mb-4 flex items-center gap-2"><Icon name="lucide:image" class="w-4 h-4 text-primary-600" /> Ana Sayfa Hero</h3>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Başlık</label>
          <input v-model="hero.headline" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Alt Başlık</label>
          <input v-model="hero.subheading" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Buton Metni</label>
          <input v-model="hero.ctaText" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Buton Linki</label>
          <input v-model="hero.ctaLink" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-ink-700 mb-1">Görsel URL</label>
          <input v-model="hero.imageUrl" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
        </div>
      </div>
      <button @click="saveHero" :disabled="heroLoading" class="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50">
        {{ heroLoading ? 'Kaydediliyor...' : 'Hero Güncelle' }}
      </button>
    </div>

    <!-- Sayfalar -->
    <div class="bg-white rounded-xl border border-ink-200">
      <div class="px-5 py-4 border-b border-ink-200 flex items-center justify-between">
        <h3 class="font-semibold text-ink-900 flex items-center gap-2"><Icon name="lucide:file-text" class="w-4 h-4 text-primary-600" /> Sayfalar</h3>
        <button @click="openNew" class="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md flex items-center gap-1.5">
          <Icon name="lucide:plus" class="w-3.5 h-3.5" /> Yeni Sayfa
        </button>
      </div>

      <div v-if="loading" class="p-8 text-center text-ink-500">Yükleniyor...</div>

      <div v-else-if="pages.length > 0" class="overflow-x-auto"><table class="w-full">
        <thead class="bg-ink-50 border-b border-ink-200 text-left">
          <tr>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Başlık</th>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Slug</th>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Güncelleme</th>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Durum</th>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Aksiyon</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-100">
          <tr v-for="p in pages" :key="p.id" class="hover:bg-ink-50">
            <td class="px-5 py-3 text-sm font-medium text-ink-900">{{ p.title }}</td>
            <td class="px-5 py-3 text-sm font-mono text-ink-600">/sayfa/{{ p.slug }}</td>
            <td class="px-5 py-3 text-xs text-ink-500">{{ formatDate(p.updatedAt) }}</td>
            <td class="px-5 py-3">
              <span :class="['inline-flex px-2 py-0.5 rounded-full text-xs font-medium', p.isActive ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500']">{{ p.isActive ? 'Aktif' : 'Pasif' }}</span>
            </td>
            <td class="px-5 py-3 flex items-center gap-1">
              <button @click="openEdit(p)" class="p-1.5 text-ink-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Icon name="lucide:edit-2" class="w-4 h-4" /></button>
              <button @click="deletePage(p)" class="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded"><Icon name="lucide:trash-2" class="w-4 h-4" /></button>
            </td>
          </tr>
        </tbody>
      </table></div><EmptyState v-else icon="lucide:file-text" title="Henüz sayfa eklenmemiş" />
    </div>

    <!-- Sayfa Form Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/30" @click="showForm = false" />
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="font-semibold text-lg text-ink-900 mb-4">{{ editingId ? 'Sayfa Düzenle' : 'Yeni Sayfa' }}</h3>
        <div v-if="formError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">{{ formError }}</div>
        <div class="space-y-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1">Başlık</label>
              <input v-model="form.title" @input="!editingId && (form.slug = slugify(form.title))" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1">Slug</label>
              <input v-model="form.slug" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm font-mono" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-700 mb-1">İçerik (HTML)</label>
            <div class="flex flex-wrap gap-0.5 p-1.5 border border-ink-300 rounded-t-md bg-ink-50">
              <button @click="wrapSelection('b')" class="px-2 py-1 text-xs font-bold text-ink-600 hover:bg-white hover:text-ink-900 rounded transition-colors" title="Kalın">B</button>
              <button @click="wrapSelection('i')" class="px-2 py-1 text-xs italic text-ink-600 hover:bg-white hover:text-ink-900 rounded transition-colors" title="İtalik">I</button>
              <button @click="wrapSelection('h2')" class="px-2 py-1 text-xs font-semibold text-ink-600 hover:bg-white hover:text-ink-900 rounded transition-colors" title="Başlık 2">H2</button>
              <button @click="wrapSelection('h3')" class="px-2 py-1 text-xs font-semibold text-ink-600 hover:bg-white hover:text-ink-900 rounded transition-colors" title="Başlık 3">H3</button>
              <button @click="wrapSelection('a')" class="px-2 py-1 text-xs text-ink-600 hover:bg-white hover:text-ink-900 rounded transition-colors" title="Link">🔗</button>
              <button @click="wrapSelection('ul')" class="px-2 py-1 text-xs text-ink-600 hover:bg-white hover:text-ink-900 rounded transition-colors" title="Liste">≡</button>
              <button @click="wrapSelection('p')" class="px-2 py-1 text-xs text-ink-600 hover:bg-white hover:text-ink-900 rounded transition-colors" title="Paragraf">¶</button>
            </div>
            <textarea ref="contentTextarea" v-model="form.content" rows="12" class="w-full px-3 py-2 border border-t-0 border-ink-300 rounded-b-md text-sm font-mono resize-y" placeholder="<p>Sayfa içeriği...</p>" />
          </div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1">SEO Başlığı</label>
              <input v-model="form.seoTitle" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1">Meta Açıklama</label>
              <input v-model="form.seoMeta" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="form.isActive" class="rounded" />
            <span class="text-ink-700">Aktif</span>
          </label>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showForm = false" class="px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 rounded-md">İptal</button>
          <button @click="save" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50">{{ saving ? 'Kaydediliyor...' : 'Kaydet' }}</button>
        </div>
      </div>
    </div>

    <!-- SEO Yönlendirmeleri -->
    <div class="bg-white rounded-xl border border-ink-200">
      <div class="px-5 py-4 border-b border-ink-200">
        <h3 class="font-semibold text-ink-900 flex items-center gap-2"><Icon name="lucide:arrow-right-left" class="w-4 h-4 text-primary-600" /> 301 Yönlendirmeler</h3>
        <p class="text-xs text-ink-500 mt-1">Eski URL'leri yeni URL'lere yönlendir. SEO migration için kritik.</p>
      </div>

      <div class="p-5 space-y-4">
        <!-- Add single -->
        <div class="flex gap-2">
          <input v-model="newRedirect.oldUrl" placeholder="/eski-sayfa" class="flex-1 px-3 py-2 border border-ink-300 rounded-md text-sm font-mono" @keyup.enter="addRedirect" />
          <span class="text-ink-400 self-center">→</span>
          <input v-model="newRedirect.newUrl" placeholder="/yeni-sayfa" class="flex-1 px-3 py-2 border border-ink-300 rounded-md text-sm font-mono" @keyup.enter="addRedirect" />
          <button @click="addRedirect" :disabled="!newRedirect.oldUrl || !newRedirect.newUrl" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 shrink-0">Ekle</button>
        </div>

        <!-- CSV import -->
        <details class="border border-ink-200 rounded-lg">
          <summary class="px-4 py-2 text-sm font-medium text-ink-700 cursor-pointer hover:bg-ink-50">CSV ile Toplu İçe Aktar (eski_url, yeni_url)</summary>
          <div class="p-4">
            <textarea v-model="csvText" rows="6" placeholder="/eski-urun, /urun/yeni-urun&#10;/eski-kategori, /kategori/yeni" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm font-mono" />
            <button @click="importCsv" :disabled="!csvText.trim()" class="mt-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50">İçe Aktar</button>
          </div>
        </details>

        <!-- List -->
        <div v-if="redirectLoading" class="text-center py-4 text-ink-500 text-sm">Yükleniyor...</div>
        <table v-else-if="redirects.length > 0" class="w-full text-sm">
          <thead class="bg-ink-50 border-b border-ink-200 text-left">
            <tr>
              <th class="px-4 py-2 text-xs font-semibold text-ink-700 uppercase">Eski URL</th>
              <th class="px-4 py-2 text-xs font-semibold text-ink-700 uppercase"></th>
              <th class="px-4 py-2 text-xs font-semibold text-ink-700 uppercase">Yeni URL</th>
              <th class="px-4 py-2 text-xs font-semibold text-ink-700 uppercase w-16"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr v-for="r in redirects" :key="r.id" class="hover:bg-ink-50">
              <td class="px-4 py-2 font-mono text-xs text-ink-600">{{ r.oldUrl }}</td>
              <td class="px-4 py-2 text-ink-400 text-xs">→ 301 →</td>
              <td class="px-4 py-2 font-mono text-xs text-green-700">{{ r.newUrl }}</td>
              <td class="px-4 py-2"><button @click="removeRedirect(r)" class="p-1 text-ink-400 hover:text-red-600 rounded"><Icon name="lucide:x" class="w-3.5 h-3.5" /></button></td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else icon="lucide:arrow-right-left" title="Henüz yönlendirme eklenmemiş" />
      </div>
    </div>
  </div>
</template>
