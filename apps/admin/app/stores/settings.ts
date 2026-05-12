/**
 * Site settings — maintenance mode, notification channels, integration triggers.
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
}

export const useSettingsStore = defineStore('settings', {
  state: (): { data: SiteSettings; loaded: boolean } => ({ data: { ...DEFAULTS }, loaded: false }),

  actions: {
    load() {
      this.data = storage.read<SiteSettings>('settings', DEFAULTS)
      this.loaded = true
    },

    save(patch: Partial<SiteSettings>) {
      const prev = { ...this.data }
      this.data = { ...this.data, ...patch }
      storage.write('settings', this.data)
      const diff: Record<string, { from: unknown; to: unknown }> = {}
      Object.keys(patch).forEach((k) => {
        const key = k as keyof SiteSettings
        if (prev[key] !== this.data[key]) diff[k] = { from: prev[key], to: this.data[key] }
      })
      if (Object.keys(diff).length) {
        useAuditStore().log('settings.update', 'Settings', 'global', diff)
      }
    },

    toggleMaintenance() {
      this.save({ maintenanceMode: !this.data.maintenanceMode })
    },
  },
})
