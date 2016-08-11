(function() {
	'use strict';

	angular
		.module('shared.logger')
		.factory('logger', logger);

	logger.$inject = ['$log', 'toastr'];

	function logger($log, toastr) {

		var service = {
			error: error,
			info: info,
			success: success,
			warning: warning,

			// console only, no toastr
			debug: debug
		};

		return service;

		/////////////////////

		function debug(message, data, title) {
			$log.debug('Debug: ' + message, data);
		}

		function error(message, data, title) {
			if (typeof $log.error() === 'undefined') {
				toastr.error(message, title);
			}
			$log.error('Error: ' + message, data);
		}

		function info(message, data, title) {
			if (typeof $log.info() === 'undefined') {
				toastr.info(message, title);
			}
			$log.info('Info: ' + message, data);
		}

		function success(message, data, title) {
			if (typeof $log.info() === 'undefined') {
				toastr.success(message, title);
			}
			$log.info('Success: ' + message, data);
		}

		function warning(message, data, title) {
			if (typeof $log.error() === 'undefined') {
				toastr.warning(message, title);
			}
			$log.warn('Warning: ' + message, data);
		}
	}
}());
