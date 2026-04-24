import { useState, useEffect, useMemo } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onComplete }) {
    const [phase, setPhase] = useState('logo');
    const [progress, setProgress] = useState(0);

    const particles = useMemo(() => Array.from({ length: 30 }).map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${2 + Math.random() * 3}s`
    })), []);

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 2;
            });
        }, 40);

        const fadeTimer = setTimeout(() => {
            setPhase('fade');
        }, 2500);

        const completeTimer = setTimeout(() => {
            setPhase('done');
            onComplete();
        }, 3000);

        return () => {
            clearInterval(progressInterval);
            clearTimeout(fadeTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    if (phase === 'done') return null;

    return (
        <div className={`splash-screen ${phase === 'fade' ? 'fading' : ''}`}>
            <div className="splash-particles">
                {particles.map((style, i) => (
                    <div key={i} className="splash-particle" style={style} />
                ))}
            </div>

            <div className="splash-orb splash-orb-1" />
            <div className="splash-orb splash-orb-2" />
            <div className="splash-orb splash-orb-3" />

            <div className="splash-logo-container">
                <div className="splash-logo">
                    <span className="splash-logo-text">
                        <span className="splash-logo-o">O</span>
                        <span className="splash-logo-t">T</span>
                        <span className="splash-logo-t2">T</span>
                    </span>
                    <div className="splash-logo-glow" />
                </div>
                <p className="splash-tagline">Stream Without Limits</p>
            </div>

            <div className="splash-progress-container">
                <div className="splash-progress-bar">
                    <div
                        className="splash-progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                    <div className="splash-progress-shimmer" />
                </div>
            </div>
        </div>
    );
}
