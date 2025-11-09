
// import {onSchedule} from 'firebase-functions/v2/scheduler';
// import * as admin from 'firebase-admin';
// import * as logger from 'firebase-functions/logger';

// admin.initializeApp();

// const db = admin.firestore();

// export const checkScheduledPosts = onSchedule('every 5 minutes', async (_event) => {
//  const now = admin.firestore.Timestamp.now();
//  const query = db.collectionGroup('whatsappSchedules').where('scheduledTime', '<=', now).where('status', '==', 'scheduled');
//  const snapshot = await query.get();

//  if (snapshot.empty) {
//    logger.info('No scheduled posts to process.');
//    return;
//  }

//  const promises = snapshot.docs.map(async (doc) => {
//    const post = doc.data();
//    const storeId = post.storeId;
//    const storeDoc = await db.collection('stores').doc(storeId).get();
//    const storeData = storeDoc.data();
//    const fcmToken = storeData?.fcmToken;
//  });

//  await Promise.all(promises);
// });
