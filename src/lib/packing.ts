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
 * Tries different strategies and picks the one with lowest total fallback cost.
 */
export function calculateOptimalPacking(
  items: PackingItem[],
  packageTypes: PackageType[]
): PackingResult {
  const totalUnits = items.reduce((sum, item) => sum + (item.quantity * item.packing_units), 0);
  const totalWeight = items.reduce((sum, item) => sum + (item.quantity * item.weight_lbs), 0);

  if (totalUnits === 0) {
    return { boxes: [], total_packages: 0, total_weight: 0, total_units: 0 };
  }

  // Average weight per packing unit (used for weight constraint estimation)
  const weightPerUnit = totalUnits > 0 ? totalWeight / totalUnits : 0;

  // Sort package types by capacity ascending
  const sortedPackages = [...packageTypes]
    .filter(p => p.capacity_units > 0)
    .sort((a, b) => a.capacity_units - b.capacity_units);

  if (sortedPackages.length === 0) {
    return { boxes: [], total_packages: 0, total_weight: 0, total_units: 0 };
  }

  let bestPacking: PackedBox[] | null = null;
  let bestCost = Infinity;

  // Strategy 1: Try each single package type
  for (const pkgType of sortedPackages) {
    const packing = packAllWithType(totalUnits, weightPerUnit, pkgType);
    const cost = totalFallbackCost(packing);
    if (cost < bestCost) {
      bestCost = cost;
      bestPacking = packing;
    }
  }

  // Strategy 2: Greedy largest-first (fill big boxes, then use smaller for remainder)
  const greedyResult = packGreedyLargestFirst(totalUnits, weightPerUnit, sortedPackages);
  const greedyCost = totalFallbackCost(greedyResult);
  if (greedyCost < bestCost) {
    bestCost = greedyCost;
    bestPacking = greedyResult;
  }

  const boxes = bestPacking || [];

  return {
    boxes,
    total_packages: boxes.length,
    total_weight: boxes.reduce((sum, box) => sum + box.gross_weight, 0),
    total_units: totalUnits
  };
}

/**
 * Determine how many units fit in one box of a given type,
 * respecting both capacity and weight limits.
 */
function unitsPerBox(weightPerUnit: number, pkgType: PackageType): number {
  const byCapacity = Math.floor(pkgType.capacity_units);
  const byWeight = weightPerUnit > 0
    ? Math.floor(pkgType.max_weight_lbs / weightPerUnit)
    : byCapacity;
  return Math.max(1, Math.min(byCapacity, byWeight));
}

/**
 * Pack all units using a single package type.
 */
function packAllWithType(totalUnits: number, weightPerUnit: number, pkgType: PackageType): PackedBox[] {
  const perBox = unitsPerBox(weightPerUnit, pkgType);
  const numBoxes = Math.ceil(totalUnits / perBox);
  const boxes: PackedBox[] = [];
  let remaining = totalUnits;

  for (let i = 0; i < numBoxes; i++) {
    const units = Math.min(remaining, perBox);
    const weight = units * weightPerUnit;
    boxes.push({
      package_type: pkgType,
      total_units: units,
      total_weight: weight,
      gross_weight: weight + pkgType.empty_weight_lbs,
      utilization: units / pkgType.capacity_units
    });
    remaining -= units;
  }

  return boxes;
}

/**
 * Greedy packing: fill the largest package first, then use smaller for leftovers.
 */
function packGreedyLargestFirst(totalUnits: number, weightPerUnit: number, sortedPackages: PackageType[]): PackedBox[] {
  const boxes: PackedBox[] = [];
  let remaining = totalUnits;
  // Work from largest to smallest
  const largestFirst = [...sortedPackages].reverse();

  while (remaining > 0) {
    let packed = false;

    for (const pkgType of largestFirst) {
      const perBox = unitsPerBox(weightPerUnit, pkgType);

      // Only use this box size if we can fill at least half of it,
      // OR it's the smallest available option
      const isSmallest = pkgType === largestFirst[largestFirst.length - 1];
      if (remaining >= perBox || isSmallest) {
        const units = Math.min(remaining, perBox);
        const weight = units * weightPerUnit;
        boxes.push({
          package_type: pkgType,
          total_units: units,
          total_weight: weight,
          gross_weight: weight + pkgType.empty_weight_lbs,
          utilization: units / pkgType.capacity_units
        });
        remaining -= units;
        packed = true;
        break;
      }
    }

    // Safety valve: if nothing packed (shouldn't happen), use smallest box
    if (!packed) {
      const smallest = sortedPackages[0];
      const units = Math.min(remaining, Math.max(1, Math.floor(smallest.capacity_units)));
      const weight = units * weightPerUnit;
      boxes.push({
        package_type: smallest,
        total_units: units,
        total_weight: weight,
        gross_weight: weight + smallest.empty_weight_lbs,
        utilization: units / smallest.capacity_units
      });
      remaining -= units;
    }
  }

  return boxes;
}

/**
 * Total fallback cost = sum of fallback_rate for each box used.
 * Each box costs its full fallback rate regardless of utilization.
 */
function totalFallbackCost(boxes: PackedBox[]): number {
  return boxes.reduce((total, box) => total + box.package_type.fallback_rate, 0);
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
