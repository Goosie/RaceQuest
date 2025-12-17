import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Users, Trophy, Zap, Bell, ChevronRight, Map } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useNostrStore } from '../stores/nostrStore'
import { useGeolocationStore } from '../stores/geolocationStore'

export default function HomePage() {
  const { currentUser, notifications, selectedTeam } = useAppStore()
  const { connected, publicKey } = useNostrStore()
  const { hasPermission } = useGeolocationStore()
  const [activeRaces, setActiveRaces] = useState(0)
  const [nearbyCheckpoints, setNearbyCheckpoints] = useState(0)

  useEffect(() => {
    // Simulate fetching active races and nearby checkpoints
    setActiveRaces(3)
    setNearbyCheckpoints(7)
  }, [])

  const unreadNotifications = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-grounded-50 to-grounded-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm safe-area-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RaceQuest</h1>
              <p className="text-sm text-grounded-600">
                {connected ? 'Connected' : 'Connecting...'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/notifications"
                className="relative p-2 text-gray-600 hover:text-grounded-600 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Link>
              <div className="w-8 h-8 bg-grounded-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {currentUser?.name?.[0] || publicKey?.slice(0, 2) || '?'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-grounded-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-grounded-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold text-gray-900">
                  {hasPermission ? 'Active' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-bitcoin-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-bitcoin-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Wallet</p>
                <p className="font-semibold text-gray-900">Connected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-grounded-600">{activeRaces}</div>
              <div className="text-sm text-gray-600">Active Races</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-grounded-600">{nearbyCheckpoints}</div>
              <div className="text-sm text-gray-600">Nearby Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-bitcoin-600">0</div>
              <div className="text-sm text-gray-600">Sats Earned</div>
            </div>
          </div>
        </div>

        {/* Current Team/Challenge */}
        {selectedTeam && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Current Team</h2>
              <Link to="/teams" className="text-grounded-600 hover:text-grounded-700">
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-grounded-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-grounded-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{selectedTeam.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedTeam.members.length} / {selectedTeam.max_members} members
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <Link
            to="/map"
            className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-grounded-100 rounded-lg flex items-center justify-center">
                <Map className="w-5 h-5 text-grounded-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Explore Routes</p>
                <p className="text-sm text-gray-600">Find races near you</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link
            to="/teams"
            className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-grounded-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-grounded-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Join a Team</p>
                <p className="text-sm text-gray-600">Team up for challenges</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link
            to="/route-maker"
            className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-bitcoin-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-bitcoin-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Create Route</p>
                <p className="text-sm text-gray-600">Design your own challenge</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Grounded Tagline */}
      <div className="px-4 pb-4">
        <div className="text-center text-grounded-600 text-sm italic">
          "If it's Grounded, you were really there."
        </div>
      </div>
    </div>
  )
}