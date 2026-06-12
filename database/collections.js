/**
 * Firestore Collection Names & Schema Definitions
 * Single source of truth for database structure.
 */

export const COLLECTIONS = {
  USERS: 'users',
  SHOPS: 'shops',
  MANAGERS: 'managers',
  STAFF: 'staff',
  SALES: 'sales',
  CUSTOMERS: 'customers',
  INVOICES: 'invoices',
  UDHARI: 'udhari',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  BACKUP: 'backup',
  INVENTORY: 'inventory',
  EXPENSES: 'expenses',
  CHATS: 'chats',
  MESSAGES: 'messages',
  ANNOUNCEMENTS: 'announcements',
  ATTENDANCE: 'attendance',
  PAYROLL: 'payroll',
  LEAVE_REQUESTS: 'leaveRequests',
  ACTIVITY_LOG: 'activityLog',
  PRODUCTS: 'products'
};

export const SHOP_CATEGORIES = [
  'Mobile Shop',
  'Clothing Shop',
  'Kirana Store',
  'Restaurant',
  'Food Business',
  'Medical Store',
  'Furniture',
  'Electronics',
  'Builder',
  'Interior Designer',
  'Website Agency',
  'Service Business',
  'Game Center',
  'Grocery',
  'Hardware',
  'Jewellery',
  'Automobile',
  'Salon',
  'Book Store',
  'Generic Business'
];

export const BUSINESS_TYPE_MAP = {
  'Mobile Shop': 'Mobile',
  'Clothing Shop': 'Clothing',
  'Kirana Store': 'Grocery',
  'Restaurant': 'Restaurant',
  'Food Business': 'Restaurant',
  'Medical Store': 'Medical',
  'Furniture': 'Furniture',
  'Electronics': 'Electronics',
  'Builder': 'Builder',
  'Interior Designer': 'InteriorDesigner',
  'Website Agency': 'WebsiteAgency',
  'Service Business': 'Service',
  'Game Center': 'GameCenter',
  'Grocery': 'Grocery',
  'Hardware': 'Hardware',
  'Jewellery': 'Jewellery',
  'Automobile': 'Automobile',
  'Salon': 'Salon',
  'Book Store': 'BookStore',
  'Generic Business': 'Generic'
};

export const CATEGORY_FORM_FIELDS = {
  Mobile: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'model', label: 'Model', type: 'text', required: true },
    { name: 'imei', label: 'IMEI', type: 'text', required: false },
    { name: 'warranty', label: 'Warranty (months)', type: 'number', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Clothing: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'size', label: 'Size', type: 'text', required: true },
    { name: 'color', label: 'Color', type: 'text', required: false },
    { name: 'brand', label: 'Brand', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Medical: [
    { name: 'medicineName', label: 'Medicine Name', type: 'text', required: true },
    { name: 'batchNumber', label: 'Batch Number', type: 'text', required: true },
    { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Restaurant: [
    { name: 'itemName', label: 'Food Item', type: 'text', required: true },
    { name: 'tableNumber', label: 'Table Number', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Grocery: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Electronics: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'model', label: 'Model', type: 'text', required: false },
    { name: 'serialNumber', label: 'Serial Number', type: 'text', required: false },
    { name: 'warranty', label: 'Warranty (months)', type: 'number', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Hardware: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Furniture: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'material', label: 'Material', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Jewellery: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'weight', label: 'Weight (g)', type: 'number', required: false, step: 0.01 },
    { name: 'purity', label: 'Purity', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Automobile: [
    { name: 'productName', label: 'Product/Service Name', type: 'text', required: true },
    { name: 'vehicleNumber', label: 'Vehicle Number', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Salon: [
    { name: 'serviceName', label: 'Service Name', type: 'text', required: true },
    { name: 'duration', label: 'Duration (mins)', type: 'number', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  BookStore: [
    { name: 'bookTitle', label: 'Book Title', type: 'text', required: true },
    { name: 'author', label: 'Author', type: 'text', required: false },
    { name: 'isbn', label: 'ISBN', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Builder: [
    { name: 'projectName', label: 'Project Name', type: 'text', required: true },
    { name: 'siteAddress', label: 'Site Address', type: 'text', required: false },
    { name: 'projectCost', label: 'Project Cost', type: 'number', required: true, min: 0, step: 0.01 },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  InteriorDesigner: [
    { name: 'serviceName', label: 'Service/Item Name', type: 'text', required: true },
    { name: 'roomType', label: 'Room Type', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  WebsiteAgency: [
    { name: 'projectName', label: 'Project Name', type: 'text', required: true },
    { name: 'domain', label: 'Domain', type: 'text', required: false },
    { name: 'hosting', label: 'Hosting', type: 'text', required: false },
    { name: 'projectType', label: 'Project Type', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Service: [
    { name: 'serviceName', label: 'Service Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  GameCenter: [
    { name: 'gameName', label: 'Game/Activity', type: 'text', required: true },
    { name: 'duration', label: 'Duration (mins)', type: 'number', required: false },
    { name: 'players', label: 'Players', type: 'number', required: false },
    { name: 'quantity', label: 'Sessions', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Generic: [
    { name: 'productName', label: 'Item Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, min: 0, step: 0.01 },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Other: []
};

export const DEFAULT_CUSTOMER_FIELDS = [
  { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
  { name: 'customerMobile', label: 'Mobile', type: 'tel', required: false },
  { name: 'customerAddress', label: 'Address', type: 'text', required: false }
];

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Salary',
  'Electricity',
  'Internet',
  'Fuel',
  'Maintenance',
  'Supplies',
  'Marketing',
  'Insurance',
  'Tax',
  'Misc'
];

export const LEAVE_TYPES = [
  'Paid Leave',
  'Unpaid Leave',
  'Half Day',
  'Emergency Leave',
  'Sick Leave'
];

export const ATTENDANCE_STATUS = ['present', 'absent', 'halfDay'];

export const ANNOUNCEMENT_TYPES = ['normal', 'important', 'emergency'];
