import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { NavigationHelper } from "../utils/navigation";

export const useNavigation = () => {
  const navigate = useNavigate();

  const navigationHelper = useMemo(() => {
    return new NavigationHelper(navigate);
  }, [navigate]);

  return navigationHelper;
};
