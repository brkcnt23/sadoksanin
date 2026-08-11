<script setup lang="ts">
/**
 * Kategori Yönetimi
 * Backend CRUD zaten hazırdı (GET/POST/PATCH/DELETE /products/categories) ama
 * panelde ekranı yoktu; kategori sadece ürün formundan isimle açılabiliyordu ve
 * görsel seçilemiyordu. Bu sayfa listeleme + ekleme/düzenleme + görsel + silme sağlar.
 */
const products = useProductsStore()

const showModal = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const errorMsg = ref('')
const search = ref('')

const form = ref<{
  name: string
  parentId: string
  description: string
  order: number
  images: string[]
}>({ name: '', parentId: '', description: '', order: 0, images: [] })

const tree = computed(() => products.allCategories || [])

const filteredTree = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tree.value
  const match = (s?: string) => (s || '').toLowerCase().includes(q)
  return tree.value
    .map((c: any) => {
      const kids = (c.children || []).filter((ch: any) => match(ch.name))
      if (match(c.name)) return c
      if (kids.length) return { ...c, children: kids }
      return null
    })
    .filter(Boolean)
})

const totals = computed(() => {
  let ana = 0, alt = 0, gorselli = 0
  for (const c of tree.value as any[]) {
    ana++
    if (c.imageUrl) gorselli++
    for (const ch of c.children || []) {
      alt++
      if (ch.imageUrl) gorselli++
    }
  }
  return { ana, alt, gorselli, toplam: ana + alt }
})

const urunSayisi = (c: any) => c?._count?.products ?? 0

const openCreate = (parentId = '') => {
  editingId.value = null
  errorMsg.value = ''
  form.value = { name: '', parentId, description: '', order: 0, images: [] }
  showModal.value = true
}

const openEdit = (cat: any) => {
  editingId.value = cat.id
  errorMsg.value = ''
  form.value = {
    name: cat.name || '',
    parentId: cat.parentId || '',
    description: cat.description || '',
    order: cat.order ?? 0,
    images: cat.imageUrl ? [cat.imageUrl] : [],
  }
  showModal.value = true
}

const save = async () => {
  const name = form.value.name.trim()
  if (!name) { errorMsg.value = 'Kategori adı zorunlu.'; return }
  saving.value = true
  errorMsg.value = ''
  try {
    const imageUrl = form.value.images[0] || ''
    if (editingId.value) {
      await products.updateCategory(editingId.value, {
        name,
        description: form.value.description || undefined,
        imageUrl,
        order: Number(form.value.order) || 0,
      })
    } else {
      await products.createCategory({
        name,
        parentId: form.value.parentId || undefined,
        description: form.value.description || undefined,
        imageUrl: imageUrl || undefined,
        order: Number(form.value.order) || 0,
      })
    }
    showModal.value = false
  } catch (e: any) {
    errorMsg.value = e?.data?.message || e?.message || 'Kaydedilemedi.'
  } finally {
    saving.value = false
  }
}

const remove = async (cat: any) => {
  const kids = (cat.children || []).length
  const adet = urunSayisi(cat)
  let uyari = `"${cat.name}" kategorisi silinecek.`
  if (kids) uyari += `\n${kids} alt kategorisi var.`
  if (adet) uyari += `\n${adet} ürün bu kategoride — ürünler silinmez, kategorisiz kalır.`
  uyari += '\n\nDevam edilsin mi?'
  if (!confirm(uyari)) return
  try {
    await products.deleteCategory(cat.id)
  } catch (e: any) {
    alert(e?.data?.message || e?.message || 'Silinemedi.')
  }
}

onMounted(() => {
  if (!products.allCategories?.length) products.fetchCategories()
})

useHead({ title: 'Kategoriler | Sadoksan Panel' })
</script>

