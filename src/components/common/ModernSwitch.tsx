'use client';
import React from 'react';

interface ModernSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
}

const ModernSwitch: React.FC<ModernSwitchProps> = ({ checked, onChange, label, description }) => (
    <label className="flex items-center cursor-pointer justify-between w-full py-2">
        <div className="flex-grow flex flex-col pr-4">
            <span className="text-sm font-medium text-text-primary">{label}</span>
            {description && <span className="text-xs text-text-secondary mt-1">{description}</span>}
        </div>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-input-background'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
        </div>
    </label>
);

export default ModernSwitch;
