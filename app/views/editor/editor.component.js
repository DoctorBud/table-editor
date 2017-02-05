import template from './editor.html';
import controller from './editor.controller';

let editorComponent = {
    restrict: 'EA',
    scope: {},
    template: template,
    controller: controller,
    controllerAs: 'editorCtrl',
    bindToController: true
  };

export default editorComponent;
