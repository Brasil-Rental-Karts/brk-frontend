import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_HEIGHT_BREAKPOINT = 500;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const isUserAgentMobile =
        /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
          navigator.userAgent,
        );
      const isSmallScreen =
        window.innerWidth < MOBILE_BREAKPOINT ||
        window.innerHeight < MOBILE_HEIGHT_BREAKPOINT;
      setIsMobile(isUserAgentMobile || isSmallScreen);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}
