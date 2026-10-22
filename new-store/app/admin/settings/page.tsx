import { settings } from '@/lib/data';
import { SettingsForm } from '@/components/settings-form';
export default async function Settings() {
  return (
    <>
      <h1 className="text-4xl">Store settings</h1>
      <p className="mt-4 text-sm">
        Set per-product shipping charges in Products. Tax rates are stored as
        decimals; the optional free-shipping threshold uses cents. The default
        Indiana tax applies to merchandise only.
      </p>
      <SettingsForm settings={await settings()} />
    </>
  );
}
