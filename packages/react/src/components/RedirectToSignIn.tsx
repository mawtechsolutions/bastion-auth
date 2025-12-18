import React, { useEffect } from 'react';

export interface RedirectToSignInProps {
  signInUrl?: string;
  redirectUrl?: string;
}

export function RedirectToSignIn({
  signInUrl = '/sign-in',
  redirectUrl,
}: RedirectToSignInProps) {
  useEffect(() => {
    const currentPath = redirectUrl || window.location.pathname + window.location.search;
    const url = new URL(signInUrl, window.location.origin);
    url.searchParams.set('redirect_url', currentPath);
    window.location.href = url.toString();
  }, [signInUrl, redirectUrl]);

  return null;
}

