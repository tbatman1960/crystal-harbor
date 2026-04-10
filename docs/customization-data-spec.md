# Customization Data Specification

**Version:** 1.0  
**Last Updated:** 2026-04-10  
**Status:** Active — referenced by all customization-related code

This document defines the JSON structure output by the customization module when a customer clicks "Add to Cart." It is the **integration contract** between the customization editor and the rest of the site: cart, checkout, order processing, admin review, and PDF export.

---

## Design Specification Object

```json
{
  "designId": "uuid-v4",
  "productId": "uuid-of-product",
  "selectedColor": "Navy",
  "selectedSize": "XL",
  "layers": [
    {
      "id": "uuid-v4",
      "type": "text",
      "order": 1,
      "position": {
        "x": 20.5,
        "y": 15.0,
        "width": 60.0,
        "height": 30.0,
        "rotation": 0
      },
      "visible": true,
      "locked": false,
      "data": {
        "text": "Happy Birthday Mom!",
        "fontFamily": "Impact",
        "fontSize": 48,
        "fontColor": "#FFD700",
        "bold": true,
        "italic": false,
        "alignment": "center"
      }
    },
    {
      "id": "uuid-v4",
      "type": "upload",
      "order": 2,
      "position": {
        "x": 10.0,
        "y": 50.0,
        "width": 40.0,
        "height": 35.0,
        "rotation": 0
      },
      "visible": true,
      "locked": false,
      "data": {
        "imageUrl": "data:image/png;base64,...",
        "originalFilename": "family-photo.jpg",
        "originalWidth": 3024,
        "originalHeight": 4032,
        "dpiAtCurrentSize": 245,
        "lowResolutionFlag": false
      }
    },
    {
      "id": "uuid-v4",
      "type": "catalog",
      "order": 0,
      "position": {
        "x": 0,
        "y": 0,
        "width": 100.0,
        "height": 100.0,
        "rotation": 0
      },
      "visible": true,
      "locked": false,
      "data": {
        "designId": "uuid-of-catalog-design",
        "designName": "Retro Sunset",
        "imageUrl": "https://...supabase.co/storage/v1/.../retro-sunset.jpg"
      }
    },
    {
      "id": "uuid-v4",
      "type": "ai-generated",
      "order": 3,
      "position": { "x": 5, "y": 5, "width": 90, "height": 90, "rotation": 0 },
      "visible": true,
      "locked": false,
      "data": {
        "prompt": "A golden retriever wearing a party hat",
        "model": "stable-diffusion-xl",
        "imageUrl": "data:image/png;base64,...",
        "generationId": "gen-uuid",
        "wasUpscaled": true,
        "originalWidth": 1024,
        "originalHeight": 1024
      }
    },
    {
      "id": "uuid-v4",
      "type": "style-transfer",
      "order": 4,
      "position": { "x": 0, "y": 0, "width": 100, "height": 100, "rotation": 0 },
      "visible": true,
      "locked": false,
      "data": {
        "sourceImageUrl": "data:image/png;base64,...",
        "styleName": "Watercolor",
        "resultImageUrl": "data:image/png;base64,...",
        "transferId": "xfer-uuid"
      }
    }
  ],
  "fees": {
    "baseFee": 2.99,
    "textFees": 0.00,
    "imageFees": 3.00,
    "aiFees": 0.00,
    "upscalingFees": 0.00,
    "styleTransferFees": 0.00,
    "total": 5.99
  },
  "previewImageUrl": "data:image/png;base64,...",
  "aiPreviewImageUrl": null,
  "printFileUrl": null,
  "lowResWarnings": [
    {
      "layerId": "uuid-of-flagged-layer",
      "filename": "old-photo.jpg",
      "currentDpi": 95,
      "recommendedDpi": 300,
      "message": "This image may not print clearly at this size."
    }
  ],
  "metadata": {
    "createdAt": "2026-04-10T12:00:00Z",
    "editorVersion": "1.0",
    "canvasLibrary": "fabric@6"
  }
}
```

---

## Field Reference

### Top Level

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `designId` | string (UUID) | Yes | Unique ID for this design instance, generated on Add to Cart |
| `productId` | string (UUID) | Yes | Product this design is for |
| `selectedColor` | string | Yes | Product color/template the customer chose |
| `selectedSize` | string \| null | No | Product size (set by product page, not the editor) |
| `layers` | Layer[] | Yes | All design elements, ordered by `order` (0 = bottom) |
| `fees` | FeeBreakdown | Yes | Itemized customization charges |
| `previewImageUrl` | string | Yes | 2D composite PNG (data URL or uploaded URL) |
| `aiPreviewImageUrl` | string \| null | No | AI-enhanced 3D preview (Prompt 3) |
| `printFileUrl` | string \| null | No | High-res print file (generated at order processing time) |
| `lowResWarnings` | LowResWarning[] | Yes | Images flagged as insufficient resolution |
| `metadata` | object | Yes | Editor version info for debugging |

