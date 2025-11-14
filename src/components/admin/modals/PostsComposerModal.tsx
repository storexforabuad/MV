
'use client';
import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon, CalendarIcon, ArrowPathIcon, CheckIcon, TrashIcon, PencilIcon, ArrowUturnLeftIcon, ArrowDownTrayIcon, ClipboardDocumentIcon, CubeIcon, ShareIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { getFirestore, collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { uploadImageToCloudinary } from '../../../lib/cloudinaryClient';
import { compressImage } from '../../../utils/imageCompression';
import { WholesaleData } from '../../../lib/db';
import { app as firebaseApp } from '../../../lib/firebase';
import { Product } from '@/types/product';
import ProductSelectorModal from './ProductSelectorModal';
import { urlToFile } from '@/utils/fileUtils';
import { scheduleWhatsappMessage } from '@/lib/whatsappScheduler';

// -- TYPES --
interface FirebaseScheduledPost {
    id: string;
    message: string;
    imageUrl?: string;
    scheduledTime: Timestamp;
    status: 'scheduled' | 'completed' | 'missed';
    recurrence: 'none' | 'daily' | 'weekly';
    createdAt: Timestamp;
    platforms: Platform[];
}

interface ScheduledPost extends Omit<FirebaseScheduledPost, 'scheduledTime' | 'createdAt'> {
    scheduledTime: Date;
    createdAt: Date;
}

interface PostsComposerProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    contacts: WholesaleData[];
    products: Product[];
    storeName?: string;
}

// -- CONSTANTS --
type Platform = 'Facebook' | 'Instagram' | 'X' | 'WhatsApp';
const platformDetails: { name: Platform; icon: string; color: string }[] = [
    { name: 'Facebook', icon: '.../facebook.svg', color: '#1877F2' },
    { name: 'Instagram', icon: '.../instagram.svg', color: '#E4405F' },
    { name: 'X', icon: '.../x.svg', color: '#000000' },
    { name: 'WhatsApp', icon: '.../whatsapp.svg', color: '#25D366' },
];

// -- HELPER FUNCTIONS --
const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Message copied!');
};

const downloadImage = (url: string) => {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'scheduled-image.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Image saved!');
        })
        .catch(() => toast.error('Failed to save image.'));
};

