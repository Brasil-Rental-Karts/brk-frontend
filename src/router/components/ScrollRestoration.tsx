import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface ScrollRestorationProps {
  enabled?: boolean;
  scrollToTop?: boolean;
}

export const ScrollRestoration = ({
  enabled = true,
  scrollToTop = true,
}: ScrollRestorationProps) => {
  const location = useLocation();

  useEffect(() => {
    if (!enabled) return;

    if (scrollToTop) {
      // Scroll to top on route change
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [location.pathname, enabled, scrollToTop]);

  return null;
};

// Hook for manual scroll restoration
export const useScrollRestoration = () => {
  const scrollToTop = (smooth = true) => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  const scrollToElement = (elementId: string, smooth = true) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "start",
      });
    }
  };

  const scrollToPosition = (x: number, y: number, smooth = true) => {
    window.scrollTo({
      top: y,
      left: x,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  return {
    scrollToTop,
    scrollToElement,
    scrollToPosition,
  };
};
