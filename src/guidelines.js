module.exports = function (opts, cy, $, debounce) {


	var RBTree = require("functional-red-black-tree");

	var options = opts;

	var changeOptions = function (opts) {
		options = opts;

		// RBTree always returns null, when low == high
		// to avoid this:
		if (options.guidelinesTolerance == 0)
			options.guidelinesTolerance = 0.001;
	};

	var getCyScratch = function () {
		var sc = cy.scratch("_guidelines");
		if (!sc)
			sc = cy.scratch("_guidelines", {});

		return sc;
	};

	var resizeCanvas = function () {
		clearDrawing();
		$canvas
			.attr('height', $container.height())
			.attr('width', $container.width())
			.css({
				'position': 'absolute',
				'top': 0,
				'left': 0,
				'z-index': options.guidelinesStackOrder
			});
		setTimeout(function () {
			var canvasBb = $canvas.offset();
			var containerBb = $container.offset();

			$canvas
				.attr('height', $container.height())
				.attr('width', $container.width())
				.css({
					'top': -( canvasBb.top - containerBb.top ),
					'left': -( canvasBb.left - containerBb.left )
				});
		}, 0);
	};

	var clearDrawing = function () {
		var width = $container.width();
		var height = $container.height();

		ctx.clearRect(0, 0, width, height);
	};

	var $canvas = $('<canvas></canvas>');
	var $container = $(cy.container());
	var ctx = $canvas[0].getContext('2d');
	$container.append($canvas);
	resizeCanvas();

	var VTree = null;
	var HTree = null;
	var excludedNodes;
	var lines = {};

	lines.getDims = function (node) {

		var pos = node.renderedPosition();
		var width = node.renderedWidth();
		var height = node.renderedHeight();
		var padding = {
			left: Number(node.renderedStyle("padding-left").replace("px", "")),
			right: Number(node.renderedStyle("padding-right").replace("px", "")),
			top: Number(node.renderedStyle("padding-top").replace("px", "")),
			bottom: Number(node.renderedStyle("padding-bottom").replace("px", ""))
		};

		// v for vertical, h for horizontal
		return {
			horizontal: {
				center: (pos.x),
				left: Math.round(pos.x - (padding.left + width / 2)),
				right: Math.round(pos.x + (padding.right + width / 2))
			},
				vertical: {
				center: (pos.y),
				top: Math.round(pos.y - (padding.top + height / 2)),
				bottom: Math.round(pos.y + (padding.bottom + height / 2))
			}
		};

	};


	lines.init = function (_activeNodes) {
		VTree = RBTree();
		HTree = RBTree();
		var activeNodes = _activeNodes.nodes(); 
		var nodes = cy.nodes();
		excludedNodes = activeNodes.union(activeNodes.ancestors());
		nodes.not(excludedNodes).each(function (i, node) {
			var dims = lines.getDims(node);

			["left", "center", "right"].forEach(function (val) {
				var hKey = dims.horizontal[val];
				if (HTree.get(hKey))
				HTree.get(hKey).push(node);
				else
				HTree = HTree.insert(hKey, [node]);

			});
			["top", "center", "bottom"].forEach(function (val) {
				var vKey = dims.vertical[val];
				if (VTree.get(vKey))
				VTree.get(vKey).push(node);
				else
				VTree = VTree.insert(vKey, [node]);

			});

		});
		lines.update(activeNodes);

	};

	lines.destroy = function () {
		lines.clear();
		VTree = null;
		HTree = null;
	};

	lines.clear = clearDrawing;


	lines.drawLine = function (from, to, color) {
		ctx.beginPath();
		ctx.moveTo(from.x, from.y);
		ctx.lineTo(to.x, to.y);
		ctx.strokeStyle = color;
		ctx.stroke();
	};

	lines.drawArrow = function(position, type){
		if (type == "right"){
			// right arrow
			ctx.beginPath();
			ctx.moveTo(position.x-5, position.y-5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x-5, position.y+5);
			//ctx.strokeStyle = "red";
			ctx.stroke();
		}
		else if (type == "left"){
			// left arrow
			ctx.beginPath();
			ctx.moveTo(position.x+5, position.y-5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x+5, position.y+5);
			ctx.stroke();
		}
		else if (type == "top"){
			// up arrow
			ctx.beginPath();
			ctx.moveTo(position.x-5, position.y+5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x+5, position.y+5);
			ctx.stroke();
		}
		else if (type == "bottom"){
			// down arrow
			ctx.beginPath();
			ctx.moveTo(position.x-5, position.y-5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x+5, position.y-5);
			ctx.stroke();
		}

	}


	/** Guidelines for horizontally distributed alignment
	 * @param: node the node to be aligned
	 */
	lines.horizontalDistribution = function(node){
		// variables
		var leftNode = null, rightNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];
		// Find nodes in range and check if they align
		HTree.forEach(function(key, nodes){

			for (left of nodes){
				var leftDim = lines.getDims(left);
				if (Math.abs(leftDim["vertical"]["center"] - nodeDim["vertical"]["center"]) < options.guidelinesStyle.range*2.5*cy.zoom()){
					if ((leftDim["horizontal"]["right"]) == key && 
						leftDim["horizontal"]["right"] < nodeDim["horizontal"]["left"]){
							var ripo = Math.round(2*Xcenter)-key;
							HTree.forEach(function($, rightNodes){
								//if (rightNodes){
								for (right of rightNodes){
									if (Math.abs(lines.getDims(right)["vertical"]["center"] - Ycenter) < options.guidelinesStyle.range*2.5*cy.zoom()){
										if (Math.abs(ripo - lines.getDims(right)["horizontal"]["left"]) < 2*options.guidelinesTolerance){
											leftNode = left; rightNode = right;
										}
									}
								}
								//}
							}, ripo - options.guidelinesTolerance, ripo + options.guidelinesTolerance);
						}
				}
			}
		}, Xcenter - options.guidelinesStyle.range*2.5*cy.zoom(), Xcenter);

		// Draw the lines
		if (leftNode){
			lines.drawLine({
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: Ycenter
			}, {
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: Ycenter
			}, options.guidelinesStyle.horizontalDistColor);

			lines.drawLine({
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: Ycenter
			}, {
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: lines.getDims(leftNode)["vertical"]["center"]
			}, options.guidelinesStyle.horizontalDistColor);

			lines.drawLine({
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: Ycenter
			}, {
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: lines.getDims(rightNode)["vertical"]["center"]
			}, options.guidelinesStyle.horizontalDistColor);
		}
		else{
			var state = lines.horizontalDistributionNext(node,"left" );

			if (!state)  
				lines.horizontalDistributionNext(node,"right" );
		}



	}

	/** Guidelines for horizontally distributed alignment
	 * @param: node the node to be aligned
	 */
	lines.verticalDistribution = function(node){
		// variables
		var belowNode = null, aboveNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];

		// Find nodes in range and check if they align
		VTree.forEach(function(key, nodes){

			for (below of nodes){
				var belowDim = lines.getDims(below);
				if (Math.abs(belowDim["horizontal"]["center"] - nodeDim["horizontal"]["center"]) < options.guidelinesStyle.range*2.5*cy.zoom()){
					if (belowDim["vertical"]["bottom"] == key &&
						belowDim["vertical"]["bottom"] < nodeDim["vertical"]["top"]){
							var abpo = Math.round((2*Ycenter)-key);
							VTree.forEach(function($, aboveNodes){
								//if (aboveNodes){
								for (above of aboveNodes){
									if (Math.abs(lines.getDims(above)["horizontal"]["center"] - Xcenter) < options.guidelinesStyle.range*2.5*cy.zoom()){
										if (Math.abs(abpo - lines.getDims(above)["vertical"]["top"]) < 2*options.guidelinesTolerance){
											belowNode = below; aboveNode = above;
										}
									}
								}
								//}
							}, abpo - options.guidelinesTolerance, abpo + options.guidelinesTolerance);
						}
				}
			}
		}, Ycenter - options.guidelinesStyle.range*2.5*cy.zoom(), Ycenter);


		if (belowNode){
			lines.drawLine({
				y: lines.getDims(belowNode)["vertical"]["bottom"],//renderedPosition("x"),
				x: Xcenter
			}, {
				y: lines.getDims(aboveNode)["vertical"]["top"],
				x: Xcenter
			}, options.guidelinesStyle.verticalDistColor);

			lines.drawLine({
				y: lines.getDims(belowNode)["vertical"]["bottom"],//renderedPosition("x"),
				x: Xcenter
			}, {
				y: lines.getDims(belowNode)["vertical"]["bottom"],
				x: lines.getDims(belowNode)["horizontal"]["center"]
			}, options.guidelinesStyle.verticalDistColor);

			lines.drawLine({
				y: lines.getDims(aboveNode)["vertical"]["top"],//renderedPosition("x"),
				x: Xcenter
			}, {
				y: lines.getDims(aboveNode)["vertical"]["top"],
				x: lines.getDims(aboveNode)["horizontal"]["center"]
			}, options.guidelinesStyle.verticalDistColor);
		}
		else{
			var state = lines.verticalDistributionNext(node,"below" );

			if (!state)  
				lines.verticalDistributionNext(node,"above" );
		}


	}    

	/**
	 * Find geometric alignment lines and draw them
	 * @param type: horizontal or vertical
	 * @param node: the node to be aligned
	 */
	lines.searchForLine = function (type, node) {

		// variables
		var position, target, center, axis, Tree;
		var dims = lines.getDims(node)[type];
		var targetKey = Number.MAX_SAFE_INTEGER;

		// initialize Tree
		if ( type == "horizontal"){
			Tree = HTree;
			axis = "y";
		} else{
			Tree = VTree;
			axis = "x";
		}

		center = node.renderedPosition(axis);
		// check if node aligned in any dimension:
		// {center, left, right} or {center, top, bottom}
		for (var dimKey in dims) {
			position = dims[dimKey];

			// find the closest alignment in range of tolerance
			Tree.forEach(function (exKey, nodes) {
				for (n of nodes){
					var pos = n.renderedPosition(axis);
					if ( Math.abs(pos - center) < targetKey){
						target = n;
						targetKey = Math.abs(pos - center);
					}
				}

			}, position - Number(options.guidelinesTolerance), position + Number(options.guidelinesTolerance));

			// if alignment found, draw lines and break
			if (target) {
				targetKey = lines.getDims(node)[type][dimKey];

				// Draw horizontal or vertical alignment line
				if (type == "horizontal") {
					lines.drawLine({
						x: targetKey,
						y: node.renderedPosition("y")
					}, {
						x: targetKey,
						y: target.renderedPosition("y")
					}, options.guidelinesStyle.strokeStyle);
				} else {
					lines.drawLine({
						x: node.renderedPosition("x"),
						y: targetKey
					}, {
						x: target.renderedPosition("x"),
						y: targetKey
					}, options.guidelinesStyle.strokeStyle);
				}

				break;
			}
		}
	};

	lines.horizontalDistributionNext = function(node, type){

		// variables
		var leftNode = null, rightNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];
		var side = "right", otherSide = "left";
		var lowerBound = Xcenter;
		if (type == "left"){
			side = "left"; otherSide = "right";
			var lowerBound = Xcenter - options.guidelinesStyle.range*2.5*cy.zoom();
		}


		var compare = {
			"left": function (x, y) { return x < y },
			"right": function (x, y) { return x > y }
		}



		// Find nodes in range and check if they align
		HTree.forEach(function(key, nodes){

			for (left of nodes){
				var leftDim = lines.getDims(left);
				if (Math.abs(leftDim["vertical"]["center"] - nodeDim["vertical"]["center"]) < options.guidelinesStyle.range*2.5*cy.zoom()){
					if ((leftDim["horizontal"][otherSide]) == key && 
						compare[type](leftDim["horizontal"][otherSide], nodeDim["horizontal"][side])){
							var ll = leftDim["horizontal"][side]-(nodeDim["horizontal"][side] - key);
							rightNodes = HTree.get(ll);
							if (rightNodes){
								for (right of rightNodes){
									if (Math.abs(lines.getDims(right)["vertical"]["center"] - Ycenter) < options.guidelinesStyle.range*2.5*cy.zoom()){
										if (ll == lines.getDims(right)["horizontal"][otherSide]){
											leftNode = left; rightNode = right;
										}
									}
								}
							}
						}
				}
			}
		}, lowerBound, lowerBound + options.guidelinesStyle.range*2.5*cy.zoom());

		// Draw the lines
		if (leftNode)
		{
			lines.drawDH(node, leftNode, rightNode, type);
			return true;
		}
		else
			return false;

	}



	lines.drawDH = function(node, leftNode, rightNode, type){
		var Ycenter = lines.getDims(node)["vertical"]["center"];
		var side = "right", otherSide = "left";
		if (type == "left"){
			side = "left"; otherSide = "right";
		}

		lines.drawLine({
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: Ycenter
		}, {
			x: lines.getDims(node)["horizontal"][side],
			y: Ycenter
		}, options.guidelinesStyle.horizontalDistColor);

		lines.drawLine({
			x: lines.getDims(node)["horizontal"][side],
			y: Ycenter
		}, {
			x: lines.getDims(node)["horizontal"][side],
			y: lines.getDims(leftNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor);

		lines.drawLine({
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: Ycenter
		}, {
			x: lines.getDims(leftNode)["horizontal"][side],
			y: Ycenter
		}, options.guidelinesStyle.horizontalDistColor);
		lines.drawLine({
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: Ycenter
		}, {
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: lines.getDims(rightNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor);

		lines.drawLine({
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: Ycenter
		}, {
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: lines.getDims(leftNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor);

		lines.drawLine({
			x: lines.getDims(leftNode)["horizontal"][side],
			y: Ycenter
		}, {
			x: lines.getDims(leftNode)["horizontal"][side],
			y: lines.getDims(leftNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor);

		lines.drawLine({
			x: lines.getDims(leftNode)["horizontal"][side],
			y: Ycenter
		}, {
			x: lines.getDims(leftNode)["horizontal"][side],
			y: lines.getDims(leftNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor);


		lines.drawArrow({
			x: lines.getDims(node)["horizontal"][side],
			y: Ycenter}, otherSide);

		lines.drawArrow({
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: Ycenter}, side);

		lines.drawArrow({
			x: lines.getDims(leftNode)["horizontal"][side],
			y: Ycenter}, otherSide);

		lines.drawArrow({
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: Ycenter}, side);

	}

	lines.verticalDistributionNext = function(node, type){
		// variables
		var belowNode = null, aboveNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];
		var side = "top", otherSide = "bottom";
		var lowerBound = Ycenter - options.guidelinesStyle.range*2.5*cy.zoom();
		if (type == "above"){
			side = "bottom"; otherSide = "top";
			lowerBound = Ycenter;
		}

		var compare = {
			"below": function (x, y) { return x < y },
			"above": function (x, y) { return x > y }
		}
		// Find nodes in range and check if they align
		VTree.forEach(function(key, nodes){

			for (below of nodes){
				var belowDim = lines.getDims(below);
				if (Math.abs(belowDim["horizontal"]["center"] - nodeDim["horizontal"]["center"]) < options.guidelinesStyle.range*2.5*cy.zoom()){
					if (belowDim["vertical"][otherSide] == key &&
						compare[type](belowDim["vertical"][otherSide], nodeDim["vertical"][side])){
							var ll = belowDim["vertical"][side]-(nodeDim["vertical"][side]-key);
							aboveNodes = VTree.get(ll);
							if (aboveNodes){
								for (above of aboveNodes){
									if (Math.abs(lines.getDims(above)["horizontal"]["center"] - Xcenter) < options.guidelinesStyle.range*2.5*cy.zoom()){
										if (ll == lines.getDims(above)["vertical"][otherSide]){
											belowNode = below; aboveNode = above;
										}
									}
								}
							}
						}
				}
			}
		}, lowerBound, lowerBound+options.guidelinesStyle.range*2.5*cy.zoom());

		if (belowNode){
			lines.drawDV(node, belowNode, aboveNode, type);
			return true;
		}
		else
			return false;
	}



	lines.drawDV = function(node, belowNode, aboveNode, type){
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var side = "top", otherSide = "bottom";
		if (type == "above"){
			side = "bottom"; otherSide = "top";
		}

		lines.drawLine({
			x: Xcenter,
			y: nodeDim["vertical"][side]
		}, {
			x: Xcenter,
			y: lines.getDims(belowNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor);

		lines.drawLine({
			x: Xcenter,
			y: lines.getDims(belowNode)["vertical"][side]
		}, {
			x: Xcenter,
			y: lines.getDims(aboveNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor);


		lines.drawLine({
			x: lines.getDims(belowNode)["horizontal"]["center"],
			y: nodeDim["vertical"][side]
		}, {
			x: Xcenter,
			y: nodeDim["vertical"][side]
		}, options.guidelinesStyle.verticalDistColor);


		lines.drawLine({
			x: lines.getDims(belowNode)["horizontal"]["center"],
			y: lines.getDims(belowNode)["vertical"][otherSide]
		}, {
			x: Xcenter,
			y: lines.getDims(belowNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor);


		lines.drawLine({
			x: lines.getDims(belowNode)["horizontal"]["center"],
			y: lines.getDims(belowNode)["vertical"][side]
		}, {
			x: Xcenter,
			y: lines.getDims(belowNode)["vertical"][side]
		}, options.guidelinesStyle.verticalDistColor);


		lines.drawLine({
			x: Xcenter,//lines.getDims(aboveNode)["horizontal"]["center"],
			y: lines.getDims(aboveNode)["vertical"][otherSide]
		}, {
			x: lines.getDims(aboveNode)["horizontal"]["center"],
			y: lines.getDims(aboveNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor);

		lines.drawArrow({
			x: Xcenter,
			y: nodeDim["vertical"][side]}, otherSide);

		lines.drawArrow({
			x: Xcenter,
			y: lines.getDims(belowNode)["vertical"][otherSide]}, side);

		lines.drawArrow({
			x: Xcenter,
			y: lines.getDims(belowNode)["vertical"][side]}, otherSide);

		lines.drawArrow({
			x: Xcenter,
			y: lines.getDims(aboveNode)["vertical"][otherSide]}, side);

	}
	lines.update = function (_activeNodes) {
		lines.clear();
		var activeNodes = _activeNodes.nodes();

		activeNodes.each(function (i, node) {
			if (options.geometricGuideline){
				lines.searchForLine("horizontal", node);
				lines.searchForLine("vertical", node);
			}
			if (options.distributionGuidelines){
				lines.horizontalDistribution(node);
				lines.verticalDistribution(node);

				//				lines.horizontalDistributionNext(node,"left" );
				//				lines.horizontalDistributionNext(node,"right" );

				//				lines.verticalDistributionNext(node, "below");
				//				lines.verticalDistributionNext(node, "above");
			}
		});

	};

	lines.resize = function () {
		resizeCanvas();
		lines.update();
	};




	return {
		changeOptions: changeOptions,
			lines: lines
	}

};
