define([],
function() {

	function _translatePoint(point, rotPoint, angleRad) {
		var transX = rotPoint.x + ((point.x - rotPoint.x) * Math.cos(angleRad)) +
						((point.y - rotPoint.y) * Math.sin(angleRad));
		var transY = rotPoint.y - ((point.x - rotPoint.x) * Math.sin(angleRad)) +
						((point.y - rotPoint.y) * Math.cos(angleRad));
		return {
			x: transX,
			y: transY
		};
	}

	function _findMinMaxPoints(pointArray) {
		var minX = Number.POSITIVE_INFINITY;
		var minY = Number.POSITIVE_INFINITY;
		var maxX = Number.NEGATIVE_INFINITY;
		var maxY = Number.NEGATIVE_INFINITY;

		var idxMinX, idxMinY, idxMaxX, idxMaxY;

		for (var i = 0, len = pointArray.length; i < len; i++) {
			var currPoint = pointArray[i];
			if (currPoint.x < minX)
				minX = currPoint.x;
			if (currPoint.x > maxX)
				maxX = currPoint.x;
			if (currPoint.y < minY)
				minY = currPoint.y;
			if (currPoint.y > maxY)
				maxY = currPoint.y;
		}

		var retValue = {
			minX: minX,
			maxX: maxX,
			minY: minY,
			maxY: maxY
		};
		return retValue;
	}

	function _getBoundingBox(position, dimensions, angle) {
		//position.x/y, dimensions.width/height, angle in deg
		var angleRad = angle / 180 * Math.PI;
		var halfWidth = dimensions.width / 2;
		var halfHeight = dimensions.height / 2;

		var topLeft = {x: position.x - halfWidth, y: position.y - halfHeight};
		var topRight = {x: position.x + halfWidth, y: position.y - halfHeight};
		var bottomLeft = {x: position.x - halfWidth, y: position.y + halfHeight};
		var bottomRight = {x: position.x + halfWidth, y: position.y + halfHeight};

		var transTL = _translatePoint(topLeft, position, angleRad);
		var transTR = _translatePoint(topRight, position, angleRad);
		var transBL = _translatePoint(bottomLeft, position, angleRad);
		var transBR = _translatePoint(bottomRight, position, angleRad);

		var minMaxPoints = _findMinMaxPoints([transTL, transTR, transBL, transBR]);

		//Return topLeft corner, and width+height, and an array of points
		var boundingBox = {
			x: minMaxPoints.minX,
			y: minMaxPoints.minY,
			width: minMaxPoints.maxX - minMaxPoints.minX,
			height: minMaxPoints.maxY - minMaxPoints.minY,
			points: {
				topLeft: {
					x: minMaxPoints.minX,
					y: minMaxPoints.minY
				},
				topRight: {
					x: minMaxPoints.maxX,
					y: minMaxPoints.minY
				},
				bottomLeft: {
					x: minMaxPoints.minX,
					y: minMaxPoints.maxY
				},
				bottomRight: {
					x: minMaxPoints.maxX,
					y: minMaxPoints.maxY
				}
			}
		};

		return boundingBox;
	}

	//rectInfo is an object with position, size, angle
	function _rectToPoints(rectInfo) {
		var points;
		var rectPoints = [
			{
				x: rectInfo.position.x - rectInfo.width / 2,
				y: rectInfo.position.y - rectInfo.height / 2
			},
			{
				x: rectInfo.position.x + rectInfo.width / 2,
				y: rectInfo.position.y - rectInfo.height / 2
			},
			{
				x: rectInfo.position.x - rectInfo.width / 2,
				y: rectInfo.position.y + rectInfo.height / 2
			},
			{
				x: rectInfo.position.x + rectInfo.width / 2,
				y: rectInfo.position.y + rectInfo.height / 2
			}
		];

		var angleRad = rectInfo.angle / 180 * Math.PI;

		points = rectPoints.map(function(point) {
			return _translatePoint(point, rectInfo.position, angleRad);
		});

		return points;
	}

	//Intersection between 2 lines, where a1, a2 are points on line a, and b1, b2 are points on line b
	function _intersectLineLine (a1, a2, b1, b2) {
		var result = {};
		var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
		var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
		var u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

		if (u_b != 0) {
			var ua = ua_t / u_b;
			var ub = ub_t / u_b;
			if (0 <= ua && ua <= 1 && 0 <= ub && ub <=1) {
				result.points = [];
				result.points.push({
					x: a1.x + ua * (a2.x - a1.x),
					y: a1.y + ua * (a2.y - a1.y)
				});
			}
		}

		return result;
	}

	//Intersection between a line and a polygon (collection of points)
	function _intersectLinePoly(a1, a2, points) {
		var result = {};
		var length = points.length;
		for (var i = 0; i < length; i++) {
			var b1 = points[i];
			var b2 = points[(i + 1) % length];
			var intersection = _intersectLineLine(a1, a2, b1, b2);
			if (intersection.points) {
				result.points = [];
				result.points.concat(intersection.points);
			}
		}

		return result;
	}

	return {
		translatePoint: _translatePoint,
		findMinMaxPoints: _findMinMaxPoints,
		getBoundingBox: _getBoundingBox,
		rectToPoints: _rectToPoints,
		intersectLineLine: _intersectLineLine,
		intersectLinePoly: _intersectLinePoly,
	}
});