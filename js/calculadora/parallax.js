// Efecto de parallax del sol y las palmeras del hero.
export function bindParallax() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const sun = document.querySelector(".sun-wrap");
  const reflect = document.querySelector(".sun-reflect");
  const left = document.querySelector(".palm-left");
  const right = document.querySelector(".palm-right");
  if (!sun) return;
  let px = 0;
  let py = 0;
  const apply = () => {
    const scroll = window.scrollY || 0;
    sun.style.transform = `translate(calc(-50% + ${px * 12}px), ${scroll * 0.08 + py * 8}px)`;
    if (reflect) reflect.style.transform = `translate(calc(-50% + ${px * 10}px), ${py * 6}px) scaleY(-1)`;
    if (left) left.style.transform = `translate(${px * -16}px, ${scroll * 0.04}px)`;
    if (right) right.style.transform = `scaleX(-1) rotate(-4deg) translate(${px * -16}px, ${scroll * 0.03}px)`;
  };
  window.addEventListener("scroll", apply, { passive: true });
  window.addEventListener("pointermove", (event) => {
    px = event.clientX / window.innerWidth - 0.5;
    py = event.clientY / window.innerHeight - 0.5;
    apply();
  }, { passive: true });
  apply();
}
