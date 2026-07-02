/**
 * Site settings — API-first with localStorage fallback.
 */
import { defineStore } from 'pinia'
import type { SiteSettings } from '~/types'
import { storage } from '~/utils/storage'
import { useAuditStore } from './audit'

const DEFAULTS: SiteSettings = {
  maintenanceMode: false,
  maintenanceMessage: 'Site bakım çalışması nedeniyle kısa süreliğine kapalıdır.',
  maintenanceAllowAdmins: true,
  cartReminderEnabled: true,
  cartReminderHours: 24,
  notifyChannelDefault: 'email',
  whatsappRecipient: '+90 555 000 0000',
  netsisSyncInterval: 'hourly',
  alneoTrigger: 'order-shipped',
  siteName: 'Sadöksan',
  contactEmail: 'info@sadoksan.com',
  introEnabled: true,
}

export const useSettingsStore = defineStore('settings', {
  state: (): { data: SiteSettings; loaded: boolean } => ({ data: { ...DEFAULTS }, loaded: false }),

  actions: {
    async load() {
      try {
        const api = useApi()
        const remote = await api.get<any>('/cms/settings')
        this.data = { ...DEFAULTS, ...this.mapFromApi(remote) }
      } catch {
        this.data = storage.read<SiteSettings>('settings', DEFAULTS)
      }
      this.loaded = true
    },

    async save(patch: Partial<SiteSettings>) {
      const prev = { ...this.data }
      this.data = { ...this.data, ...patch }
      storage.write('settings', this.data)

      // Diff for audit
      const diff: Record<string, { from: unknown; to: unknown }> = {}
      Object.keys(patch).forEach((k) => {
        const key = k as keyof SiteSettings
        if (prev[key] !== this.data[key]) diff[k] = { from: prev[key], to: this.data[key] }
      })
      if (Object.keys(diff).length) {
        useAuditStore().log('settings.update', 'Settings', 'global', diff)
      }

      // Persist to API
      try {
        const api = useApi()
        await api.patch('/cms/settings', this.mapToApi(patch))
      } catch {
        // API offline — localStorage fallback already saved
      }
    },

    toggleMaintenance() {
      this.save({ maintenanceMode: !this.data.maintenanceMode })
    },

    mapFromApi(data: any): Partial<SiteSettings> {
      return {
        maintenanceMode: data.maintenanceMode,
        maintenanceMessage: data.maintenanceMessage,
        maintenanceAllowAdmins: data.maintenanceAllowAdmins,
        siteName: data.siteName,
        contactEmail: data.contactEmail,
        whatsappRecipient: data.whatsappNumber,
        cartReminderEnabled: data.cartReminderEnabled,
        cartReminderHours: data.cartReminderIntervalHours,
        notifyChannelDefault: data.defaultNotificationChannel,
        netsisSyncInterval: data.netsisSyncInterval,
        alneoTrigger: data.alneoTriggerEvent,
        introEnabled: data.introEnabled ?? true,
      }
    },

    mapToApi(patch: Partial<SiteSettings>): any {
      const m: any = {}
      if ('maintenanceMode' in patch) m.maintenanceMode = patch.maintenanceMode
      if ('maintenanceMessage' in patch) m.maintenanceMessage = patch.maintenanceMessage
      if ('maintenanceAllowAdmins' in patch) m.maintenanceAllowAdmins = patch.maintenanceAllowAdmins
      if ('siteName' in patch) m.siteName = patch.siteName
      if ('contactEmail' in patch) m.contactEmail = patch.contactEmail
      if ('whatsappRecipient' in patch) m.whatsappNumber = patch.whatsappRecipient
      if ('cartReminderEnabled' in patch) m.cartReminderEnabled = patch.cartReminderEnabled
      if ('cartReminderHours' in patch) m.cartReminderIntervalHours = patch.cartReminderHours
      if ('notifyChannelDefault' in patch) m.defaultNotificationChannel = patch.notifyChannelDefault
      if ('netsisSyncInterval' in patch) m.netsisSyncInterval = patch.netsisSyncInterval
      if ('alneoTrigger' in patch) m.alneoTriggerEvent = patch.alneoTrigger
      if ('introEnabled' in patch) m.introEnabled = patch.introEnabled
      return m
    },
  },
})
