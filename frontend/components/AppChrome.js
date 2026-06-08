'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

const AUTH_PATHS = ['/login', '/register', '/social-oauth-complete'];

function isAuthRoute(pathname) {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function AppChrome({ children }) {
  const pathname = usePathname();

  if (isAuthRoute(pathname)) {
    return children;
  }

  return (
    <>
      <Header />
      <main className="container">{children}</main>
    </>
  );
}
