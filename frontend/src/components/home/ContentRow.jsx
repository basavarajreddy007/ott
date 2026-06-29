import { useRef } from "react";
import { Link } from "react-router-dom";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import MovieCard from "../common/MovieCard";
import "../../css/ContentRow.css";

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
        <button className="scroll-btn scroll-left" onClick={() => scroll("left")}>
          <HiChevronLeft />
        </button>

        <div className="content-row-track" ref={rowRef}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ minWidth: 200, aspectRatio: "2/3", borderRadius: 12 }} />
              ))
            : items.map((item) => (
                <MovieCard key={item._id} item={item} type={type} />
              ))}
        </div>

        <button className="scroll-btn scroll-right" onClick={() => scroll("right")}>
          <HiChevronRight />
        </button>
      </div>
    </section>
  );
}
