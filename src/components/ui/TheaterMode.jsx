// src/components/ui/TheaterMode.jsx
import { useEffect, useCallback } from 'react';
import './TheaterMode.css';

/**
 * Full viewport theater mode overlay for immersive video viewing
 * - 85% viewport video with blurred/dimmed background
 * - YouTube with controls enabled
 * - ESC or click outside to exit
 * - F key to toggle (handled by parent)
 */
export function TheaterMode({
  project,
  audioEnabled,
  isOpen,
  onClose
}) {
  // Handle ESC key to close
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const videoId = project.url.split('v=')[1]?.split('&')[0] || project.url;

  // Click on backdrop (not video) to close
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('theater-backdrop')) {
      onClose();
    }
  };

  return (
    <div
      className="theater-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="theater-container">
        {/* Close button */}
        <button
          className="theater-close"
          onClick={onClose}
          aria-label="Close theater mode"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Video title */}
        <div className="theater-title" style={{ color: project.color }}>
          {project.title}
        </div>

        {/* Video frame */}
        <div className="theater-video-frame" style={{ borderColor: project.color }}>
          <iframe
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${audioEnabled ? 0 : 1}&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0&playsinline=1`}
            style={{ border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={project.title}
          />
        </div>

        {/* Video description */}
        <div className="theater-description">
          {project.description}
        </div>

        {/* Hint text */}
        <div className="theater-hint">
          Press <kbd>ESC</kbd> or <kbd>F</kbd> to exit | Click outside video to close
        </div>
      </div>
    </div>
  );
}

export default TheaterMode;
