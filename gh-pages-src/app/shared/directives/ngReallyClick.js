(function() {
	'use strict';

	angular
		.module('shared.directives')
		.directive('ngReallyClick', ngReallyClick);

	ngReallyClick.$inject = ['$window'];

	function ngReallyClick($window) {
		/**
		 * A generic confirmation for risky actions.
		 * Usage: Add attributes: ng-really-message="Are you sure"? ng-really-click="takeAction()" function
		 */
		var directive = {
			link: link,
			restrict: 'A'
		};
		return directive;

		function link(scope, element, attrs) {
			element.bind('click', function() {
				var message = attrs.ngReallyMessage;
				if (message && $window.confirm(message)) {
					scope.$apply(attrs.ngReallyClick);
				}
			});
		}
	}
})();