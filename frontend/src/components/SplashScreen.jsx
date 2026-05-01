import { useEffect, useState } from 'react';
import '../css/splash.css';

export default function SplashScreen({ email, onDone }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDone, 400); // wait for fade-out
        }, 2500);
        return () => clearTimeout(timer);
    }, [onDone]);

    return (
        <div className={`splash${visible ? '' : ' splash--out'}`}>
            <div className="splash__inner">
                <div className="splash__logo">streamer</div>
                <p className="splash__welcome">Welcome back</p>
                <p className="splash__email">{email}</p>
                <span className="splash__dot-1" />
                <span className="splash__dot-2" />
                <span className="splash__dot-3" />
            </div>
        </div>
    );
}
