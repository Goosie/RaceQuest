import { useState } from 'react'
import { Plus, Edit, Pause, Play, Trash2 } from 'lucide-react'

interface Offer {
  id: string
  title: string
  description: string
  inventory: number
  claimed: number
  redeemed: number
  validUntil: string
  status: 'active' | 'paused' | 'expired'
}

export function OffersPage() {
  const [offers] = useState<Offer[]>([
    {
      id: '1',
      title: 'Free Coffee',
      description: '10% off any coffee drink',
      inventory: 100,
      claimed: 45,
      redeemed: 23,
      validUntil: '2024-02-15',
      status: 'active'
    },
    {
      id: '2',
      title: 'Ski Equipment Rental',
      description: '15% off ski equipment rental',
      inventory: 50,
      claimed: 12,
      redeemed: 8,
      validUntil: '2024-03-01',
      status: 'active'
    },
    {
      id: '3',
      title: 'Hot Chocolate Special',
      description: 'Buy one get one free hot chocolate',
      inventory: 75,
      claimed: 75,
      redeemed: 42,
      validUntil: '2024-01-31',
      status: 'paused'
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
          <p className="text-gray-600 mt-2">Manage your coupon offers and inventory</p>
        </div>
        <button className="bg-grounded-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-grounded-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Create Offer</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Offer</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Inventory</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Claimed</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Redeemed</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Valid Until</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">{offer.title}</div>
                      <div className="text-sm text-gray-500">{offer.description}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-900">{offer.inventory}</td>
                  <td className="py-4 px-6 text-gray-900">{offer.claimed}</td>
                  <td className="py-4 px-6 text-gray-900">{offer.redeemed}</td>
                  <td className="py-4 px-6 text-gray-900">{offer.validUntil}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(offer.status)}`}>
                      {offer.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        {offer.status === 'active' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}