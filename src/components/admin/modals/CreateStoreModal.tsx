'use client';

import { useState, ChangeEvent, FormEvent, useRef } from "react";
import { StoreMeta } from "../../../types/store";
import { geography } from "../../../config/geography";
import { categorySuggestions } from "../../../config/categories";
import { db, storage } from "../../../lib/firebase";
import {
  collection,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";

interface CreateStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProgressBar = ({ step }: { step: number }) => (
  <div className="w-full px-4 sm:px-8">
    <div className="relative w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
      <div
        className="absolute top-0 left-0 h-1 bg-blue-500 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${((step - 1) / 2) * 100}%` }}
      />
      <div className="absolute w-full flex justify-between top-1/2 -translate-y-1/2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s
                ? "bg-blue-500 text-white"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300"
                }`}
            >
              {step > s ? "✓" : s}
            </div>
            <p
              className={`absolute top-10 left-1/2 -translate-x-1/2 text-xs text-center w-24 ${step >= s
                ? "text-gray-800 dark:text-gray-200 font-semibold"
                : "text-gray-500 dark:text-gray-400"
                }`}
            >
              {s === 1 && "CEO Details"}
              {s === 2 && "Business Info"}
              {s === 3 && "Categories"}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function CreateStoreModal({
  isOpen,
  onClose,
}: CreateStoreModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<StoreMeta>>({
    name: "",
    whatsapp: "",
    ceoName: "",
    ceoEmail: "",
    ceoPhone: "",
    ceoInstagram: "",
    businessDescription: "",
    businessInstagram: "",
    hasPhysicalShop: false,
    shopNumber: "",
    plazaBuildingName: "",
    streetAddress: "",
    country: "",
    state: "",
    storeType: "general",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [ceoImageFile, setCeoImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, country: e.target.value, state: "" }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCeoImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (!categories.includes(category)) {
      setCategories([...categories, category]);
    } else {
      setCategories(categories.filter((c) => c !== category));
    }
  };

  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !categories.includes(customCategory.trim())) {
      setCategories([...categories, customCategory.trim()]);
      setCustomCategory("");
    }
  };

  const nextStep = () => setStep((prev) => (prev < 3 ? prev + 1 : prev));
  const prevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : prev));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let ceoImageUrl = "";
      if (ceoImageFile) {
        const storageRef = ref(storage, `ceo-images/${Date.now()}_${ceoImageFile.name}`);
        await uploadBytes(storageRef, ceoImageFile);
        ceoImageUrl = await getDownloadURL(storageRef);
      }

      const storeId = formData.name?.toLowerCase().replace(/\s+/g, "-") ?? "";
      if (!storeId) throw new Error("Store name is required to generate an ID");

      const storeRef = doc(db, "stores", storeId);

      const finalFormData = {
        ...formData,
        id: storeId,
        ceoImage: ceoImageUrl,
        name: formData.name ?? "Default Store Name",
        whatsapp: formData.whatsapp ?? "",
      };

      await setDoc(storeRef, finalFormData);

      const batch = writeBatch(db);
      const allCategories = [...new Set(categories)];

      allCategories.forEach((categoryName) => {
        const categoryRef = doc(collection(db, `stores/${storeId}/categories`));
        batch.set(categoryRef, { name: categoryName, createdAt: serverTimestamp() });
      });

      await batch.commit();

      console.log("Store and categories created successfully!");
      onClose();
    } catch (error) {
      console.error("Error creating store:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedCountry = geography.find(c => c.name === formData.country);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col transition-all duration-300 ease-in-out">
        <div className="p-6 pt-12 sm:pt-16">
          <ProgressBar step={step} />
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">CEO Details</h2>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">Tell us about the person leading this business</p>
                <div
                  className="w-32 h-32 mx-auto rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <Image src={imagePreview} alt="CEO Preview" width={128} height={128} className="rounded-full object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs text-center text-gray-500">Click to upload image</span>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                </div>
                <input name="ceoName" value={formData.ceoName} onChange={handleInputChange} placeholder="Full Name *" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required />
                <div className="flex flex-col sm:flex-row gap-4">
                  <input name="ceoPhone" value={formData.ceoPhone} onChange={handleInputChange} placeholder="Phone Number *" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required />
                  <input name="ceoEmail" value={formData.ceoEmail} onChange={handleInputChange} placeholder="Email Address *" type="email" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required />
                </div>
                <input name="ceoInstagram" value={formData.ceoInstagram} onChange={handleInputChange} placeholder="Instagram (@username)" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">Business Info</h2>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">Tell us about the business and where it&apos;s located</p>
                <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Business Name *" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required />
                <div className="flex flex-col sm:flex-row gap-4">
                  <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="Business WhatsApp (e.g. +234...)" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                  <input name="businessInstagram" value={formData.businessInstagram} onChange={handleInputChange} placeholder="Instagram (@username)" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">🏢 What type of business is this?</label>
                  <select
                    name="storeType"
                    value={formData.storeType || 'general'}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">🛍️ General (Retail, Food, etc.)</option>
                    <option value="fashion">👗 Fashion (Ready-to-Wear, Bespoke)</option>
                    <option value="automotive">🚗 Automotive (Car Dealership)</option>
                    <option value="livestock">🐟 Livestock (Fishery & Aquaculture)</option>
                    <option value="restaurant">🍔 Restaurant (Food & Drinks)</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This determines the product fields and storefront design.
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Payout Account (optional)</h4>
                  <input name="bankAccountName" value={(formData as any).bankAccountName || ''} onChange={handleInputChange} placeholder="Account Name" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                  <input name="bankAccountNumber" value={(formData as any).bankAccountNumber || ''} onChange={handleInputChange} placeholder="Account Number" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                  <input name="bankName" value={(formData as any).bankName || ''} onChange={handleInputChange} placeholder="Bank Name" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                </div>
                <div className="flex items-center gap-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <label htmlFor="hasPhysicalShop" className="text-gray-700 dark:text-gray-300">Do you have a physical shop?</label>
                  <input type="checkbox" id="hasPhysicalShop" name="hasPhysicalShop" checked={formData.hasPhysicalShop} onChange={handleInputChange} className="toggle-checkbox" />
                </div>
                {formData.hasPhysicalShop && (
                  <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-fade-in">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input name="shopNumber" value={formData.shopNumber} onChange={handleInputChange} placeholder="Shop Number *" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required={formData.hasPhysicalShop} />
                      <input name="plazaBuildingName" value={formData.plazaBuildingName} onChange={handleInputChange} placeholder="Plaza/Building Name *" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required={formData.hasPhysicalShop} />
                    </div>
                    <input name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} placeholder="Street Address *" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required={formData.hasPhysicalShop} />
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <select name="country" value={formData.country} onChange={handleCountryChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required>
                    <option value="">Select your country</option>
                    {geography.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                  <select name="state" value={formData.state} onChange={handleInputChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required disabled={!formData.country}>
                    <option value="">Select state/province</option>
                    {selectedCountry?.states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <textarea name="businessDescription" value={formData.businessDescription} onChange={handleInputChange} placeholder="Business Description (max 500 chars)..." className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg h-24" maxLength={500}></textarea>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">Product Categories</h2>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">Select categories that best describe the products</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {categorySuggestions.map(cat => (
                    <button key={cat} type="button" onClick={() => handleCategorySelect(cat)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${categories.includes(cat) ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Or add a custom category..." className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                  <button type="button" onClick={handleAddCustomCategory} className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">+</button>
                </div>
                <div>
                  <h3 className="font-semibold mt-4">Selected Categories:</h3>
                  {categories.length > 0 ? (
                    <ul className="list-disc pl-5 mt-2 text-gray-700 dark:text-gray-300">
                      {categories.map(c => <li key={c}>{c}</li>)}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No categories selected yet. System categories &apos;Promo&apos; and &apos;New Arrivals&apos; will be available by default.</p>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-between p-6 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
          <button
            onClick={prevStep}
            disabled={step === 1 || isLoading}
            className="px-6 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 disabled:opacity-50"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Finish"}
            </button>
          )}
        </div>
      </div >
    </div >
  );
}
