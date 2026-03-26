import { useState } from 'react';
import axios from 'axios';
import '../css/aiscript.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AIScript() {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setResult('');
        try {
            const res = await axios.post(`${API}/api/v1/ai/script`, { prompt });
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
                <div className="ai-badge">
                    <span className="ai-badge-dot" />
                    AI Powered
                </div>
                <h2 className="ai-title">Script Writer <span>&amp; Analyzer</span></h2>
                <p className="ai-subtitle">
                    Drop a movie concept, character arc, or dialogue snippet. The Hollywood AI will expand, critique, and bring it to life.
                </p>
            </div>

            <div className="ai-editor">
                <div className="ai-editor-toolbar">
                    <span className="ai-editor-dot" />
                    <span className="ai-editor-dot" />
                    <span className="ai-editor-dot" />
                    <span className="ai-editor-label">script.txt</span>
                </div>
                <textarea
                    className="ai-textarea"
                    placeholder="A detective wakes up with no memory in a city that doesn't exist..."
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                />
                <div className="ai-editor-footer">
                    <span className="ai-char-count">{prompt.length} chars</span>
                    <button className="ai-generate-btn" onClick={handleGenerate} disabled={loading || !prompt.trim()}>
                        <span className="ai-btn-icon">✦</span>
                        {loading ? 'Generating...' : 'Generate Script'}
                    </button>
                </div>
            </div>

            {loading && (
                <div className="ai-thinking">
                    <div className="ai-thinking-dots"><span /><span /><span /></div>
                    Hollywood AI is thinking...
                </div>
            )}

            {result && !loading && (
                <div className="ai-result">
                    <div className="ai-result-header">
                        <div className="ai-result-label">
                            <span className="ai-result-icon">🎬</span>
                            AI Response
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
