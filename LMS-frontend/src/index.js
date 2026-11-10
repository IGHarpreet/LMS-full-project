import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as themes from './theme/schema.json';
import { setToLS } from './utils/storage';
import { setupAxios } from './shared/api';
import ErrorBoundary from './components/ErrorBoundary';

// token header, friendly network errors, 401 handling for every axios call
setupAxios();

const Index = () => {
  setToLS('all-themes', themes.default);
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Index />);
