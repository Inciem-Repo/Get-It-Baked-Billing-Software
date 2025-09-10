export const createTables = [
  `
  CREATE TABLE IF NOT EXISTS billing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invid TEXT NOT NULL,
    totalTaxableValuef REAL DEFAULT 0.00,
    totalCgstf REAL DEFAULT 0.00,
    totalIgstf REAL DEFAULT 0.00,
    discountPercentf INTEGER DEFAULT 0,
    grandTotalf REAL DEFAULT 0.00,
    customer_id TEXT NOT NULL,
    bill_type TEXT NOT NULL,
    paymenttype TEXT NOT NULL,
    billdate TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    pdflink TEXT,
    customernote TEXT,
    advanceamount TEXT,
    balanceAmount TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 1 
);`,
  `
CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bname TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  branchaddress TEXT NOT NULL,
  bnumber TEXT NOT NULL,
  Email TEXT NOT NULL,
  gst_no TEXT NOT NULL,
  nstaffs INTEGER NOT NULL,
  aname TEXT NOT NULL,
  status TEXT NOT NULL,
  date TEXT NOT NULL, 
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  real_password TEXT NOT NULL
);
`,
  `
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category_id TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    cost INTEGER NOT NULL DEFAULT 0,
    hsn INTEGER NOT NULL DEFAULT 0,
    price INTEGER NOT NULL DEFAULT 0,
    tax TEXT NOT NULL,
    quantity TEXT CHECK(quantity IN ('low', 'medium', 'high', '')) NOT NULL,
    unit TEXT CHECK(unit IN ('kg', 'grams', 'packets','')),
    obgo TEXT
  )`,
  `
  CREATE TABLE IF NOT EXISTS category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 1,
    date TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    gstin TEXT,
    pan TEXT,
    tax_type TEXT,
    tds_percentage REAL,
    mobile TEXT,
    email TEXT,
    billing_address TEXT,
    billing_city TEXT,
    billing_postal_code TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_postal_code TEXT,
    date TEXT,
    synced INTEGER DEFAULT 1 
)`,
  `CREATE TABLE IF NOT EXISTS billing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER ,
    item_id INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    taxable_value REAL,
    cgst_value REAL,
    igst_value REAL,
    total_price REAL NOT NULL
)`,
`CREATE TABLE IF NOT EXISTS sync_meta (
  table_name TEXT PRIMARY KEY,
  last_sync_at TEXT
);`
];
