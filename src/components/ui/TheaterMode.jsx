// src/components/ui/TheaterMode.jsx
import { useEffect, useCallback } from 'react';
import YouTubePlayer from '../YouTubePlayer';
import './TheaterMode.css';

/**
 * Full viewport theater mode overlay for immersive video viewing
 * - 85% viewport video with blurred/dimmed background
 * - YouTube with controls enabled
 * - Auto-advances to next video when current one ends
 * - ESC or click outside to exit
 * - F key to toggle (handled by parent)
 */
export function TheaterMode({
  project,
  audioEnabled,
  isOpen,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  queuePosition,
  queueTotal,
  nextVideoTitle
}) {
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight' && hasNext) onNext?.();
    if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
  }, [isOpen, onClose, onNext, onPrev, hasNext, hasPrev]);

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

        {/* Video title with nav */}
        <div className="theater-title-row">
          {hasPrev && (
            <button className="theater-nav-btn" onClick={onPrev} aria-label="Previous video">
              <svg viewBox="0 0 24 24" width="24" height="24"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
          <div className="theater-title" style={{ color: project.color }}>
            {project.title}
          </div>
          {hasNext && (
            <button className="theater-nav-btn" onClick={onNext} aria-label="Next video">
              <svg viewBox="0 0 24 24" width="24" height="24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
        </div>

        {/* Video frame */}
        <div className="theater-video-frame" style={{ borderColor: project.color }}>
          <YouTubePlayer
            key={videoId}
            videoId={videoId}
            autoplay
            controls
            muted={!audioEnabled}
            onEnd={onNext}
          />
        </div>

        {/* Queue info + description */}
        <div className="theater-queue-row">
          <div className="theater-queue-info">
            <span className="theater-now-playing-icon">
              <span></span><span></span><span></span>
            </span>
            {queuePosition && queueTotal ? `${queuePosition} / ${queueTotal}` : ''}
          </div>
          {nextVideoTitle && (
            <div className="theater-up-next">Up Next: {nextVideoTitle}</div>
          )}
        </div>

        <div className="theater-description">
          {project.description}
        </div>

        {/* Social sharing */}
        <div className="theater-share-row">
          <button
            className="theater-share-btn"
            onClick={() => {
              const vid = project.url?.split('v=')[1]?.split('&')[0] || project.youtubeId
              const url = `${window.location.origin}?v=${vid}`
              navigator.clipboard.writeText(url)
            }}
          >
            🔗 Copy Link
          </button>
          <button
            className="theater-share-btn"
            onClick={() => {
              const vid = project.url?.split('v=')[1]?.split('&')[0] || project.youtubeId
              const url = `${window.location.origin}?v=${vid}`
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(project.title + ' — shot by TdotsSolutionsz 🎬')}&url=${encodeURIComponent(url)}`, '_blank', 'width=550,height=420')
            }}
          >
            𝕏 Post
          </button>
          <button
            className="theater-share-btn"
            onClick={() => {
              const vid = project.url?.split('v=')[1]?.split('&')[0] || project.youtubeId
              const url = `${window.location.origin}?v=${vid}`
              window.open(`https://wa.me/?text=${encodeURIComponent(project.title + ' — ' + url)}`, '_blank')
            }}
          >
            WA Share
          </button>
        </div>

        {/* Hint text */}
        <div className="theater-hint">
          Press <kbd>ESC</kbd> or <kbd>F</kbd> to exit | <kbd>←</kbd> <kbd>→</kbd> prev/next | Click outside to close
        </div>
      </div>
    </div>
  );
}

export default TheaterMode;
