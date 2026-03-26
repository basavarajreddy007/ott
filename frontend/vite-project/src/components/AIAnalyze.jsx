import { useState } from 'react';
import axios from 'axios';
import '../css/aiscript.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AIAnalyze() {
    const [script, setScript] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleAnalyze = async () => {
        if (!script.trim()) return;
        setLoading(true);
        setResult('');
        try {
            const res = await axios.post(`${API}/api/v1/ai/analyze`, { script });
            setResult(res.data.success ? res.data.text : 'Error: ' + res.data.error);
        } catch {
            setResult('Failed to reach AI service.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="ai-page">
            <div className="ai-header">
                <div className="ai-badge analyzer-badge">
                    <span className="ai-badge-dot analyzer-dot" />
                    AI Powered
                </div>
                <h2 className="ai-title">Script <span className="analyzer-gradient">Analyser</span></h2>
                <p className="ai-subtitle">
                    Paste your script or scene. Get a professional breakdown — tone, structure, dialogue, pacing, and actionable notes.
                </p>
            </div>

            <div className="ai-editor analyzer-editor">
                <div className="ai-editor-toolbar">
                    <span className="ai-editor-dot" />
                    <span className="ai-editor-dot" />
                    <span className="ai-editor-dot" />
                    <span className="ai-editor-label">script-to-analyze.txt</span>
                </div>
                <textarea
                    className="ai-textarea"
                    placeholder={`INT. COFFEE SHOP - DAY\n\nSARAH sits alone, staring at her phone...\n\nPaste your script or scene here.`}
                    value={script}
                    onChange={e => setScript(e.target.value)}
                />
                <div className="ai-editor-footer">
                    <span className="ai-char-count">{script.length} chars</span>
                    <button className="ai-generate-btn analyzer-btn" onClick={handleAnalyze} disabled={loading || !script.trim()}>
                        <span className="ai-btn-icon">◈</span>
                        {loading ? 'Analysing...' : 'Analyse Script'}
                    </button>
                </div>
            </div>

            {loading && (
                <div className="ai-thinking analyzer-thinking">
                    <div className="ai-thinking-dots"><span /><span /><span /></div>
                    Reading your script...
                </div>
            )}

            {result && !loading && (
                <div className="ai-result analyzer-result">
                    <div className="ai-result-header">
                        <div className="ai-result-label analyzer-label">
                            <span className="ai-result-icon">◈</span>
                            Analysis Report
                        </div>
                        <button className="ai-copy-btn" onClick={handleCopy}>
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <div className="ai-result-body">{result}</div>
                </div>
            )}
        </div>
    );
}
