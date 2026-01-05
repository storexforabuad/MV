'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Home, Info, TrendingUp, Target, Users } from 'lucide-react';
import { useState } from 'react';

interface Region {
    id: string;
    name: string;
    status: 'active' | 'targeted' | 'next-phase';
    vendors: number;
    target: number;
    coordinates: { x: number, y: number };
    description: string;
}

const REGIONS: Region[] = [
    {
        id: 'bauchi',
        name: 'Bauchi',
        status: 'active',
        vendors: 5,
        target: 500,
        coordinates: { x: 68, y: 38 },
        description: 'Home Base & Physical Lab. Focus on ATBU and city center vendors.'
    },
    {
        id: 'kano',
        name: 'Kano',
        status: 'active',
        vendors: 2,
        target: 2300,
        coordinates: { x: 58, y: 22 },
        description: 'Remote Pilot. Focus on Sabon Gari and Instagram outreach.'
    },
    {
        id: 'abuja',
        name: 'Abuja',
        status: 'targeted',
        vendors: 0,
        target: 1400,
        coordinates: { x: 48, y: 48 },
        description: 'Capital Expansion. Targeting high-end retail and food vendors.'
    },
    {
        id: 'lagos',
        name: 'Lagos',
        status: 'next-phase',
        vendors: 0,
        target: 2700,
        coordinates: { x: 15, y: 75 },
        description: 'The Big Prize. Massive fashion and general retail market.'
    },
    {
        id: 'ph',
        name: 'Port Harcourt',
        status: 'next-phase',
        vendors: 0,
        target: 2500,
        coordinates: { x: 45, y: 88 },
        description: 'Oil City Growth. High purchasing power for premium services.'
    }
];

export default function NigeriaMap() {
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

    return (
        <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            {/* --- SVG Map Background --- */}
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full opacity-20"
                style={{ filter: 'drop-shadow(0 0 20px rgba(79, 70, 229, 0.2))' }}
            >
                {/* Simplified Nigeria Outline */}
                <path
                    d="M10,70 L5,60 L8,40 L20,20 L40,10 L60,10 L85,20 L95,40 L90,60 L80,85 L60,95 L40,95 L20,90 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-indigo-500"
                />

                {/* Grid Lines */}
                {[...Array(10)].map((_, i) => (
                    <line
                        key={`h-${i}`}
                        x1="0" y1={i * 10} x2="100" y2={i * 10}
                        stroke="currentColor"
                        strokeWidth="0.1"
                        className="text-slate-700"
                    />
                ))}
                {[...Array(10)].map((_, i) => (
                    <line
                        key={`v-${i}`}
                        x1={i * 10} y1="0" x2={i * 10} y2="100"
                        stroke="currentColor"
                        strokeWidth="0.1"
                        className="text-slate-700"
                    />
                ))}
            </svg>

            {/* --- Region Markers --- */}
            {REGIONS.map((region) => (
                <motion.button
                    key={region.id}
                    onClick={() => setSelectedRegion(region)}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${region.coordinates.x}%`, top: `${region.coordinates.y}%` }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + Math.random() * 0.5 }}
                >
                    {/* Pulse Effect */}
                    <span className={`absolute inset-0 rounded-full animate-ping opacity-20 ${region.id === 'bauchi' ? 'bg-yellow-400' :
                            region.status === 'active' ? 'bg-green-400' :
                                region.status === 'targeted' ? 'bg-indigo-400' : 'bg-slate-400'
                        }`} />

                    <div className={`relative p-2 rounded-full border-2 transition-all duration-300 group-hover:scale-125 ${region.id === 'bauchi' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' :
                            region.status === 'active' ? 'bg-green-500/20 border-green-500 text-green-500' :
                                region.status === 'targeted' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500' :
                                    'bg-slate-800 border-slate-600 text-slate-400'
                        }`}>
                        {region.id === 'bauchi' ? <Home className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    </div>

                    {/* Label */}
                    <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-2 py-0.5 rounded shadow-lg">
                        {region.name}
                    </span>
                </motion.button>
            ))}

            {/* --- Legend --- */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Home Base (Bauchi)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Active Pilot</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Targeted City</span>
                </div>
            </div>

            {/* --- Detail Overlay --- */}
            <AnimatePresence>
                {selectedRegion && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="absolute top-4 right-4 bottom-4 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-2xl z-20 flex flex-col"
                    >
                        <button
                            onClick={() => setSelectedRegion(null)}
                            className="absolute top-2 right-2 p-2 hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <Info className="w-4 h-4 text-slate-500" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-xl ${selectedRegion.id === 'bauchi' ? 'bg-yellow-500/20 text-yellow-500' :
                                    selectedRegion.status === 'active' ? 'bg-green-500/20 text-green-500' :
                                        'bg-indigo-500/20 text-indigo-500'
                                }`}>
                                {selectedRegion.id === 'bauchi' ? <Home className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{selectedRegion.name}</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{selectedRegion.status}</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-6">
                            {selectedRegion.description}
                        </p>

                        <div className="space-y-4 mt-auto">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                                    <span>Progress</span>
                                    <span>{Math.round((selectedRegion.vendors / selectedRegion.target) * 100)}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full ${selectedRegion.id === 'bauchi' ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(5, (selectedRegion.vendors / selectedRegion.target) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                                    <p className="text-[8px] text-slate-500 uppercase font-bold">Vendors</p>
                                    <p className="text-sm font-black text-white">{selectedRegion.vendors}</p>
                                </div>
                                <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                                    <p className="text-[8px] text-slate-500 uppercase font-bold">Target</p>
                                    <p className="text-sm font-black text-white">{selectedRegion.target}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Background Text --- */}
            <div className="absolute top-4 left-4 pointer-events-none">
                <h2 className="text-2xl font-black text-white/10 uppercase tracking-tighter">Regional Expansion</h2>
            </div>
        </div>
    );
}
