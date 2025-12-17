import { useState } from 'react'
import { Users, Plus, Crown, UserPlus, Copy, QrCode } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import type { Team } from '../types'

// Sample teams data
const sampleTeams: Team[] = [
  {
    id: 'team-red',
    name: 'Red Rockets',
    captain: 'captain-pubkey-1',
    members: ['captain-pubkey-1', 'member-pubkey-2'],
    challenge_id: 'winterberg-race',
    invite_code: 'RR2024',
    created_at: Date.now() - 3600000,
    max_members: 2
  },
  {
    id: 'team-blue',
    name: 'Blue Lightning',
    captain: 'captain-pubkey-3',
    members: ['captain-pubkey-3'],
    challenge_id: 'winterberg-race',
    invite_code: 'BL2024',
    created_at: Date.now() - 7200000,
    max_members: 3
  }
]

export default function TeamsPage() {
  const { selectedTeam, setSelectedTeam } = useAppStore()
  const [teams] = useState<Team[]>(sampleTeams)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return
    
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: newTeamName,
      captain: 'current-user-pubkey', // Would be actual user pubkey
      members: ['current-user-pubkey'],
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      created_at: Date.now(),
      max_members: 2
    }
    
    setSelectedTeam(newTeam)
    setNewTeamName('')
    setShowCreateForm(false)
  }

  const handleJoinTeam = () => {
    if (!joinCode.trim()) return
    
    const team = teams.find(t => t.invite_code === joinCode.toUpperCase())
    if (team && team.members.length < team.max_members) {
      setSelectedTeam(team)
      setJoinCode('')
      setShowJoinForm(false)
    }
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    // Would show toast notification
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-grounded-50 to-grounded-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm safe-area-top">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-sm text-grounded-600">Join or create a team for challenges</p>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Current Team */}
        {selectedTeam && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Team</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyInviteCode(selectedTeam.invite_code)}
                  className="p-2 text-grounded-600 hover:bg-grounded-50 rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-2 text-grounded-600 hover:bg-grounded-50 rounded-lg">
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-grounded-100 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-grounded-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{selectedTeam.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedTeam.members.length} / {selectedTeam.max_members} members
                </p>
                <p className="text-xs text-grounded-600 font-mono">
                  Code: {selectedTeam.invite_code}
                </p>
              </div>
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              {selectedTeam.members.map((member, index) => (
                <div key={member} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-grounded-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {member.slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Player {index + 1}
                      {member === selectedTeam.captain && (
                        <Crown className="w-4 h-4 text-yellow-500 inline ml-2" />
                      )}
                    </p>
                    <p className="text-xs text-gray-600 font-mono">{member.slice(0, 16)}...</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedTeam.members.length < selectedTeam.max_members && (
              <div className="mt-4 p-3 bg-grounded-50 rounded-lg text-center">
                <p className="text-sm text-grounded-700 mb-2">
                  Share your invite code with teammates
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <code className="bg-white px-3 py-1 rounded font-mono text-lg font-bold">
                    {selectedTeam.invite_code}
                  </code>
                  <button
                    onClick={() => copyInviteCode(selectedTeam.invite_code)}
                    className="p-1 text-grounded-600 hover:text-grounded-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {!selectedTeam && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-grounded-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-grounded-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Create Team</h3>
              <p className="text-sm text-gray-600">Start your own team</p>
            </button>

            <button
              onClick={() => setShowJoinForm(true)}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-grounded-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-6 h-6 text-grounded-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Join Team</h3>
              <p className="text-sm text-gray-600">Use an invite code</p>
            </button>
          </div>
        )}

        {/* Available Teams */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Available Teams</h2>
          {teams.map(team => (
            <div key={team.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-grounded-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-grounded-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-600">
                      {team.members.length} / {team.max_members} members
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeam(team)}
                  disabled={team.members.length >= team.max_members}
                  className="px-4 py-2 bg-grounded-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {team.members.length >= team.max_members ? 'Full' : 'Join'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Team</h3>
            <input
              type="text"
              placeholder="Team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-grounded-500"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                className="flex-1 py-2 px-4 bg-grounded-500 text-white rounded-lg font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Team</h3>
            <input
              type="text"
              placeholder="Enter invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-grounded-500 font-mono text-center"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowJoinForm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinTeam}
                className="flex-1 py-2 px-4 bg-grounded-500 text-white rounded-lg font-medium"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}