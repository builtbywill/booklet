// Include in index.html so that app level exceptions are handled.
// Exclude from testRunner.html which should run exactly what it wants to run
(function() {
	'use strict';

	angular
		.module('shared.exception')
		.provider('exceptionHandler', exceptionHandlerProvider)
		.config(config);

	config.$inject = ['$provide'];
	extendExceptionHandler.$inject = ['$delegate', 'exceptionHandler', 'logger'];

	/**
	 * Must configure the exception handling
	 * @return {[type]}
	 */
	function exceptionHandlerProvider() {
		/* jshint validthis:true */
		this.config = {
			appErrorPrefix: undefined
		};

		this.configure = function(appErrorPrefix) {
			this.config.appErrorPrefix = appErrorPrefix;
		};

		this.$get = function() {
			return {
				config: this.config
			};
		};
	}

	/**
	 * Configure by setting an optional string value for appErrorPrefix.
	 * Accessible via config.appErrorPrefix (via config value).
	 * @param  {[type]} $provide
	 * @return {[type]}
	 */
	function config($provide) {
		$provide.decorator('$exceptionHandler', extendExceptionHandler);
	}

	/**
	 * Extend the $exceptionHandler service to also display a toast.
	 * @param  {Object} $delegate
	 * @param  {Object} exceptionHandler
	 * @param  {Object} logger
	 * @return {Function} the decorated $exceptionHandler service
	 */
	function extendExceptionHandler($delegate, exceptionHandler, logger) {
		return function(exception, cause) {

			var appErrorPrefix = exceptionHandler.config.appErrorPrefix || '';
			var prefixedException = appErrorPrefix + exception;
			var data = {
				exception: exception,
				cause: cause
			};

			//$delegate(prefixedException, data); // calls $logger.error by default
			logger.error(prefixedException, data);
		};
	}
})();
