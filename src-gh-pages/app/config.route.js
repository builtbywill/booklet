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
		}, {
			url: '/demos/auto',
			config: {
				templateUrl: 'app/pages/auto.html',
				title: 'Auto Play'
			}
		}, {
			url: '/demos/buttons',
			config: {
				templateUrl: 'app/pages/buttons.html',
				title: 'Custom Next & Prev Links'
			}
		}, {
			url: '/demos/chapterselect',
			config: {
				templateUrl: 'app/pages/chapterselect.html',
				title: 'Chapter Selector'
			}
		}, {
			url: '/demos/closed',
			config: {
				templateUrl: 'app/pages/closed.html',
				title: 'Closed Book & Covers'
			}
		}, {
			url: '/demos/cursors',
			config: {
				templateUrl: 'app/pages/cursors.html',
				title: 'Controls Cursor'
			}
		}, {
			url: '/demos/direction',
			config: {
				templateUrl: 'app/pages/direction.html',
				title: 'Reading Direction'
			}
		}, {
			url: '/demos/easing',
			config: {
				templateUrl: 'app/pages/easing.html',
				title: 'Easing'
			}
		}, {
			url: '/demos/events',
			config: {
				templateUrl: 'app/pages/events.html',
				title: 'Using Events'
			}
		}, {
			url: '/demos/hash',
			config: {
				templateUrl: 'app/pages/hash.html',
				title: 'Hash Tag Control'
			}
		}, {
			url: '/demos/hovers',
			config: {
				templateUrl: 'app/pages/hovers.html',
				title: 'Hover Effect'
			}
		}, {
			url: '/demos/keyboard',
			config: {
				templateUrl: 'app/pages/keyboard.html',
				title: 'Keyboard Controls'
			}
		}, {
			url: '/demos/manual',
			config: {
				templateUrl: 'app/pages/manual.html',
				title: 'Manual Control'
			}
		}, {
			url: '/demos/methods',
			config: {
				templateUrl: 'app/pages/methods.html',
				title: 'Using Methods'
			}
		}, {
			url: '/demos/overlays',
			config: {
				templateUrl: 'app/pages/overlays.html',
				title: 'Overlays'
			}
		}, {
			url: '/demos/padding',
			config: {
				templateUrl: 'app/pages/padding.html',
				title: 'Page Padding'
			}
		}, {
			url: '/demos/pagenums',
			config: {
				templateUrl: 'app/pages/pagenums.html',
				title: 'Page Numbers'
			}
		}, {
			url: '/demos/pageselect',
			config: {
				templateUrl: 'app/pages/pageselect.html',
				title: 'Page Selector'
			}
		}, {
			url: '/demos/shadows',
			config: {
				templateUrl: 'app/pages/shadows.html',
				title: 'Shadows'
			}
		}, {
			url: '/demos/size',
			config: {
				templateUrl: 'app/pages/size.html',
				title: 'Width/Height'
			}
		}, {
			url: '/demos/speed',
			config: {
				templateUrl: 'app/pages/speed.html',
				title: 'Speed'
			}
		}, {
			url: '/demos/starting',
			config: {
				templateUrl: 'app/pages/starting.html',
				title: 'Starting Page'
			}
		}, {
			url: '/demos/tabs',
			config: {
				templateUrl: 'app/pages/tabs.html',
				title: 'Tabs'
			}
		}];
	}
})();
