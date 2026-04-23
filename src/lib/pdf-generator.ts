// PDF generation utilities
// This is a client-side only module due to jsPDF and html2canvas dependencies

import { OrderDetails } from '@/app/checkout/success/page'
import type { DesignSpecification } from '@/modules/customization'

// Check if running in browser
const isBrowser = typeof window !== 'undefined'

let jsPDF: any = null
let html2canvas: any = null

// Dynamic imports for client-side only
const loadDependencies = async () => {
  if (!isBrowser) return false
  
  try {
    if (!jsPDF) {
      const jsPDFModule = await import('jspdf')
      jsPDF = jsPDFModule.default
    }
    if (!html2canvas) {
      const html2canvasModule = await import('html2canvas')
      html2canvas = html2canvasModule.default
    }
    return true
  } catch (error) {
    console.error('Error loading PDF dependencies:', error)
    return false
  }
}

/**
 * Generate and download PDF from HTML element
 */
export async function generatePDFFromElement(
  elementId: string, 
  filename: string = 'order-summary.pdf'
): Promise<{ success: boolean; error?: string }> {
  if (!isBrowser) {
    return { success: false, error: 'PDF generation only available in browser' }
  }

  try {
    const loaded = await loadDependencies()
    if (!loaded) {
      return { success: false, error: 'Failed to load PDF dependencies' }
    }

    const element = document.getElementById(elementId)
    if (!element) {
      return { success: false, error: `Element with ID '${elementId}' not found` }
    }

    // Generate canvas from HTML
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    // Calculate dimensions
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 295 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if content is tall
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Download the PDF
    pdf.save(filename)
    return { success: true }

  } catch (error) {
    console.error('Error generating PDF:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error generating PDF' 
    }
  }
}

/**
 * Generate PDF from order data programmatically
 */
