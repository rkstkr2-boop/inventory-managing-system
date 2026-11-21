/* ==========================================================
   categories.js  -  Product types and the details asked for each
   To add a new product type, add one block here. Nothing else
   needs to change: forms, tables and reports pick it up.
   t = input type (text | number | select), req = required
   ========================================================== */
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'EMI / Finance', 'Bank Transfer'];

const CATEGORIES = {
  phone: {
    label: 'Mobile Phone', prefix: 'PH', icon: '📱',
    fields: [
      { k: 'brand', l: 'Brand', t: 'text', req: 1, ph: 'Apple, Samsung, Redmi...' },
      { k: 'model', l: 'Model', t: 'text', req: 1, ph: 'iPhone 15' },
      { k: 'storage', l: 'Storage', t: 'select', o: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'], req: 1 },
      { k: 'ram', l: 'RAM', t: 'select', o: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB'] },
      { k: 'color', l: 'Colour', t: 'text', req: 1 },
      { k: 'condition', l: 'Condition', t: 'select', o: ['New', 'Refurbished', 'Used'], req: 1 },
      { k: 'warranty', l: 'Warranty (months)', t: 'number' }
    ],
    name: a => [a.brand, a.model, a.storage, a.color].filter(Boolean).join(' ')
  },
  battery: {
    label: 'Battery', prefix: 'BT', icon: '🔋',
    fields: [
      { k: 'brand', l: 'Brand', t: 'text', req: 1 },
      { k: 'model', l: 'Compatible phone model', t: 'text', req: 1 },
      { k: 'capacity', l: 'Capacity (mAh)', t: 'number', req: 1 },
      { k: 'type', l: 'Battery type', t: 'select', o: ['Li-ion', 'Li-Polymer'] },
      { k: 'grade', l: 'Quality', t: 'select', o: ['Original', 'OEM / Compatible'], req: 1 },
      { k: 'warranty', l: 'Warranty (months)', t: 'number' }
    ],
    name: a => [a.brand, a.model, 'Battery'].filter(Boolean).join(' ')
  },
  watch: {
    label: 'Watch', prefix: 'WT', icon: '⌚',
    fields: [
      { k: 'brand', l: 'Brand', t: 'text', req: 1 },
      { k: 'model', l: 'Model', t: 'text', req: 1 },
      { k: 'type', l: 'Watch type', t: 'select', o: ['Smart Watch', 'Fitness Band', 'Analog', 'Digital', 'Kids Watch'], req: 1 },
      { k: 'strap', l: 'Strap material', t: 'select', o: ['Silicone', 'Leather', 'Metal', 'Nylon'] },
      { k: 'color', l: 'Colour', t: 'text' },
      { k: 'warranty', l: 'Warranty (months)', t: 'number' }
    ],
    name: a => [a.brand, a.model, a.type].filter(Boolean).join(' ')
  },
  cover: {
    label: 'Phone Cover', prefix: 'CV', icon: '🛡️',
    fields: [
      { k: 'brand', l: 'Brand', t: 'text', ph: 'Generic' },
      { k: 'model', l: 'Fits phone model', t: 'text', req: 1 },
      { k: 'type', l: 'Cover type', t: 'select', o: ['Silicone', 'Hard Case', 'Flip Cover', 'Clear / Transparent', 'Rugged', 'Wallet'], req: 1 },
      { k: 'color', l: 'Colour', t: 'text' }
    ],
    name: a => [a.model, a.type, 'Cover', a.color].filter(Boolean).join(' ')
  },
  screenguard: {
    label: 'Screen Guard', prefix: 'SG', icon: '🪟',
    fields: [
      { k: 'brand', l: 'Brand', t: 'text', ph: 'Generic' },
      { k: 'model', l: 'Fits phone model', t: 'text', req: 1 },
      { k: 'type', l: 'Guard type', t: 'select', o: ['Tempered 9H', 'Privacy', 'Matte', 'UV Glass', 'Film / Flexible'], req: 1 }
    ],
    name: a => [a.model, a.type, 'Screen Guard'].filter(Boolean).join(' ')
  },
  charger: {
    label: 'Charger / Cable / Power Bank', prefix: 'CH', icon: '🔌',
    fields: [
      { k: 'brand', l: 'Brand', t: 'text', req: 1 },
      { k: 'type', l: 'Item type', t: 'select', o: ['Adapter', 'Cable', 'Wireless Charger', 'Power Bank', 'Car Charger'], req: 1 },
      { k: 'watt', l: 'Wattage / Capacity', t: 'text', ph: '20W or 10000mAh' },
      { k: 'connector', l: 'Connector', t: 'select', o: ['USB-C', 'Lightning', 'Micro-USB', 'Multi'] },
      { k: 'warranty', l: 'Warranty (months)', t: 'number' }
    ],
    name: a => [a.brand, a.watt, a.type, a.connector].filter(Boolean).join(' ')
  },
  earphones: {
    label: 'Earphones / Headphones', prefix: 'EP', icon: '🎧',
    fields: [
      { k: 'brand', l: 'Brand', t: 'text', req: 1 },
      { k: 'model', l: 'Model', t: 'text', req: 1 },
      { k: 'type', l: 'Type', t: 'select', o: ['Wired', 'TWS Earbuds', 'Neckband', 'Over-ear Headphone'], req: 1 },
      { k: 'color', l: 'Colour', t: 'text' },
      { k: 'warranty', l: 'Warranty (months)', t: 'number' }
    ],
    name: a => [a.brand, a.model, a.type].filter(Boolean).join(' ')
  },
  other: {
    label: 'Other Accessory', prefix: 'AC', icon: '📦',
    fields: [
      { k: 'item', l: 'Item name', t: 'text', req: 1 },
      { k: 'brand', l: 'Brand', t: 'text' },
      { k: 'details', l: 'Details', t: 'text' }
    ],
    name: a => [a.brand, a.item].filter(Boolean).join(' ')
  }
};
