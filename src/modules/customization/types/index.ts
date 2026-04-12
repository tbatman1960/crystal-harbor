// ─── Core customization types ───────────────────────────────────────

/** Rectangle expressed as percentages of the template image dimensions */
export interface PrintableArea {
  x: number      // left edge, 0-100
  y: number      // top edge, 0-100
  width: number  // 0-100
  height: number // 0-100
}

/** Physical print dimensions in inches */
export interface PhysicalDimensions {
  widthInches: number
  heightInches: number
}

/** A single template image (one per product color) */
export interface ProductTemplate {
  id: string
  productId: string
  colorName: string        // e.g. "White", "Navy"
  imageUrl: string         // URL to the clean product photo
  printableArea: PrintableArea
  physicalDimensions: PhysicalDimensions
  createdAt: string
  updatedAt: string
}

/** Text constraints configured by admin */
export interface TextConstraints {
  maxCharacters: number
  maxLines: number
  availableFonts: string[]
  availableColors: string[]  // hex values
}

/** Per-product customization pricing */
export interface CustomizationPricing {
  baseFee: number           // flat fee when any customization applied
  perTextElementFee: number
  perImageFee: number
  aiGenerationFee: number   // Prompt 3
  aiUpscalingFee: number    // Prompt 3
  styleTransferFee: number  // Prompt 3
}

/** Full admin-managed customization config for a product */
export interface ProductCustomizationConfig {
  productId: string
  templates: ProductTemplate[]
  textConstraints: TextConstraints
  pricing: CustomizationPricing
}

// ─── Canvas layer types ─────────────────────────────────────────────

export type LayerType = 'text' | 'image' | 'catalog-design' | 'ai-generated' | 'style-transfer'

export interface BaseLayer {
  id: string
  type: LayerType
  x: number       // percentage within printable area
  y: number
  width: number   // percentage within printable area
  height: number
  rotation: number // degrees
  zIndex: number
  locked: boolean
}

export interface TextLayer extends BaseLayer {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number    // in canvas units (will map to physical size)
  fontColor: string   // hex
  bold: boolean
  italic: boolean
  alignment: 'left' | 'center' | 'right'
}

export interface ImageLayer extends BaseLayer {
  type: 'image'
  imageUrl: string          // data URL or uploaded URL
  originalFilename: string
  originalWidth: number     // pixels
  originalHeight: number
  dpiAtCurrentSize: number  // computed based on physical area
  lowResolutionFlag: boolean // true if image was flagged as insufficient DPI at upload
}

export interface CatalogDesignLayer extends BaseLayer {
  type: 'catalog-design'
  designId: string
  designName: string
  imageUrl: string
}

export interface AIGeneratedLayer extends BaseLayer {
  type: 'ai-generated'
  prompt: string
  model: string
  imageUrl: string
  generationId: string
  wasUpscaled: boolean
  originalWidth: number
  originalHeight: number
}

export interface StyleTransferLayer extends BaseLayer {
  type: 'style-transfer'
  sourceImageUrl: string
  styleName: string
  imageUrl: string
  transferId: string
}

export type DesignLayer = TextLayer | ImageLayer | CatalogDesignLayer | AIGeneratedLayer | StyleTransferLayer

// ─── Canvas state ───────────────────────────────────────────────────

export interface CanvasState {
  layers: DesignLayer[]
  selectedLayerId: string | null
  selectedColor: string     // which template color is active
}

// ─── Design spec output (sent to cart / order) ─────────────────────

export interface LowResWarning {
  layerId: string
  filename: string
  currentDpi: number
  recommendedDpi: number
  message: string
}

export interface DesignSpecification {
  designId: string              // unique ID for this design instance
  productId: string
  templateId: string
  selectedColor: string
  selectedSize: string | null   // set by product page, not editor
  layers: DesignLayer[]
  fees: {
    baseFee: number
    textFees: number
    imageFees: number
    aiFees: number
    upscalingFees: number
    styleTransferFees: number
    total: number
  }
  previewImageUrl: string       // composite preview data URL
  aiPreviewImageUrl: string | null  // Prompt 3
  printFileUrl: string | null       // generated at order time
  lowResWarnings: LowResWarning[]
  metadata: {
    createdAt: string
    editorVersion: string
    canvasLibrary: string
  }
}

// ─── Props for the customization module entry point ─────────────────

export interface CustomizationModuleProps {
  productId: string
  productName: string
  basePrice: number
  config: ProductCustomizationConfig
  catalogDesigns: CatalogDesign[]
  allowText: boolean
  allowImageUpload: boolean
  allowCatalogDesigns: boolean
  allowAiGeneration: boolean
  allowStyleTransfer: boolean
  onAddToCart: (spec: DesignSpecification) => void
  onCancel: () => void
}

export interface CatalogDesign {
  id: string
  name: string
  imageUrl: string
  thumbnailUrl: string
  category: string
}

// ─── Database row shapes ────────────────────────────────────────────

export interface ProductTemplateRow {
  id: string
  product_id: string
  color_name: string
  image_url: string
  printable_area_x: number
  printable_area_y: number
  printable_area_width: number
  printable_area_height: number
  physical_width_inches: number
  physical_height_inches: number
  created_at: string
  updated_at: string
}

export interface ProductCustomizationSettingsRow {
  id: string
  product_id: string
  max_characters: number
  max_lines: number
  available_fonts: string     // JSON array
  available_colors: string    // JSON array
  base_fee: number
  per_text_element_fee: number
  per_image_fee: number
  ai_generation_fee: number
  ai_upscaling_fee: number
  style_transfer_fee: number
  created_at: string
  updated_at: string
}
