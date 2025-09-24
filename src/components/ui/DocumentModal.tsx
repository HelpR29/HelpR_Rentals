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
    checklistType: 'move-in',
    paymentMethod: '',
    petsAllowed: 'no',
    smokingAllowed: 'no',
    signatureDate: '',
    landlordSignatureDataUrl: '' as string,
    tenantSignatureDataUrl: '' as string,
  })

  const [landlordSigPreview, setLandlordSigPreview] = useState<string>('')
  const [tenantSigPreview, setTenantSigPreview] = useState<string>('')

  if (!isOpen) return null

  const handleGenerate = () => {
    onGenerate(selectedType, formData)
    onClose()
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'landlordSignatureDataUrl' | 'tenantSignatureDataUrl') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setFormData((prev) => ({ ...prev, [field]: dataUrl }))
      if (field === 'landlordSignatureDataUrl') setLandlordSigPreview(dataUrl)
      if (field === 'tenantSignatureDataUrl') setTenantSigPreview(dataUrl)
    }
    reader.readAsDataURL(file)
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
              <>
                <input
                  type="number"
                  placeholder="Monthly Rent ($)"
                  value={formData.monthlyRent}
                  onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})}
                  className="w-full border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-bold text-base placeholder-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Payment Method (e.g., e-Transfer, PAD, Cheques)"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-bold text-base placeholder-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Pets Allowed?</label>
                    <select
                      value={formData.petsAllowed}
                      onChange={(e) => setFormData({...formData, petsAllowed: e.target.value})}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Smoking Allowed?</label>
                    <select
                      value={formData.smokingAllowed}
                      onChange={(e) => setFormData({...formData, smokingAllowed: e.target.value})}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Landlord Signature (PNG/JPG)</label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={(e) => handleSignatureUpload(e, 'landlordSignatureDataUrl')}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 bg-white"
                    />
                    {landlordSigPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={landlordSigPreview} alt="Landlord signature preview" className="mt-2 h-16 object-contain" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Tenant Signature (PNG/JPG)</label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={(e) => handleSignatureUpload(e, 'tenantSignatureDataUrl')}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 bg-white"
                    />
                    {tenantSigPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tenantSigPreview} alt="Tenant signature preview" className="mt-2 h-16 object-contain" />
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Signature Date (e.g., 2025-09-24)"
                  value={formData.signatureDate}
                  onChange={(e) => setFormData({...formData, signatureDate: e.target.value})}
                  className="w-full border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-bold text-base placeholder-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </>
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
