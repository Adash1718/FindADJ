import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import Navbar from './components/Navbar';
import ProfileSetup from './components/ProfileSetup';
import Inbox from './components/Inbox';
import Events from './components/Events';
import EventDetail from './components/EventDetail';
import CreateEvent from './components/CreateEvent';
import Profile from './components/Profile';
import Messages from './components/Messages';

function AppContent() {
  const { user: clerkUser, isLoaded } = useUser();
  const [appUser, setAppUser] = useState(null);

  useEffect(() => {
    console.log('AppContent useEffect - isLoaded:', isLoaded, 'clerkUser:', clerkUser);
    
    if (!isLoaded) {
      console.log('Clerk not loaded yet, waiting...');
      return;
    }

    console.log('Clerk loaded!');

    if (!clerkUser) {
      // User signed out, clear localStorage
      console.log('No Clerk user, clearing localStorage');
      localStorage.removeItem('currentUser');
      setAppUser(null);
      return;
    }

    // User is signed in with Clerk
    console.log('Clerk user found:', clerkUser.id);
    const profileData = clerkUser.publicMetadata || {};
    
    console.log('Clerk User Metadata:', profileData);
    console.log('User Type:', profileData.user_type);
    
    if (profileData.user_type) {
      // User has completed setup
      const userData = {
        id: clerkUser.id,
        username: clerkUser.username || clerkUser.emailAddresses[0].emailAddress,
        name: profileData.name || clerkUser.fullName || clerkUser.firstName || 'User',
        user_type: profileData.user_type,
        email: clerkUser.emailAddresses[0].emailAddress
      };
      console.log('Setting app user with complete profile:', userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setAppUser(userData);
    } else {
      // User needs to complete profile
      console.log('User needs to complete profile');
      setAppUser({
        id: clerkUser.id,
        username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || 'user',
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        user_type: null
      });
    }
  }, [clerkUser, isLoaded]);

  const handleProfileComplete = (userData) => {
    setAppUser(userData);
  };

  // Show loading only while Clerk is initializing
  if (!isLoaded) {
    console.log('Rendering: Clerk loading...');
    return (
      <div className="container" style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Loading Clerk...</h2>
        <p>If this takes too long, check your Clerk keys in .env files</p>
      </div>
    );
  }

  console.log('Rendering: isLoaded=true, clerkUser=', !!clerkUser, 'appUser=', !!appUser);

  // If user is signed in but hasn't completed profile
  if (clerkUser && appUser && !appUser.user_type) {
    return <ProfileSetup user={appUser} onComplete={handleProfileComplete} />;
  }

  return (
    <Router>
      <div className="App">
        <SignedIn>
          {appUser && <Navbar user={appUser} />}
          <Routes>
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            <Route path="/inbox" element={appUser ? <Inbox user={appUser} /> : <div>Loading...</div>} />
            <Route path="/events" element={appUser ? <Events user={appUser} /> : <div>Loading...</div>} />
            <Route path="/events/:id" element={appUser ? <EventDetail user={appUser} /> : <div>Loading...</div>} />
            <Route path="/create-event" element={appUser && appUser.user_type === 'party_thrower' ? <CreateEvent user={appUser} /> : <Navigate to="/inbox" />} />
            <Route path="/profile/:userId" element={appUser ? <Profile user={appUser} /> : <div>Loading...</div>} />
            <Route path="/messages/:eventId" element={appUser ? <Messages user={appUser} /> : <div>Loading...</div>} />
          </Routes>
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </div>
    </Router>
  );
}

function App() {
  return <AppContent />;
}

export default App;

