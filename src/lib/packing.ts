export interface PackingItem {
  product_name: string;
  quantity: number;
  packing_units: number; // per unit
  weight_lbs: number;    // per unit
}

export interface PackageType {
  id: string;
  name: string;
  capacity_units: number;
  max_weight_lbs: number;
  length_inches: number;
  width_inches: number;
  height_inches: number;
  empty_weight_lbs: number;
  fallback_rate: number;
  sort_order: number;
}

export interface PackedBox {
  package_type: PackageType;
  total_units: number;
  total_weight: number; // contents only
  gross_weight: number; // contents + empty package weight
  utilization: number;  // 0-1, units used / capacity
}

export interface PackingResult {
  boxes: PackedBox[];
  total_packages: number;
  total_weight: number;
  total_units: number;
}

/**
 * Calculates the optimal packing for a list of items using available package types.
 * Tries different combinations and picks the one with lowest total fallback cost.
 */
export function calculateOptimalPacking(
  items: PackingItem[],
  packageTypes: PackageType[]
): PackingResult {
  // Calculate total requirements
  const totalUnits = items.reduce((sum, item) => sum + (item.quantity * item.packing_units), 0);
  const totalWeight = items.reduce((sum, item) => sum + (item.quantity * item.weight_lbs), 0);

  if (totalUnits === 0) {
    return {
      boxes: [],
      total_packages: 0,
      total_weight: 0,
      total_units: 0
    };
  }

  // Sort package types by capacity ascending for efficient algorithm
  const sortedPackages = [...packageTypes].sort((a, b) => a.capacity_units - b.capacity_units);

  let bestPacking: PackedBox[] = [];
  let bestCost = Infinity;

  // Try different packing strategies
  const strategies = [
    () => packWithSingleType(totalUnits, totalWeight, sortedPackages),
    () => packLargestFirst(totalUnits, totalWeight, sortedPackages)
  ];

  for (const strategy of strategies) {
    const packing = strategy();
    if (packing && packing.length > 0) {
      const cost = calculateFallbackCost(packing);
      if (cost < bestCost) {
        bestCost = cost;
        bestPacking = packing;
      }
    }
  }

  // If no valid packing found, use the largest available package
  if (bestPacking.length === 0) {
    const largestPackage = sortedPackages[sortedPackages.length - 1];
    if (largestPackage) {
      bestPacking = createFallbackPacking(totalUnits, totalWeight, largestPackage);
    }
  }

  return {
    boxes: bestPacking,
    total_packages: bestPacking.length,
    total_weight: bestPacking.reduce((sum, box) => sum + box.gross_weight, 0),
    total_units: totalUnits
  };
}

/**
 * Try using all boxes of the same type for each available package type
 */
function packWithSingleType(totalUnits: number, totalWeight: number, packageTypes: PackageType[]): PackedBox[] | null {
  let bestPacking: PackedBox[] | null = null;
  let bestCost = Infinity;

  for (const packageType of packageTypes) {
    const packing = tryPackingWithType(totalUnits, totalWeight, packageType);
    if (packing && packing.length > 0) {
      const cost = calculateFallbackCost(packing);
      if (cost < bestCost) {
        bestCost = cost;
        bestPacking = packing;
      }
    }
  }

  return bestPacking;
}

/**
 * Try packing starting with largest boxes, using smaller for remainder
 */
function packLargestFirst(totalUnits: number, totalWeight: number, packageTypes: PackageType[]): PackedBox[] | null {
  const reversedPackages = [...packageTypes].reverse(); // Largest first
  return greedyPacking(totalUnits, totalWeight, reversedPackages);
}

/**
 * Greedy packing algorithm using packages in order
 */
function greedyPacking(remainingUnits: number, remainingWeight: number, packageTypes: PackageType[]): PackedBox[] | null {
  const boxes: PackedBox[] = [];
  let unitsLeft = remainingUnits;
  let weightLeft = remainingWeight;

  while (unitsLeft > 0) {
    let packed = false;

    for (const packageType of packageTypes) {
      const canFitUnits = Math.floor(packageType.capacity_units);
      const canFitWeight = packageType.max_weight_lbs;

      // Calculate how much we can fit in this package
      const unitsToFit = Math.min(unitsLeft, canFitUnits);
      
      // Estimate weight per unit for weight constraint
      const avgWeightPerUnit = remainingWeight / remainingUnits;
      const maxUnitsByWeight = Math.floor(canFitWeight / avgWeightPerUnit);
      const actualUnits = Math.min(unitsToFit, maxUnitsByWeight);

      if (actualUnits > 0) {
        const actualWeight = (actualUnits / remainingUnits) * remainingWeight;
        
        if (actualWeight <= canFitWeight) {
          boxes.push({
            package_type: packageType,
            total_units: actualUnits,
            total_weight: actualWeight,
            gross_weight: actualWeight + packageType.empty_weight_lbs,
            utilization: actualUnits / packageType.capacity_units
          });

          unitsLeft -= actualUnits;
          weightLeft -= actualWeight;
          packed = true;
          break;
        }
      }
    }

    if (!packed) {
      // Use the largest package as fallback
      const largestPackage = packageTypes[packageTypes.length - 1];
      if (largestPackage) {
        boxes.push(...createFallbackPacking(unitsLeft, weightLeft, largestPackage));
      }
      break;
    }
  }

  return boxes.length > 0 ? boxes : null;
}

