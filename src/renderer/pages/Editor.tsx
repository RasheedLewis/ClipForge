import type { FC } from 'react';
import { TopBar } from '../components/TopBar';

export const EditorPage: FC = () => (
  <div className="editor-shell">
    <TopBar />
    <div className="editor-shell__body">
      <section className="panel panel--library">
        <header className="panel__header">
          <h2>Media Library</h2>
        </header>
        <div className="panel__content">
          <p>Import clips to populate your library.</p>
        </div>
      </section>
      <section className="panel panel--preview">
        <header className="panel__header">
          <h2>Preview</h2>
        </header>
        <div className="panel__content panel__content--centered">
          <span className="panel__placeholder">Preview area</span>
        </div>
      </section>
    </div>
    <section className="panel panel--timeline">
      <header className="panel__header">
        <h2>Timeline</h2>
      </header>
      <div className="panel__content">
        <p>Drag and arrange clips on the timeline.</p>
      </div>
    </section>
  </div>
);
