'use client';

import React from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useSearchParams, useParams as useNextParams } from 'next/navigation';

export function Link({ to, href, className, children, ...props }) {
  const target = to || href || '#';
  return (
    <NextLink href={target} className={className} {...props}>
      {children}
    </NextLink>
  );
}

export function NavLink({ to, href, className, activeClassName = 'active', children, end, ...props }) {
  const target = to || href || '#';
  const pathname = usePathname();
  const isActive = end ? pathname === target : pathname.startsWith(target);
  const resolvedClass = typeof className === 'function' 
    ? className({ isActive }) 
    : `${className || ''} ${isActive ? activeClassName : ''}`.trim();

  return (
    <NextLink href={target} className={resolvedClass} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to, options) => {
    if (typeof to === 'number') {
      if (typeof window !== 'undefined') {
        window.history.go(to);
      }
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

export function useLocation() {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';

  return {
    pathname,
    search,
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    key: pathname + search,
  };
}

export function useParams() {
  const params = useNextParams();
  return params || {};
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  React.useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);
  return null;
}

export function useNavigationType() {
  return 'PUSH';
}
