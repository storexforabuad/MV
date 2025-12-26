"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useVendor } from '@/context/VendorContext';
import { db } from "../../lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { uploadImageToCloudinary } from '@/lib/cloudinaryClient';
import { compressImage } from '@/utils/imageCompression';

interface Props {
  storeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPitchComposer({ storeId, isOpen, onClose }: Props) {
  const { vendor, promptLogin } = useVendor();
  const [name, setName] = useState("");
  const [pricePerSlot, setPricePerSlot] = useState<number | ''>('');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(60);
  const [availabilityStart, setAvailabilityStart] = useState("08:00");
  const [availabilityEnd, setAvailabilityEnd] = useState("22:00");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  if (!vendor || vendor.storeId !== storeId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md p-6">
          <h3 className="text-lg font-bold mb-2">Vendor required</h3>
          <p className="text-sm mb-4">You need to sign in as the store vendor to add a pitch.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => { promptLogin(storeId); }} className="px-4 py-2 rounded bg-blue-600 text-white">Sign in</button>
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    setIsSubmitting(true);
    try {
      const pitchesRef = collection(db, `stores/${storeId}/pitches`);
      const pitchRef = doc(pitchesRef);
      let imageUrl = "";
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        imageUrl = await uploadImageToCloudinary(compressed, storeId);
      }

      const payload = {
        id: pitchRef.id,
        name,
        images: imageUrl ? [imageUrl] : [],
        pricePerSlot: typeof pricePerSlot === 'number' ? pricePerSlot : Number(pricePerSlot) || 0,
        slotDurationMinutes,
        availability: { start: availabilityStart, end: availabilityEnd },
        createdAt: serverTimestamp(),
      };

      await setDoc(pitchRef, payload);
      onClose();
    } catch (err) {
      console.error("Failed to create pitch", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-xl p-6">
        <h3 className="text-lg font-bold mb-2">Add Pitch</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium">Price per Slot (NGN)</label>
              <input type="number" min={0} value={pricePerSlot as any} onChange={e => setPricePerSlot(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium">Slot Duration (mins)</label>
              <input type="number" min={15} step={15} value={slotDurationMinutes} onChange={e => setSlotDurationMinutes(Number(e.target.value))} className="w-full p-2 border rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium">Available From</label>
              <input type="time" value={availabilityStart} onChange={e => setAvailabilityStart(e.target.value)} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">Available Until</label>
              <input type="time" value={availabilityEnd} onChange={e => setAvailabilityEnd(e.target.value)} className="w-full p-2 border rounded" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Image (optional)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white">{isSubmitting ? 'Adding...' : 'Add Pitch'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
