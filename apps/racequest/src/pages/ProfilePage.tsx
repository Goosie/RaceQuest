import { useState } from 'react'
import { User, Key, MapPin, Trophy, Settings, Copy, Eye, EyeOff } from 'lucide-react'
import { useNostrStore } from '../stores/nostrStore'
import { useAppStore } from '../stores/appStore'

export default function ProfilePage() {
  const { publicKey, privateKey, connected } = useNostrStore()
  const { currentUser } = useAppStore()
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Would show toast notification
  }

  const stats = {
    routesCompleted: 12,
    satsEarned: 25000,
    checkpointsActivated: 47,
    teamsJoined: 3
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-grounded-50 to-grounded-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm safe-area-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:text-grounded-600 transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-20 h-20 bg-grounded-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {currentUser?.name?.[0] || publicKey?.slice(0, 2) || '?'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {currentUser?.name || 'Anonymous Racer'}
              </h2>
              <p className="text-sm text-gray-600">
                {connected ? 'Connected to Nostr' : 'Disconnected'}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {connected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-grounded-50 rounded-lg">
              <div className="text-2xl font-bold text-grounded-600">{stats.routesCompleted}</div>
              <div className="text-sm text-gray-600">Routes Completed</div>
            </div>
            <div className="text-center p-3 bg-bitcoin-50 rounded-lg">
              <div className="text-2xl font-bold text-bitcoin-600">{stats.satsEarned.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Sats Earned</div>
            </div>
            <div className="text-center p-3 bg-grounded-50 rounded-lg">
              <div className="text-2xl font-bold text-grounded-600">{stats.checkpointsActivated}</div>
              <div className="text-sm text-gray-600">Checkpoints</div>
            </div>
            <div className="text-center p-3 bg-grounded-50 rounded-lg">
              <div className="text-2xl font-bold text-grounded-600">{stats.teamsJoined}</div>
              <div className="text-sm text-gray-600">Teams Joined</div>
            </div>
          </div>
        </div>

        {/* Nostr Identity */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Key className="w-5 h-5 mr-2 text-grounded-600" />
            Nostr Identity
          </h3>
          
          {/* Public Key */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Public Key (npub)
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-sm break-all">
                {publicKey ? `${publicKey.slice(0, 16)}...${publicKey.slice(-16)}` : 'Not available'}
              </div>
              {publicKey && (
                <button
                  onClick={() => copyToClipboard(publicKey)}
                  className="p-2 text-grounded-600 hover:bg-grounded-50 rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Private Key */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Key (nsec)
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                {privateKey ? (
                  showPrivateKey ? 
                    `${privateKey.slice(0, 16)}...${privateKey.slice(-16)}` : 
                    '••••••••••••••••••••••••••••••••'
                ) : 'Not available'}
              </div>
              <button
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {privateKey && (
                <button
                  onClick={() => copyToClipboard(privateKey)}
                  className="p-2 text-grounded-600 hover:bg-grounded-50 rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Never share your private key with anyone
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-grounded-600" />
            Recent Activity
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Checkpoint Activated</p>
                <p className="text-sm text-gray-600">Winterberg Demo Route - 2 hours ago</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-bitcoin-600">+500 sats</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Joined Team</p>
                <p className="text-sm text-gray-600">Red Rockets - 1 day ago</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Trophy className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Route Completed</p>
                <p className="text-sm text-gray-600">City Explorer Challenge - 3 days ago</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-bitcoin-600">+1,200 sats</p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-semibold text-sm text-gray-900">First Route</div>
              <div className="text-xs text-gray-600">Complete your first route</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold text-sm text-gray-900">Lightning Fast</div>
              <div className="text-xs text-gray-600">Earn 10,000 sats</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-sm text-gray-900">Checkpoint Master</div>
              <div className="text-xs text-gray-600">Activate 50 checkpoints</div>
            </div>
            
            <div className="text-center p-4 bg-gray-100 rounded-lg border border-gray-200 opacity-50">
              <div className="text-2xl mb-2">👥</div>
              <div className="font-semibold text-sm text-gray-900">Team Player</div>
              <div className="text-xs text-gray-600">Join 5 teams</div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
            
            <div className="space-y-4">
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Edit Profile</div>
                <div className="text-sm text-gray-600">Update name and picture</div>
              </button>
              
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Backup Keys</div>
                <div className="text-sm text-gray-600">Export your Nostr keys</div>
              </button>
              
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Privacy Settings</div>
                <div className="text-sm text-gray-600">Manage data sharing</div>
              </button>
              
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg text-red-600">
                <div className="font-medium">Sign Out</div>
                <div className="text-sm text-red-500">Clear all data</div>
              </button>
            </div>
            
            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-6 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}