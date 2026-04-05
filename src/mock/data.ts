import type { MockDatabase } from '@/types'

export const initialDatabase: MockDatabase = {
  users: [
    {
      id: 'user-1',
      name: 'Selam Tadesse',
      email: 'selam@demo.com',
      password: 'demo123',
      role: 'user',
      location: 'Addis Ababa',
    },
    {
      id: 'merchant-user-1',
      name: 'Kalayu Redae',
      email: 'kalayu@demo.com',
      password: 'demo123',
      role: 'merchant',
      businessName: 'Kalayu Pharmacy',
      location: 'Bole',
    },
    {
      id: 'merchant-user-2',
      name: 'Hadush A.',
      email: 'hadush@demo.com',
      password: 'demo123',
      role: 'merchant',
      businessName: 'Hadush Med Store',
      location: 'Piassa',
    },
    {
      id: 'admin-1',
      name: 'System Admin',
      email: 'admin@demo.com',
      password: 'demo123',
      role: 'admin',
      location: 'HQ',
    },
  ],
  merchants: [
    {
      id: 'merchant-1',
      ownerId: 'merchant-user-1',
      businessName: 'Kalayu Pharmacy',
      category: 'Pharmacy',
      location: 'Bole, Addis Ababa',
      description:
        'A verified pharmacy focused on hard-to-find prescription support, wellness products, and fast response to customer inquiries.',
      verified: true,
    },
    {
      id: 'merchant-2',
      ownerId: 'merchant-user-2',
      businessName: 'Hadush Med Store',
      category: 'Medical Supplies',
      location: 'Piassa, Addis Ababa',
      description:
        'Specialized in mobility support, imported wellness products, and product discovery for repeat customers.',
      verified: true,
    },
  ],
  products: [
    {
      id: 'product-1',
      merchantId: 'merchant-1',
      name: 'Digital Blood Pressure Monitor',
      category: 'Medical Devices',
      price: 3850,
      availability: 'In Stock',
      shortDescription: 'Compact monitor with memory recall and fast reading.',
      description:
        'A home-use digital blood pressure monitor with memory recall, cuff fit guidance, and clear digital display for repeat measurements.',
      image:
        'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      featured: true,
    },
    {
      id: 'product-2',
      merchantId: 'merchant-1',
      name: 'Infant Fever Relief Syrup',
      category: 'Pharmacy',
      price: 290,
      availability: 'Low Stock',
      shortDescription: 'Popular infant syrup with dosage guidance included.',
      description:
        'Over-the-counter syrup commonly requested by parents. Merchant can provide dosage instructions and substitution guidance when needed.',
      image:
        'https://images.unsplash.com/photo-1580281658629-9515a9a5b645?auto=format&fit=crop&w=900&q=80',
      featured: true,
    },
    {
      id: 'product-3',
      merchantId: 'merchant-2',
      name: 'Wheelchair Cushion Support',
      category: 'Medical Supplies',
      price: 2100,
      availability: 'In Stock',
      shortDescription: 'Pressure-support cushion with anti-slip base.',
      description:
        'Designed for daily use in mobility support scenarios. Useful for customers looking for a specific comfort accessory not usually easy to discover.',
      image:
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      featured: false,
    },
    {
      id: 'product-4',
      merchantId: 'merchant-2',
      name: 'Imported Vitamin D3 Drops',
      category: 'Supplements',
      price: 740,
      availability: 'In Stock',
      shortDescription: 'Imported drops for adults and children with serving notes.',
      description:
        'A frequently searched supplement that many customers ask for by brand. Listing it clearly helps connect search intent to available stock.',
      image:
        'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      featured: true,
    },
  ],
  inquiries: [
    {
      id: 'inquiry-1',
      productId: 'product-2',
      merchantId: 'merchant-1',
      userId: 'user-1',
      customerName: 'Selam Tadesse',
      message: 'Do you still have this syrup available today, and what bottle size is in stock?',
      createdAt: '2026-04-04T09:40:00.000Z',
    },
  ],
}
