import type { FC } from 'react';
import { TopBar } from '../components/TopBar';
import { MediaLibrary } from '../components/MediaLibrary';
import { Timeline } from '../components/Timeline';

export const EditorPage: FC = () => (
  <div className="editor-shell">
    <TopBar />
    <div className="editor-shell__body">
      <section className="panel panel--library">
        <header className="panel__header">
          <h2>Media Library</h2>
        </header>
        <div className="panel__content panel__content--scroll">
          <MediaLibrary />
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
    <section className="panel panel--timeline" id="timeline-panel">
      <header className="panel__header">
        <h2>Timeline</h2>
      </header>
      <div className="panel__content panel__content--timeline">
        <Timeline />
      </div>
    </section>
  </div>
);
