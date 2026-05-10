import { useState, useEffect, useRef, useCallback } from 'react';
import { scriptChat, scriptAnalyze, getSessions, getSession, saveSession, deleteSession } from '../services/aiService';
import '../css/studio.css';

const ACTION_PROMPTS = {
    scene:    'Generate a new scene based on our discussion so far.',
    dialogue: 'Improve the dialogue in the last scene to make it more natural and compelling.',
    twist:    'Add an unexpected plot twist to the story.',
};

const SCORE_KEYS = ['Story Quality', 'Character Depth', 'Dialogue Strength', 'Plot Consistency', 'Engagement Level'];

const ERROR_MESSAGES = {
    'not-allowed': 'Microphone access denied. Please allow mic permissions in your browser.',
    'no-speech':   'No speech detected. Please speak clearly and try again.',
    'network':     'Network error with speech recognition. Check your connection.',
    'audio-capture': 'No microphone found. Please connect a microphone and try again.',
};

function formatScreenplay(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/(?<!\n)(INT\.|EXT\.)/g, '\n$1')
        .replace(/^([A-Z][A-Z\s]{2,})$/gm, (m) => `\n${m.trim()}`)
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function getScoreValue(scores, key) {
    return scores[key] ?? scores[key.replace(/ /g, '_')] ?? scores[key.toUpperCase()] ?? 0;
}

function isCanceled(err) {
    return err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED';
}

