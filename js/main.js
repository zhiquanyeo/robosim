require.config({
	'urlArgs': 'bust=' + (new Date()).getTime(),
	'paths': {
		//App Specific stuff
		'app': 'app',

		//define vendor paths
		'jquery': 'libs/jquery',
		'underscore': 'libs/underscore',
		'backbone': 'libs/backbone',
		'jqxwidgets': 'libs/jqwidgets/jqx-all',
	},
	'shim': {
		'underscore': {
			'exports': '_'
		},
		'backbone': {
			'deps': ['jquery', 'underscore'],
			'exports': 'Backbone'
		},
		'jqxwidgets': ['jquery'],
	},
	'waitSeconds': 200,
});

//Main App
require(['app'],
function(App) {
	App.start();
});