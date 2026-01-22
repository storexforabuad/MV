export interface BusinessConfig {
  name: string;
  shortName: string;
  description: string;
  contact: {
    whatsapp: string;
    support: string;
    payment: {
      accountName: string;
      accountNumber: string;
      bankName: string;
    }
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
  };
}

export const businessConfig: BusinessConfig = {
  name: "Atlas Network",
  shortName: "Atlas",
  description: "Authentic Products at affordable prices",
  contact: {
    whatsapp: "+2348119772223",
    support: "+2348119772223",
    payment: {
      accountName: "Gambo Mustapha",
      accountNumber: "8119772223",
      bankName: "Opay"
    }
  },
  theme: {
    primaryColor: "blue-800",
    secondaryColor: "green-500",
    backgroundColor: "gray-50"
  }
};