export default function ScriptStudio() {
    const [messages, setMessages]           = useState([]);
    const [input, setInput]                 = useState('');
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState('');
    const [recording, setRecording]         = useState(false);
    const [ttsEnabled, setTtsEnabled]       = useState(false);
    const [sessions, setSessions]           = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [sessionTitle, setSessionTitle]   = useState('');
    const [analysis, setAnalysis]           = useState(null);
    const [analyzing, setAnalyzing]         = useState(false);

    const chatEndRef       = useRef(null);
    const recognitionRef   = useRef(null);
    const recognizingRef   = useRef(false);
    const messagesRef      = useRef(messages);
    const activeSessionRef = useRef(activeSession);
    const loadingRef       = useRef(false);
    const abortRef         = useRef(null);
    const utteranceRef     = useRef(null);
    const requestIdRef     = useRef(0);

    useEffect(() => { messagesRef.current = messages; }, [messages]);
    useEffect(() => { activeSessionRef.current = activeSession; }, [activeSession]);

    useEffect(() => {
        getSessions()
            .then(r => setSessions(r.data.data || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (e) => {
            let transcript = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                transcript += e.results[i][0].transcript;
            }
            setInput(transcript);
        };

        rec.onend = () => {
            recognizingRef.current = false;
            setRecording(false);
        };

        rec.onerror = (e) => {
            if (e.error === 'aborted') return;
            recognizingRef.current = false;
            setRecording(false);
            setError(ERROR_MESSAGES[e.error] || `Microphone error: ${e.error}. Please try again.`);
        };

        recognitionRef.current = rec;

        return () => {
            rec.onresult = null;
            rec.onend = null;
            rec.onerror = null;
            recognizingRef.current = false;
            try { rec.abort(); } catch {}
        };
    }, []);

    useEffect(() => {
        return () => {
            if (abortRef.current) abortRef.current.abort();
            if (utteranceRef.current && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const speak = useCallback((text) => {
        if (!ttsEnabled || !window.speechSynthesis) return;
        if (utteranceRef.current) {
            window.speechSynthesis.cancel();
            utteranceRef.current = null;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.lang = 'en-US';
        utterance.onend = () => { utteranceRef.current = null; };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [ttsEnabled]);

    const toggleRecording = useCallback(() => {
        const rec = recognitionRef.current;
        if (!rec) return setError('Speech recognition is not supported in this browser.');

        if (recognizingRef.current) {
            recognizingRef.current = false;
            try { rec.stop(); } catch {}
            setRecording(false);
        } else {
            setError('');
            try {
                rec.start();
                recognizingRef.current = true;
                setRecording(true);
            } catch {
                recognizingRef.current = false;
                setError('Could not start microphone. It may already be in use.');
            }
        }
    }, []);

    const sendMessage = useCallback(async (overrideText) => {
        const msg = (overrideText !== undefined ? overrideText : input).trim();
        if (!msg || loadingRef.current) return;

        if (recognizingRef.current) {
            recognizingRef.current = false;
            try { recognitionRef.current?.stop(); } catch {}
            setRecording(false);
        }

        const historySnapshot = messagesRef.current;
        const sessionId = activeSessionRef.current;
        const requestId = ++requestIdRef.current;

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setInput('');
        setError('');
        setAnalysis(null);
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        loadingRef.current = true;
        setLoading(true);

        try {
            const res = await scriptChat(msg, historySnapshot, sessionId, controller.signal);

            if (requestId !== requestIdRef.current) return;

            const formatted = formatScreenplay(res.data.response);
            setMessages(prev => [...prev, { role: 'assistant', content: formatted }]);
            speak(formatted);
        } catch (err) {
            if (isCanceled(err)) return;
            if (requestId !== requestIdRef.current) return;

            const errMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
            setError(errMsg);
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'user' && last?.content === msg) return prev.slice(0, -1);
                return prev;
            });
        } finally {
            if (requestId === requestIdRef.current) {
                loadingRef.current = false;
                setLoading(false);
            }
        }
    }, [input, speak]);

    const handleAnalyze = useCallback(async () => {
        const current = messagesRef.current;
        if (!current.length) return setError('Start a conversation first before analyzing.');
        setAnalyzing(true);
        setError('');
        try {
            const res = await scriptAnalyze(null, current);
            setAnalysis(res.data.analysis);
        } catch (err) {
            if (!isCanceled(err)) {
                setError(err.response?.data?.error || 'Analysis failed. Please try again.');
            }
        } finally {
            setAnalyzing(false);
        }
    }, []);

    const handleSave = useCallback(async () => {
        const current = messagesRef.current;
        if (!current.length) return setError('Nothing to save yet.');
        const title = sessionTitle.trim() || `Script ${new Date().toLocaleDateString()}`;
        try {
            const res = await saveSession(title, current);
            const saved = res.data.data;
            setSessions(prev => [saved, ...prev.filter(s => s._id !== saved._id)]);
            setActiveSession(saved._id);
            setSessionTitle(saved.title);
        } catch (err) {
            setError(err.response?.data?.error || 'Save failed. Please try again.');
        }
    }, [sessionTitle]);

    const handleLoad = useCallback(async (session) => {
        if (abortRef.current) abortRef.current.abort();
        loadingRef.current = false;
        setLoading(false);
        setError('');
        try {
            const res = await getSession(session._id);
            const loaded = res.data?.data || session;
            setActiveSession(loaded._id);
            setSessionTitle(loaded.title || '');
            setMessages(Array.isArray(loaded.messages) ? loaded.messages : []);
            setAnalysis(null);
            setInput('');
        } catch (err) {
            setError(err.response?.data?.error || 'Could not load this session.');
        }
    }, []);

    const handleDelete = useCallback(async (e, id) => {
        e.stopPropagation();
        try {
            await deleteSession(id);
            setSessions(prev => prev.filter(s => s._id !== id));
            if (activeSessionRef.current === id) {
                setActiveSession(null);
                setMessages([]);
                setSessionTitle('');
                setInput('');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed. Please try again.');
        }
    }, []);

    const handleNew = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        loadingRef.current = false;
        setLoading(false);
        setActiveSession(null);
        setMessages([]);
        setSessionTitle('');
        setAnalysis(null);
        setError('');
        setInput('');
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }, [sendMessage]);

    const actionButtons = [
        { label: '🎭 Generate Scene',   prompt: ACTION_PROMPTS.scene },
        { label: '💬 Improve Dialogue', prompt: ACTION_PROMPTS.dialogue },
        { label: '🌀 Add Plot Twist',   prompt: ACTION_PROMPTS.twist },
    ];

    return (
        <div className="studio">
            <div className="studio__header">
                <div>
                    <h1 className="studio__title">🎬 AI Script Studio</h1>
                    <p className="studio__subtitle">Co-write screenplays with AI — voice or text</p>
                </div>
                <div className="studio__session-bar">
                    <input
                        className="studio__session-input"
                        placeholder="Session title..."
                        value={sessionTitle}
                        onChange={e => setSessionTitle(e.target.value)}
                    />
                    <button className="studio__btn studio__btn--primary" onClick={handleSave} disabled={loading || analyzing}>
                        💾 Save
                    </button>
                    <button className="studio__btn studio__btn--ghost" onClick={handleNew}>
                        ＋ New
                    </button>
                </div>
            </div>

            {error && <div className="studio__error" role="alert">{error}</div>}

            <div className="studio__body">
                <aside className="studio__sidebar">
                    <div className="studio__sidebar-title">Saved Sessions</div>
                    {sessions.length === 0 && (
                        <p style={{ color: 'var(--text-4)', fontSize: '0.8rem' }}>No sessions yet</p>
                    )}
                    {sessions.map(s => (
                        <div
                            key={s._id}
                            className={`studio__session-item${activeSession === s._id ? ' studio__session-item--active' : ''}`}
                            onClick={() => handleLoad(s)}
                        >
                            <span className="studio__session-name">{s.title}</span>
                            <button
                                className="studio__session-del"
                                onClick={e => handleDelete(e, s._id)}
                                title="Delete session"
                                aria-label={`Delete session ${s.title}`}
                            >✕</button>
                        </div>
                    ))}
                </aside>

                <div className="studio__main">
                    <div className="studio__actions">
                        {actionButtons.map(({ label, prompt }) => (
                            <button
                                key={label}
                                className="studio__action-btn"
                                onClick={() => sendMessage(prompt)}
                                disabled={loading}
                            >
                                {label}
                            </button>
                        ))}
                        <button
                            className="studio__action-btn"
                            onClick={handleAnalyze}
                            disabled={analyzing || loading}
                            style={{ borderColor: 'var(--cyan-2)', color: 'var(--cyan-3)' }}
                        >
                            {analyzing ? '⏳ Analyzing...' : '🔍 Analyze Script'}
                        </button>
                    </div>

                    <div className="studio__chat" role="log" aria-live="polite">
                        {messages.length === 0 && (
                            <div className="studio__empty">
                                <div className="studio__empty-icon">✍️</div>
                                <div className="studio__empty-text">
                                    Start your screenplay — type, speak, or pick an action above
                                </div>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`studio__msg studio__msg--${msg.role}`}>
                                <div className="studio__msg-avatar">{msg.role === 'user' ? 'U' : 'AI'}</div>
                                <div className="studio__msg-bubble">{msg.content}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="studio__msg studio__msg--assistant">
                                <div className="studio__msg-avatar">AI</div>
                                <div className="studio__msg-bubble">
                                    <div className="studio__typing"><span /><span /><span /></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="studio__input-row">
                        <button
                            className={`studio__mic-btn studio__mic-btn--${recording ? 'recording' : 'idle'}`}
                            onClick={toggleRecording}
                            title={recording ? 'Stop recording' : 'Start voice input'}
                            aria-label={recording ? 'Stop recording' : 'Start voice input'}
                            disabled={loading}
                        >
                            🎙️
                        </button>
                        <textarea
                            className="studio__textarea"
                            placeholder={recording ? '🔴 Listening...' : 'Describe your scene, character, or idea...'}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={2}
                            disabled={loading}
                        />
                        <button
                            className="studio__send-btn"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            title="Send"
                            aria-label="Send message"
                        >
                            ➤
                        </button>
                    </div>

                    <div className="studio__tts-row">
                        <button
                            className={`studio__tts-toggle${ttsEnabled ? ' studio__tts-toggle--on' : ''}`}
                            onClick={() => setTtsEnabled(v => !v)}
                            title="Toggle text-to-speech"
                            aria-label={`Text-to-speech ${ttsEnabled ? 'on' : 'off'}`}
                        />
                        <span>Read AI responses aloud</span>
                    </div>

                    {analysis && (
                        <div className="studio__analysis">
                            <h3 className="studio__analysis-title">📊 Script Analysis</h3>
                            {analysis.scores && (
                                <div className="studio__scores">
                                    {SCORE_KEYS.map(key => {
                                        const val = getScoreValue(analysis.scores, key);
                                        return (
                                            <div key={key} className="studio__score-card">
                                                <div className="studio__score-label">{key}</div>
                                                <div className="studio__score-value">
                                                    {val}
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-3)' }}>/10</span>
                                                </div>
                                                <div className="studio__score-bar">
                                                    <div className="studio__score-bar-fill" style={{ width: `${val * 10}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {analysis.strengths?.length > 0 && (
                                <div className="studio__analysis-section">
                                    <h4>✅ Strengths</h4>
                                    <ul>{analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                </div>
                            )}
                            {analysis.weaknesses?.length > 0 && (
                                <div className="studio__analysis-section">
                                    <h4>⚠️ Weaknesses</h4>
                                    <ul>{analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                                </div>
                            )}
                            {analysis.suggestions?.length > 0 && (
                                <div className="studio__analysis-section">
                                    <h4>💡 Suggestions</h4>
                                    <ul>{analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                </div>
                            )}
                            {analysis.overall_feedback && (
                                <div className="studio__analysis-feedback">{analysis.overall_feedback}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
