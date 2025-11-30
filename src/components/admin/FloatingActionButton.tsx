'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, MessageSquare, Phone, X } from 'lucide-react';
import { businessConfig } from '@/config/business';

interface FloatingActionButtonProps {
  isModalOpen?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ isModalOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const toggleMenu = () => {
    if (typeof window.navigator.vibrate === 'function') {
      window.navigator.vibrate(10);
    }
    setIsOpen(!isOpen);
  };

  const whatsAppNumber = businessConfig.contact.whatsapp.replace('+', '');
  const contactLink = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent("Hello, I need help with my store.")}`;
  const featureRequestLink = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent("Hi! I'd like to request a new feature for my store.")}`;
  const callLink = `tel:${businessConfig.contact.support}`;

  const menuItems = [
    {
      label: 'Chat',
      icon: MessageSquare,
      action: () => window.open(contactLink, '_blank'),
      bg: 'bg-green-500/20',
      iconColor: 'text-green-500'
    },
    {
      label: 'Call',
      icon: Phone,
      action: () => window.open(callLink, '_self'),
      bg: 'bg-blue-500/20',
      iconColor: 'text-blue-500'
    },
    {
      label: 'Request a feature',
      icon: HelpCircle,
      action: () => window.open(featureRequestLink, '_blank'),
      bg: 'bg-purple-500/20',
      iconColor: 'text-purple-500'
    }
  ];

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-24 right-6 transition-transform duration-500 ease-in-out z-50 ${isMounted ? 'scale-100' : 'scale-0'} ${isModalOpen ? 'translate-x-[150%]' : 'translate-x-0'}`}
      aria-live="polite"
    >
      <div className="relative flex flex-col items-center gap-3">
        {isOpen &&
          menuItems.map((item, index) => (
            <div
              key={item.label}
              className="flex items-center gap-3 animate-spring-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span
                onClick={item.action}
                className="card-glass text-sm font-semibold py-2 px-4 rounded-lg shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              >
                {item.label}
              </span>
              <button
                onClick={item.action}
                aria-label={item.label}
                className={`card-glass w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-100 transition-transform ${item.bg}`}
              >
                <item.icon className={`w-6 h-6 ${item.iconColor}`} />
              </button>
            </div>
          ))}

        <button
          onClick={toggleMenu}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label="Help and Support Menu"
          className="card-glass w-16 h-16 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
        >
          {isOpen ? (
            <X className="w-8 h-8 text-text-primary transition-transform duration-300 rotate-90" />
          ) : (
            <HelpCircle className="w-8 h-8 text-text-primary transition-transform duration-300" />
          )}
        </button>
      </div>
    </div>
  );
};

export default FloatingActionButton;
