// Public API for the customization module
export { CustomizationModal } from './components/CustomizationModal'
export { CustomizationEditor } from './components/CustomizationEditor'
export type {
  DesignSpecification,
  DesignLayer,
  TextLayer,
  ImageLayer,
  CatalogDesignLayer,
  AIGeneratedLayer,
  StyleTransferLayer,
  LowResWarning,
  CustomizationModuleProps,
  ProductCustomizationConfig,
  CatalogDesign,
  CustomizationPricing,
} from './types'
export { calculateFees } from './utils/pricing'
