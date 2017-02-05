import editorComponent from './editor.component';

export default app => {
  app.config(['$stateProvider', '$urlRouterProvider',
    ($stateProvider, $urlRouterProvider) => {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('editor', {
        url: '/editor',
        template: '<editor></editor>' // Essentially Treats the Editor Directive as the Route View.
      });
  }]).component('editor', editorComponent);

  if (ENVIRONMENT === 'test') {
    require('./editor.test.js');
  }
};
