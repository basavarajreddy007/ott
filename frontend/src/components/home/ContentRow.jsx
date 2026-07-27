import { useRef } from "react";
import { Link } from "react-router-dom";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { motion } from "framer-motion";
import MovieCard from "../common/MovieCard";
import "../../css/ContentRow.css";

const rowTrackVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export default function ContentRow({ title, link, items = [], type = "Movie", loading }) {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (!rowRef.current) return;
    const scrollAmount = 600;
    rowRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="content-row">
      <div className="content-row-header">
        <h2 className="section-title">{title}</h2>
        {link && <Link to={link} className="section-link">View All</Link>}
      </div>

      <div className="content-row-wrapper">
        <motion.button
          className="scroll-btn scroll-left"
          onClick={() => scroll("left")}
          whileHover={{ scale: 1.18, backgroundColor: "rgba(0, 0, 0, 0.85)" }}
          whileTap={{ scale: 0.9 }}
          aria-label="Scroll left"
        >
          <HiChevronLeft />
        </motion.button>

        <motion.div
          className="content-row-track"
          ref={rowRef}
          variants={rowTrackVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ minWidth: 200, aspectRatio: "2/3", borderRadius: 12 }} />
              ))
            : items.map((item) => (
                <MovieCard key={item._id} item={item} type={type} progress={item.progress} />
              ))}
        </motion.div>

        <motion.button
          className="scroll-btn scroll-right"
          onClick={() => scroll("right")}
          whileHover={{ scale: 1.18, backgroundColor: "rgba(0, 0, 0, 0.85)" }}
          whileTap={{ scale: 0.9 }}
          aria-label="Scroll right"
        >
          <HiChevronRight />
        </motion.button>
      </div>
    </section>
  );
}
