import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New content available, auto-updating...');
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