// -- MAIN COMPONENT --
const PostsComposerModal: React.FC<PostsComposerProps> = ({ isOpen, onClose, storeId, contacts, products, storeName }) => {
    const [currentTab, setCurrentTab] = useState('composer');
    const [message, setMessage] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [scheduledTime, setScheduledTime] = useState(() => new Date(Date.now() + 5 * 60000));
    const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly'>('none');
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [isScheduling, setIsScheduling] = useState(false);
    const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
    
    const [scheduledItems, setScheduledItems] = useState<ScheduledPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<ScheduledPost | null>(null);

    const db = getFirestore(firebaseApp);

    const resetComposer = useCallback(() => {
        setMessage('');
        setImageFile(null);
        setScheduledTime(new Date(Date.now() + 5 * 60000));
        setRecurrence('none');
        setPlatforms([]);
        setIsScheduling(false);
    }, []);

    useEffect(() => {
        if (!isOpen || !storeId) return;
        
        setIsLoading(true);
        const postsRef = collection(db, 'stores', storeId, 'posts');
        const q = query(postsRef, orderBy('scheduledTime', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => {
                const data = doc.data() as Omit<FirebaseScheduledPost, 'id'>;
                return {
                    ...data,
                    id: doc.id,
                    scheduledTime: data.scheduledTime.toDate(),
                    createdAt: data.createdAt?.toDate() ?? new Date(),
                };
            });
            setScheduledItems(items);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching scheduled posts:", err);
            setError("Couldn't load scheduled posts.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, storeId, db]);

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            resetComposer();
            setCurrentTab('composer');
        }, 300);
    };

    const handleSchedule = async () => {
        if (!message) return toast.error('Please enter a message.');
        if (platforms.length === 0) return toast.error('Please select at least one platform.');
        if (scheduledTime < new Date()) return toast.error('Scheduled time must be in the future.');
    
        setIsScheduling(true);
        const toastId = toast.loading('Scheduling...');
    
        try {
            let imageUrl = '';
            if (imageFile) {
                const compressedFile = await compressImage(imageFile);
                imageUrl = await uploadImageToCloudinary(compressedFile, storeId);
            }
    
            const socialPlatforms = platforms.filter(p => p !== 'WhatsApp');
            const isWhatsAppSelected = platforms.includes('WhatsApp');
    
            if (isWhatsAppSelected) {
                const result = await scheduleWhatsappMessage(storeId, message, imageUrl, contacts, scheduledTime, recurrence);
                if (!result.success) throw new Error("WhatsApp scheduling failed");
            }
    
            if (socialPlatforms.length > 0) {
                await addDoc(collection(db, 'stores', storeId, 'posts'), {
                    storeId, message, imageUrl, recurrence, 
                    platforms: socialPlatforms,
                    scheduledTime: Timestamp.fromDate(scheduledTime),
                    status: 'scheduled',
                    createdAt: serverTimestamp(),
                });
            }
    
            toast.success('Post scheduled!', { id: toastId });
            setCurrentTab('scheduled');
            resetComposer();
        } catch (error) {
            console.error("Scheduling failed:", error);
            toast.error('Failed to schedule post.', { id: toastId });
        } finally {
            setIsScheduling(false);
        }
    };
    
    const handleProductSelect = async (product: Product) => {
        const caption = `Check out our new product: ${product.name}!\n\nPrice: ₦${product.price.toLocaleString()}\n\nOrder now at https://${storeName}.bizcon.app/products/${product.id}`;
        setMessage(caption);

        if (product.images && product.images[0]) {
            const file = await urlToFile(product.images[0], `${product.id}.jpg`);
            if (file) {
                setImageFile(file);
            }
        }

        setIsProductSelectorOpen(false);
    };

    const handleMarkAsComplete = async (item: ScheduledPost) => {
        const collectionName = item.platforms.includes('WhatsApp') ? 'whatsappSchedules' : 'posts';
        const docRef = doc(db, 'stores', storeId, collectionName, item.id);
        const toastId = toast.loading('Updating status...');
        try {
            await updateDoc(docRef, { status: 'completed' });
    
            if (item.recurrence !== 'none' && collectionName === 'posts') {
                const newScheduledTime = new Date(item.scheduledTime);
                if (item.recurrence === 'daily') {
                    newScheduledTime.setDate(newScheduledTime.getDate() + 1);
                } else if (item.recurrence === 'weekly') {
                    newScheduledTime.setDate(newScheduledTime.getDate() + 7);
                }
    
                await addDoc(collection(db, 'stores', storeId, 'posts'), {
                    ...item,
                    scheduledTime: Timestamp.fromDate(newScheduledTime),
                    status: 'scheduled',
                    createdAt: serverTimestamp(),
                });
                toast.success('Posted & rescheduled for next occurrence!', { id: toastId });
            } else {
                toast.success('Marked as Posted!', { id: toastId });
            }
           
        } catch (error) {
            toast.error("Couldn't update status.", { id: toastId });
            console.error(error);
        }
    };

    const handleDelete = async (item: ScheduledPost) => {
        setItemToDelete(null);
        const collectionName = item.platforms.includes('WhatsApp') ? 'whatsappSchedules' : 'posts';
        const toastId = toast.loading('Deleting...');
        try {
            await deleteDoc(doc(db, 'stores', storeId, collectionName, item.id));
            toast.success('Schedule deleted.', { id: toastId });
        } catch (error) {
            toast.error('Could not delete schedule.', { id: toastId });
        }
    };

    const handlePostAgain = (item: ScheduledPost) => {
        setMessage(item.message);
        setImageFile(null); 
        setScheduledTime(new Date(Date.now() + 5 * 60000));
        setRecurrence(item.recurrence);
        setPlatforms(item.platforms);
        setCurrentTab('composer');
        toast('Composer loaded with message. Set a new time to post again.');
    }

    const togglePlatform = (platform: Platform) => {
        setPlatforms(prev => 
            prev.includes(platform) 
                ? prev.filter(p => p !== platform) 
                : [...prev, platform]
        );
    };

    // -- RENDER METHODS --

    const renderComposer = () => (
      <div className="p-4 sm:p-6 space-y-4">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What content would you like to post?" className="block w-full px-4 py-3 text-base text-text-primary bg-input-background rounded-lg border-2 border-input-border focus:outline-none focus:ring-0 focus:border-blue-600 transition-colors" rows={5} />
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label htmlFor="image-upload" className="cursor-pointer flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition">
                  <PhotoIcon className="w-6 h-6" />
                  <span>{imageFile ? 'Change Image' : 'Add Image'}</span>
              </label>
              <button onClick={() => setIsProductSelectorOpen(true)} className="cursor-pointer flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition">
                <CubeIcon className="w-6 h-6" />
                <span>Add Product</span>
              </button>
            </div>
            <input id="image-upload" type="file" accept="image/*" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} className="hidden" />
            {imageFile && <span className="text-sm text-text-secondary truncate max-w-[50%]">{imageFile.name}</span>}
        </div>
        <div className="space-y-4 pt-4 border-t border-border-color">
            <h3 className="text-lg font-semibold text-text-primary">Options</h3>
            <div className="flex items-center gap-4">
                <ShareIcon className="w-6 h-6 text-text-secondary flex-shrink-0" />
                <div className="flex gap-2 flex-wrap">
                    {platformDetails.map(p => (
                        <button key={p.name} onClick={() => togglePlatform(p.name)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-all ${platforms.includes(p.name) ? 'text-white shadow' : 'bg-input-background text-text-secondary'}`} style={{ backgroundColor: platforms.includes(p.name) ? p.color : undefined }}>
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <CalendarIcon className="w-6 h-6 text-text-secondary flex-shrink-0" />
                <input type="datetime-local" value={new Date(scheduledTime.getTime() - scheduledTime.getTimezoneOffset() * 60000).toISOString().substring(0, 16)} onChange={(e) => setScheduledTime(new Date(e.target.value))} className="w-full p-2 bg-input-background rounded-lg border-2 border-input-border focus:ring-0 focus:border-blue-600" min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().substring(0, 16)} />
            </div>
             <div className="flex items-center gap-4">
                <ArrowPathIcon className="w-6 h-6 text-text-secondary flex-shrink-0" />
                <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as 'none' | 'daily' | 'weekly')} className="w-full p-2 bg-input-background rounded-lg border-2 border-input-border focus:ring-0 focus:border-blue-600">
                    <option value="none">No Recurrence</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                </select>
            </div>
        </div>
      </div>
    );

    const renderScheduleList = (listType: 'scheduled' | 'history') => {
        const now = new Date();
        const anHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        const isReadyToPost = (item: ScheduledPost) => item.status === 'scheduled' && item.scheduledTime <= now;
        const isUpcoming = (item: ScheduledPost) => item.status === 'scheduled' && item.scheduledTime > now;
        const isDueSoon = (item: ScheduledPost) => isUpcoming(item) && item.scheduledTime <= anHourFromNow;

        const items = listType === 'scheduled' 
            ? scheduledItems.filter(item => item.status === 'scheduled').sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
            : scheduledItems.filter(item => item.status !== 'scheduled').sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());

        if (isLoading) return <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
        if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
        if (items.length === 0) return <div className="p-8 text-center text-text-secondary"><h3 className="text-xl font-semibold text-text-primary">No {listType === 'scheduled' ? 'Scheduled' : 'Past'} Posts</h3><p>Your {listType} posts will appear here.</p></div>;

        return (
            <div className="p-2 sm:p-4 space-y-4 h-full overflow-y-auto">
                {items.map(item => {
                    const cardState = isReadyToPost(item) ? 'ready' : isUpcoming(item) ? 'upcoming' : item.status;
                    const cardAccentColor: { [key: string]: string } = {
                        ready: 'border-amber-500',
                        upcoming: isDueSoon(item) ? 'border-blue-500' : 'border-border-color',
                        completed: 'border-green-500/50',
                        missed: 'border-red-500/50',
                        scheduled: 'border-border-color',
                    };

                    return (
                        <div key={item.id} className={`rounded-xl bg-input-background p-4 border-2 ${cardAccentColor[cardState]} shadow-sm transition-all duration-300`}>
                            <p className="text-text-primary mb-3 whitespace-pre-wrap text-base">{item.message}</p>
                            {item.imageUrl && <div className="relative h-40 w-full rounded-lg overflow-hidden mb-3"><Image src={item.imageUrl} alt="Scheduled Image" layout="fill" objectFit="cover" /></div>}
                            
                            <div className="flex justify-between items-center mb-4 text-sm">
                                <div className="font-medium text-text-primary flex items-center gap-1.5">
                                    <CalendarIcon className="w-4 h-4 text-text-secondary"/>
                                    {item.scheduledTime.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    {item.recurrence !== 'none' && <ArrowPathIcon className="w-4 h-4 text-blue-500" title={`Recurs ${item.recurrence}`}/>}
                                </div>
                                <div className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-full text-xs capitalize ${{
                                        ready: 'bg-amber-100 text-amber-800', 
                                        upcoming: 'bg-blue-100 text-blue-800',
                                        completed: 'bg-green-100 text-green-800',
                                        missed: 'bg-red-100 text-red-800',
                                        scheduled: 'bg-gray-100 text-gray-800',
                                    }[cardState]}`}>
                                    {cardState === 'ready' ? "Ready to Post" : cardState}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    {item.platforms?.map(p => {
                                        const platform = platformDetails.find(pd => pd.name === p);
                                        return platform ? (
                                            <div key={p} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: platform.color }}>
                                                {/* You can use an img tag or a more sophisticated Icon component here */}
                                            </div>
                                        ) : null;
                                    })}
                                </div>

                                <div className="flex gap-2 justify-end flex-wrap">
                                    {cardState === 'ready' && (
                                        <>
                                            <button onClick={() => downloadImage(item.imageUrl!)} disabled={!item.imageUrl} className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 text-text-primary text-sm font-semibold hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"><ArrowDownTrayIcon className="w-5 h-5"/> Save Image</button>
                                            <button onClick={() => copyToClipboard(item.message)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 text-text-primary text-sm font-semibold hover:bg-white/20 transition"><ClipboardDocumentIcon className="w-5 h-5"/> Copy Text</button>
                                            <button onClick={() => handleMarkAsComplete(item)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition"><CheckIcon className="w-5 h-5"/> I've Posted It!</button>
                                        </>
                                    )}
                                    {cardState === 'upcoming' && (
                                        <>
                                            <button disabled className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 text-text-primary text-sm font-semibold hover:bg-white/20 disabled:opacity-50 transition" title="Edit coming soon"><PencilIcon className="w-5 h-5"/> Edit</button>
                                            <button onClick={() => setItemToDelete(item)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/80 text-white text-sm font-semibold hover:bg-red-500 transition"><TrashIcon className="w-5 h-5"/> Delete</button>
                                        </>
                                    )}
                                    {(cardState === 'completed' || cardState === 'missed') && (
                                        <button onClick={() => handlePostAgain(item)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition"><ArrowUturnLeftIcon className="w-5 h-5"/> Post Again</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        );
    };

  return (
    <>
      {/* Main Dialog */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center text-center md:items-center md:px-2 lg:px-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full md:translate-y-0 md:scale-95" enterTo="opacity-100 translate-y-0 md:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 md:scale-100" leaveTo="opacity-0 translate-y-full md:translate-y-0 md:scale-95">
                <Dialog.Panel className="relative flex w-full max-w-lg transform text-left text-base transition">
                  <div className="relative flex w-full h-[90vh] md:h-auto md:max-h-[85vh] flex-col overflow-hidden rounded-t-2xl md:rounded-2xl bg-card-background shadow-2xl">
                      <div className="p-4 sm:p-6 flex justify-between items-center border-b border-border-color flex-shrink-0">
                          <Dialog.Title as="h3" className="text-xl font-bold text-text-primary">Content Scheduler</Dialog.Title>
                          <button onClick={handleClose} className="p-1 rounded-full hover:bg-button-secondary transition"><XMarkIcon className="h-6 w-6 text-text-secondary" /></button>
                      </div>

                      <div className="border-b border-border-color flex-shrink-0">
                        <nav className="-mb-px flex justify-around">
                          {['Composer', 'Scheduled', 'History'].map(tab => (
                              <button key={tab} onClick={() => setCurrentTab(tab.toLowerCase())} className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${currentTab === tab.toLowerCase() ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{tab}</button>
                          ))}
                        </nav>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto bg-background-primary">
                        <AnimatePresence mode="wait">
                          <motion.div key={currentTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                              {currentTab === 'composer' && renderComposer()}
                              {currentTab === 'scheduled' && renderScheduleList('scheduled')}
                              {currentTab === 'history' && renderScheduleList('history')}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {currentTab === 'composer' && (
                          <div className="p-4 sm:p-6 border-t border-border-color flex-shrink-0 bg-card-background">
                             <button onClick={handleSchedule} disabled={isScheduling} className="w-full flex justify-center items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50">
                                 {isScheduling ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Schedule Post'}
                             </button>
                          </div>
                      )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <ProductSelectorModal 
        isOpen={isProductSelectorOpen} 
        onClose={() => setIsProductSelectorOpen(false)} 
        products={products} 
        onProductSelect={handleProductSelect} 
      />

      {/* Confirmation Dialog */}
      <Transition.Root show={!!itemToDelete} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={() => setItemToDelete(null)}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity" />
            </Transition.Child>
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card-background p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-text-primary">Confirm Deletion</Dialog.Title>
                            <div className="mt-2"><p className="text-sm text-text-secondary">Are you sure you want to delete this scheduled post? This action cannot be undone.</p></div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 transition" onClick={() => setItemToDelete(null)}>Cancel</button>
                                <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition" onClick={() => itemToDelete && handleDelete(itemToDelete)}>Delete</button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default PostsComposerModal;
