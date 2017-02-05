import template from './about.html';
import controller from './about.controller';

let aboutComponent = {
    restrict: 'EA',
    scope: {},
    template: template,
    controller: controller,
    controllerAs: 'aboutCtrl',
    bindToController: true
  };

export default aboutComponent;
