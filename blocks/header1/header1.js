import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav1 = document.getElementById('nav1');
    const nav1Sections = nav1.querySelector('.nav1-sections');
    const nav1SectionExpanded = nav1Sections.querySelector('[aria-expanded="true"]');
    if (nav1SectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllnav1Sections(nav1Sections);
      nav1SectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav1, nav1Sections);
      nav1.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav1 = e.currentTarget;
  if (!nav1.contains(e.relatedTarget)) {
    const nav1Sections = nav1.querySelector('.nav1-sections');
    const nav1SectionExpanded = nav1Sections.querySelector('[aria-expanded="true"]');
    if (nav1SectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllnav1Sections(nav1Sections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav1, nav1Sections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isnav1Drop = focused.className === 'nav1-drop';
  if (isnav1Drop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllnav1Sections(focused.closest('.nav1-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusnav1Section() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav1 sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllnav1Sections(sections, expanded = false) {
  sections.querySelectorAll('.nav1-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav1
 * @param {Element} nav1 The container element
 * @param {Element} nav1Sections The nav1 sections within the container element
 * @param {*} forceExpanded Optional param to force nav1 expand behavior when not null
 */
function toggleMenu(nav1, nav1Sections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav1.getAttribute('aria-expanded') === 'true';
  const button = nav1.querySelector('.nav1-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav1.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllnav1Sections(nav1Sections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open nav1igation' : 'Close nav1igation');
  // enable nav1 dropdown keyboard accessibility
  const nav1Drops = nav1Sections.querySelectorAll('.nav1-drop');
  if (isDesktop.matches) {
    nav1Drops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusnav1Section);
      }
    });
  } else {
    nav1Drops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusnav1Section);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav1.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav1.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav1
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav1 as fragment
  const nav1Meta = getMetadata('nav1');
  const nav1Path = nav1Meta ? new URL(nav1Meta, window.location).pathname : '/nav1';
  const fragment = await loadFragment(nav1Path);

  // decorate nav1 DOM
  block.textContent = '';
  const nav1 = document.createElement('nav1');
  nav1.id = 'nav1';
  while (fragment.firstElementChild) nav1.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav1.children[i];
    if (section) section.classList.add(`nav1-${c}`);
  });

  const nav1Brand = nav1.querySelector('.nav1-brand');
  const brandLink = nav1Brand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const nav1Sections = nav1.querySelector('.nav1-sections');
  if (nav1Sections) {
    nav1Sections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((nav1Section) => {
      if (nav1Section.querySelector('ul')) nav1Section.classList.add('nav1-drop');
      nav1Section.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = nav1Section.getAttribute('aria-expanded') === 'true';
          toggleAllnav1Sections(nav1Sections);
          nav1Section.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav1-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav1" aria-label="Open nav1igation">
      <span class="nav1-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav1, nav1Sections));
  nav1.prepend(hamburger);
  nav1.setAttribute('aria-expanded', 'false');
  // prevent mobile nav1 behavior on window resize
  toggleMenu(nav1, nav1Sections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav1, nav1Sections, isDesktop.matches));

  const nav1Wrapper = document.createElement('div');
  nav1Wrapper.className = 'nav1-wrapper';
  nav1Wrapper.append(nav1);
  block.append(nav1Wrapper);
}
