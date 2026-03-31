import React, { ChangeEvent } from 'react';

export const ModernToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
    <label className="flex items-center cursor-pointer justify-between w-full py-3 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</span>
            {description && <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>}
        </div>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-12 h-7 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
    </label>
);

export const FloatingLabelInput: React.FC<{
    label: string,
    value: string | number,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    name?: string,
    id?: string,
    type?: string,
    placeholder?: string,
    required?: boolean,
    prefix?: string
}> = ({ label, value, onChange, name, id, type = 'text', placeholder = ' ', required = false, prefix }) => {
    const inputId = id || name || label.toLowerCase().replace(/\s+/g, '-');
    return (
        <div className="relative">
            <div className="relative group">
                {prefix && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none z-10">
                        {prefix}
                    </div>
                )}
                <input
                    id={inputId}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className={`block w-full ${prefix ? 'pl-10 pr-4' : 'px-4'} py-3.5 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer transition-all`}
                />
                <label
                    htmlFor={inputId}
                    className={`absolute text-sm text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 ${prefix ? 'start-9' : 'start-3'}`}
                >
                    {label}
                </label>
            </div>
        </div>
    );
};
