import { motion } from "framer-motion";
import "../../css/Spinner.css";

export default function Spinner({ fullScreen, size = 40 }) {
  const spinnerElement = (
    <motion.div
      className="spinner"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
    />
  );

  if (fullScreen) {
    return (
      <div className="spinner-fullscreen">
        {spinnerElement}
      </div>
    );
  }
  return spinnerElement;
}
