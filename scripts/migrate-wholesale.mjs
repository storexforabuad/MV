#!/usr/bin/env node
/**
 * Wholesale Feature Migration Script
 * 
 * One-time migration to initialize wholesaleConfig and wholesaleStats
 * on all existing stores for backward compatibility with the wholesale feature.
 * 
 * Usage:
 *   npm run migrate:wholesale                    # Interactive mode with confirmation
 *   npm run migrate:wholesale -- --dry-run       # Preview changes without committing
 *   npm run migrate:wholesale -- --skip-prompt   # Skip confirmation prompt
 * 
 * FIRESTORE INDEXES REQUIRED:
 * This migration will output clickable Firebase Console links to auto-generate required indexes.
 * If indexes are not created, queries may fail.
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
const skipPrompt = args.includes('--skip-prompt');

// Get Firebase project ID from environment or ask user
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ladevida-f3b00';

// Required indexes for wholesale queries
const REQUIRED_INDEXES = [
  {
    name: 'stores: storeType + isWholesaleVendor',
    collection: 'stores',
    fields: [
      { fieldPath: 'storeType', order: 'Ascending' },
      { fieldPath: 'isWholesaleVendor', order: 'Ascending' }
    ],
    query: 'getDiscoverableStores() - main wholesale discovery query'
  },
  {
    name: 'stores: storeType + isWholesaleVendor + wholesaleConfig.isVisible',
    collection: 'stores',
    fields: [
      { fieldPath: 'storeType', order: 'Ascending' },
      { fieldPath: 'isWholesaleVendor', order: 'Ascending' },
      { fieldPath: 'wholesaleConfig.isVisible', order: 'Ascending' }
    ],
    query: 'Optional: for future server-side visibility filtering (currently client-side)'
  }
];

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
let serviceAccount;

try {
  const fs = await import('fs');
  const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(serviceAccountFile);
} catch (error) {
  console.error('❌ Error: firebase-service-account.json not found');
  console.error('   Place your Firebase service account key at:', serviceAccountPath);
  console.error('   Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
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
 * Default wholesale configuration for new stores
 */
const DEFAULT_WHOLESALE_CONFIG = {
  isVisible: true,
  globalDiscount: 0,
  minOrderValue: 0,
  defaultPaymentTermsDays: 0
};

/**
 * Default wholesale statistics for new stores
 */
const DEFAULT_WHOLESALE_STATS = {
  activePartners: 0,
  monthlyWholesaleRevenue: 0,
  totalWholesaleOrders: 0,
  pendingSettlements: 0
};

/**
 * Prompt user for confirmation (y/n)
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
 * Display Firebase index creation instructions
 */
