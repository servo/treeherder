// Remove the eslint-disable when rewriting this file during the React conversion.
/* eslint-disable func-names */
import angular from 'angular';
import ngSanitize from 'angular-sanitize';

import treeherderModule from './treeherder';

const logViewerApp = angular.module('logviewer', [treeherderModule.name, ngSanitize]);

logViewerApp.config(['$compileProvider', '$locationProvider',
    function ($compileProvider, $locationProvider) {
        // Disable debug data & legacy comment/class directive syntax, as recommended by:
        // https://docs.angularjs.org/guide/production
        $compileProvider.debugInfoEnabled(false);
        $compileProvider.commentDirectivesEnabled(false);
        $compileProvider.cssClassDirectivesEnabled(false);

        // Revert to the legacy Angular <=1.5 URL hash prefix to save breaking existing links:
        // https://docs.angularjs.org/guide/migration#commit-aa077e8
        $locationProvider.hashPrefix('');
    }]);

export default logViewerApp;
