'use client'

import React, { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'

interface Bank {
  code: string
  name: string
}

interface QRData {
  accountNumber: string
  bankCode: string
  bankName: string
}

interface MessageState {
  text: string
  type: 'success' | 'error' | ''
}

const PaymentQRGenerator: React.FC = () => {
  const [banks, setBanks] = useState<Bank[]>([])
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [recipientAccount, setRecipientAccount] = useState('')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [isLoadingBanks, setIsLoadingBanks] = useState(false)
  const [message, setMessage] = useState<MessageState>({ text: '', type: '' })
  const [isFormEnabled, setIsFormEnabled] = useState(false)
  
  // API Configuration
  const [apiConfig, setApiConfig] = useState({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    phoneNumber: process.env.NEXT_PUBLIC_API_PHONE_NUMBER || '',
    pin: process.env.NEXT_PUBLIC_API_PIN || '',
    accountNumber: process.env.NEXT_PUBLIC_API_ACCOUNT_NUMBER || '',
    deviceId: process.env.NEXT_PUBLIC_API_DEVICE_ID || ''
  })

  const dropdownRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Sample banks fallback
  const sampleBanks: Bank[] = [
    { code: "044", name: "Access Bank" },
    { code: "050", name: "Eco Bank" },
    { code: "070", name: "Fidelity" },
    { code: "011", name: "First Bank" },
    { code: "214", name: "FCMB" },
    { code: "058", name: "GTB" },
    { code: "076", name: "Polaris Bank" },
    { code: "232", name: "Sterling" },
    { code: "033", name: "UBA" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith" }
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 5000)
  }

  const loadBanks = async () => {
    if (isLoadingBanks) return

    const { baseUrl, phoneNumber, pin, accountNumber, deviceId } = apiConfig
    
    if (!baseUrl || !phoneNumber || !pin || !accountNumber || !deviceId) {
      showMessage('Please fill in all API configuration fields', 'error')
      return
    }

    setIsLoadingBanks(true)

    try {
      const apiUrl = new URL(`${baseUrl}/api/v1/f1core-service/Transaction/GetBanks/`)
      apiUrl.searchParams.set('phoneNumber', phoneNumber)
      apiUrl.searchParams.set('pin', pin)
      apiUrl.searchParams.set('accountNumber', accountNumber)
      apiUrl.searchParams.set('deviceId', deviceId)

      console.log('Making API request to:', apiUrl.toString())

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('API Response:', data)

      if (data.status && data.banks && Array.isArray(data.banks)) {
        const sortedBanks = data.banks.sort((a: Bank, b: Bank) => a.name.localeCompare(b.name))
        setBanks(sortedBanks)
        setIsFormEnabled(true)
        showMessage(`Successfully loaded ${sortedBanks.length} banks`, 'success')
      } else {
        throw new Error('Invalid response format or no banks found')
      }
    } catch (error) {
      console.error('Error loading banks:', error)
      showMessage(`Error loading banks: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      
      // Fallback to sample banks
      const sortedSampleBanks = sampleBanks.sort((a, b) => a.name.localeCompare(b.name))
      setBanks(sortedSampleBanks)
      setIsFormEnabled(true)
      showMessage(`Using sample banks for demonstration (${sortedSampleBanks.length} banks loaded)`, 'success')
    } finally {
      setIsLoadingBanks(false)
    }
  }

  const handleBankSearch = (value: string) => {
    setSearchTerm(value)
    setShowDropdown(value.length > 0)
  }

  const selectBank = (bank: Bank) => {
    setSelectedBank(bank)
    setSearchTerm(`${bank.name} (${bank.code})`)
    setShowDropdown(false)
  }

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.code.includes(searchTerm)
  ).slice(0, 10)

  const handleAccountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10)
    setRecipientAccount(numericValue)
  }

  const generateQRCode = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('Generate QR Code clicked')
    console.log('Recipient Account:', recipientAccount)
    console.log('Selected Bank:', selectedBank)
    console.log('Form Enabled:', isFormEnabled)

    if (!recipientAccount || recipientAccount.length !== 10 || !/^\d{10}$/.test(recipientAccount)) {
      alert('Please enter a valid 10-digit account number')
      return
    }

    if (!selectedBank) {
      alert('Please select a bank')
      return
    }

    const qrDataObj: QRData = {
      accountNumber: recipientAccount,
      bankCode: selectedBank.code,
      bankName: selectedBank.name
    }

    const qrString = JSON.stringify(qrDataObj)
    console.log('QR String:', qrString)

    try {
      // Create a new canvas element if ref is not working
      let canvas = canvasRef.current
      if (!canvas) {
        console.log('Canvas ref not found, creating new canvas')
        canvas = document.createElement('canvas')
        const qrContainer = document.getElementById('qr-canvas-container')
        if (qrContainer) {
          qrContainer.innerHTML = ''
          qrContainer.appendChild(canvas)
        }
      }

      if (canvas) {
        console.log('Generating QR code on canvas...')
        await QRCode.toCanvas(canvas, qrString, {
          width: 300,
          height: 300,
          margin: 2,
          color: {
            dark: '#DB2521',
            light: '#FFFFFF'
          }
        })
        
        console.log('QR code generated successfully')
        setQrCode(canvas.toDataURL())
        setQrData(qrDataObj)
        
        // Scroll to QR code
        setTimeout(() => {
          canvas.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        throw new Error('Could not create or find canvas element')
      }
    } catch (error) {
      console.error('QR Generation Error:', error)
      alert('Error generating QR code: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const downloadQR = () => {
    if (qrCode && selectedBank) {
      const link = document.createElement('a')
      link.download = `payment-qr-${selectedBank.code}-${recipientAccount}.png`
      link.href = qrCode
      link.click()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-6 shadow-lg">
            <span className="text-3xl text-white">🏦</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Payment QR Generator
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Generate secure QR codes for bank transfers with our advanced payment system
          </p>
        </div>

        {/* Sample Data Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 mb-8 shadow-sm border border-slate-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <span className="text-xl">📱</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">QR Data Format</h3>
              <p className="text-slate-600 mb-4">Your QR codes will contain JSON data structure:</p>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <pre className="text-sm font-mono text-slate-700 overflow-x-auto">
{`{
  "accountNumber": "0123456789",
  "bankCode": "044", 
  "bankName": "Access Bank"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* API Configuration Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 mb-8 shadow-sm border border-slate-200">
          {/* <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">API Configuration</h3>
              <p className="text-slate-600">Configure your payment service connection</p>
            </div>
          </div>
           */}
          <div className="space-y-6">
            {/* <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Base URL</label>
              <input
                type="text"
                value={apiConfig.baseUrl}
                onChange={(e) => setApiConfig({...apiConfig, baseUrl: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-slate-500"
                placeholder="https://your-api-domain.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={apiConfig.phoneNumber}
                  onChange={(e) => setApiConfig({...apiConfig, phoneNumber: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-slate-500"
                  placeholder="08012345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">PIN</label>
                <input
                  type="password"
                  value={apiConfig.pin}
                  onChange={(e) => setApiConfig({...apiConfig, pin: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-slate-500"
                  placeholder="1234"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Account Number</label>
                <input
                  type="text"
                  value={apiConfig.accountNumber}
                  onChange={(e) => setApiConfig({...apiConfig, accountNumber: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-slate-500"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Device ID</label>
                <input
                  type="text"
                  value={apiConfig.deviceId}
                  onChange={(e) => setApiConfig({...apiConfig, deviceId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-slate-500"
                  placeholder="device123"
                />
              </div>
            </div> */}

            <button
              onClick={loadBanks}
              disabled={isLoadingBanks}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 ease-out transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {isLoadingBanks ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Loading Banks...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">📥</span>
                  Load Banks from API
                </div>
              )}
            </button>

            {message.text && (
              <div className={`p-4 rounded-2xl border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  <span className="mr-2">{message.type === 'success' ? '✅' : '❌'}</span>
                  {message.text}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QR Generation Form Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 mb-8 shadow-sm border border-slate-200">
          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Generate QR Code</h3>
              <p className="text-slate-600">Enter recipient details to create payment QR</p>
            </div>
          </div>

          <form 
            onSubmit={generateQRCode} 
            className={`space-y-6 transition-all duration-300 ${!isFormEnabled ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <span className="flex items-center">
                  <span className="mr-2">💳</span>
                  Recipient Account Number
                </span>
              </label>
              <input
                type="text"
                value={recipientAccount}
                onChange={(e) => handleAccountChange(e.target.value)}
                maxLength={10}
                required
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-lg font-mono placeholder-slate-500"
                placeholder="0123456789"
              />
              <p className="text-sm text-slate-500 mt-2">Enter exactly 10 digits</p>
            </div>

            <div ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <span className="flex items-center">
                  <span className="mr-2">🏦</span>
                  Search and Select Bank
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleBankSearch(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-slate-500"
                  placeholder="Type to search banks..."
                  autoComplete="off"
                />
                
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-2xl mt-2 max-h-60 overflow-y-auto z-50 shadow-xl">
                    {banks.length === 0 ? (
                      <div className="p-4 text-slate-500 text-center">Please load banks first</div>
                    ) : filteredBanks.length === 0 ? (
                      <div className="p-4 text-slate-500 text-center">No banks found</div>
                    ) : (
                      filteredBanks.map((bank, index) => (
                        <div
                          key={bank.code}
                          onClick={() => selectBank(bank)}
                          className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                            index !== filteredBanks.length - 1 ? 'border-b border-slate-100' : ''
                          } ${index === 0 ? 'rounded-t-2xl' : ''} ${
                            index === filteredBanks.length - 1 ? 'rounded-b-2xl' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">{bank.name}</div>
                          <div className="text-sm text-slate-500">Code: {bank.code}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              {selectedBank && (
                <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center text-sm">
                    <span className="mr-2">✅</span>
                    <span className="font-medium text-red-800">
                      {selectedBank.name} (Code: {selectedBank.code})
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormEnabled}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-semibold py-5 px-6 rounded-2xl transition-all duration-200 ease-out transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl text-lg disabled:transform-none disabled:shadow-none"
            >
              <div className="flex items-center justify-center">
                <span className="mr-2">🔄</span>
                Generate QR Code
              </div>
            </button>
          </form>
        </div>

        {/* QR Code Display */}
        {qrData && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-xl">📱</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Generated QR Code</h3>
              </div>
              
              <div className="bg-slate-50 rounded-3xl p-8 mb-6 inline-block" id="qr-canvas-container">
                <canvas ref={canvasRef} className="rounded-2xl shadow-md" />
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 mb-6 text-left">
                <div className="flex items-center mb-3">
                  <span className="text-sm font-semibold text-gray-900 mr-2">QR Data:</span>
                </div>
                <div className="font-mono text-sm text-slate-700 break-all bg-white rounded-xl p-4 border border-slate-200">
                  {JSON.stringify(qrData, null, 2)}
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-2xl p-6 mb-6 text-left">
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">💡</span>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Instructions</h4>
                    <p className="text-blue-800 leading-relaxed">
                      Save this QR code and scan it with your payment app to test the functionality.
                      The QR code contains the recipient account number, bank code, and bank name in JSON format.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={downloadQR}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 ease-out transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center">
                  <span className="mr-2">📥</span>
                  Download QR Code
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentQRGenerator