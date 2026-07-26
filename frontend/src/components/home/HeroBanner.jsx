import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { HiPlay, HiInformationCircle } from "react-icons/hi";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  heroBackdropVariants,
  heroContentVariants,
  heroTitleVariants,
  heroFadeUpVariants,
  heroButtonVariants
} from "../../animations";
import "../../css/HeroBanner.css";

export default function HeroBanner({ items = [] }) {
  const [current, setCurrent] = useState(0);
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 500], [0, 100]);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % (items.length || 1));
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(next, 7500);
    return () => clearInterval(timer);
  }, [items.length, next]);

  if (!items.length) {
    return (
      <div className="hero-banner">
        <div className="hero-placeholder">
          <h1>Welcome to MOVIEMAX</h1>
          <p>Unlimited movies, TV shows, and more.</p>
        </div>
      </div>
    );
  }

  const item = items[current];

  return (
    <div className="hero-banner" style={{ overflow: "hidden", position: "relative" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`backdrop-${item._id}`}
          className="hero-slide active"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
        >
          <div className="hero-backdrop" style={{ height: "100%", width: "100%" }}>
            <motion.img
              src={item.banner?.url || item.poster?.url || null}
              alt=""
              variants={heroBackdropVariants}
              animate="active"
              initial="inactive"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div className="hero-gradient" />
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${item._id}`}
          className="hero-content"
          variants={heroContentVariants}
          initial="hidden"
          animate="visible"
          style={{ y: parallaxY, zIndex: 2 }}
        >
          <motion.div className="hero-badge" variants={heroFadeUpVariants}>
            {item.quality}
          </motion.div>
          <motion.h1 className="hero-title" variants={heroTitleVariants}>
            {item.title}
          </motion.h1>
          <motion.div className="hero-meta" variants={heroFadeUpVariants}>
            <span className="hero-year">{item.releaseYear}</span>
            {item.language && <span className="hero-language">{item.language}</span>}
          </motion.div>
          <motion.p className="hero-description" variants={heroFadeUpVariants}>
            {item.description}
          </motion.p>
          <motion.div className="hero-actions" variants={heroFadeUpVariants}>
            <motion.div variants={heroButtonVariants} whileHover="hover" whileTap="tap" style={{ display: "inline-block" }}>
              <Link to={`/watch/${item.type || "Movie"}/${item.slug}`} className="btn btn-primary btn-lg">
                <HiPlay /> Watch Now
              </Link>
            </motion.div>
            <motion.div variants={heroButtonVariants} whileHover="hover" whileTap="tap" style={{ display: "inline-block" }}>
              <Link to={`/${(item.type || "Movie").toLowerCase() === "movie" ? "movies" : (item.type || "Movie").toLowerCase() === "tvshow" ? "tv-shows" : "web-series"}/${item.slug}`} className="btn btn-secondary btn-lg">
                <HiInformationCircle /> More Info
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && (
        <div className="hero-dots" style={{ zIndex: 3 }}>
          {items.map((_, index) => (
            <button
              key={index}
              className={`hero-dot ${index === current ? "active" : ""}`}
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
