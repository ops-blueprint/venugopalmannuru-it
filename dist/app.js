'use strict';

const phases = [
  { title: 'Map the estate', body: 'Identify build-plan patterns, dependencies, and migration candidates before changing delivery paths.' },
  { title: 'Validate in parallel', body: 'Compare outputs and quality checks before switching teams to the new workflow.' },
  { title: 'Cut over in phases', body: 'Promote reusable GitHub Actions workflows with controlled sequencing and clear ownership.' },
  { title: 'Keep a path back', body: 'Use rollback controls and release validation so a failed change can be contained.' }
];
const phaseButtons = [...document.querySelectorAll('[data-phase]')];
const phasePanel = document.querySelector('#phase-panel');
function selectPhase(button) {
  phaseButtons.forEach(item => { const active = item === button; item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1; });
  const phase = phases[Number(button.dataset.phase)];
  phasePanel.setAttribute('aria-labelledby', button.id);
  phasePanel.replaceChildren();
  const title = document.createElement('strong'); title.textContent = phase.title;
  const body = document.createElement('p'); body.textContent = phase.body;
  phasePanel.append(title, body);
}
phaseButtons.forEach((button, index) => {
  button.addEventListener('click', () => selectPhase(button));
  button.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % phaseButtons.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + phaseButtons.length - 1) % phaseButtons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = phaseButtons.length - 1;
    else return;
    event.preventDefault(); phaseButtons[next].focus(); selectPhase(phaseButtons[next]);
  });
});

const menu = document.querySelector('.menu-button');
const navigation = document.querySelector('#nav-links');
function closeMenu() { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; navigation.classList.toggle('open', open); menu.setAttribute('aria-expanded', String(open)); });
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menu.focus(); } });

const copyButton = document.querySelector('#copy-email');
const copyIndicator = document.querySelector('#copy-indicator');
copyButton.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('v.gopal.mannuru@gmail.com'); copyIndicator.textContent = 'Copied'; }
  catch { copyIndicator.textContent = 'Use email link'; }
});

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const animated = document.querySelectorAll('.feature,.platform-map,.platform-copy,.signal-card,.reliability-copy,.career-entry,.tool-groups>div');
  document.documentElement.classList.add('enhanced');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
  }, { threshold: 0.07, rootMargin: '0px 0px 40px 0px' });
  animated.forEach(element => { element.classList.add('reveal'); observer.observe(element); });
}
