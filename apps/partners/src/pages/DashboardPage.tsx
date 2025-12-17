import { useState } from 'react'
import { Gift, Users, TrendingUp, Clock } from 'lucide-react'

export function DashboardPage() {
  const [stats] = useState({
    totalOffers: 12,
    activeCoupons: 847,
    totalRedeems: 234,
    conversionRate: 27.6
  })

  const [recentActivity] = useState([
    { id: 1, type: 'redeem', description: 'Coffee coupon redeemed', time: '2 minutes ago' },
    { id: 2, type: 'claim', description: 'New coupon claimed', time: '5 minutes ago' },
    { id: 3, type: 'redeem', description: 'Ski pass discount used', time: '12 minutes ago' },
    { id: 4, type: 'claim', description: 'Team challenge completed', time: '18 minutes ago' },
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your Grounded partner dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Offers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOffers}</p>
            </div>
            <Gift className="w-8 h-8 text-grounded-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Coupons</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCoupons}</p>
            </div>
            <Users className="w-8 h-8 text-grounded-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Redeems</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRedeems}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-grounded-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}