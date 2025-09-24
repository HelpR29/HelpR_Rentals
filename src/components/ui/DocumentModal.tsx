'use client'

import { useState } from 'react'
import Button from './Button'

interface DocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (type: string, options: any) => void
}

export default function DocumentModal({ isOpen, onClose, onGenerate }: DocumentModalProps) {
  const [selectedType, setSelectedType] = useState<'contract' | 'checklist'>('contract')
  const [formData, setFormData] = useState({
    landlordName: '',
    tenantName: '',
    propertyAddress: '',
    monthlyRent: '',
    checklistType: 'move-in'
  })

  if (!isOpen) return null

  const handleGenerate = () => {
    onGenerate(selectedType, formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Generate Manitoba Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>

        <div className="mb-4">
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setSelectedType('contract')}
              className={`flex-1 p-3 border-2 rounded-lg ${selectedType === 'contract' ? 'border-blue-500 bg-blue-100 text-blue-800' : 'border-gray-400 text-gray-800 bg-white'} font-bold text-base hover:bg-gray-100 transition-colors`}
            >
              📄 Contract
            </button>
            <button
              onClick={() => setSelectedType('checklist')}
              className={`flex-1 p-3 border-2 rounded-lg ${selectedType === 'checklist' ? 'border-blue-500 bg-blue-100 text-blue-800' : 'border-gray-400 text-gray-800 bg-white'} font-bold text-base hover:bg-gray-100 transition-colors`}
            >
              📋 Checklist
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Landlord Name"
              value={formData.landlordName}
              onChange={(e) => setFormData({...formData, landlordName: e.target.value})}
              className="w-full border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-bold text-base placeholder-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Tenant Name"
              value={formData.tenantName}
              onChange={(e) => setFormData({...formData, tenantName: e.target.value})}
              className="w-full border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-bold text-base placeholder-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Property Address"
              value={formData.propertyAddress}
              onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})}
              className="w-full border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-bold text-base placeholder-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {selectedType === 'contract' && (
              <input
                type="number"
                placeholder="Monthly Rent ($)"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})}
                className="w-full border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-bold text-base placeholder-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
            {selectedType === 'checklist' && (
              <select
                value={formData.checklistType}
                onChange={(e) => setFormData({...formData, checklistType: e.target.value})}
                className="w-full border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-bold text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="move-in">Move-In Checklist</option>
                <option value="move-out">Move-Out Checklist</option>
                <option value="inspection">Property Inspection</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <Button onClick={onClose} variant="secondary" className="flex-1">Cancel</Button>
          <Button onClick={handleGenerate} className="flex-1">Generate PDF</Button>
        </div>
      </div>
    </div>
  )
}
