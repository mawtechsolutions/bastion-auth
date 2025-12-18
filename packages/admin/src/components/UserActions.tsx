'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserActionsProps {
  userId: string;
  isSuspended: boolean;
}

export function UserActions({ userId, isSuspended }: UserActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSuspend = async () => {
    if (!confirm(isSuspended ? 'Unsuspend this user?' : 'Suspend this user?')) return;
    
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/v1/admin/users/${userId}/${isSuspended ? 'unsuspend' : 'suspend'}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to update user');
      router.refresh();
    } catch (error) {
      console.error('Failed to suspend/unsuspend user:', error);
      alert('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-actions">
      <button 
        className={`btn ${isSuspended ? 'btn-primary' : 'btn-ghost'}`}
        onClick={handleSuspend}
        disabled={loading}
      >
        {loading ? 'Loading...' : (isSuspended ? 'Unsuspend User' : 'Suspend User')}
      </button>

      <style jsx>{`
        .user-actions {
          display: flex;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
}

