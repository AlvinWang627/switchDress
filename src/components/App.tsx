import { Icon } from '@iconify/react';

function App() {
  return (
    <div className="min-w-64 min-h-48 p-4 bg-white dark:bg-gray-900">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">switch-dress</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Chrome Extension with React + TypeScript + Vite
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Icon icon="mdi:rocket" className="w-6 h-6 text-blue-500" />
        <span className="text-sm text-gray-700 dark:text-gray-200">Infrastructure Ready</span>
      </div>
    </div>
  );
}

export default App;
