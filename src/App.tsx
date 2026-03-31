/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const { user, loading, signIn, signOut, isFirebaseConfigured } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {!user ? (
        <Login onSignIn={signIn} isFirebaseConfigured={isFirebaseConfigured} />
      ) : (
        <Dashboard user={user} onSignOut={signOut} />
      )}
    </ErrorBoundary>
  );
}
