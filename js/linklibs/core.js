define([],
function() {
	
	//implementations
	function getTimeImpl() {
		return (new Date()).getTime();
	}

	//registrations
	var lib = [
		{
			name: 'getTime',
			retType: 'int',
			parameters: [],
			implementation: getTimeImpl
		},
	]

	return lib;
});