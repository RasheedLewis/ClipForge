import type { FC } from 'react';

const actions: Array<{ label: string; handler: () => Promise<void> }> = [
  {
    label: 'Import',
    handler: async () => {
      const response = await window.clipforge.importClips();
      console.info(response.message);
    },
  },
  {
    label: 'Record',
    handler: async () => {
      const response = await window.clipforge.recordStart();
      console.info(response.message);
    },
  },
  {
    label: 'Export',
    handler: async () => {
      const response = await window.clipforge.exportVideo();
      console.info(response.message);
    },
  },
];

export const TopBar: FC = () => (
  <header className="top-bar">
    <div className="top-bar__brand">
      <span className="top-bar__logo">ClipForge</span>
    </div>
    <nav className="top-bar__actions">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="top-bar__button"
          onClick={() => {
            void action.handler();
          }}
        >
          {action.label}
        </button>
      ))}
    </nav>
  </header>
);
