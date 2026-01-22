'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Eye,
    AlertCircle,
    AlertOctagon,
    X,
    ChevronDown,
    ChevronUp,
    Bell
} from 'lucide-react';
import { Notification, NotificationType } from '../../types/notification';

interface NotificationCardProps {
    notifications: Notification[];
    onDismiss: (id: string) => void;
    onAction: (notification: Notification) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notifications, onDismiss, onAction }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (notifications.length === 0) {
        return (
            <div className="w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">All caught up! 🚀</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">No new notifications at the moment.</p>
            </div>
        );
    }

    const visibleNotifications = isExpanded ? notifications : notifications.slice(0, 3);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
            case 'activity': return <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
            case 'action': return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
            case 'critical': return <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400" />;
        }
    };

    const getStyles = (type: NotificationType) => {
        switch (type) {
            case 'success': return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30';
            case 'activity': return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30';
            case 'action': return 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30';
            case 'critical': return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30';
        }
    };

    return (
        <div className="w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-6 shadow-sm transition-all duration-300">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Activity Feed</h3>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        {notifications.length}
                    </span>
                </div>
                {notifications.length > 3 && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                        {isExpanded ? 'Collapse' : 'See All'}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                )}
            </div>

            {/* List */}
            <div className="p-2 space-y-2">
                <AnimatePresence initial={false}>
                    {visibleNotifications.map((notification) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`relative flex items-start gap-3 p-3 rounded-xl border ${getStyles(notification.type)} group`}
                        >
                            <div className="flex-shrink-0 mt-0.5">
                                {getIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                                        {notification.title}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                                    {notification.message}
                                </p>

                                {notification.actionLabel && (
                                    <button
                                        onClick={() => onAction(notification)}
                                        className="mt-2 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                    >
                                        {notification.actionLabel}
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDismiss(notification.id);
                                }}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all"
                            >
                                <X className="w-3 h-3 text-slate-400" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {isExpanded && (
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        Show Less
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationCard;
