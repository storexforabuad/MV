rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
// WARNING: These rules are for development and are INSECURE.
// They allow wide reads and writes to your database to keep the dev workflow fast.
// Remove the permissive fallbacks and tighten rules before production.

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

// --- Helper Function for Payment Evidence TTL ---
// Auto-deletes payment evidence after 30 days (2592000 seconds)
function isPaymentEvidenceExpired() {
  return resource.data.ttl != null && 
         request.time.toMillis() >= resource.data.ttl;
}

// --- Collection Group Read Rules (public reads) ---
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
  // Dev: open read/write so customer lookup & create work from client
  allow read, write: if true;

  match /orders/{orderId} {
    // Keep reads and creates open for development.
    allow read, create: if true;

    // Allow store owner to update ONLY the 'status' field (dev-friendly), but keep a permissive fallback for other updates.
    // Also allow updating payment-related fields (paymentEvidenceUrl, paymentStatus, paymentEvidenceFileName)
    allow update: if (request.auth != null &&
                    exists(/databases/$(database)/documents/stores/$(request.auth.uid)) &&
                    get(/databases/$(database)/documents/customers/$(userId)/orders/$(orderId)).data.storeMeta.id == request.auth.uid &&
                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'paymentEvidenceUrl', 'paymentStatus', 'paymentEvidenceFileName', 'paymentEvidenceUploadedAt', 'ttl']))
                 || true;

    // Deletes open for development
    allow delete: if true;
  }

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
  // Keep store read/write open during development.
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

  // --- Sports / Pitching Additions (dev-friendly) ---
  // Pitches for a store
  match /pitches/{pitchId} {
    allow read: if true;
    // Allow create/update/delete during development.
    allow create, update, delete: if true;
  }

  // Slot locks (deterministic lock documents) used by booking transactions
  // lockId format: "{pitchId}__{YYYY-MM-DD}__{HHmm}"
  match /slotLocks/{lockId} {
    allow read: if true;

    // For development: allow create/update/delete — production should restrict these
    allow create: if true;
    allow update: if true;
    allow delete: if true;
  }

  // Bookings under a store
  match /bookings/{bookingId} {
    allow read: if true;

    // Allow create from clients during development (createBooking transaction uses client SDK)
    allow create: if true;

    // Updates: allow owner or customer in dev — tighten in prod
    allow update: if true;

    allow delete: if true;
  }

  // Events and participants
  match /events/{eventId} {
    allow read: if true;
    allow create, update, delete: if true;

    match /participants/{participantId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if true;
    }
  }

  // Commission payment submissions (owners upload proof)
  match /commissionPayments/{paymentId} {
    allow read: if true;

    // Owners can submit commission payment records during development
    allow create: if true;

    // For development, allow update/delete — in production require Bizcon admin for ack/reject
    allow update: if true;
    allow delete: if true;
  }
}

// --- Product Metrics Rules ---
// Document ID format: {storeId}_{productId}
match /productMetrics/{metricId} {
  // Anyone can read metrics (public product data)
  allow read: if true;

  // For development, keep writes open
  allow create, update: if (request.auth != null &&
                            exists(/databases/$(database)/documents/stores/$(request.auth.uid)) &&
                            request.resource.data.storeId == request.auth.uid)
                        || true;

  allow delete: if true;
}

// --- Admin Config Rules ---
match /admin/{docId} {
  // Allow the dev team to read and update roadmap configurations
  allow read, write: if true;
}

// --- Registration Rules ---
match /registrations/{registrationId} {
  allow create: if true;
  allow read, update, delete: if true;
}

// --- Other Collections ---
match /stockNotifications/{notificationId} {
  allow read, write, create, update, delete: if true;
}

// --- TTL (Time-To-Live) Policy for Payment Evidence ---
// Firestore automatically deletes documents with a ttl field when the current time exceeds that field's value.
// For restaurant orders with payment evidence:
// - ttl is set to: current_server_timestamp + 2592000 seconds (30 days)
// - Firestore automatically deletes these orders after 30 days
// - No Cloud Functions or manual cleanup needed
// 
// Implementation in code:
// When adding payment evidence to an order, set:
// ttl: serverTimestamp() + 2592000 (in milliseconds)
// 
// Note: TTL documents are deleted within 24-48 hours of expiration.

// --- Production Guidance (replace dev permissive rules below when ready) ---
/*
match /stores/{storeId} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update, delete: if request.auth != null && resource.data.ownerId == request.auth.uid;

  match /pitches/{pitchId} {
    allow read: if true;
    allow create: if request.auth != null && request.auth.uid == resource.data.ownerId;
    allow update, delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
  }

  match /slotLocks/{lockId} {
    allow read: if true;
    // Only allow transactions from authenticated users; consider using a server-side service account for final authority
    allow create: if request.auth != null;
    allow update, delete: if request.auth != null && (request.auth.uid == resource.data.ownerId || request.auth.token.bizcon == true);
  }

  match /bookings/{bookingId} {
    allow read: if true;
    allow create: if request.auth != null;
    // Only owner or the booking owner (customer) can update certain fields; server-side verification recommended
    allow update: if request.auth != null && (request.auth.uid == resource.data.customerId || request.auth.token.bizcon == true || request.auth.uid == resource.data.storeOwnerId);
    allow delete: if request.auth != null && request.auth.token.bizcon == true;
  }

  match /commissionPayments/{paymentId} {
    allow read: if true;
    allow create: if request.auth != null && request.auth.uid == request.resource.data.uploadedBy;
    allow update: if request.auth != null && (request.auth.token.bizcon == true || request.auth.uid == request.resource.data.uploadedBy);
    allow delete: if request.auth != null && request.auth.token.bizcon == true;
  }
}
*/
}
}