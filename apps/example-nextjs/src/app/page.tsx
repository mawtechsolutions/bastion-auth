import { auth, currentUser } from '@bastionauth/nextjs/server';
import { LandingPage } from '@/components/LandingPage';

export default async function Home() {
  const { userId } = await auth();
  const user = await currentUser();

  return (
    <LandingPage 
      isAuthenticated={!!userId}
      user={user ? {
        firstName: user.firstName,
        email: user.email,
      } : null}
    />
  );
}
