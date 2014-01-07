define([],
function() {
	function randIntImpl(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	var lib = [
		{
			name: 'Math~random',
			retType: 'double',
			parameters: [],
			implementation: Math.random
		},
		{
			name: 'Math~randomInt',
			retType: 'int',
			parameters: [{
				varType: 'int',
				name: 'min'
			}, {
				varType: 'int',
				name: 'max'
			}],
			implementation: randIntImpl
		},
		{
			name: 'Math~abs',
			retType: 'int',
			parameters: [],
			implementation: Math.abs
		},
		{
			name: 'Math~cos',
			retType: 'double',
			parameters: [{
				varType: 'double',
				name: 'x'
			}],
			implementation: Math.cos
		},
		{
			name: 'Math~sin',
			retType: 'double',
			parameters: [{
				varType: 'double',
				name: 'x'
			}],
			implementation: Math.sin
		},
		{
			name: 'Math~tan',
			retType: 'double',
			parameters: [{
				varType: 'double',
				name: 'x'
			}],
			implementation: Math.tan
		},
		{
			name: 'Math~max',
			retType: 'double',
			parameters: [{
				varType: 'double',
				name: 'x1'
			}, {
				varType: 'double',
				name: 'x2'
			}],
			implementation: Math.max
		},
		{
			name: 'Math~min',
			retType: 'double',
			parameters: [{
				varType: 'double',
				name: 'x1'
			}, {
				varType: 'double',
				name: 'x2'
			}],
			implementation: Math.min
		},
		{
			name: 'Math~floor',
			retType: 'int',
			parameters: [{
				varType: 'double',
				name: 'x'
			}],
			implementation: Math.floor
		},
		{
			name: 'Math~ceil',
			retType: 'int',
			parameters: [{
				varType: 'double',
				name: 'x'
			}],
			implementation: Math.ceil
		},
		{
			name: 'Math~sqrt',
			retType: 'double',
			parameters: [{
				varType: 'double',
				name: 'x'
			}],
			implementation: Math.sqrt
		},

	]

	return lib;
});