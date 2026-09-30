'use client';

import { useEffect } from 'react';

const HOVER_VARIANTS_ATTRIBUTE = 'data-mobile-hover-variants';

function hoverVariants(element: Element) {
  return Array.from(element.classList).filter((className) => className.includes('hover:'));
}

function suppressHoverVariants(element: Element) {
  const variants = hoverVariants(element);
  if (variants.length === 0) return;

  const savedVariants = new Set(
    (element.getAttribute(HOVER_VARIANTS_ATTRIBUTE) ?? '').split(' ').filter(Boolean),
  );
  variants.forEach((variant) => savedVariants.add(variant));
  variants.forEach((variant) => element.classList.remove(variant));
  element.setAttribute(HOVER_VARIANTS_ATTRIBUTE, Array.from(savedVariants).join(' '));
}

function restoreHoverVariants(element: Element) {
  const savedVariants = (element.getAttribute(HOVER_VARIANTS_ATTRIBUTE) ?? '').split(' ').filter(Boolean);
  if (savedVariants.length === 0) return;

  element.classList.add(...savedVariants);
  element.removeAttribute(HOVER_VARIANTS_ATTRIBUTE);
}

function visitElements(root: ParentNode, selector: string, callback: (element: Element) => void) {
  if (root instanceof Element && root.matches(selector)) callback(root);
  root.querySelectorAll(selector).forEach(callback);
}

/** Removes Tailwind hover variants on narrow touch layouts while retaining them on desktop. */
export default function MobileHoverGuard() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const suppress = (root: ParentNode) => visitElements(root, '[class*="hover:"]', suppressHoverVariants);
    const restore = (root: ParentNode) => visitElements(root, `[${HOVER_VARIANTS_ATTRIBUTE}]`, restoreHoverVariants);

    const update = () => {
      if (mediaQuery.matches) suppress(document);
      else restore(document);
    };

    update();

    const observer = new MutationObserver((mutations) => {
      if (!mediaQuery.matches) return;

      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          suppress(mutation.target);
        }
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) suppress(node);
        });
      });
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
    });
    mediaQuery.addEventListener('change', update);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', update);
      restore(document);
    };
  }, []);

  return null;
}
