require.config({
	'urlArgs': 'bust=' + (new Date()).getTime(),
	'paths': {
		//App Specific stuff
		'app': 'app',

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
	console.log('App', App);
	App.start();
});