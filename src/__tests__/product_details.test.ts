import { describe, it, expect, beforeAll } from 'vitest';
import { vi } from 'vitest';

// Unmock the firebase module to test the actual implementation of mapping functions and Supabase operations
vi.unmock('../services/dbService');

import { toRelationalPayload, fromRelationalRow, updateDoc, getDoc, doc, db } from '../services/dbService';
import { Product } from '../types/erp';

describe('Product Details Adapter Mapping & Supabase Integration', () => {
  const sampleProduct: Product = {
    id: 'test-pim-product-' + Date.now(),
    name: 'Sản phẩm Test PIM Cao Cấp',
    sku: 'SKU-TEST-PIM-999',
    price: 1500000,
    stock: 50,
    category: 'Thiết bị điện tử',
    image: 'https://picsum.photos/seed/test/200/200',
    image_url: 'https://picsum.photos/seed/test/200/200',
    sellerName: 'Nhà cung cấp ABC',
    brand: 'Samsung',
    costPrice: 1000000,
    hiddenCosts: 50000,
    margin: 30.00,
    profit: 450000,
    description: '<p>Đây là mô tả chi tiết sản phẩm test.</p>',
    weight: '1.5 kg',
    dimensions: '20 x 15 x 5 cm',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    images: [
      'https://picsum.photos/seed/test1/200/200',
      'https://picsum.photos/seed/test2/200/200'
    ],
    specs: [
      { key: 'Màn hình', value: '6.7 inch Super AMOLED' },
      { key: 'Hệ điều hành', value: 'Android 14' }
    ]
  };

  it('toRelationalPayload should correctly map JS properties to database snake_case columns', () => {
    const payload = toRelationalPayload('products', sampleProduct.id, 'tenant-vcomm-prod-01', sampleProduct);
    
    expect(payload.id).toBe(sampleProduct.id);
    expect(payload.name).toBe(sampleProduct.name);
    expect(payload.price).toBe(sampleProduct.price);
    expect(payload.sku).toBe(sampleProduct.sku);
    expect(payload.category).toBe(sampleProduct.category);
    expect(payload.image_url).toBe(sampleProduct.image_url);
    expect(payload.brand).toBe(sampleProduct.brand);
    expect(payload.stock).toBe(sampleProduct.stock);
    expect(payload.cost_price).toBe(sampleProduct.costPrice);
    expect(payload.hidden_costs).toBe(sampleProduct.hiddenCosts);
    expect(payload.margin).toBe(sampleProduct.margin);
    expect(payload.profit).toBe(sampleProduct.profit);
    expect(payload.seller_name).toBe(sampleProduct.sellerName);
    expect(payload.weight).toBe(sampleProduct.weight);
    expect(payload.dimensions).toBe(sampleProduct.dimensions);
    expect(payload.video_url).toBe(sampleProduct.videoUrl);
    expect(payload.images).toEqual(sampleProduct.images);
    expect(payload.specs).toEqual(sampleProduct.specs);
  });

  it('fromRelationalRow should correctly map database snake_case columns to JS properties', () => {
    const row = {
      id: sampleProduct.id,
      tenant_id: 'tenant-vcomm-prod-01',
      name: sampleProduct.name,
      description: sampleProduct.description,
      price: sampleProduct.price,
      sku: sampleProduct.sku,
      category: sampleProduct.category,
      image_url: sampleProduct.image_url,
      created_at: new Date().toISOString(),
      brand: sampleProduct.brand,
      stock: sampleProduct.stock,
      cost_price: sampleProduct.costPrice,
      hidden_costs: sampleProduct.hiddenCosts,
      margin: sampleProduct.margin,
      profit: sampleProduct.profit,
      seller_name: sampleProduct.sellerName,
      weight: sampleProduct.weight,
      dimensions: sampleProduct.dimensions,
      video_url: sampleProduct.videoUrl,
      images: sampleProduct.images,
      specs: sampleProduct.specs
    };

    const jsData = fromRelationalRow('products', row);
    
    expect(jsData.id).toBe(sampleProduct.id);
    expect(jsData.name).toBe(sampleProduct.name);
    expect(jsData.description).toBe(sampleProduct.description);
    expect(jsData.price).toBe(sampleProduct.price);
    expect(jsData.sku).toBe(sampleProduct.sku);
    expect(jsData.category).toBe(sampleProduct.category);
    expect(jsData.image_url).toBe(sampleProduct.image_url);
    expect(jsData.image).toBe(sampleProduct.image_url); // compatible mapping
    expect(jsData.brand).toBe(sampleProduct.brand);
    expect(jsData.stock).toBe(sampleProduct.stock);
    expect(jsData.costPrice).toBe(sampleProduct.costPrice);
    expect(jsData.hiddenCosts).toBe(sampleProduct.hiddenCosts);
    expect(jsData.margin).toBe(sampleProduct.margin);
    expect(jsData.profit).toBe(sampleProduct.profit);
    expect(jsData.sellerName).toBe(sampleProduct.sellerName);
    expect(jsData.weight).toBe(sampleProduct.weight);
    expect(jsData.dimensions).toBe(sampleProduct.dimensions);
    expect(jsData.videoUrl).toBe(sampleProduct.videoUrl);
    expect(jsData.images).toEqual(sampleProduct.images);
    expect(jsData.specs).toEqual(sampleProduct.specs);
  });

  // Integration test using real Supabase connection (only if DATABASE_URL is present)
  it('should successfully write and read product details to/from Supabase', async () => {
    const productRef = doc(db, 'products', sampleProduct.id);
    
    // 1. Save/Create Product via updateDoc (it uses upsert behind the scenes)
    const writeResult = await updateDoc(productRef, sampleProduct);
    expect(writeResult).toBe(true);

    // 2. Fetch the saved product
    const snap = await getDoc(productRef);
    expect(snap.exists()).toBe(true);
    
    const retrievedData = snap.data() as Product;
    expect(retrievedData.id).toBe(sampleProduct.id);
    expect(retrievedData.name).toBe(sampleProduct.name);
    expect(retrievedData.brand).toBe(sampleProduct.brand);
    expect(retrievedData.stock).toBe(sampleProduct.stock);
    expect(retrievedData.costPrice).toBe(sampleProduct.costPrice);
    expect(retrievedData.hiddenCosts).toBe(sampleProduct.hiddenCosts);
    expect(retrievedData.margin).toBe(sampleProduct.margin);
    expect(retrievedData.profit).toBe(sampleProduct.profit);
    expect(retrievedData.sellerName).toBe(sampleProduct.sellerName);
    expect(retrievedData.weight).toBe(sampleProduct.weight);
    expect(retrievedData.dimensions).toBe(sampleProduct.dimensions);
    expect(retrievedData.videoUrl).toBe(sampleProduct.videoUrl);
    expect(retrievedData.images).toEqual(sampleProduct.images);
    expect(retrievedData.specs).toEqual(sampleProduct.specs);
    
    // Clean up
    const { deleteDoc } = await import('../services/dbService');
    await deleteDoc(productRef);
  });
});
