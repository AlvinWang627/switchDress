import { useState } from 'react';
import { Icon } from '@iconify/react';

interface ApiKeyInputProps {
  value: string;
  onChange: (apiKey: string) => void;
  disabled?: boolean;
}

export function ApiKeyInput({ value, onChange, disabled }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="api-key-input" className="text-sm font-medium text-gray-700">
        API Key
      </label>
      <div className="relative">
        <input
          id="api-key-input"
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="輸入您的 API Key"
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          aria-label={showKey ? '隱藏 API Key' : '顯示 API Key'}
        >
          <Icon icon={showKey ? 'mdi:eye-off' : 'mdi:eye'} className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
