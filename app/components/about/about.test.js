import AboutModule from './about'
import AboutController from './about.controller';
import AboutComponent from './about.component';
import AboutTemplate from './about.html';

describe('About', () => {
  let $rootScope, $controller, scope, makeController;

  beforeEach(window.module('app'));
  beforeEach(inject((_$rootScope_, $timeout, $log, $http, $httpBackend, _$controller_) => {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    makeController = () => {
      let ctrl = _$controller_(AboutController,
        { $scope: scope
        });

      return ctrl;
    };
  }));

  describe('Module', () => {
    // top-level specs: i.e., routes, injection, naming
  });

  describe('Controller', () => {
    // controller specs
    it('has a name property [REMOVE]', () => { // erase if removing this.name from the controller
      let controller = makeController();
      expect(controller).to.have.property('name');
    });
  });

  describe('Template', () => {
    // template specs
    // tip: use regex to ensure correct bindings are used e.g., {{  }}
    it('has Source YAML in template', () => {
      expect(AboutTemplate).to.match(/Source YAML/g);
    });
  });

  describe('Component', () => {
    // component/directive specs
    let component = AboutComponent();

    it('includes the intended template',() => {
      expect(component.template).to.equal(AboutTemplate);
    });

    it('uses `controllerAs` syntax', () => {
      expect(component).to.have.property('controllerAs');
    });

    it('invokes the right controller', () => {
      expect(component.controller).to.equal(AboutController);
    });
  });
});
