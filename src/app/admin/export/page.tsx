'use client'

import { useState } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { 
  DocumentArrowDownIcon, 
  TableCellsIcon, 
  UserGroupIcon, 
  CubeIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon 
} from '@heroicons/react/24/outline'

interface ExportConfig {
  exportType: 'orders' | 'customers' | 'products' | 'financial' | 'inventory'
  dateFrom: string
  dateTo: string
  includeCustomerDetails: boolean
  includeProductDetails: boolean
  format: 'csv' | 'excel'
}

export default function ExportPage() {
  const { isAuthenticated } = useAdminStore()
  const [config, setConfig] = useState<ExportConfig>({
    exportType: 'orders',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    includeCustomerDetails: false,
    includeProductDetails: false,
    format: 'csv'
  })
  const [exporting, setExporting] = useState(false)

  const exportTypes = [
    {
      id: 'orders',
      name: 'Orders Export',
      description: 'Complete order data with customer and product details',
      icon: TableCellsIcon,
      fields: [
        'Order numbers, dates, statuses',
        'Financial data (subtotal, shipping, tax, total)',
        'Payment information',
        'Customer details (optional)',
        'Product details (optional)'
      ]
    },
    {
      id: 'customers',
      name: 'Customer Database',
      description: 'Customer profiles with purchase history and analytics',
      icon: UserGroupIcon,
      fields: [
        'Contact information',
        'Addresses',
        'Registration dates',
        'Order statistics',
        'Spending patterns'
      ]
    },
    {
      id: 'products',
      name: 'Product Performance',
      description: 'Product catalog with sales performance data',
      icon: CubeIcon,
      fields: [
        'Product details and pricing',
        'Sales quantities',
        'Revenue generated',
        'Performance metrics',
        'Inventory status'
      ]
    },
    {
      id: 'financial',
      name: 'Financial Analysis',
      description: 'Revenue, taxes, and profit analysis for business reporting',
      icon: CurrencyDollarIcon,
      fields: [
        'Daily/monthly revenue',
        'Tax collection by state',
        'Profit margins',
        'Customer type analysis',
        'Payment method breakdown'
      ]
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      description: 'Current product availability and catalog management',
      icon: ArchiveBoxIcon,
      fields: [
        'Product catalog',
        'Availability status',
        'Pricing information',
        'Category breakdown',
        'Product lifecycle data'
      ]
    }
  ]

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/admin/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get the CSV content
      const csvContent = await response.text()
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename
      const filename = `${config.exportType}-export-${config.dateFrom}-to-${config.dateTo}.csv`
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      alert(`Export completed! Downloaded: ${filename}`)
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (!isAuthenticated) {
    return <div>Access denied. Please log in as admin.</div>
  }

  const selectedExportType = exportTypes.find(type => type.id === config.exportType)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary-600">Data Export Center</h1>
          <p className="text-secondary-600">Export business data for Excel analysis and reporting</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary flex items-center space-x-2"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>{exporting ? 'Exporting...' : 'Export Data'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Type Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Select Export Type</h3>
          
          <div className="space-y-3">
            {exportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setConfig({ ...config, exportType: type.id as any })}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  config.exportType === type.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <type.icon className={`w-6 h-6 mt-1 ${
                    config.exportType === type.id ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      config.exportType === type.id ? 'text-primary-600' : 'text-gray-700'
                    }`}>
                      {type.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      {type.fields.map((field, index) => (
                        <li key={index}>• {field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Export Configuration</h3>
            
            {selectedExportType && (
              <div className="mb-4 p-3 bg-primary-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <selectedExportType.icon className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-primary-600">{selectedExportType.name}</span>
                </div>
                <p className="text-sm text-primary-700">{selectedExportType.description}</p>
              </div>
            )}

            {/* Date Range */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={config.dateFrom}
                    onChange={(e) => setConfig({ ...config, dateFrom: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={config.dateTo}
                    onChange={(e) => setConfig({ ...config, dateTo: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Orders-specific options */}
            {config.exportType === 'orders' && (
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-gray-700">Additional Data</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.includeCustomerDetails}
                      onChange={(e) => setConfig({ 
                        ...config, 
                        includeCustomerDetails: e.target.checked 
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">Include customer details (names, addresses, contact info)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.includeProductDetails}
                      onChange={(e) => setConfig({ 
                        ...config, 
                        includeProductDetails: e.target.checked 
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">Include detailed product information (sizes, colors, customizations)</span>
                  </label>
                </div>
                
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                  <p><strong>Note:</strong> Including product details will create one row per item (larger file), 
                  otherwise one row per order (smaller file).</p>
                </div>
              </div>
            )}

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Export Format
              </label>
              <select
                value={config.format}
                onChange={(e) => setConfig({ ...config, format: e.target.value as any })}
                className="input-field"
              >
                <option value="csv">CSV (Excel Compatible)</option>
                <option value="excel" disabled>Excel (.xlsx) - Coming Soon</option>
              </select>
            </div>
          </div>

          {/* Export Preview */}
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Export Preview</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Export Type:</span>
                <span className="font-medium">{selectedExportType?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date Range:</span>
                <span className="font-medium">{config.dateFrom} to {config.dateTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium">CSV</span>
              </div>
              
              {config.exportType === 'orders' && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>✓ Order numbers, dates, statuses, totals</div>
                    <div>✓ Financial breakdown (subtotal, shipping, tax)</div>
                    {config.includeCustomerDetails && <div>✓ Customer details and addresses</div>}
                    {config.includeProductDetails && <div>✓ Individual product specifications</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-green-50 rounded text-sm text-green-800">
              <p><strong>Ready for Excel:</strong> The exported CSV file can be opened directly in 
              Microsoft Excel, Google Sheets, or other spreadsheet applications for analysis.</p>
            </div>
          </div>

          {/* Quick Export Buttons */}
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Quick Exports</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  setConfig({ ...config, exportType: 'orders', includeCustomerDetails: true, includeProductDetails: false })
                  setTimeout(handleExport, 100)
                }}
                disabled={exporting}
                className="btn-outline text-sm"
              >
                Orders Summary
              </button>
              <button 
                onClick={() => {
                  setConfig({ ...config, exportType: 'customers' })
                  setTimeout(handleExport, 100)
                }}
                disabled={exporting}
                className="btn-outline text-sm"
              >
                Customer List
              </button>
              <button 
                onClick={() => {
                  setConfig({ ...config, exportType: 'financial' })
                  setTimeout(handleExport, 100)
                }}
                disabled={exporting}
                className="btn-outline text-sm"
              >
                Financial Report
              </button>
              <button 
                onClick={() => {
                  setConfig({ ...config, exportType: 'products' })
                  setTimeout(handleExport, 100)
                }}
                disabled={exporting}
                className="btn-outline text-sm"
              >
                Product Performance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}