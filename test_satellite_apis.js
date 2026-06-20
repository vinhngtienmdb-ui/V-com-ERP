
const ERP_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== START SATELLITE API TESTS ===');
  
  const testEmail = `test-shop-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testShopName = `Hải Bánh Mart ${Date.now().toString().slice(-4)}`;
  
  // 1. Seller Register Test
  console.log('\n[1] Testing Seller Register...');
  try {
    const regRes = await fetch(`${ERP_URL}/api/seller/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        shopName: testShopName,
        repName: 'Nguyễn Văn A',
        taxId: '0101234567',
        description: 'Cửa hàng tiện lợi chính hãng'
      })
    });
    const regData = await regRes.json();
    console.log('Register Response Status:', regRes.status);
    console.log('Register Response:', regData);
    
    if (regRes.ok && regData.status === 'success') {
      console.log('✅ Seller Register Test: PASSED');
    } else {
      console.log('❌ Seller Register Test: FAILED');
    }
  } catch (e) {
    console.error('❌ Seller Register Error:', e);
  }

  // 2. Seller Login Test
  console.log('\n[2] Testing Seller Login...');
  let sellerId = '';
  try {
    const loginRes = await fetch(`${ERP_URL}/api/seller/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData = await loginRes.json();
    console.log('Login Response Status:', loginRes.status);
    console.log('Login Response:', loginData);

    if (loginRes.ok && loginData.status === 'success') {
      sellerId = loginData.seller.id;
      console.log('✅ Seller Login Test: PASSED (Seller ID:', sellerId, ')');
    } else {
      console.log('❌ Seller Login Test: FAILED');
    }
  } catch (e) {
    console.error('❌ Seller Login Error:', e);
  }

  // 3. Seller Data Get Test
  if (sellerId) {
    console.log('\n[3] Testing Seller Data Fetch...');
    try {
      const dataRes = await fetch(`${ERP_URL}/api/seller/data/${sellerId}`);
      const dataPayload = await dataRes.json();
      console.log('Data Fetch Status:', dataRes.status);
      console.log('Data Keys:', Object.keys(dataPayload));
      
      if (dataRes.ok && dataPayload.status === 'success') {
        console.log('✅ Seller Data Fetch Test: PASSED');
      } else {
        console.log('❌ Seller Data Fetch Test: FAILED');
      }
    } catch (e) {
      console.error('❌ Seller Data Fetch Error:', e);
    }
  }

  // 4. iPOS Products Get Test
  console.log('\n[4] Testing iPOS Products Fetch...');
  try {
    const prodRes = await fetch(`${ERP_URL}/api/ipos/products`);
    const prodData = await prodRes.json();
    console.log('Products Fetch Status:', prodRes.status);
    console.log('Products Count:', prodData.products?.length || 0);

    if (prodRes.ok && prodData.status === 'success') {
      console.log('✅ iPOS Products Fetch Test: PASSED');
    } else {
      console.log('❌ iPOS Products Fetch Test: FAILED');
    }
  } catch (e) {
    console.error('❌ iPOS Products Fetch Error:', e);
  }

  // 5. iPOS Checkout Test
  console.log('\n[5] Testing iPOS Order Checkout...');
  try {
    const checkoutPayload = {
      items: [
        {
          product: { id: 'prod-123', name: 'Trà Sữa Lipton 500ml', price: 20000, sku: 'LIP-TS-500' },
          quantity: 2
        }
      ],
      total: 40000,
      customerPhone: '0987654321',
      cashierId: 'cashier-test-01',
      storeId: 'ST-01'
    };

    const checkRes = await fetch(`${ERP_URL}/api/ipos/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload)
    });
    const checkData = await checkRes.json();
    console.log('Checkout Status:', checkRes.status);
    console.log('Checkout Response:', checkData);

    if (checkRes.ok && checkData.status === 'success') {
      console.log('✅ iPOS Checkout Test: PASSED');
    } else {
      console.log('❌ iPOS Checkout Test: FAILED');
    }
  } catch (e) {
    console.error('❌ iPOS Checkout Error:', e);
  }

  // 6. iPOS O2O Sync Test
  console.log('\n[6] Testing iPOS O2O Cart Sync...');
  try {
    const o2oRes = await fetch(`${ERP_URL}/api/ipos/o2o-cart?phone=0987654321`);
    const o2oData = await o2oRes.json();
    console.log('O2O Sync Status:', o2oRes.status);
    console.log('O2O Sync Items Count:', o2oData.items?.length || 0);

    if (o2oRes.ok && o2oData.status === 'success') {
      console.log('✅ iPOS O2O Sync Test: PASSED');
    } else {
      console.log('❌ iPOS O2O Sync Test: FAILED');
    }
  } catch (e) {
    console.error('❌ iPOS O2O Sync Error:', e);
  }

  // 7. iPOS Cashier Auth Approval Flow Test
  console.log('\n[7] Testing iPOS Cashier Auth & Approval Flow...');
  const cashierEmail = `cashier-${Date.now()}@vcomm.vn`;
  const cashierPassword = 'Password123!';
  const cashierName = 'Thu ngân Đẹp Trai';
  let cashierId = '';

  try {
    // Step A: Register
    console.log('Step A: Registering cashier...');
    const regRes = await fetch(`${ERP_URL}/api/ipos/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cashierEmail,
        password: cashierPassword,
        fullName: cashierName,
        phone: '0988887777',
        storeName: 'Chi nhánh Quận 1',
        storeAddress: '123 Lê Lợi, Q1, HCM',
        role: 'cashier'
      })
    });
    const regData = await regRes.json();
    console.log('Register cashier status:', regRes.status, regData);
    cashierId = regData.userId;

    // Step B: Attempt login (should be forbidden with pending_approval)
    console.log('Step B: Attempting login while pending...');
    const loginPendingRes = await fetch(`${ERP_URL}/api/ipos/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cashierEmail,
        password: cashierPassword
      })
    });
    const loginPendingData = await loginPendingRes.json();
    console.log('Login pending status:', loginPendingRes.status, loginPendingData);

    // Step C: Fetch accounts list and verify cashier exists
    console.log('Step C: Fetching accounts list...');
    const listRes = await fetch(`${ERP_URL}/api/ipos/accounts`);
    const listData = await listRes.json();
    const found = (listData.accounts || []).find(acc => acc.id === cashierId);
    console.log('Cashier found in list:', !!found, found ? found.status : 'N/A');

    // Step D: Approve account
    console.log('Step D: Approving cashier...');
    const approveRes = await fetch(`${ERP_URL}/api/ipos/accounts/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: cashierId })
    });
    const approveData = await approveRes.json();
    console.log('Approve result:', approveData);

    // Step E: Attempt login again (should succeed)
    console.log('Step E: Attempting login after approval...');
    const loginApprovedRes = await fetch(`${ERP_URL}/api/ipos/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cashierEmail,
        password: cashierPassword
      })
    });
    const loginApprovedData = await loginApprovedRes.json();
    console.log('Login approved status:', loginApprovedRes.status, loginApprovedData);

    if (
      regRes.status === 201 &&
      loginPendingRes.status === 403 &&
      loginPendingData.status === 'pending' &&
      found &&
      approveRes.status === 200 &&
      loginApprovedRes.status === 200 &&
      loginApprovedData.status === 'success'
    ) {
      console.log('✅ iPOS Cashier Auth & Approval Flow Test: PASSED');
    } else {
      console.log('❌ iPOS Cashier Auth & Approval Flow Test: FAILED');
    }
  } catch (e) {
    console.error('❌ iPOS Cashier Auth & Approval Flow Error:', e);
  }

  console.log('\n=== END SATELLITE API TESTS ===');
}

runTests();
