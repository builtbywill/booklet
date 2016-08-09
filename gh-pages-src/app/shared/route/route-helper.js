(function() {
    'use strict';

    angular
        .module('shared.route')
        .provider('routeHelperConfig', routeHelperConfig)
        .factory('routeHelper', routeHelper);

    routeHelper.$inject = ['$location', '$rootScope', '$route', '$window', 'logger', 'routeHelperConfig'];

    // Must configure via the routeHelperConfigProvider

    function routeHelperConfig() {
        /* jshint validthis:true */
        this.config = {
            // These are the properties we need to set
            // $routeProvider: undefined
            // docTitle: ''
            // resolveAlways: {ready: function(){ } }
        };

        this.$get = function() {
            return {
                config: this.config
            };
        };
    }

    function routeHelper($location, $rootScope, $route, $window, logger, routeHelperConfig) {
        var handlingRouteChangeError = false;
        var routeCounts = {
            errors: 0,
            changes: 0
        };
        var routes = [];
        var $routeProvider = routeHelperConfig.config.$routeProvider;

        var service = {
            configureRoutes: configureRoutes,
            getRoutes: getRoutes,
            routeCounts: routeCounts
        };

        init();

        return service;

        ///////////////

        function init() {
            handleRoutingErrors();
            updateDocTitle();
            trackGoogleAnalyticsPageView();
        }

        function configureRoutes(routes) {
            routes.forEach(function(route) {
                route.config.resolve = angular.extend(route.config.resolve || {}, routeHelperConfig.config.resolveAlways);
                $routeProvider.when(route.url, route.config);

            });
            $routeProvider.otherwise({
                redirectTo: '/'
            });
        }

        function handleRoutingErrors() {
            // Route cancellation:
            // On routing error, go to the dashboard.
            // Provide an exit clause if it tries to do it twice.
            $rootScope.$on('$routeChangeError',
                function(event, current, previous, rejection) {
                    if (handlingRouteChangeError) {
                        return;
                    }
                    routeCounts.errors++;
                    handlingRouteChangeError = true;
                    var destination = (current && (current.title || current.name || current.loadedTemplateUrl)) ||
                        'unknown target';
                    var msg = 'Error routing to ' + destination + '. ' + (rejection.msg || '');
                    logger.warning(msg, [current]);

                    $location.path('/');
                }
            );
        }

        function getRoutes() {
            for (var prop in $route.routes) {
                if ($route.routes.hasOwnProperty(prop)) {
                    var route = $route.routes[prop];
                    var isRoute = !!route.title;
                    if (isRoute) {
                        routes.push(route);
                    }
                }
            }
            return routes;
        }

        function updateDocTitle() {
            $rootScope.$on('$routeChangeSuccess',
                function(event, current, previous) {
                    routeCounts.changes++;
                    handlingRouteChangeError = false;
                    $rootScope.title = routeHelperConfig.config.docTitle + ' ' + (current.title || ''); // data bind to <title>
                }
            );
        }

        function trackGoogleAnalyticsPageView() {
            if (typeof $window.ga === 'function') {
                $rootScope.$on('$routeChangeSuccess', function() {
                    $window.ga('send', 'pageview', {
                        page: $location.path()
                    });
                });
            }
        }

    }
})();
