import "../../css/Spinner.css";

export default function Spinner({ fullScreen, size = 40 }) {
  if (fullScreen) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner" style={{ width: size, height: size }} />
      </div>
    );
  }
  return <div className="spinner" style={{ width: size, height: size }} />;
}
