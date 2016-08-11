(function() {
    'use strict';

    angular
        .module('shared.filters')
        .filter('mpReverse', mpReverse);

    function mpReverse() {
        return function(items) {
            return items.slice().reverse();
        };
    }

})();
