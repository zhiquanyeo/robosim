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

	return {
		translatePoint: _translatePoint,
		findMinMaxPoints: _findMinMaxPoints,
		getBoundingBox: _getBoundingBox,
	}
});