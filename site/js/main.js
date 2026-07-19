// Scroll-reveal: fade/slide sections in as they enter the viewport.
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12 }
);
revealEls.forEach((el) => io.observe(el));

// Subtle parallax tilt on the hero app-window mockup, following the cursor.
const mock = document.querySelector('.mock');
if (mock && window.matchMedia('(pointer: fine)').matches) {
  const hero = document.querySelector('.hero');
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    mock.style.transform = `perspective(1400px) rotateY(${-6 + px * 6}deg) rotateX(${2 - py * 6}deg)`;
  });
  hero.addEventListener('mouseleave', () => {
    mock.style.transform = 'perspective(1400px) rotateY(-6deg) rotateX(2deg)';
  });
}

// Smooth-scroll for in-page nav links (progressive enhancement over CSS scroll-behavior).
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
