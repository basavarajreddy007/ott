import { useState } from 'react';
import { generateScript, analyzeScript } from '../services/aiService';
import AnalysisReport from './AnalysisReport';
import '../css/aiscript.css';

const isAnalyze = mode => mode === 'analyze';

export default function AITool({ mode = 'script' }) {
    const analyze = isAnalyze(mode);

    const [input, setInput] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    async function handleSubmit() {
        if (!input.trim()) return;
        setLoading(true);
        setResult(null);
        setError('');
        try {
            const res = analyze ? await analyzeScript(input) : await generateScript(input);
            setResult(res);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to reach AI service.');
        } finally {
            setLoading(false);
        }
    }

    async function handleCopy() {
        const text = result?.type === 'structured'
            ? JSON.stringify(result.data, null, 2)
            : result?.data ?? '';
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Clipboard access denied.');
        }
    }

    return (
        <div className="ai-page">
            <div className="ai-header">
                <h2 className="ai-title">
                    {analyze ? 'Script Analyser' : 'Script Writer'}
                </h2>
                <p className="ai-subtitle">
                    {analyze
                        ? 'Paste your script or scene. Get a professional breakdown — scores, strengths, and actionable notes.'
                        : 'Drop a movie concept, character arc, or dialogue snippet. Get it expanded and critiqued.'}
                </p>
            </div>

            <div className="ai-editor">
                <textarea
                    className="ai-textarea"
                    placeholder={analyze
                        ? `INT. COFFEE SHOP - DAY\n\nSARAH sits alone, staring at her phone...\n\nPaste your script or scene here.`
                        : "A detective wakes up with no memory in a city that doesn't exist..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />
                <div className="ai-editor-footer">
                    <span className="ai-char-count">{input.length} chars</span>
                    <button
                        className="ai-generate-btn"
                        onClick={handleSubmit}
                        disabled={loading || !input.trim()}
                    >
                        {loading ? (analyze ? 'Analysing...' : 'Generating...') : (analyze ? 'Analyse Script' : 'Generate Script')}
                    </button>
                </div>
            </div>

            {loading && (
                <div className="ai-thinking">
                    <div className="ai-thinking-dots"><span /><span /><span /></div>
                    {analyze ? 'Reading your script...' : 'Generating...'}
                </div>
            )}

            {error && !loading && (
                <div className="ai-result" style={{ marginTop: 24 }}>
                    <div className="ai-result-body" style={{ color: '#fca5a5' }}>{error}</div>
                </div>
            )}

            {result && !loading && result.type === 'structured' && (
                <AnalysisReport analysis={result.data} onCopy={handleCopy} copied={copied} />
            )}

            {result && !loading && result.type === 'text' && (
                <div className="ai-result">
                    <div className="ai-result-header">
                        <div className="ai-result-label">
                            {analyze ? 'Analysis Report' : 'Result'}
                        </div>
                        <button className="ai-copy-btn" onClick={handleCopy}>
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <div className="ai-result-body">{result.data}</div>
                </div>
            )}
        </div>
    );
}
