
import { Timestamp } from "firebase/firestore";

export interface DeliveryAddress {
  country: string;
  state: string;
  street: string;
}

export interface Customer {
  id: string; // The Firestore document ID
  phoneNumber: string;
  name: string;
  referralCode: string;
  deliveryAddress: DeliveryAddress;
  createdAt: Timestamp;
  totalReferralCommission: number;
  successfulReferralCount: number;
  referralDataByStore?: {
    [storeId: string]: {
      commissionEarned?: number;
      referralCount?: number;
    };
  };
}
