import {onSchedule} from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

admin.initializeApp();

const db = admin.firestore();

export const checkScheduledPosts = onSchedule('every 5 minutes', async (_event) => {
  const now = admin.firestore.Timestamp.now();
  const query = db.collectionGroup('whatsappSchedules').where('scheduledTime', '<=', now).where('status', '==', 'scheduled');
  const snapshot = await query.get();

  if (snapshot.empty) {
    logger.info('No scheduled posts to process.');
    return;
  }

  const promises = snapshot.docs.map(async (doc) => {
    const post = doc.data();
    const storeId = post.storeId;
    const storeDoc = await db.collection('stores').doc(storeId).get();
    const storeData = storeDoc.data();
    const fcmToken = storeData?.fcmToken;

    if (fcmToken) {
      const payload = {
        notification: {
          title: 'Time to post your WhatsApp update!',
          body: post.message,
        },
        webpush: {
          fcmOptions: {
            link: `https://ladevida-f3b00.web.app/admin/${storeId}?open=whatsapp`,
          },
        },
        token: fcmToken,
      };

      try {
        await admin.messaging().send(payload);
        await doc.ref.update({ status: 'missed' });
      } catch (error) {
        logger.error('Error sending notification for store:', storeId, error);
      }
    } else {
      logger.info(`No FCM token found for store ${storeId}. Skipping notification.`);
      await doc.ref.update({ status: 'missed' });
    }
  });

  await Promise.all(promises);
});
