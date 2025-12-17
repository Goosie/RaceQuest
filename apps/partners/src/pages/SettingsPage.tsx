import { useState } from 'react'
import { Save, Key, Bell, MapPin } from 'lucide-react'

export function SettingsPage() {
  const [settings, setSettings] = useState({
    businessName: 'Mountain Coffee Co.',
    email: 'contact@mountaincoffee.com',
    phone: '+1 (555) 123-4567',
    address: '123 Ski Resort Blvd, Alpine Valley',
    notifications: {
      newClaims: true,
      redeems: true,
      lowInventory: true,
      weeklyReports: false
    },
    nostrPubkey: 'npub1...',
    lightningAddress: 'payments@mountaincoffee.com'
  })

  const handleSave = () => {
    // Save settings logic
    console.log('Saving settings:', settings)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your business profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Business Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-grounded-600" />
            <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-grounded-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      [key]: e.target.checked
                    }
                  }))}
                  className="w-4 h-4 text-grounded-600 border-gray-300 rounded focus:ring-grounded-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bitcoin & Nostr Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <Key className="w-5 h-5 text-grounded-600" />
            <h2 className="text-lg font-semibold text-gray-900">Bitcoin & Nostr Integration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nostr Public Key
              </label>
              <input
                type="text"
                value={settings.nostrPubkey}
                onChange={(e) => setSettings(prev => ({ ...prev, nostrPubkey: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="npub1..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Nostr public key for event publishing
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lightning Address
              </label>
              <input
                type="text"
                value={settings.lightningAddress}
                onChange={(e) => setSettings(prev => ({ ...prev, lightningAddress: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="payments@yourbusiness.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lightning address for receiving payments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-grounded-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-grounded-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  )
}