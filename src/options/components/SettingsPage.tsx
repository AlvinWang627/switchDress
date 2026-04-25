import { SettingsSection } from './SettingsSection';
import { PhotosSection } from './PhotosSection';

export function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto py-6 px-4 space-y-6">
        <SettingsSection />
        <PhotosSection />
      </div>
    </div>
  );
}