/**
 * Try to pack everything using only one package type
 */
function tryPackingWithType(totalUnits: number, totalWeight: number, packageType: PackageType): PackedBox[] | null {
  const unitsPerBox = Math.floor(packageType.capacity_units);
  const weightPerBox = packageType.max_weight_lbs;

  if (unitsPerBox <= 0) return null;

  // Calculate boxes needed for unit constraint
  const boxesForUnits = Math.ceil(totalUnits / unitsPerBox);
  
  // Calculate boxes needed for weight constraint
  const boxesForWeight = Math.ceil(totalWeight / weightPerBox);

  // Need the higher of the two
  const totalBoxes = Math.max(boxesForUnits, boxesForWeight);

  const boxes: PackedBox[] = [];
  let remainingUnits = totalUnits;
  let remainingWeight = totalWeight;

  for (let i = 0; i < totalBoxes; i++) {
    const unitsInBox = Math.min(remainingUnits, unitsPerBox);
    const weightInBox = Math.min(remainingWeight, weightPerBox);

    // Ensure we don't exceed weight limits
    const actualUnitsInBox = Math.min(unitsInBox, Math.floor(weightPerBox / (totalWeight / totalUnits)));
    const actualWeightInBox = (actualUnitsInBox / totalUnits) * totalWeight;

    boxes.push({
      package_type: packageType,
      total_units: actualUnitsInBox,
      total_weight: actualWeightInBox,
      gross_weight: actualWeightInBox + packageType.empty_weight_lbs,
      utilization: actualUnitsInBox / packageType.capacity_units
    });

    remainingUnits -= actualUnitsInBox;
    remainingWeight -= actualWeightInBox;
  }

  return boxes;
}

/**
 * Create a fallback packing when no optimal solution found
 */
function createFallbackPacking(totalUnits: number, totalWeight: number, packageType: PackageType): PackedBox[] {
  const boxes: PackedBox[] = [];
  const unitsPerBox = Math.floor(packageType.capacity_units);
  const weightPerBox = packageType.max_weight_lbs;

  if (unitsPerBox <= 0) {
    // If package can't fit anything, create one box anyway
    return [{
      package_type: packageType,
      total_units: totalUnits,
      total_weight: totalWeight,
      gross_weight: totalWeight + packageType.empty_weight_lbs,
      utilization: 1 // Force 100% utilization for fallback
    }];
  }

  let remainingUnits = totalUnits;
  let remainingWeight = totalWeight;

  while (remainingUnits > 0 || remainingWeight > 0) {
    const unitsInBox = Math.min(remainingUnits, unitsPerBox);
    const weightInBox = Math.min(remainingWeight, weightPerBox);

    boxes.push({
      package_type: packageType,
      total_units: unitsInBox,
      total_weight: weightInBox,
      gross_weight: weightInBox + packageType.empty_weight_lbs,
      utilization: unitsInBox / packageType.capacity_units
    });

    remainingUnits -= unitsInBox;
    remainingWeight -= weightInBox;
  }

  return boxes;
}

/**
 * Calculate total fallback cost for a packing solution
 */
function calculateFallbackCost(boxes: PackedBox[]): number {
  return boxes.reduce((total, box) => {
    return total + (box.utilization * box.package_type.fallback_rate);
  }, 0);
}

/**
 * Helper function to convert cart items to packing items
 */
export function cartItemsToPackingItems(cartItems: any[], products: any[]): PackingItem[] {
  return cartItems.map(cartItem => {
    const product = products.find(p => p.id === cartItem.product_id || p.slug === cartItem.product_slug);
    
    return {
      product_name: cartItem.product_name || product?.name || 'Unknown Product',
      quantity: cartItem.quantity || 1,
      packing_units: product?.packing_units || 1.0,
      weight_lbs: product?.packed_weight_lbs || 0.5
    };
  });
}