<template>
  <div>
    <PageHeader title="Kategori Yönetimi" description="Kategori ağacı, görselleri ve sıralaması">
      <template #actions>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          @click="openCreate()"
        >
          <Icon name="lucide:plus" class="w-4 h-4" /> Yeni Kategori
        </button>
      </template>
    </PageHeader>

    <!-- Özet -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      <div class="bg-white rounded-xl border border-ink-200 p-4">
        <p class="text-xs text-ink-500">Ana Kategori</p>
        <p class="text-2xl font-bold text-ink-900">{{ totals.ana }}</p>
      </div>
      <div class="bg-white rounded-xl border border-ink-200 p-4">
        <p class="text-xs text-ink-500">Alt Kategori</p>
        <p class="text-2xl font-bold text-ink-900">{{ totals.alt }}</p>
      </div>
      <div class="bg-white rounded-xl border border-ink-200 p-4">
        <p class="text-xs text-ink-500">Görseli Olan</p>
        <p class="text-2xl font-bold text-emerald-600">{{ totals.gorselli }}</p>
      </div>
      <div class="bg-white rounded-xl border border-ink-200 p-4">
        <p class="text-xs text-ink-500">Görseli Eksik</p>
        <p class="text-2xl font-bold text-amber-600">{{ totals.toplam - totals.gorselli }}</p>
      </div>
    </div>

    <!-- Arama -->
    <div class="relative mb-4 max-w-md">
      <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
      <input
        v-model="search"
        type="text"
        placeholder="Kategori ara..."
        class="w-full pl-9 pr-3 py-2 border border-ink-300 rounded-lg text-sm"
      />
    </div>

    <!-- Liste -->
    <div class="bg-white rounded-xl border border-ink-200 divide-y divide-ink-100">
      <div v-if="!filteredTree.length" class="p-8 text-center text-ink-500 text-sm">
        Kategori bulunamadı.
      </div>

      <div v-for="cat in filteredTree" :key="cat.id" class="p-3">
        <!-- Ana kategori -->
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-ink-50 border border-ink-200 overflow-hidden grid place-items-center shrink-0">
            <img v-if="cat.imageUrl" :src="cat.imageUrl" :alt="cat.name" class="w-full h-full object-cover" />
            <Icon v-else name="lucide:image-off" class="w-5 h-5 text-ink-300" />
          </div>

          <div class="min-w-0 flex-1">
            <p class="font-semibold text-ink-900 truncate">{{ cat.name }}</p>
            <p class="text-xs text-ink-500">
              {{ urunSayisi(cat) }} ürün
              <span v-if="(cat.children || []).length"> · {{ cat.children.length }} alt kategori</span>
              <span v-if="!cat.imageUrl" class="text-amber-600"> · görsel yok</span>
            </p>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button
              class="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-primary-700 transition-colors"
              title="Alt kategori ekle"
              @click="openCreate(cat.id)"
            >
              <Icon name="lucide:plus" class="w-4 h-4" />
            </button>
            <button
              class="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-primary-700 transition-colors"
              title="Düzenle"
              @click="openEdit(cat)"
            >
              <Icon name="lucide:pencil" class="w-4 h-4" />
            </button>
            <button
              class="p-2 rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Sil"
              @click="remove(cat)"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Alt kategoriler -->
        <div v-if="(cat.children || []).length" class="mt-2 ml-6 pl-4 border-l-2 border-ink-100 space-y-2">
          <div v-for="child in cat.children" :key="child.id" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-md bg-ink-50 border border-ink-200 overflow-hidden grid place-items-center shrink-0">
              <img v-if="child.imageUrl" :src="child.imageUrl" :alt="child.name" class="w-full h-full object-cover" />
              <Icon v-else name="lucide:image-off" class="w-4 h-4 text-ink-300" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-ink-800 truncate">{{ child.name }}</p>
              <p class="text-xs text-ink-400">
                {{ urunSayisi(child) }} ürün
                <span v-if="!child.imageUrl" class="text-amber-600"> · görsel yok</span>
              </p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                class="p-1.5 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-primary-700 transition-colors"
                title="Düzenle"
                @click="openEdit(child)"
              >
                <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
              </button>
              <button
                class="p-1.5 rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Sil"
                @click="remove(child)"
              >
                <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ekle / Düzenle -->
    <Modal
      :open="showModal"
      size="md"
      :title="editingId ? 'Kategori Düzenle' : 'Yeni Kategori'"
      @close="showModal = false"
    >
      <div class="space-y-4 p-4">
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Kategori Adı *</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Örn. Duş Sistemleri"
            class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
            @keyup.enter="save"
          />
        </div>

        <div v-if="!editingId">
          <label class="block text-sm font-medium text-ink-700 mb-1">Üst Kategori</label>
          <select v-model="form.parentId" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm bg-white">
            <option value="">— Ana kategori olarak ekle —</option>
            <option v-for="c in tree" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Açıklama</label>
          <textarea
            v-model="form.description"
            rows="2"
            class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
            placeholder="İsteğe bağlı"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Sıra</label>
          <input
            v-model.number="form.order"
            type="number"
            min="0"
            class="w-32 rounded-lg border border-ink-200 px-3 py-2 text-sm"
          />
          <p class="text-xs text-ink-400 mt-1">Küçük değer önce gösterilir.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Kategori Görseli</label>
          <UiImageUploadZone v-model="form.images" :multiple="false" />
          <p class="text-xs text-ink-400 mt-1">
            Bu görsel sitede kategori kartlarında ve üst menüdeki "Ürünler" panelinde görünür.
          </p>
        </div>

        <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>

        <div class="flex justify-end gap-2 pt-2">
          <button
            class="px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 rounded-lg transition-colors"
            @click="showModal = false"
          >
            Vazgeç
          </button>
          <button
            :disabled="saving"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 rounded-lg transition-colors"
            @click="save"
          >
            <Icon v-if="saving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            {{ editingId ? 'Kaydet' : 'Ekle' }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
