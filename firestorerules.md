rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {

// WARNING: These rules are for development and are INSECURE.
// They allow anyone to read and write to your database.
// You MUST secure these rules before deploying to production.

// --- Helper Function for Product Validation ---
function isValidProduct(product) {
  return (!('commission' in product) ||
            (product.commission is number &&
             product.commission >= 1 &&
             product.commission <= 12)) &&
         (!('originalPrice' in product) ||
            product.originalPrice == null ||
            (product.price < product.originalPrice));
}

// --- Helper Function for WhatsApp Schedule Validation ---
function isValidWhatsappSchedule(schedule) {
  return schedule.storeId is string &&
         schedule.message is string &&
         schedule.scheduledTime is timestamp &&
         (schedule.status in ['scheduled', 'completed', 'missed']) &&
         (schedule.recurrence in ['none', 'daily', 'weekly']) &&
         (schedule.imageUrl == null || schedule.imageUrl is string);
}

// --- Collection Group Read Rules ---
match /{path=**}/products/{productId} {
  allow read: if true;
}
match /{path=**}/categories/{categoryId} {
  allow read: if true;
}
match /{path=**}/referrals/{referralId} {
  allow read: if true;
}
match /{path=**}/whatsappSchedules/{scheduleId} {
  allow read: if true;
}


// --- Customer Data Rules ---
match /customers/{userId} {
  allow read, write: if true;

  // MODIFIED BLOCK START
  match /orders/{orderId} {
    // Keeps reads and creates open for development, as before.
    allow read, create: if true;
    
    // Allows an update if:
    // 1. It's an authenticated store owner updating ONLY the status field of an order from their store.
    // OR
    // 2. Fallback to `true` to keep other update operations working during development.
    allow update: if (request.auth != null &&
                    exists(/databases/$(database)/documents/stores/$(request.auth.uid)) &&
                    get(/databases/$(database)/documents/customers/$(userId)/orders/$(orderId)).data.storeMeta.id == request.auth.uid &&
                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status']))
                 || true; // IMPORTANT: This `|| true` keeps your app working like before for other updates.
                 
    // Keeps deletes open for development
    allow delete: if true;
  }
  // MODIFIED BLOCK END

  match /referrals/{referralId} {
    allow read, write: if true;
  }
  match /referralsByStore/{storeId} {
    allow read, write: if true;

    match /successfulOrders/{orderId} {
      allow read, write: if true;
    }
  }
}

// --- Store Data Rules ---
match /stores/{storeId} {
  allow read, write: if true;

  match /orders/{orderId} {
    allow read, write: if true;
  }
  match /products/{productId} {
    allow read, create, update, delete: if true;
  }
  match /posts/{postId} {
    allow read, write: if true;
  }
  match /categories/{categoryId} {
    allow read, write: if true;
  }
  match /wholesale/{wholesaleId} {
    allow read, write: if true;
  }
  match /contacts/{contactId} {
    allow read, write: if true;
  }
  match /referrals/{referralId} {
    allow read, write: if true;
  }
  
  match /whatsappSchedules/{scheduleId} {
    allow read, write: if true; 
  }
  
  match /dailyMetrics/{metricId} {
    allow read, write: if true;
  }
}

// --- Product Metrics Rules ---
// Document ID format: {storeId}_{productId}
match /productMetrics/{metricId} {
  // Anyone can read metrics (public product data)
  allow read: if true;
  
  // Only the store owner can create/update their product metrics
  // For development, also allow open writes like other collections
  allow create, update: if (request.auth != null &&
                            exists(/databases/$(database)/documents/stores/$(request.auth.uid)) &&
                            request.resource.data.storeId == request.auth.uid)
                        || true; // Keeps it open for development
  
  // Deletes open for development                      
  allow delete: if true;
}

// --- Other Collections ---
match /stockNotifications/{notificationId} {
  allow read, write, create, update, delete: if true;
}