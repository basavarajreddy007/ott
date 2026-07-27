import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiFilm, HiGlobeAlt, HiCheckBadge } from "react-icons/hi2";
import { channelAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import MovieCard from "../components/common/MovieCard";
import SubscribeButton from "../components/common/SubscribeButton";
import AnimatedTitle from "../components/common/AnimatedTitle";
import "../css/SubscriptionsFeed.css";

export default function SubscriptionsFeed() {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const [feedRes, recRes] = await Promise.all([
          channelAPI.getSubscriptionsFeed().catch(() => ({ data: { data: [] } })),
          channelAPI.getRecommendedChannels().catch(() => ({ data: { data: [] } }))
        ]);
        setFeed(feedRes.data.data || []);
        setRecommended(recRes.data.data || []);
      } catch (err) {
        console.error("Feed load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="subs-feed-page">
        <div className="skeleton" style={{ width: 300, height: 32, marginBottom: 24, borderRadius: 8 }} />
        <div className="browse-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="subs-feed-page">
      <h1 className="browse-title"><AnimatedTitle text="Subscriptions Feed" /></h1>

      {feed.length === 0 ? (
        <div className="subs-feed-empty">
          <HiFilm size={56} />
          <h3>No content from your subscriptions yet</h3>
          <p>Subscribe to creators to see their latest uploads and community posts here.</p>
        </div>
      ) : (
        <div className="subs-feed-list">
          {feed.map((item) => {
            if (item.feedType === "video") {
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MovieCard item={item.video} type="Movie" />
                </motion.div>
              );
            }

            if (item.feedType === "post") {
              const post = item.post;
              return (
                <motion.div
                  key={item._id}
                  className="subs-feed-post glass"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="subs-feed-post-header">
                    <div className="subs-feed-post-avatar">
                      {post.channel?.avatar ? (
                        <img src={post.channel.avatar} alt="" />
                      ) : (
                        <span>{post.channel?.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <Link to={`/channel/${post.channel?.username}`} className="subs-feed-post-name">
                        {post.channel?.name}
                        {post.channel?.verifiedBadge && <HiCheckBadge className="subs-verified-icon" />}
                      </Link>
                      <span className="subs-feed-post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="subs-feed-post-content">{post.content}</p>
                  {post.poll && (
                    <div className="subs-feed-poll">
                      <h4>{post.poll.question}</h4>
                      {post.poll.options.map((opt, idx) => (
                        <div key={idx} className="subs-feed-poll-option">{opt.text}</div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Recommended Creators */}
      {recommended.length > 0 && (
        <section className="subs-feed-discover">
          <h2 className="subs-feed-discover-title">Discover Creators</h2>
          <div className="subs-feed-creators-grid">
            {recommended.map((ch) => (
              <motion.div
                key={ch._id}
                className="subs-creator-card glass"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link to={`/channel/${ch.slug}`} className="subs-creator-link">
                  <div className="subs-creator-avatar">
                    {ch.avatar ? (
                      <img src={ch.avatar} alt={ch.name} />
                    ) : (
                      <span>{ch.name?.charAt(0)}</span>
                    )}
                  </div>
                  <h4 className="subs-creator-name">
                    {ch.name}
                    {ch.verifiedBadge && <HiCheckBadge className="subs-verified-icon" />}
                  </h4>
                  <p className="subs-creator-subs">{ch.subscribersCount || 0} subscribers</p>
                </Link>
                <SubscribeButton channelId={ch._id} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
