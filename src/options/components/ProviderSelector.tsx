import { Icon } from '@iconify/react';
import type { ProviderId } from '@/types/provider';

interface ProviderSelectorProps {
  value: ProviderId;
  onChange: (provider: ProviderId) => void;
  providers: { id: ProviderId; label: string }[];
  disabled?: boolean;
}

export function ProviderSelector({ value, onChange, providers, disabled }: ProviderSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="provider-select" className="text-sm font-medium text-gray-700">
        供應商
      </label>
      <div className="relative">
        <select
          id="provider-select"
          value={value}
          onChange={(e) => onChange(e.target.value as ProviderId)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label}
            </option>
          ))}
        </select>
        <Icon
          icon="mdi:chevron-down"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
        />
      </div>
    </div>
  );
}
