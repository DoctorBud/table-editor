import aboutComponent from './about.component';

export default app => {
  app.config(['$stateProvider', '$urlRouterProvider',
    ($stateProvider, $urlRouterProvider) => {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('about', {
        url: '/about',
        template: '<about></about>' // Essentially Treats the About Directive as the Route View.
      });
  }]).directive('about', aboutComponent);

  if (ENVIRONMENT === 'test') {
    require('./about.test.js');
  }
};
