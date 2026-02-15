import { LoadingSkeleton } from '../../../components/LoadingSkeleton';

export default function Loading() {
  return (
    <div style={{ padding: '40px 24px', maxWidth: 700, margin: '0 auto' }}>
      <LoadingSkeleton variant="page" />
    </div>
  );
}
