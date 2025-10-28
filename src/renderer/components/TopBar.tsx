import type { FC } from 'react';
import { useMediaImporter } from '../hooks/useMediaImporter';

export const TopBar: FC = () => {
  const { importFromDialog, isImporting } = useMediaImporter();

  const handleImport = async () => {
    await importFromDialog();
  };

  const handleRecord = async () => {
    const response = await window.clipforge.recordStart();
    if (response.status === 'error') {
      console.warn(response.message);
    } else {
      console.info('Recording workflow not yet implemented.');
    }
  };

  const handleExport = async () => {
    const response = await window.clipforge.exportVideo();
    if (response.status === 'error') {
      console.warn(response.message);
    } else {
      console.info('Export workflow not yet implemented.');
    }
  };

  return (
    <header className="top-bar">
      <div className="top-bar__brand">
        <span className="top-bar__logo">ClipForge</span>
      </div>
      <nav className="top-bar__actions">
        <button
          type="button"
          className="top-bar__button"
          onClick={() => {
            void handleImport();
          }}
          disabled={isImporting}
        >
          {isImporting ? 'Importing…' : 'Import'}
        </button>
        <button
          type="button"
          className="top-bar__button"
          onClick={() => {
            void handleRecord();
          }}
        >
          Record
        </button>
        <button
          type="button"
          className="top-bar__button"
          onClick={() => {
            void handleExport();
          }}
        >
          Export
        </button>
      </nav>
    </header>
  );
};
