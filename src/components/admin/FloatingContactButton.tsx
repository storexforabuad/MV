'use client';

import { useState } from 'react';
import { PhoneIcon, ChatBubbleLeftIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';

const FloatingContactButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const phoneNumber = '+2348119772223';

  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleChat = () => {
    window.location.href = `https://wa.me/${formatWhatsAppNumber(phoneNumber)}`;
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-60">
      {isOpen && (
        <div className="flex flex-col items-end gap-3 mb-4 animate-fade-in">
          <button
            onClick={handleChat}
            className="flex items-center gap-2 bg-blue-500 text-white font-medium px-4 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200"
            aria-label="Chat with support"
          >
            <ChatBubbleLeftIcon className="h-6 w-6" />
            Chat
          </button>
          <button
            onClick={handleCall}
            className="flex items-center gap-2 bg-pink-500 text-white font-medium px-4 py-3 rounded-full shadow-lg hover:bg-pink-600 transition-colors duration-200"
            aria-label="Call support"
          >
            <PhoneIcon className="h-6 w-6" />
            Call
          </button>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
        aria-label="Toggle contact options"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <ChatBubbleLeftIcon className="h-6 w-6" />
        )}
      </button>
    </div>
  );
};

export default FloatingContactButton;
