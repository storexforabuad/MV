#!/usr/bin/env node
/**
 * Enable Wholesale Vendor Mode on Stores
 * 
 * Sets isWholesaleVendor: true on stores so they appear in wholesale discovery.
 * Run AFTER: npm run migrate:wholesale
 * 
 * Usage:
 *   npm run enable:wholesale-vendors                    # Enable on all stores
 *   npm run enable:wholesale-vendors -- --store=<id>    # Enable on specific store
 *   npm run enable:wholesale-vendors -- --dry-run       # Preview changes
 */

import admin from 'firebase-admin';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const storeIdArg = args.find(arg => arg.startsWith('--store='))?.split('=')[1];

// Get Firebase project ID
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ladevida-f3b00';

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
let serviceAccount;

try {
  const fs = await import('fs');
  const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(serviceAccountFile);
} catch (error) {
  console.error('❌ Error: firebase-service-account.json not found');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || projectId
  });
} catch (error) {
  if (!error.message.includes('already initialized')) {
    throw error;
  }
}

const db = admin.firestore();

/**
 * Prompt user for confirmation
 */
const confirm = (question) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
};

/**
 * Enable wholesale vendor mode on stores
 */
const enableWholesaleVendors = async (isDryRun = false, targetStoreId = null) => {
  try {
    console.log(`\n🔄 Starting wholesale vendor enablement (${isDryRun ? 'DRY RUN' : 'LIVE'})...`);
    if (targetStoreId) {
      console.log(`   Target store: ${targetStoreId}`);
    }
    console.log(`   Project ID: ${serviceAccount.project_id || projectId}\n`);

    let processedCount = 0;
    let enabledCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let lastDoc = null;

    const BATCH_SIZE = 25;

    // Process stores in batches
    while (true) {
      let query = db.collection('stores');

      if (targetStoreId) {
        query = query.where('__name__', '==', targetStoreId);
      } else if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.limit(BATCH_SIZE).get();

      if (snapshot.empty) {
        break;
      }

      // Process each store in batch
      const batch = db.batch();
      let batchMutationCount = 0;

      for (const doc of snapshot.docs) {
        const store = doc.data();
        processedCount++;

        // Skip if already wholesale vendor
        if (store.isWholesaleVendor === true) {
          skippedCount++;
          console.log(`   ✓ ${store.name || doc.id}: Already wholesale vendor`);
          continue;
        }

        enabledCount++;
        console.log(`   ✓ ${store.name || doc.id}: Enabling wholesale vendor mode`);

        if (!isDryRun) {
          batch.update(doc.ref, {
            isWholesaleVendor: true,
            wholesaleEnabledAt: admin.firestore.FieldValue.serverTimestamp()
          });
          batchMutationCount++;
        }
      }

      if (!isDryRun && batchMutationCount > 0) {
        try {
          await batch.commit();
        } catch (error) {
          errorCount += batchMutationCount;
          console.error(`   ❌ Batch commit failed:`, error.message);
        }
      }

      if (targetStoreId || snapshot.docs.length < BATCH_SIZE) {
        break;
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    // Display results
    console.log('\n📊 SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total stores processed:  ${processedCount}`);
    console.log(`   Stores enabled:          ${enabledCount} ${isDryRun ? '(DRY RUN)' : '✅'}`);
    console.log(`   Already wholesale:       ${skippedCount}`);
    console.log(`   Errors:                  ${errorCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (isDryRun) {
      console.log('\n✨ DRY RUN COMPLETE - No changes were made');
      console.log('   Run again without --dry-run to apply changes');
    } else {
      console.log('\n✅ WHOLESALE VENDOR ENABLEMENT COMPLETE');
      console.log('\n💡 Next steps:');
      console.log('   1. Run: npm run dev');
      console.log('   2. Open admin panel → Wholesale Hub → Discovery tab');
      console.log('   3. You should now see other wholesale vendors');
    }

    return { processedCount, enabledCount, skippedCount, errorCount };
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    throw error;
  }
};

/**
 * Main execution
 */
const main = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  Enable Wholesale Vendor Mode                         ║');
    console.log('║  Mark stores as wholesale vendors so they appear      ║');
    console.log('║  in wholesale discovery for other stores              ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes will be made');
    }

    // Show confirmation prompt
    const message = storeIdArg 
      ? `Enable wholesale vendor mode for store: ${storeIdArg}\n   Continue? (y/n): `
      : `Enable wholesale vendor mode for ALL stores?\n   This will set isWholesaleVendor: true on all stores.\n   Continue? (y/n): `;

    const shouldProceed = await confirm(message);

    if (!shouldProceed) {
      console.log('\n❌ Operation cancelled');
      process.exit(0);
    }

    // Run enablement
    await enableWholesaleVendors(isDryRun, storeIdArg);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

main();