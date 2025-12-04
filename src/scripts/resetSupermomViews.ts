/**
 * ONE-TIME SCRIPT: Reset Views for supermom-ng Store
 * 
 * This script resets all view counts for the supermom-ng store.
 * Run this in the browser console or as a Node script.
 * 
 * INSTRUCTIONS:
 * 1. Open your browser to the admin dashboard
 * 2. Open browser DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter
 * 
 * OR use the button component below to trigger it from the UI.
 */

import { resetStoreViews } from '@/app/actions/resetViews';

// Call the function
async function runReset() {
    try {
        console.log('🔄 Starting view reset for supermom-ng...');
        const result = await resetStoreViews('supermom-ng');

        if (result.success) {
            console.log('✅ SUCCESS!');
            console.log(`   - ${result.productsUpdated} products reset`);
            console.log(`   - ${result.metricsDeleted} metrics deleted`);
            alert('Views successfully reset for supermom-ng store!');
        }
    } catch (error) {
        console.error('❌ ERROR:', error);
        alert('Failed to reset views. Check console for details.');
    }
}

// Uncomment the line below to run immediately when this file loads
// runReset();

export { runReset };
