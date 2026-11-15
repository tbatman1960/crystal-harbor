import { SavedDesigns } from '@/components/saved-designs';
export const metadata = { title: 'My saved designs' };
export default function Designs() {
  return (
    <div className="shell py-12">
      <SavedDesigns />
    </div>
  );
}
