import { useState } from 'react';
import { createRequest } from '../services/requestService';
import '../css/requests.css';

export default function RequestForm({ onSubmitted }) {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [incremented, setIncremented] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        setError('');
        setSuccess(false);
        setIncremented(false);
        try {
            const result = await createRequest(title.trim());
            setTitle('');
            if (result.incremented) {
                setIncremented(true);
            } else {
                setSuccess(true);
            }
            setTimeout(function() { setSuccess(false); setIncremented(false); }, 3500);
            if (onSubmitted) onSubmitted(result.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="req-form-wrap">
            <div className="req-form-glow" />
            <div className="req-form-header">
                <div className="req-form-icon">🎬</div>
                <div>
                    <h3 className="req-form-title">Request a Title</h3>
                    <p className="req-form-sub">Can't find it? Request it — others can vote it up!</p>
                </div>
            </div>

            <form className="req-form" onSubmit={handleSubmit}>
                <div className="req-input-row">
                    <input
                        className="req-input"
                        type="text"
                        placeholder="Movie or web series name..."
                        value={title}
                        onChange={function(e) { setTitle(e.target.value); }}
                        maxLength={120}
                        disabled={loading}
                    />
                    <button className="req-submit-btn" type="submit" disabled={loading || !title.trim()}>
                        {loading ? <span className="req-spinner" /> : '+ Request'}
                    </button>
                </div>
                {error       && <p className="req-msg req-msg--error">⚠ {error}</p>}
                {success     && <p className="req-msg req-msg--success">✓ Request added! Others can vote for it too.</p>}
                {incremented && <p className="req-msg req-msg--fire">🔥 Already requested! Vote count increased.</p>}
            </form>
        </div>
    );
}
