import { useRef, useCallback, useEffect, useState } from 'react'
import * as fabric from 'fabric'
import type { DesignLayer, TextLayer, ImageLayer, CatalogDesignLayer, PrintableArea, PhysicalDimensions } from '../types'
import { v4 as uuidv4 } from 'uuid'

interface UseCanvasEditorOptions {
  printableArea: PrintableArea
  physicalDimensions: PhysicalDimensions
  templateImageUrl: string
  canvasWidth: number
  canvasHeight: number
  onLayersChange: (layers: DesignLayer[]) => void
}

export function useCanvasEditor(options: UseCanvasEditorOptions) {
  const {
    printableArea,
    physicalDimensions,
    templateImageUrl,
    canvasWidth,
    canvasHeight,
    onLayersChange,
  } = options

  const canvasRef = useRef<fabric.Canvas | null>(null)
  const containerRef = useRef<HTMLCanvasElement | null>(null)
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Convert printable area percentages to canvas pixels
  const getPrintableAreaPx = useCallback(() => ({
    left: (printableArea.x / 100) * canvasWidth,
    top: (printableArea.y / 100) * canvasHeight,
    width: (printableArea.width / 100) * canvasWidth,
    height: (printableArea.height / 100) * canvasHeight,
  }), [printableArea, canvasWidth, canvasHeight])

  // Initialize canvas
  const initCanvas = useCallback((canvasEl: HTMLCanvasElement) => {
    if (canvasRef.current) {
      canvasRef.current.dispose()
    }

    const canvas = new fabric.Canvas(canvasEl, {
      width: canvasWidth,
      height: canvasHeight,
      selection: true,
      preserveObjectStacking: true,
      backgroundColor: '#f0f0f0',
    })

    canvasRef.current = canvas
    containerRef.current = canvasEl

    // Load template image as background
    fabric.FabricImage.fromURL(templateImageUrl, { crossOrigin: 'anonymous' }).then((img) => {
      const scaleX = canvasWidth / (img.width || canvasWidth)
      const scaleY = canvasHeight / (img.height || canvasHeight)
      img.set({ scaleX, scaleY, selectable: false, evented: false })
      canvas.backgroundImage = img
      canvas.renderAll()

      // Draw printable area boundary
      drawPrintableAreaBorder(canvas)
      setIsReady(true)
    }).catch(() => {
      // If template fails to load, still draw printable area
      drawPrintableAreaBorder(canvas)
      setIsReady(true)
    })

    // Selection events
    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0]
      if (obj) setSelectedObjectId((obj as any).layerId || null)
    })
    canvas.on('selection:updated', (e) => {
      const obj = e.selected?.[0]
      if (obj) setSelectedObjectId((obj as any).layerId || null)
    })
    canvas.on('selection:cleared', () => {
      setSelectedObjectId(null)
    })

    // Object modification — sync back to layers
    canvas.on('object:modified', () => {
      syncLayersFromCanvas(canvas)
    })

    return canvas
  }, [canvasWidth, canvasHeight, templateImageUrl, printableArea])

  const drawPrintableAreaBorder = useCallback((canvas: fabric.Canvas) => {
    const area = getPrintableAreaPx()

    // Remove old border if exists
    const existing = canvas.getObjects().find((o: any) => o.isPrintableAreaBorder)
    if (existing) canvas.remove(existing)

    const border = new fabric.Rect({
      left: area.left,
      top: area.top,
      width: area.width,
      height: area.height,
      fill: 'transparent',
      stroke: 'rgba(59, 130, 246, 0.5)',
      strokeWidth: 2,
      strokeDashArray: [8, 4],
      selectable: false,
      evented: false,
    })
    ;(border as any).isPrintableAreaBorder = true
    canvas.add(border)
    canvas.renderAll()
  }, [getPrintableAreaPx])

  // Constrain objects to printable area
  const constrainToArea = useCallback((obj: fabric.FabricObject) => {
    const area = getPrintableAreaPx()
    const bound = obj.getBoundingRect()

    let newLeft = obj.left ?? 0
    let newTop = obj.top ?? 0

    if (bound.left < area.left) newLeft = area.left
    if (bound.top < area.top) newTop = area.top
    if (bound.left + bound.width > area.left + area.width) {
      newLeft = area.left + area.width - bound.width
    }
    if (bound.top + bound.height > area.top + area.height) {
      newTop = area.top + area.height - bound.height
    }

    obj.set({ left: newLeft, top: newTop })
    obj.setCoords()
  }, [getPrintableAreaPx])

  // Extract layers from canvas objects
  const syncLayersFromCanvas = useCallback((canvas: fabric.Canvas) => {
    const layers: DesignLayer[] = []
    const area = getPrintableAreaPx()

    canvas.getObjects().forEach((obj: any, index: number) => {
      if (obj.isPrintableAreaBorder) return
      if (!obj.layerId) return

      const baseLayer = {
        id: obj.layerId,
        x: ((obj.left - area.left) / area.width) * 100,
        y: ((obj.top - area.top) / area.height) * 100,
        width: ((obj.getScaledWidth()) / area.width) * 100,
        height: ((obj.getScaledHeight()) / area.height) * 100,
        rotation: obj.angle || 0,
        zIndex: index,
        locked: !obj.selectable,
      }

      if (obj.layerType === 'text') {
        layers.push({
          ...baseLayer,
          type: 'text',
          text: obj.text || '',
          fontFamily: obj.fontFamily || 'Arial',
          fontSize: obj.fontSize || 24,
          fontColor: obj.fill as string || '#000000',
          bold: obj.fontWeight === 'bold',
          italic: obj.fontStyle === 'italic',
          alignment: obj.textAlign as 'left' | 'center' | 'right' || 'center',
        } as TextLayer)
      } else if (obj.layerType === 'image') {
        layers.push({
          ...baseLayer,
          type: 'image',
          imageUrl: obj.layerImageUrl || '',
          originalFilename: obj.originalFilename || '',
          originalWidth: obj.originalWidth || 0,
          originalHeight: obj.originalHeight || 0,
          dpiAtCurrentSize: obj.dpiAtCurrentSize || 0,
          lowResolutionFlag: obj.lowResolutionFlag || false,
        } as ImageLayer)
      } else if (obj.layerType === 'catalog-design') {
        layers.push({
          ...baseLayer,
          type: 'catalog-design',
          designId: obj.designId || '',
          designName: obj.designName || '',
          imageUrl: obj.layerImageUrl || '',
        } as CatalogDesignLayer)
      }
    })

    onLayersChange(layers)
  }, [getPrintableAreaPx, onLayersChange])

  // Add text element
  const addText = useCallback((
    text = 'Your Text',
    fontFamily = 'Arial',
    fontSize = 32,
    fontColor = '#000000',
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const area = getPrintableAreaPx()
    const id = uuidv4()

    const textObj = new fabric.IText(text, {
      left: area.left + area.width / 2,
      top: area.top + area.height / 2,
      fontFamily,
      fontSize,
      fill: fontColor,
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
    })

    ;(textObj as any).layerId = id
    ;(textObj as any).layerType = 'text'

    textObj.on('moving', () => constrainToArea(textObj))

    canvas.add(textObj)
    canvas.setActiveObject(textObj)
    canvas.renderAll()
    syncLayersFromCanvas(canvas)
    setSelectedObjectId(id)

    return id
  }, [getPrintableAreaPx, constrainToArea, syncLayersFromCanvas])

  // Add image
  const addImage = useCallback(async (
    imageUrl: string,
    originalFilename: string,
    originalWidth: number,
    originalHeight: number,
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const area = getPrintableAreaPx()
    const id = uuidv4()

    try {
      const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })

      // Scale to fit within printable area (max 80% of area)
      const maxW = area.width * 0.8
      const maxH = area.height * 0.8
      const imgW = img.width || 100
      const imgH = img.height || 100
      const scale = Math.min(maxW / imgW, maxH / imgH, 1)

      img.set({
        left: area.left + area.width / 2,
        top: area.top + area.height / 2,
        scaleX: scale,
        scaleY: scale,
        originX: 'center',
        originY: 'center',
      })

      ;(img as any).layerId = id
      ;(img as any).layerType = 'image'
      ;(img as any).layerImageUrl = imageUrl
      ;(img as any).originalFilename = originalFilename
      ;(img as any).originalWidth = originalWidth
      ;(img as any).originalHeight = originalHeight

      // Calculate DPI and flag low-res
      const physicalScaleW = (img.getScaledWidth() / area.width) * physicalDimensions.widthInches
      const initialDpi = physicalScaleW > 0 ? Math.round(originalWidth / physicalScaleW) : 0
      ;(img as any).dpiAtCurrentSize = initialDpi
      ;(img as any).lowResolutionFlag = initialDpi > 0 && initialDpi < 150

      img.on('moving', () => constrainToArea(img))
      img.on('scaling', () => {
        const sw = (img.getScaledWidth() / area.width) * physicalDimensions.widthInches
        ;(img as any).dpiAtCurrentSize = sw > 0 ? Math.round(originalWidth / sw) : 0
      })

      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
      syncLayersFromCanvas(canvas)
      setSelectedObjectId(id)
    } catch (err) {
      console.error('Failed to add image to canvas:', err)
    }

    return id
  }, [getPrintableAreaPx, physicalDimensions, constrainToArea, syncLayersFromCanvas])

  // Add catalog design
  const addCatalogDesign = useCallback(async (
    designId: string,
    designName: string,
    imageUrl: string,
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const area = getPrintableAreaPx()
    const id = uuidv4()

    try {
      const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })

      const maxW = area.width * 0.6
      const maxH = area.height * 0.6
      const imgW = img.width || 100
      const imgH = img.height || 100
      const scale = Math.min(maxW / imgW, maxH / imgH, 1)

      img.set({
        left: area.left + area.width / 2,
        top: area.top + area.height / 2,
        scaleX: scale,
        scaleY: scale,
        originX: 'center',
        originY: 'center',
      })

      ;(img as any).layerId = id
      ;(img as any).layerType = 'catalog-design'
      ;(img as any).designId = designId
      ;(img as any).designName = designName
      ;(img as any).layerImageUrl = imageUrl

      img.on('moving', () => constrainToArea(img))

      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
      syncLayersFromCanvas(canvas)
      setSelectedObjectId(id)
    } catch (err) {
      console.error('Failed to add catalog design:', err)
    }

    return id
  }, [getPrintableAreaPx, constrainToArea, syncLayersFromCanvas])

  // Update selected text properties
  const updateTextProperties = useCallback((props: {
    fontFamily?: string
    fontSize?: number
    fontColor?: string
    bold?: boolean
    italic?: boolean
    alignment?: 'left' | 'center' | 'right'
  }) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const active = canvas.getActiveObject()
    if (!active || (active as any).layerType !== 'text') return

    const textObj = active as fabric.IText
    if (props.fontFamily) textObj.set('fontFamily', props.fontFamily)
    if (props.fontSize) textObj.set('fontSize', props.fontSize)
    if (props.fontColor) textObj.set('fill', props.fontColor)
    if (props.bold !== undefined) textObj.set('fontWeight', props.bold ? 'bold' : 'normal')
    if (props.italic !== undefined) textObj.set('fontStyle', props.italic ? 'italic' : 'normal')
    if (props.alignment) textObj.set('textAlign', props.alignment)

    canvas.renderAll()
    syncLayersFromCanvas(canvas)
  }, [syncLayersFromCanvas])

  // Remove selected object
  const removeSelected = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const active = canvas.getActiveObject()
    if (active && (active as any).layerId) {
      canvas.remove(active)
      canvas.renderAll()
      syncLayersFromCanvas(canvas)
      setSelectedObjectId(null)
    }
  }, [syncLayersFromCanvas])

  // Move layer order
  const moveLayer = useCallback((direction: 'up' | 'down') => {
    const canvas = canvasRef.current
    if (!canvas) return

    const active = canvas.getActiveObject()
    if (!active) return

    if (direction === 'up') {
      canvas.bringObjectForward(active)
    } else {
      canvas.sendObjectBackwards(active)
    }
    canvas.renderAll()
    syncLayersFromCanvas(canvas)
  }, [syncLayersFromCanvas])

  // Export composite as data URL
  const exportPreview = useCallback((quality = 0.8): string => {
    const canvas = canvasRef.current
    if (!canvas) return ''

    // Deselect to remove selection handles
    canvas.discardActiveObject()
    canvas.renderAll()

    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality,
      multiplier: 1,
    })

    return dataUrl
  }, [])

  // Export high-res for print
  const exportPrintReady = useCallback((dpi = 300): string => {
    const canvas = canvasRef.current
    if (!canvas) return ''

    canvas.discardActiveObject()
    canvas.renderAll()

    // Calculate multiplier to achieve target DPI
    const physicalWidthInches = physicalDimensions.widthInches
    const printableWidthPx = (printableArea.width / 100) * canvasWidth
    const targetPixels = physicalWidthInches * dpi
    const multiplier = targetPixels / printableWidthPx

    return canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: Math.min(multiplier, 4), // cap at 4x
    })
  }, [physicalDimensions, printableArea, canvasWidth])

  // Clear all design elements
  const clearAll = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const toRemove = canvas.getObjects().filter((o: any) => o.layerId)
    toRemove.forEach(obj => canvas.remove(obj))
    canvas.discardActiveObject()
    canvas.renderAll()
    syncLayersFromCanvas(canvas)
    setSelectedObjectId(null)
  }, [syncLayersFromCanvas])

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((layerId: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const obj = canvas.getObjects().find((o: any) => o.layerId === layerId)
    if (obj) {
      obj.set('visible', !obj.visible)
      canvas.renderAll()
    }
  }, [])

  // Cleanup
  const dispose = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.dispose()
      canvasRef.current = null
    }
  }, [])

  // Get selected object info
  const getSelectedObject = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const active = canvas.getActiveObject()
    if (!active || !(active as any).layerId) return null

    return {
      id: (active as any).layerId,
      type: (active as any).layerType as string,
      text: (active as any).text,
      fontFamily: (active as any).fontFamily,
      fontSize: (active as any).fontSize,
      fill: (active as any).fill,
      fontWeight: (active as any).fontWeight,
      fontStyle: (active as any).fontStyle,
      textAlign: (active as any).textAlign,
      dpiAtCurrentSize: (active as any).dpiAtCurrentSize,
      originalFilename: (active as any).originalFilename,
    }
  }, [])

  return {
    canvasRef,
    initCanvas,
    isReady,
    selectedObjectId,
    addText,
    addImage,
    addCatalogDesign,
    updateTextProperties,
    removeSelected,
    clearAll,
    moveLayer,
    toggleLayerVisibility,
    exportPreview,
    exportPrintReady,
    getSelectedObject,
    dispose,
  }
}
