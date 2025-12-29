'use client'

import { useState } from 'react'
import { GlassCard } from './ui/GlassCard'

export function SettingsForm() {
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    // in a real implementation, this would save to server-side storage
    // for now, we just show a message that env vars should be used
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <GlassCard title="UniFi Controller Settings">
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
          <p className="font-medium mb-1">Environment Variables</p>
          <p className="text-xs opacity-80">
            Configure your UniFi credentials in <code className="px-1 py-0.5 rounded bg-black/30">.env.local</code>:
          </p>
          <pre className="mt-2 text-xs bg-black/30 rounded p-2 overflow-x-auto">
{`UNIFI_API_URL=https://<controller-ip>/proxy/network/api/s/default
UNIFI_API_KEY=<your-api-key>`}
          </pre>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Controller URL (read-only)
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Set via UNIFI_API_URL env var"
            disabled
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            API Key (read-only)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Set via UNIFI_API_KEY env var"
            disabled
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 disabled:opacity-50"
          />
        </div>

        <p className="text-xs text-gray-500">
          For security, credentials are managed via environment variables and cannot be changed through the UI.
          Restart the server after modifying .env.local.
        </p>
      </div>
    </GlassCard>
  )
}
