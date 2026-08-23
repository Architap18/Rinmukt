// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/context/AuthContext';

// export default function HomePage() {
//   const router = useRouter();
//   const { isAuthenticated, loading } = useAuth();

//   useEffect(() => {
//     if (!loading) {
//       if (isAuthenticated) {
//         router.replace('/dashboard');
//       } else {
//         router.replace('/login');
//       }
//     }
//   }, [loading, isAuthenticated, router]);

//   return (
//     <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
//       <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-600/30 animate-pulse">
//         <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none">
//           <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
//           <path
//             d="M6 14 C9 10, 12 18, 16 14 S21 10, 26 14"
//             stroke="white"
//             strokeWidth="2.5"
//             strokeLinecap="round"
//             fill="none"
//           />
//           <path
//             d="M6 19 C9 15, 12 23, 16 19 S21 15, 26 19"
//             stroke="rgba(255,255,255,0.6)"
//             strokeWidth="2"
//             strokeLinecap="round"
//             fill="none"
//           />
//           <path
//             d="M12 10 L12 22"
//             stroke="rgba(255,255,255,0.35)"
//             strokeWidth="1.5"
//             strokeLinecap="round"
//           />
//           <path
//             d="M20 10 L20 22"
//             stroke="rgba(255,255,255,0.35)"
//             strokeWidth="1.5"
//             strokeLinecap="round"
//           />
//         </svg>
//       </div>
//       <div>
//         <h2 className="text-xl font-bold text-foreground">Opening Rinmukht...</h2>
//         <p className="text-sm text-muted-foreground font-medium">Loading your financial overview</p>
//       </div>
//     </div>
//   );
// }
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-600 shadow-lg">
          <svg
            viewBox="0 0 32 32"
            className="h-10 w-10"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 13.5C9 9.5 12 17.5 16 13.5C20 9.5 23 17.5 26 13.5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <path
              d="M6 19C9 15 12 23 16 19C20 15 23 23 26 19"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          Opening Rinmukht
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Checking your account
        </p>

        <div className="mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-600" />
        </div>
      </div>
    </main>
  );
}