import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Page Not Found</h2>
        <p className="not-found-text">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>

      <style jsx>{`
        .not-found {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }
        
        .not-found-content {
          text-align: center;
        }
        
        .not-found-code {
          font-size: 6rem;
          font-weight: 700;
          color: var(--text-muted);
          line-height: 1;
          margin-bottom: 1rem;
        }
        
        .not-found-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .not-found-text {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
      `}</style>
    </div>
  );
}

