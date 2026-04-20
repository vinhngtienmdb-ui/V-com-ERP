import { db } from '../lib/firebase';
import { collection, getDocs, writeBatch, doc, setDoc } from 'firebase/firestore';

export const posSyncService = {
  syncFromErp: async () => {
    try {
      const batch = writeBatch(db);
      
      // Sync Products
      const productsSnap = await getDocs(collection(db, 'products'));
      productsSnap.forEach((docSnap) => {
        const prodRef = doc(db, 'pos_products', docSnap.id);
        batch.set(prodRef, docSnap.data());
      });

      // Sync Customers
      const customersSnap = await getDocs(collection(db, 'customers'));
      customersSnap.forEach((docSnap) => {
        const custRef = doc(db, 'pos_customers', docSnap.id);
        batch.set(custRef, docSnap.data());
      });

      // Sync Campaigns
      const campaignsSnap = await getDocs(collection(db, 'campaigns'));
      campaignsSnap.forEach((docSnap) => {
        const campRef = doc(db, 'pos_campaigns', docSnap.id);
        batch.set(campRef, docSnap.data());
      });

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error("Sync failed:", error);
      throw error;
    }
  }
};
