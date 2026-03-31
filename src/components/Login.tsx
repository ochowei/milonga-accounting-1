import React from 'react';
import { LogIn } from 'lucide-react';

interface LoginProps {
  onSignIn: () => void;
  isFirebaseConfigured: boolean;
}

export const Login: React.FC<LoginProps> = ({ onSignIn, isFirebaseConfigured }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">舞會櫃台對帳</h1>
          <p className="text-gray-500">Dance Party Accounting App</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="mb-6 bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm text-left border border-yellow-200">
            <p className="font-semibold mb-1">⚠️ 尚未設定 Firebase (Firebase not configured)</p>
            <p>請在 <code>firebase-applet-config.json</code> 中填入您的 Firebase 設定，才能啟用登入與儲存功能。</p>
            <p className="mt-2 text-xs opacity-80">Please add your Firebase config to enable login and saving.</p>
          </div>
        )}

        <button
          onClick={onSignIn}
          disabled={!isFirebaseConfigured}
          className={`w-full py-3 px-4 rounded-xl flex items-center justify-center text-lg font-medium transition-all ${
            isFirebaseConfigured 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 mr-3" />
          使用 Google 登入 (Sign in with Google)
        </button>
      </div>
    </div>
  );
};
