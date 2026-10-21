import { account } from '@/lib/account';
import { ProfileForm } from '@/components/profile-form';
export default async function Profile() {
  const { profile } = await account();
  return (
    <>
      <h1 className="text-4xl">Your profile</h1>
      <ProfileForm
        initialName={profile.full_name || ''}
        address={profile.default_shipping_address}
      />
    </>
  );
}
