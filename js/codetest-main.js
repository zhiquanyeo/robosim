require.config({
	'urlArgs': 'bust=' + (new Date()).getTime(),
	'paths': {
		//App Specific stuff
		'app': 'codetest-app',

		//define vendor paths
		'jquery': 'libs/jquery',
		'underscore': 'libs/underscore',
		'backbone': 'libs/backbone'
	},
	'shim': {
		'underscore': {
			'exports': '_'
		},
		'backbone': {
			'deps': ['jquery', 'underscore'],
			'exports': 'Backbone'
		}
	}
});

//Main App
require(['app'],
function(App) {
	App.start();
});