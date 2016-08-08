(function() {
	'use strict';

	angular
		.module('app')
		.run(appRun);

	appRun.$inject = ['routeHelper'];

	function appRun(routeHelper) {
		routeHelper.configureRoutes(getRoutes());
	}

	function getRoutes() {
		return [{
			url: '/',
			config: {
				templateUrl: 'app/pages/home.html',
				title: 'Home'
			}
		}, {
			url: '/installation',
			config: {
				templateUrl: 'app/pages/installation.html',
				title: 'Installation'
			}
		}, {
			url: '/documentation',
			config: {
				templateUrl: 'app/pages/documentation.html',
				title: 'Documentation'
			}
		}, {
			url: '/demos',
			config: {
				templateUrl: 'app/pages/demos.html',
				title: 'Demos'
			}
		}, {
			url: '/changelog',
			config: {
				templateUrl: 'app/pages/changelog.html',
				title: 'Change Log'
			}
		}, {
			url: '/demos/arrows',
			config: {
				templateUrl: 'app/pages/arrows.html',
				title: 'Arrows'
			}
		}];
	}
})();
