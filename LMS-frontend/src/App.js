import React from "react";
import "antd/dist/antd.css";
import "./App.css";
import "./LeaveForm.css";

import "./styles/pro.css";
import SiteLayout from "./shared/Sitelayout";
import "./Responsive.css";
import { ThemeProvider } from "styled-components";
import { useTheme } from "./theme/useTheme";

/**
 * Note: the old <GlobalStyles/> (global `button {}` rules + serif theme fonts)
 * was removed — it fought with Ant Design and made buttons/forms look broken.
 * ThemeProvider is kept so any component using styled-components' theme still works.
 */
const App = () => {
  const { theme, themeLoaded } = useTheme();

  if (!themeLoaded) return null;

  return (
    <ThemeProvider theme={theme}>
      <SiteLayout />
    </ThemeProvider>
  );
};

export default App;
