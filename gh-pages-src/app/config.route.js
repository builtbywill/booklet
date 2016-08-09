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
				templateUrl: 'gh-pages-src/app/pages/home.html',
				title: 'Home'
			}
		}, {
			url: '/installation',
			config: {
				templateUrl: 'gh-pages-src/app/pages/installation.html',
				title: 'Installation'
			}
		}, {
			url: '/documentation',
			config: {
				templateUrl: 'gh-pages-src/app/pages/documentation.html',
				title: 'Documentation'
			}
		}, {
			url: '/demos',
			config: {
				templateUrl: 'gh-pages-src/app/pages/demos.html',
				title: 'Demos'
			}
		}, {
			url: '/changelog',
			config: {
				templateUrl: 'gh-pages-src/app/pages/changelog.html',
				title: 'Change Log'
			}
		}, {
			url: '/demos/arrows',
			config: {
				templateUrl: 'gh-pages-src/app/pages/arrows.html',
				title: 'Arrows'
			}
		}, {
			url: '/demos/auto',
			config: {
				templateUrl: 'gh-pages-src/app/pages/auto.html',
				title: 'Auto Play'
			}
		}, {
			url: '/demos/buttons',
			config: {
				templateUrl: 'gh-pages-src/app/pages/buttons.html',
				title: 'Custom Next & Prev Links'
			}
		}, {
			url: '/demos/chapterselect',
			config: {
				templateUrl: 'gh-pages-src/app/pages/chapterselect.html',
				title: 'Chapter Selector'
			}
		}, {
			url: '/demos/closed',
			config: {
				templateUrl: 'gh-pages-src/app/pages/closed.html',
				title: 'Closed Book & Covers'
			}
		}, {
			url: '/demos/cursors',
			config: {
				templateUrl: 'gh-pages-src/app/pages/cursors.html',
				title: 'Controls Cursor'
			}
		}, {
			url: '/demos/direction',
			config: {
				templateUrl: 'gh-pages-src/app/pages/direction.html',
				title: 'Reading Direction'
			}
		}, {
			url: '/demos/easing',
			config: {
				templateUrl: 'gh-pages-src/app/pages/easing.html',
				title: 'Easing'
			}
		}, {
			url: '/demos/events',
			config: {
				templateUrl: 'gh-pages-src/app/pages/events.html',
				title: 'Using Events'
			}
		}, {
			url: '/demos/hash',
			config: {
				templateUrl: 'gh-pages-src/app/pages/hash.html',
				title: 'Hash Tag Control'
			}
		}, {
			url: '/demos/hovers',
			config: {
				templateUrl: 'gh-pages-src/app/pages/hovers.html',
				title: 'Hover Effect'
			}
		}, {
			url: '/demos/keyboard',
			config: {
				templateUrl: 'gh-pages-src/app/pages/keyboard.html',
				title: 'Keyboard Controls'
			}
		}, {
			url: '/demos/manual',
			config: {
				templateUrl: 'gh-pages-src/app/pages/manual.html',
				title: 'Manual Control'
			}
		}, {
			url: '/demos/methods',
			config: {
				templateUrl: 'gh-pages-src/app/pages/methods.html',
				title: 'Using Methods'
			}
		}, {
			url: '/demos/overlays',
			config: {
				templateUrl: 'gh-pages-src/app/pages/overlays.html',
				title: 'Overlays'
			}
		}, {
			url: '/demos/padding',
			config: {
				templateUrl: 'gh-pages-src/app/pages/padding.html',
				title: 'Page Padding'
			}
		}, {
			url: '/demos/pagenums',
			config: {
				templateUrl: 'gh-pages-src/app/pages/pagenums.html',
				title: 'Page Numbers'
			}
		}, {
			url: '/demos/pageselect',
			config: {
				templateUrl: 'gh-pages-src/app/pages/pageselect.html',
				title: 'Page Selector'
			}
		}, {
			url: '/demos/shadows',
			config: {
				templateUrl: 'gh-pages-src/app/pages/shadows.html',
				title: 'Shadows'
			}
		}, {
			url: '/demos/size',
			config: {
				templateUrl: 'gh-pages-src/app/pages/size.html',
				title: 'Width/Height'
			}
		}, {
			url: '/demos/speed',
			config: {
				templateUrl: 'gh-pages-src/app/pages/speed.html',
				title: 'Speed'
			}
		}, {
			url: '/demos/starting',
			config: {
				templateUrl: 'gh-pages-src/app/pages/starting.html',
				title: 'Starting Page'
			}
		}, {
			url: '/demos/tabs',
			config: {
				templateUrl: 'gh-pages-src/app/pages/tabs.html',
				title: 'Tabs'
			}
		}];
	}
})();
