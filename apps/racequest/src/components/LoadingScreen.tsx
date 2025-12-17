import { MapPin, Zap } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-grounded-500 to-grounded-700 flex items-center justify-center">
      <div className="text-center text-white">
        {/* Logo */}
        <div className="mb-8">
          <div className="relative mx-auto w-24 h-24 mb-4">
            <div className="absolute inset-0 bg-white rounded-full opacity-20 animate-pulse-slow"></div>
            <div className="absolute inset-2 bg-white rounded-full opacity-40 animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-grounded-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">RaceQuest</h1>
          <p className="text-grounded-100 text-lg">Powered by Grounded</p>
        </div>

        {/* Loading animation */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-grounded-100">Initializing...</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto text-sm">
          <div className="flex items-center justify-center space-x-2 text-grounded-100">
            <MapPin className="w-4 h-4" />
            <span>Real location verification</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-grounded-100">
            <Zap className="w-4 h-4" />
            <span>Bitcoin Lightning rewards</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-grounded-100">
            <div className="w-4 h-4 bg-bitcoin-400 rounded-full"></div>
            <span>NFC proof required</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-8 text-grounded-200 text-sm italic">
          "If it's Grounded, you were really there."
        </div>
      </div>
    </div>
  )
}