### Layer Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique layer ID |
| `type` | enum | `"text"` \| `"upload"` \| `"catalog"` \| `"ai-generated"` \| `"style-transfer"` |
| `order` | number | Z-index (0 = bottom layer) |
| `position.x` | number | Left edge, 0-100 (% of printable area) |
| `position.y` | number | Top edge, 0-100 (% of printable area) |
| `position.width` | number | 0-100 (% of printable area) |
| `position.height` | number | 0-100 (% of printable area) |
| `position.rotation` | number | Degrees, clockwise |
| `visible` | boolean | Whether the layer is visible in the final output |
| `locked` | boolean | Whether the layer was locked by the customer |
| `data` | object | Type-specific payload (see below) |

### Layer Data by Type

**`text`:**
- `text` (string) — the customer's text
- `fontFamily` (string) — font name
- `fontSize` (number) — canvas font size in px
- `fontColor` (string) — hex color
- `bold` (boolean)
- `italic` (boolean)
- `alignment` ("left" | "center" | "right")

**`upload`:**
- `imageUrl` (string) — data URL of uploaded image
- `originalFilename` (string) — customer's filename
- `originalWidth` (number) — pixels
- `originalHeight` (number) — pixels
- `dpiAtCurrentSize` (number) — effective DPI at placed size
- `lowResolutionFlag` (boolean) — true if DPI < 150 at upload time

**`catalog`:**
- `designId` (string) — UUID of the catalog design
- `designName` (string) — display name
- `imageUrl` (string) — URL to the design image

**`ai-generated`** (Prompt 3):
- `prompt` (string) — the text prompt used
- `model` (string) — AI model identifier
- `imageUrl` (string) — generated image data URL
- `generationId` (string) — tracking ID
- `wasUpscaled` (boolean) — whether image was upscaled
- `originalWidth` / `originalHeight` (number)

**`style-transfer`** (Prompt 3):
- `sourceImageUrl` (string) — original image
- `styleName` (string) — style applied
- `resultImageUrl` (string) — result image
- `transferId` (string) — tracking ID

### Fee Breakdown

| Field | Type | Description |
|-------|------|-------------|
| `baseFee` | number | Flat fee for any customization |
| `textFees` | number | Sum of per-text-element fees |
| `imageFees` | number | Sum of per-image fees |
| `aiFees` | number | AI generation charges (Prompt 3) |
| `upscalingFees` | number | AI upscaling charges (Prompt 3) |
| `styleTransferFees` | number | Style transfer charges (Prompt 3) |
| `total` | number | Sum of all fees |

### Low Resolution Warning

| Field | Type | Description |
|-------|------|-------------|
| `layerId` | string | UUID of the flagged layer |
| `filename` | string | Original filename |
| `currentDpi` | number | Effective DPI at current size |
| `recommendedDpi` | number | Always 300 |
| `message` | string | Human-readable warning |

---

## Integration Points

### Cart (Prompt 2)
The `DesignSpecification` is stored alongside the cart item. The cart displays:
- `previewImageUrl` as the item thumbnail
- `fees.total` added to the per-unit price as "Customization: +$X.XX"
- `lowResWarnings` shown as caution icons

### Checkout / Order Creation (Prompt 2)
- The full spec is serialized to JSON and stored in `order_items.customization_data` (JSONB column)
- `printFileUrl` is generated at order processing time (high-res composite)
- `fees.total` is included in the line item calculation

### Admin Order Review
- Admin sees the preview image and can expand to view individual layers
- `lowResWarnings` are highlighted for attention
- Layer data allows admin to understand exactly what the customer designed

### PDF Export
- The `previewImageUrl` is embedded in the order PDF
- For print production, `printFileUrl` provides the 300 DPI file

---

## Mapping from Internal Types

The customization module uses internal TypeScript types (`DesignLayer`, `TextLayer`, etc.) that map to this spec:

| Internal Type | Spec `type` |
|--------------|-------------|
| `TextLayer` | `"text"` |
| `ImageLayer` | `"upload"` |
| `CatalogDesignLayer` | `"catalog"` |
| (Prompt 3) | `"ai-generated"` |
| (Prompt 3) | `"style-transfer"` |

The `DesignSpecification` type in `src/modules/customization/types/index.ts` is the canonical TypeScript interface. This document is the human-readable version.

---

## Versioning

The `metadata.editorVersion` field allows future migration of older design specs if the format changes. Current version: `"1.0"`.
