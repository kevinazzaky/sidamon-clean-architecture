import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';

export default function CurtainTransition() {
    const { currentUser, userRole } = useAuth();
    const [showCurtain, setShowCurtain] = useState(false);
    const [animateCurtain, setAnimateCurtain] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            setAnimateCurtain(false);
            setShowCurtain(false);
        } else if (currentUser && userRole !== 'Guest' && !animateCurtain) {
            setShowCurtain(true);
            const timer1 = setTimeout(() => setAnimateCurtain(true), 50);
            const timer2 = setTimeout(() => {
                setShowCurtain(false);
            }, 1500);
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }
    }, [currentUser, userRole, animateCurtain]);

    if (!showCurtain) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex pointer-events-none overflow-hidden">
            <div className={`w-1/2 h-full bg-slate-900 border-r border-[#158ed4]/30 flex items-center justify-end pr-8 transition-transform duration-1000 ease-[cubic-bezier(0.83,0,0.17,1)] ${animateCurtain ? '-translate-x-full' : 'translate-x-0'}`}>
                <div className="text-white text-5xl font-black">SIDA</div>
            </div>
            <div className={`w-1/2 h-full bg-slate-900 border-l border-[#158ed4]/30 flex items-center justify-start pl-8 transition-transform duration-1000 ease-[cubic-bezier(0.83,0,0.17,1)] ${animateCurtain ? 'translate-x-full' : 'translate-x-0'}`}>
                <div className="text-[#158ed4] text-5xl font-black">MON.</div>
            </div>
        </div>
    );
}
