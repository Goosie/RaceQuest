import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')

  const redeemData = [
    { name: 'Mon', redeems: 12, claims: 24 },
    { name: 'Tue', redeems: 19, claims: 32 },
    { name: 'Wed', redeems: 8, claims: 18 },
    { name: 'Thu', redeems: 15, claims: 28 },
    { name: 'Fri', redeems: 22, claims: 45 },
    { name: 'Sat', redeems: 35, claims: 67 },
    { name: 'Sun', redeems: 28, claims: 52 },
  ]

  const offerPerformance = [
    { name: 'Free Coffee', value: 45, color: '#0ea5e9' },
    { name: 'Ski Rental', value: 25, color: '#10b981' },
    { name: 'Hot Chocolate', value: 20, color: '#f59e0b' },
    { name: 'Other', value: 10, color: '#6b7280' },
  ]

  const conversionData = [
    { name: 'Week 1', rate: 24.5 },
    { name: 'Week 2', rate: 28.2 },
    { name: 'Week 3', rate: 31.8 },
    { name: 'Week 4', rate: 27.6 },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Track your offer performance and customer engagement</p>
        </div>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Claims vs Redeems Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Claims vs Redeems</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={redeemData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="claims" fill="#bae6fd" name="Claims" />
            <Bar dataKey="redeems" fill="#0ea5e9" name="Redeems" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Offer Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Offer Performance</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={offerPerformance}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {offerPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rate Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Rate Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
              <Line type="monotone" dataKey="rate" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600">Average Redeem Time</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">24 minutes</p>
          <p className="text-sm text-green-600 mt-1">↓ 12% from last week</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600">Peak Activity</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">2-4 PM</p>
          <p className="text-sm text-gray-500 mt-1">Weekend afternoons</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600">Customer Retention</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">68%</p>
          <p className="text-sm text-green-600 mt-1">↑ 5% from last month</p>
        </div>
      </div>
    </div>
  )
}