export async function generateOrderPDF(
  orderData: OrderDetails,
  filename: string = `order-${orderData.order_number}.pdf`
): Promise<{ success: boolean; error?: string }> {
  if (!isBrowser) {
    return { success: false, error: 'PDF generation only available in browser' }
  }

  try {
    const loaded = await loadDependencies()
    if (!loaded) {
      return { success: false, error: 'Failed to load PDF dependencies' }
    }

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 20

    // Helper function to add text with line wrapping
    const addText = (text: string, x: number, fontSize: number = 10, fontWeight: string = 'normal') => {
      pdf.setFontSize(fontSize)
      pdf.setFont('helvetica', fontWeight)
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * x)
      pdf.text(lines, x, yPosition)
      yPosition += lines.length * (fontSize * 0.4) + 2
      return lines.length
    }

    // Add header
    pdf.setFillColor(30, 58, 138) // Primary blue
    pdf.rect(0, 0, pageWidth, 30, 'F')
    
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text('DearPast', 20, 15)
    
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Order Confirmation', 20, 25)

    yPosition = 40
    pdf.setTextColor(0, 0, 0) // Reset to black

    // Order information
    addText('Order Information', 20, 14, 'bold')
    addText(`Order Number: ${orderData.order_number}`, 20, 10)
    addText(`Order Date: ${new Date(orderData.created_at).toLocaleDateString()}`, 20, 10)
    addText(`Status: ${orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}`, 20, 10)
    addText(`Estimated Delivery: ${orderData.estimated_delivery || '2-3 weeks from order date'}`, 20, 10)

    yPosition += 10

    // Shipping address
    addText('Shipping Address', 20, 14, 'bold')
    addText(`${orderData.shipping_address.first_name} ${orderData.shipping_address.last_name}`, 20, 10)
    addText(orderData.shipping_address.address_line_1, 20, 10)
    if (orderData.shipping_address.address_line_2) {
      addText(orderData.shipping_address.address_line_2, 20, 10)
    }
    addText(`${orderData.shipping_address.city}, ${orderData.shipping_address.state} ${orderData.shipping_address.postal_code}`, 20, 10)
    addText(orderData.shipping_address.country, 20, 10)

    yPosition += 10

    // Order items
    addText('Order Items', 20, 14, 'bold')
    
    orderData.order_items.forEach((item, index) => {
      addText(`${index + 1}. ${item.product_name}`, 20, 11, 'bold')
      
      if (item.selected_size) addText(`   Size: ${item.selected_size}`, 25, 9)
      if (item.selected_color) addText(`   Color: ${item.selected_color}`, 25, 9)
      
      // Legacy design display
      if (item.selected_design && !item.customization_data) {
        addText(`   Design: ${item.selected_design.name}`, 25, 9)
      }
      if (item.custom_text && !item.customization_data) {
        addText(`   Custom Text: "${item.custom_text}"`, 25, 9)
      }

      // New customization system
      if (item.customization_data) {
        addText('   ✨ Custom Design Specifications:', 25, 9, 'bold')
        
        // Design overview
        const spec = item.customization_data
        addText(`   • Design ID: ${spec.designId}`, 30, 8)
        addText(`   • Design Elements: ${spec.layers.length} layers`, 30, 8)
        if (spec.fees.total > 0) {
          addText(`   • Customization Fee: $${spec.fees.total.toFixed(2)}`, 30, 8)
        }

        // Layer details
        spec.layers.forEach((layer, layerIndex) => {
          const layerNum = layerIndex + 1
          switch (layer.type) {
            case 'text':
              const textLayer = layer as any // TextLayer from spec
              addText(`   • Layer ${layerNum}: Text - "${textLayer.text}"`, 30, 8)
              addText(`     Font: ${textLayer.fontFamily}, ${textLayer.fontSize}px, ${textLayer.fontColor}`, 33, 7)
              if (textLayer.bold) addText(`     Bold: Yes`, 33, 7)
              if (textLayer.italic) addText(`     Italic: Yes`, 33, 7)
              addText(`     Alignment: ${textLayer.alignment}`, 33, 7)
              break
            case 'image':
              const imageLayer = layer as any // ImageLayer from spec
              addText(`   • Layer ${layerNum}: Uploaded Image - ${imageLayer.originalFilename}`, 30, 8)
              addText(`     Resolution: ${imageLayer.dpiAtCurrentSize} DPI (${imageLayer.originalWidth} × ${imageLayer.originalHeight}px)`, 33, 7)
              if (imageLayer.lowResolutionFlag) {
                addText(`     ⚠️ Low resolution warning`, 33, 7)
              }
              break
            case 'catalog-design':
              const catalogLayer = layer as any // CatalogDesignLayer from spec
              addText(`   • Layer ${layerNum}: Catalog Design - ${catalogLayer.designName}`, 30, 8)
              break
          }
          
          // Position info for all layers
          addText(`     Position: ${layer.x.toFixed(1)}%, ${layer.y.toFixed(1)}% (${layer.width.toFixed(1)}% × ${layer.height.toFixed(1)}%)`, 33, 7)
          if (layer.rotation !== 0) {
            addText(`     Rotation: ${layer.rotation}°`, 33, 7)
          }
        })

        // Print file reference
        if (spec.printFileUrl) {
          addText(`   • Print File: Available at order processing`, 30, 8)
          addText(`     URL: ${spec.printFileUrl}`, 33, 7)
        }

        // Low resolution warnings
        if (spec.lowResWarnings.length > 0) {
          addText(`   ⚠️ Print Quality Warnings:`, 30, 8, 'bold')
          spec.lowResWarnings.forEach(warning => {
            addText(`     • ${warning.filename}: ${warning.currentDpi} DPI (recommended: ${warning.recommendedDpi})`, 33, 7)
            addText(`       ${warning.message}`, 35, 7)
          })
        }

        yPosition += 3 // Extra space after customization details
      }
      
      addText(`   Quantity: ${item.quantity} × $${item.unit_price.toFixed(2)}${item.customization_fee ? ` + $${item.customization_fee.toFixed(2)} customization` : ''} = $${item.line_total.toFixed(2)}`, 25, 9)
      yPosition += 5
      
      // Add new page if needed
      if (yPosition > pageHeight - 40) {
        pdf.addPage()
        yPosition = 20
      }
    })

    yPosition += 10

    // Order summary
    addText('Order Summary', 20, 14, 'bold')
    addText(`Subtotal: $${orderData.subtotal.toFixed(2)}`, 20, 10)
    addText(`Shipping: $${orderData.shipping_cost.toFixed(2)}`, 20, 10)
    if (orderData.tax_amount && orderData.tax_amount > 0) {
      addText(`Tax: $${orderData.tax_amount.toFixed(2)}`, 20, 10)
    }
    
    // Total with emphasis
    pdf.setDrawColor(0, 0, 0)
    pdf.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 5
    addText(`Total: $${orderData.total_amount.toFixed(2)}`, 20, 12, 'bold')

    yPosition += 10

    // Footer
    addText('What\'s Next?', 20, 12, 'bold')
    addText('• Your order will be reviewed and prepared for printing', 20, 9)
    addText('• We\'ll send you design proofs if applicable', 20, 9)
    addText('• Professional printing begins once approved', 20, 9)
    addText('• Quality check and careful packaging', 20, 9)
    addText('• Shipment with tracking information', 20, 9)

    yPosition += 10

    // Contact info
    addText('Questions?', 20, 12, 'bold')
    addText('Email: info@crystalharbortc.com | Phone: (317) 997-5503', 20, 9)

    // Download the PDF
    pdf.save(filename)
    return { success: true }

  } catch (error) {
    console.error('Error generating order PDF:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error generating PDF' 
    }
  }
}

/**
 * Print current page
 */
export function printPage(): void {
  if (isBrowser) {
    window.print()
  }
}

/**
 * Check if PDF generation is supported
 */
export function isPDFSupported(): boolean {
  return isBrowser && typeof window !== 'undefined'
}