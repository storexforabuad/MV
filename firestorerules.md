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
      allow read, write: if true;

      match /orders/{orderId} {
        allow read, create: if true;
        allow update: if (request.auth != null &&
                        exists(/databases/$(database)/documents/stores/$(request.auth.uid)) &&
                        get(/databases/$(database)/documents/customers/$(userId)/orders/$(orderId)).data.storeMeta.id == request.auth.uid &&
                        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'paymentEvidenceUrl', 'paymentStatus', 'paymentEvidenceFileName', 'paymentEvidenceUploadedAt', 'ttl']))
                     || true;
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

      match /pitches/{pitchId} {
        allow read: if true;
        allow create, update, delete: if true;
      }

      match /slotLocks/{lockId} {
        allow read: if true;
        allow create: if true;
        allow update: if true;
        allow delete: if true;
      }

      match /bookings/{bookingId} {
        allow read: if true;
        allow create: if true;
        allow update: if true;
        allow delete: if true;
      }

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

      match /commissionPayments/{paymentId} {
        allow read: if true;
        allow create: if true;
        allow update: if true;
        allow delete: if true;
      }

      // --- WHOLESALE SUBCOLLECTIONS ---
      match /wholesaleRequests/{requestId} {
        allow read, write: if true;
      }

      match /wholesalePartners/{partnerId} {
        allow read, write: if true;
      }

      match /wholesaleOrders/{orderId} {
        allow read, write: if true;
      }

      match /wholesaleInvoices/{invoiceId} {
        allow read, write: if true;
      }
    }

    // --- Product Metrics Rules ---
    match /productMetrics/{metricId} {
      allow read: if true;
      allow create, update: if (request.auth != null &&
                                exists(/databases/$(database)/documents/stores/$(request.auth.uid)) &&
                                request.resource.data.storeId == request.auth.uid)
                            || true;
      allow delete: if true;
    }

    // --- Admin Config Rules ---
    match /admin/{docId} {
      allow read, write: if true;
    }

    // --- Registration Rules (NEW) ---
    match /registrations/{registrationId} {
      allow create: if true;
      allow read, update, delete: if true;
    }

    // --- Wholesale Transactions (Platform-level) ---
    match /wholesaleTransactions/{transactionId} {
      allow read, write: if true;
    }

    // --- Wholesale Invoices (Platform-level) ---
    match /wholesaleInvoices/{invoiceId} {
      allow read, write: if true;
    }

    // --- Other Collections ---
    match /stockNotifications/{notificationId} {
      allow read, write, create, update, delete: if true;
    }
  }
}