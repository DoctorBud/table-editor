import template from './navbar.html';
import controller from './navbar.controller';
import 'file!./INCA.png';

let navbarComponent = {
  template: template,
  controller: controller,
  controllerAs: 'navBarCtrl'
};

export default navbarComponent;
