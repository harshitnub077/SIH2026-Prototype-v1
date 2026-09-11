'use client';

/**
 * FieldGrid.jsx
 * Displays all extracted label declarations in a clean two-column table.
 * - Green dot = field found / Red dot = field missing
 * - [est.] tag for fields that were estimated (e.g. font size)
 */

const FIELD_LABELS = {
  product_name: 'Product Name',
  brand_name: 'Brand Name',
  net_quantity: 'Net Quantity',
  mrp: 'MRP (Max Retail Price)',
  mfg_date: 'Mfg. / Packing Date',
  best_before: 'Best Before / Use By',
  manufacturer_name: 'Manufacturer Name',
  manufacturer_address: 'Manufacturer Address',
  customer_care: 'Consumer Care Contact',
  batch_lot_number: 'Batch / Lot Number',
  fssai_license: 'FSSAI License No.',
  country_of_origin: 'Country of Origin',
  ingredients: 'Ingredients',
  veg_nonveg: 'Veg / Non-Veg',
  font_size_compliant: 'Font Size (Rule 8)',
};

// Fields to always show in the grid, in this order
const DISPLAY_ORDER = [
  'product_name',
  'brand_name',
  'net_quantity',
  'mrp',
  'mfg_date',
  'best_before',
  'manufacturer_name',
  'manufacturer_address',
  'customer_care',
  'batch_lot_number',
  'fssai_license',
  'country_of_origin',
  'ingredients',
  'veg_nonveg',
  'font_size_compliant',
];

function FieldRow({ label, value, isPresent, isEstimated }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-700/50 last:border-0 gap-4">
      <span className="text-slate-400 text-sm shrink-0 w-44">{label}</span>
      <div className="flex items-start gap-2 flex-1 justify-end min-w-0">
        {isEstimated && (
          <span className="text-xs text-orange-400 font-mono shrink-0 mt-0.5">[est.]</span>
        )}
        <span
          className={`text-sm text-right break-words ${
            isPresent ? 'text-text-primary' : 'text-slate-600 italic'
          }`}
        >
          {value || '— not found —'}
        </span>
        {/* Status indicator dot */}
        <span
          className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${
            isPresent ? 'bg-green-400' : 'bg-red-500'
          }`}
        />
      </div>
    </div>
  );
}

/**
 * @param {Array} fields - Array of ExtractedField objects from the backend
 */
export default function FieldGrid({ fields = [] }) {
  // Build a lookup map for quick access
  const fieldMap = fields.reduce((map, f) => {
    map[f.fieldName] = f;
    return map;
  }, {});

  const totalFields = DISPLAY_ORDER.filter(k => FIELD_LABELS[k]).length;
  const foundCount = DISPLAY_ORDER.filter(k => fieldMap[k]?.isPresent).length;

  return (
    <div className="space-y-1">
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
        <span>{foundCount} of {totalFields} mandatory declarations found</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Found</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Missing</span>
          <span className="flex items-center gap-1 text-orange-400"><span className="font-mono">[est.]</span> Estimated</span>
        </div>
      </div>

      {/* Field rows */}
      {DISPLAY_ORDER.map(key => {
        if (!FIELD_LABELS[key]) return null;
        const field = fieldMap[key];
        return (
          <FieldRow
            key={key}
            label={FIELD_LABELS[key]}
            value={field?.fieldValue}
            isPresent={!!field?.isPresent}
            isEstimated={!!field?.isEstimated}
          />
        );
      })}
    </div>
  );
}
