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

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Activating fake backend
if (process.env.REACT_APP_DEFAULTAUTH === "fake") {
  fakeBackend();
}

function App() {
  useSSE();

  useEffect(() => {
    applyLumaTheme(getLumaTheme());
  }, []);

  // Prevent Reactstrap Modal from shifting layout by stripping inline padding-right from body
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.body.style.paddingRight) {
        document.body.style.paddingRight = '';
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  return (
    <React.Fragment>
      <CommandPalette />
      <Route />
      <ToastContainer />
    </React.Fragment>
  );
}

export default App;
