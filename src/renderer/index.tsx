import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';
import './styles/highlight.css';
import 'katex/dist/katex.min.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(<App />);
