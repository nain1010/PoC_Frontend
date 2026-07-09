import React from 'react';

//import Scss
import './assets/scss/themes.scss';
import './assets/scss/luma_theme_overrides.scss';

//imoprt Route
import Route from './Routes';

// Import Firebase Configuration file
// import { initFirebaseBackend } from "./helpers/firebase_helper";

// Fake Backend 
import fakeBackend from "./helpers/AuthType/fakeBackend";

// SSE
import { useSSE } from './Components/Hooks/useSSE';

// Luma Premium Theme
import { getLumaTheme, applyLumaTheme } from './helpers/luma_theme_helper';
import { useEffect } from 'react';

import CommandPalette from './Components/Common/CommandPalette';

// Activating fake backend
if (process.env.REACT_APP_DEFAULTAUTH === "fake") {
  fakeBackend();
}

function App() {
  useSSE();

  useEffect(() => {
    applyLumaTheme(getLumaTheme());
  }, []);

  return (
    <React.Fragment>
      <CommandPalette />
      <Route />
    </React.Fragment>
  );
}

export default App;
