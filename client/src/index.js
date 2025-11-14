import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

console.log('Clerk Publishable Key loaded:', clerkPubKey ? 'YES' : 'NO');
console.log('Key starts with:', clerkPubKey?.substring(0, 20));

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key - check client/.env file');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

