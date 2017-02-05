import heroComponent from './hero.component';

export default app => {
  // app.directive('hero', heroComponent);
  app.component('hero', heroComponent);

  if (ENVIRONMENT === 'test') {
    require('./hero.test.js');
  }
};


