// 3D Floating Gallery - Lightweight version
const gallery = document.getElementById('gallery');

// Simple CSS-based parallax on mouse move (no RAF loop)
document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 10;
  const y = (e.clientY / window.innerHeight - 0.5) * -6;
  gallery.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
});

// Debug mode toggle (press 'd')
window.addEventListener('keydown', (e) => {
  if (e.key?.toLowerCase() === 'd') {
    document.body.classList.toggle('debug');
  }
});
