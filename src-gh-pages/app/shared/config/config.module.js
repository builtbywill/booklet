(function() {
	'use strict';

	angular.module('shared.config', [
		// Angular Modules
		'ngAnimate',
		'ngCookies',
		'ngResource',
		'ngRoute',
		'ngSanitize',
		'ngTouch',

		// 3rd Party Modules
		'mgcrea.ngStrap',
		'hljs',

		// Shared Modules
		'shared.constants',
		'shared.logger',
		'shared.exception',
		'shared.directives',
		'shared.filters',
		'shared.route'

	]);

})();
