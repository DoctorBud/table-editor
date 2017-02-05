import homeComponent from './home/home';
import editorComponent from './editor/editor';

export default app => {
  INCLUDE_ALL_MODULES([homeComponent, editorComponent], app);
};

