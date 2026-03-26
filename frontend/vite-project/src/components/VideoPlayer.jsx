import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/videoplayer.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VideoPlayer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const controller = new AbortController();
        axios.get(`${API}/api/v1/videos/${id}`, { signal: controller.signal })
            .then(res => {
                if (!res.data.success) throw new Error();
                setVideo(res.data.data);
                setStatus('ok');
            })
            .catch(err => {
                if (err.name !== 'AbortError') setStatus('error');
            });
        return () => controller.abort();
    }, [id]);

    return (
        <div className="video-player-container">
            {status === 'loading' && <div className="loading-spinner">Loading Theatre...</div>}

            {status === 'error' && (
                <>
                    <h2>Failed to load video</h2>
                    <button onClick={() => navigate('/')} className="back-button">Go Home</button>
                </>
            )}

            {status === 'ok' && video && (
                <>
                    <button className="back-button" onClick={() => navigate('/')}>← Back</button>
                    <div className="video-wrapper">
                        <video controls autoPlay preload="metadata" className="styled-video" poster={video.thumbnailUrl}>
                            <source src={video.videoUrl} type="video/mp4" />
                        </video>
                    </div>
                    <div className="video-details">
                        <h1>{video.title}</h1>
                        <p className="video-description">{video.description || 'No description available'}</p>
                        <div className="video-meta">
                            {video.duration && <span>{video.duration} min</span>}
                            {video.genres?.length > 0 && <span> • {video.genres.join(', ')}</span>}
                            {video.releaseYear && <span> • {video.releaseYear}</span>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
