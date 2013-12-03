/* Simulator Object 

This represents a Simulation instance that includes a reference to a field, 
and a robot. This will be the interface by which the outside world starts 
and stops the robot.

*/
define([],
function() {

	function Simulation(field, robot, program) {

		var _playingField = field;
		var _robot = robot;

		if (!field || !robot) {
			console.error("Must specify Field and Robot!");
			return;
		}

		//Store the last timestamp we got (for use during ticks);
		var _lastTime;

		var _isRunning = false;
		var _timerToken;

		var _eventHandlers = {};

		Object.defineProperty(this, "isRunning", {
			get: function() {
				return _isRunning;
			}
		});

		//==== Startup routines ====
		// set up the event handler for the robot


		//This is the function that does the actual timing stuff
		function _doTimerTick() {
			var currTime = (new Date()).getTime();
			var deltaTime = currTime - _lastTime;

			//TODO Execute whatever code needs to be executed (via parser)

			_robot.processTick(deltaTime);

			_lastTime = currTime;
		}

		this.start = function() {
			if (!_isRunning) {
				_lastTime = (new Date()).getTime();
				_timerToken = setInterval(_doTimerTick, 100);
				_isRunning = true;
				_fireEvent('runStateChanged', true);
			}
		};

		this.stop = function() {
			if (_timerToken) {
				clearInterval(_timerToken);
				_timerToken = null;
				_isRunning = false;
				_fireEvent('runStateChanged', false);
			}
		};

		this.reset = function() {

		};

		this.addEventHandler = function (event, callback) {
			var handlers = _eventHandlers[event];
			if (!handlers) {
				handlers = [];
				_eventHandlers[event] = handlers;
			}

			handlers.push(callback);
		};

		function _fireEvent (event, data) {
			var handlers = _eventHandlers[event];
			if (handlers) {
				for (var i = 0, len = handlers.length; i < len; i++) {
					var callback = handlers[i];
					callback(data);
				}
			}
		}
	}

	return Simulation;
});