Redone: Product Requirements Document (PRD): PitchPerfect Africa
Project Status: Native Platform Execution (Phase 4) Core Value Proposition: Transitioning fragmented manual sports facility management into a synchronized, trust-based digital ecosystem via a mobile-first native booking platform.   

1. Executive Summary
Eliminating the reliance on fragmented WhatsApp chats for the core booking flow. The platform now hosts the entire transaction lifecycle—from discovery and real-time availability checks to secure split-payment checkout—ensuring zero double-bookings and full revenue transparency for owners.   

2. Target Personas
Persona	Pain Points	Primary Goal
The Pitch Owner	
Staff theft, unrecorded cash payments, offline-only visibility.

Maximize occupancy and automate revenue split via a digital dashboard.

The Weekend Warrior	
Unreliable availability, high data costs, lack of secure platform payments.

Book a verified pitch in under 60 seconds via a native, low-data interface.

  
3. Functional Requirements (User Stories)
3.1 Facility Discovery & Inventory
Real-time Calendar: Users must see live availability for pitches in their selected neighborhood (e.g., Lekki, Wuse 2).

Search & Filter: Ability to filter facilities by pitch type (5-a-side/7-a-side), price range, and amenities like floodlights.

3.2 Native Platform Booking (REPLACES WhatsApp Flow)
Slot Locking: Upon clicking "Book Now," the time slot is reserved for 10 minutes to allow the user to complete payment.   

Direct Checkout: Seamless integration with Paystack for bank transfers and card payments directly on the PWA.   

Automatic Split: Platform takes a 10% service fee, and 90% is instantly routed to the owner's subaccount.   

3.3 Dashboard for Owners
Digital Audit Trail: Every booking is logged with time-stamps and payment references to eliminate staff "side-pocketing" of cash.   

Manual Entry: Capability for owners to log "walk-in" cash bookings manually to keep the calendar accurate.   

4. Technical Specifications
PWA Standards: The platform must be a Progressive Web App to ensure functionality on 2G/3G networks and offline viewing of existing bookings.   

Firebase Firestore: Real-time listeners to sync calendar updates across all devices instantly.   

Service Workers: Caching of static assets and user profiles for faster repeat-visit load times.

5. Non-Functional Requirements
Time to Interactive (TTI): Must be under 5 seconds on a throttled 3G connection.   

Compliance: Adherence to the Nigeria Data Protection Act (NDPA) for all player and owner data storage.   

6. Success Metrics (KPIs)
Booking Conversion Rate: Goal >12% for users who land on a specific facility page.

Double-Booking Rate: Must be <0.5% through real-time sync verification.   

Owner Revenue Growth: 15-20% increase in captured revenue within 90 days due to the digital audit trail.   

