/* eslint-disable */

import MainController from './MainController';
import MainTemplate from './index.html';

describe('MainController', () => {
  let $rootScope, makeController;

  beforeEach(window.module('app'));
  // beforeEach(inject((_$rootScope_) => {
  //   $rootScope = _$rootScope_;
  //   makeController = () => {
  //     return new MainController();
  //   };
  // }));


  beforeEach(angular.mock.inject(function ($rootScope, $controller) {
    var scope = $rootScope.$new();
    makeController = function() {
      return $controller('MainController', {
          '$scope': scope
      });
    };
  }));

//  describe('Module', () => {
//    // top-level specs: i.e., routes, injection, naming
//  });

  describe('Controller', () => {
    // controller specs
    it('has a name property', () => { // erase if removing this.name from the controller
      console.log('makeController', makeController);
      let controller = makeController();
      expect(controller).to.have.property('name');
      // expect(2 + 2).to.equal(4);
    });
  });

 describe('Template', () => {
   // template specs
   // tip: use regex to ensure correct bindings are used e.g., {{  }}
   it('has Table Editor V1 in template', () => {
     expect(MainTemplate).to.match(/Table Editor V1/g);
   });
 });
});

