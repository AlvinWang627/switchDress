import React from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsPage } from './components/SettingsPage';
import styles from './index.css?inline';

const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

function Options() {
  return <SettingsPage />;
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<Options />);
}

export default Options;
