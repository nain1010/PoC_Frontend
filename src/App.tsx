import React from 'react';

//import Scss
import './assets/scss/themes.scss';

//imoprt Route
import Route from './Routes';

// Import Firebase Configuration file
// import { initFirebaseBackend } from "./helpers/firebase_helper";

// Fake Backend 
import fakeBackend from "./helpers/AuthType/fakeBackend";

// SSE
import { useSSE } from './Components/Hooks/useSSE';

// Activating fake backend
if (process.env.REACT_APP_DEFAULTAUTH === "fake") {
  fakeBackend();
}

function App() {
  useSSE();
  return (
    <React.Fragment>
      <Route />
    </React.Fragment>
  );
}

export default App;