const displayIndexLinks = () => {
  console.log('\n📌 FIRESTORE INDEXES REQUIRED:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nTwo composite indexes are required for wholesale discovery to work.\n');
  
  REQUIRED_INDEXES.forEach((idx, i) => {
    console.log(`\n${i + 1}. ${idx.name}`);
    console.log(`   Collection: ${idx.collection}`);
    console.log(`   Fields to index:`);
    idx.fields.forEach(f => {
      console.log(`      • ${f.fieldPath} (${f.order})`);
    });
    console.log(`   Used by: ${idx.query}`);
  });

  console.log('\n\n🛠️  OPTION A: Deploy using firebaseIndexes.json (Recommended)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nRun this command to create all indexes at once:\n');
  console.log('   firebase deploy --only firestore:indexes\n');
  console.log('This deploys the firebaseIndexes.json config file from your project root.');

  console.log('\n\n🖱️  OPTION B: Create indexes manually in Firebase Console');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n1. Open Firebase Console:');
  console.log(`   https://console.firebase.google.com/project/${serviceAccount.project_id || projectId}/firestore/indexes\n`);
  console.log('2. Click "Create Index" button');
  
  REQUIRED_INDEXES.forEach((idx, i) => {
    console.log(`\n3.${i === 0 ? '' : i + 1} Create Index ${i + 1}:`);
    console.log(`   Collection ID: ${idx.collection}`);
    idx.fields.forEach((f, fIdx) => {
      console.log(`   Field ${fIdx + 1}: ${f.fieldPath} (${f.order})`);
    });
    console.log(`   Query scope: Collection`);
    console.log(`   Click: "Create Index"`);
  });

  console.log('\n\n⏱️  WAIT FOR INDEXES TO BUILD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nIndexes typically take 5-15 minutes to build depending on data size.');
  console.log('Check the Firebase Console Indexes page to see the status.\n');
  console.log('When both indexes show "Enabled", you can proceed with testing the wholesale feature.\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

/**
 * Migrate stores with pagination
 */
const migrateStores = async (isDryRun = false) => {
  try {
    console.log(`\n🔄 Starting wholesale migration (${isDryRun ? 'DRY RUN' : 'LIVE'})...`);
    console.log(`   Project ID: ${serviceAccount.project_id || projectId}\n`);

    let processedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let lastDoc = null;

    const BATCH_SIZE = 25;

    // Process stores in batches
    while (true) {
      let query = db.collection('stores');

      if (lastDoc) {
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

        // Skip if wholesaleConfig already exists
        if (store.wholesaleConfig) {
          skippedCount++;
          continue;
        }

        updatedCount++;

        if (!isDryRun) {
          // Initialize missing fields - don't use nested notation for top-level objects
          const updateData = {
            wholesaleConfig: {
              ...DEFAULT_WHOLESALE_CONFIG,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            wholesaleStats: {
              ...(store.wholesaleStats || DEFAULT_WHOLESALE_STATS),
              lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }
          };
          
          batch.update(doc.ref, updateData);
          batchMutationCount++;
        }

        // Log progress every 10 stores
        if (processedCount % 10 === 0) {
          console.log(`   Processed: ${processedCount} stores...`);
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

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      // Check if there are more documents
      if (snapshot.docs.length < BATCH_SIZE) {
        break;
      }
    }

    // Display results
    console.log('\n📊 MIGRATION SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total stores processed:  ${processedCount}`);
    console.log(`   Stores skipped:          ${skippedCount} (already has wholesaleConfig)`);
    console.log(`   Stores updated:          ${updatedCount} ${isDryRun ? '(DRY RUN)' : '✅'}`);
    console.log(`   Errors:                  ${errorCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (isDryRun) {
      console.log('\n✨ DRY RUN COMPLETE - No changes were made');
      console.log('   Run again without --dry-run to apply changes');
    } else {
      console.log('\n✅ MIGRATION COMPLETE');
    }

    // Display index links
    displayIndexLinks();

    return { processedCount, skippedCount, updatedCount, errorCount };
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
};

/**
 * Main execution
 */
const main = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  Wholesale Feature Migration                          ║');
    console.log('║  Initialize wholesaleConfig & wholesaleStats on       ║');
    console.log('║  all existing stores for backward compatibility       ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes will be made');
    }

    // Display index links upfront
    displayIndexLinks();

    // Show confirmation prompt (unless --skip-prompt)
    if (!skipPrompt && !isDryRun) {
      const shouldProceed = await confirm(
        '⚠️  This will initialize wholesaleConfig on all existing stores.\n   Continue? (y/n): '
      );

      if (!shouldProceed) {
        console.log('\n❌ Migration cancelled');
        process.exit(0);
      }
    } else if (isDryRun && !skipPrompt) {
      const shouldProceed = await confirm(
        '📋 Preview changes without applying them?\n   Continue? (y/n): '
      );

      if (!shouldProceed) {
        console.log('\n❌ Dry run cancelled');
        process.exit(0);
      }
    }

    // Run migration
    await migrateStores(isDryRun);

    console.log('\n💡 Next steps:');
    console.log('   1. Click the index links above to create indexes in Firebase Console');
    console.log('   2. Or use firebaseIndexes.json with: firebase deploy --only firestore:indexes');
    console.log('   3. Run: npm run dev');
    console.log('   4. Test wholesale discovery modal to verify all stores appear');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

main();
