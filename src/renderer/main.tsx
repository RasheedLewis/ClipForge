import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const isDropZoneTarget = (event: DragEvent) =>
  event
    .composedPath()
    .some(
      (node) =>
        node instanceof HTMLElement &&
        (node.classList.contains('drop-zone') || node.closest?.('.drop-zone')),
    );

window.addEventListener('dragover', (event) => {
  if (!isDropZoneTarget(event)) {
    event.preventDefault();
  }
});

window.addEventListener('drop', (event) => {
  if (!isDropZoneTarget(event)) {
    event.preventDefault();
  }
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Renderer root element was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
