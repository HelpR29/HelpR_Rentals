'use client'

import Card from '@/components/ui/Card'

interface AIQuickFactsProps {
  quickFacts: Record<string, string>
}

export default function AIQuickFacts({ quickFacts }: AIQuickFactsProps) {
  if (!quickFacts || Object.keys(quickFacts).length === 0) {
    return null
  }

  return (
    <Card className="mt-6">
      <div className="flex items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">✨</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">AI-Generated Quick Facts</h2>
        </div>
        <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          AI-Powered
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(quickFacts).map(([key, value]) => (
          <div key={key} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
            <p className="text-sm font-semibold text-purple-900 capitalize mb-1">
              {key === 'pets' ? 'Pet Policy' : 
               key === 'utilities' ? 'Utilities Included' :
               key === 'furnished' ? 'Furnished Status' :
               key === 'deposit' ? 'Security Deposit' :
               key.replace(/([A-Z])/g, ' $1').trim()}
            </p>
            <p className="text-gray-800 font-medium">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
