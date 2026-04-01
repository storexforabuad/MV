'use client';

import dynamic from 'next/dynamic';

const SignIn = dynamic(() => import('../../components/SignIn'), {
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
        <div className="h-12 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  ),
  ssr: false
});

const SignInPage = () => {
  return <SignIn />;
  // Optionally, you can add a message here if needed
};

export default SignInPage;
