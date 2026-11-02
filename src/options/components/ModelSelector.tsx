import { Icon } from '@iconify/react';
import type { ModelOption } from '@/types/provider';

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  /** 可選模型（通常為目前供應商的模型清單） */
  models: ModelOption[];
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, models, disabled }: ModelSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="model-select" className="text-sm font-medium text-gray-700">
        模型
      </label>
      <div className="relative">
        <select
          id="model-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {models.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label}
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
