import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import Modal from '../../Modal';
import { Send, Copy, Share2, X, Check } from 'lucide-react';

interface StoreLinkModalProps {
  storeLink: string;
  handleClose: () => void;
  promoCaption?: string;
  storeName?: string;
  categories?: { id: string, name: string }[];
}

// Social Icons
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06c0 3.37 1.76 6.35 4.47 8.13-.09-.59-.2-1.28-.29-1.92h-.03c-.09-.61-.17-1.23-.24-1.87-.08-.6-.14-1.18-.18-1.72-.03-.43-.05-.82-.05-1.18 0-4.03 3.28-7.3 7.3-7.3s7.3 3.27 7.3 7.3c0 .35-.02.72-.05 1.07-.03.35-.08.73-.14 1.15s-.14.88-.22 1.37c-.08.49-.17.99-.26 1.5h-.03c-.09.51-.18 1.03-.26 1.56-.23 1.49-.57 2.92-.99 4.28.16-.01.32-.02.48-.02 5.5 0 9.96-4.49 9.96-10.02S17.5 2.04 12 2.04zM8.53 11.23c-.33 0-.6.27-.6.6s.27.6.6.6h7.93c.33 0 .6-.27.6-.6s-.27-.6-.6-.6H8.53zm0 2.59c-.33 0-.6.27-.6.6s.27.6.6.6h4.96c.33 0 .6-.27.6-.6s-.27-.6-.6-.6H8.53z"/></svg>;
const FacebookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.196h3.312z"/></svg>;
const InstagramIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.012 3.584-.07 4.85c-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.148-3.225 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.947s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
const TwitterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616v.064c0 2.298 1.634 4.212 3.793 4.649-.562.152-1.158.22-1.778.085.617 1.954 2.408 3.377 4.533 3.419-1.625 1.278-3.673 2.03-5.894 2.03-.382 0-.76-.022-1.13-.066 2.099 1.354 4.602 2.149 7.29 2.149 8.749 0 13.529-7.252 13.529-13.529 0-.206-.005-.412-.013-.617.928-.67 1.734-1.503 2.37-2.45z"/></svg>;

const formatCategories = (categories: { name: string }[] | undefined) => {
  if (!categories || categories.length === 0) return 'products';
  
  const categoryNames = categories.map(c => c.name);
  const count = categoryNames.length;

  if (count <= 5) {
    if (count === 1) return categoryNames[0];
    if (count === 2) return categoryNames.join(' and ');
    const last = categoryNames.pop();
    return `${categoryNames.join(', ')}, and ${last}`;
  } else {
    const firstFive = categoryNames.slice(0, 5);
    return `${firstFive.join(', ')}, and more`;
  }
};

const StoreLinkModal: React.FC<StoreLinkModalProps> = ({ storeLink, handleClose, promoCaption, storeName, categories }) => {
  const [fullUrl, setFullUrl] = useState('');
  const [copyState, setCopyState] = useState(false);

  useEffect(() => {
    if (storeLink) {
      if (storeLink.startsWith('http')) {
        setFullUrl(storeLink);
      } else {
        const storeId = storeLink.startsWith('/') ? storeLink.substring(1) : storeLink;
        const newFullUrl = `https://tinyurl.com/bizcononline/${storeId}`;
        setFullUrl(newFullUrl);
      }
    }
  }, [storeLink]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyState(true);
      setTimeout(() => {
        setCopyState(false);
      }, 2000);
    });
  };

  const formattedCategories = formatCategories(categories);
  const defaultCaption = `🌟 Discover authentic ${formattedCategories} at affordable prices in the new ${storeName || 'Online Store'} Online store! 🛒 Nationwide delivery 🚚 🇳🇬. Tap the link below:`;
  const shareMessage = `${promoCaption ? promoCaption.replace(/\n/g, '\n') : defaultCaption}\n${fullUrl}`;

  const socialPlatforms = [
    { name: 'WhatsApp', icon: WhatsAppIcon, url: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`, color: 'bg-[#25D366] hover:bg-[#1DA851]' },
    { name: 'Facebook', icon: FacebookIcon, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(promoCaption || defaultCaption)}`, color: 'bg-[#1877F2] hover:bg-[#166eD9]' },
    { name: 'Instagram', icon: InstagramIcon, url: `https://www.instagram.com`, color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500' },
    { name: 'Twitter', icon: TwitterIcon, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, color: 'bg-[#1DA1F2] hover:bg-[#1A91DA]' },
  ];

  const paneVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  };

  return (
    <Modal open={true} onClose={handleClose}>
      <button onClick={handleClose} className="absolute top-3 right-3 z-20 text-text-secondary hover:text-text-primary bg-white/80 dark:bg-slate-700/80 rounded-full p-1.5 shadow-lg" aria-label="Close">
        <X className="w-5 h-5" />
      </button>
      <div className="w-full flex flex-col items-center pt-2 px-2">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 border border-primary/20">
          <Send className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Share Your Store</h2>
        <p className="text-sm text-text-secondary mb-6 text-center px-4">Copy your personalized message to share.</p>

        <motion.div
          key="message"
          variants={paneVariants}
          initial="hidden"
          animate="visible"
          className="w-full space-y-4 flex flex-col items-center"
        >
          <blockquote className="w-full px-3 py-2.5 rounded-lg bg-background-alt border border-border-color">
            <p className="text-sm text-text-primary whitespace-pre-wrap break-words select-text">{shareMessage}</p>
          </blockquote>
          <button className="w-full flex items-center justify-center gap-2 h-11 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow active:scale-95" onClick={() => handleCopy(shareMessage)}>
            {copyState ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copyState ? 'Copied!' : 'Copy Message'}
          </button>
        </motion.div>

        <div className="w-full border-t border-border-color my-6"></div>

        <div className="flex flex-col items-center gap-4 w-full">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Quick Share
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-sm">
            {socialPlatforms.map((platform) => (
              <a href={platform.url} target="_blank" rel="noopener noreferrer" key={platform.name} className={`flex items-center justify-center gap-2.5 h-11 px-3 py-2 rounded-lg text-white font-semibold shadow-md transition-all active:scale-95 transform hover:scale-105 ${platform.color} ${!fullUrl ? 'pointer-events-none opacity-50' : ''}`} title={`Share on ${platform.name}`}>
                <platform.icon />
                {platform.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StoreLinkModal;
