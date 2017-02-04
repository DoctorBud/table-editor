import template from './about.html';
import controller from './about.controller';

// This is the Directive Definition Object function seen in a traditional Angular setup.
// In this example it is abstracted as a shell and used in the about.js.
let aboutComponent = function () {
  return {
    restrict: 'EA',
    scope: {},
    template: template,
    controller: controller,
    controllerAs: 'aboutCtrl',
    bindToController: true
  };
};

export default aboutComponent;