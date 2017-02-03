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


	lines.init = function (activeNodes) {
		VTree = RBTree();
		HTree = RBTree();

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
				if (Math.abs(leftDim["vertical"]["center"] - nodeDim["vertical"]["center"]) < 100){
					if ((leftDim["horizontal"]["right"]) == key && 
						leftDim["horizontal"]["right"] < nodeDim["horizontal"]["left"]){

							rightNodes = HTree.get(Math.round(2*Xcenter)-key);
							if (rightNodes){
								for (right of rightNodes){
									if (Math.abs(lines.getDims(right)["vertical"]["center"] - Ycenter) < 100){
										var leftPos = lines.getDims(right)["horizontal"]["left"];
										if (Math.round(2*Xcenter)-key == lines.getDims(right)["horizontal"]["left"]){
											leftNode = left; rightNode = right;
										}
									}
								}
							}
						}
				}
			}
		}, Xcenter - 100, Xcenter);

		// Draw the lines
		if (leftNode){
			lines.drawLine({
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: Ycenter
			}, {
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: Ycenter
			}, "#ff0000");

			lines.drawLine({
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: Ycenter
			}, {
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: lines.getDims(leftNode)["vertical"]["center"]
			}, "#ff0000");

			lines.drawLine({
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: Ycenter
			}, {
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: lines.getDims(rightNode)["vertical"]["center"]
			}, "#ff0000");
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
				if (Math.abs(belowDim["horizontal"]["center"] - nodeDim["horizontal"]["center"]) < 100){
					if (belowDim["vertical"]["bottom"] == key &&
						belowDim["vertical"]["bottom"] < nodeDim["vertical"]["top"]){
							aboveNodes = VTree.get(Math.round((2*Ycenter)-key));
							if (aboveNodes){
								for (above of aboveNodes){
									if (Math.abs(lines.getDims(above)["horizontal"]["center"] - Xcenter) < 100){
										if (Math.round(2*Ycenter)-key == lines.getDims(above)["vertical"]["top"]){
											belowNode = below; aboveNode = above;
										}
									}
								}
							}
						}
				}
			}
		}, Ycenter - 100, Ycenter);


		if (belowNode){
			lines.drawLine({
				y: lines.getDims(belowNode)["vertical"]["bottom"],//renderedPosition("x"),
				x: Xcenter
			}, {
				y: lines.getDims(aboveNode)["vertical"]["top"],
				x: Xcenter
			}, "#00ff00");

			lines.drawLine({
				y: lines.getDims(belowNode)["vertical"]["bottom"],//renderedPosition("x"),
				x: Xcenter
			}, {
				y: lines.getDims(belowNode)["vertical"]["bottom"],
				x: lines.getDims(belowNode)["horizontal"]["center"]
			}, "#00ff00");

			lines.drawLine({
				y: lines.getDims(aboveNode)["vertical"]["top"],//renderedPosition("x"),
				x: Xcenter
			}, {
				y: lines.getDims(aboveNode)["vertical"]["top"],
				x: lines.getDims(aboveNode)["horizontal"]["center"]
			}, "#00ff00");
		}


	}    

	/**
	 * Find geometric alignment lines and draw them
	 * @param type: horizontal or vertical
	 * @param node: the node to be aligned
	 */
	lines.searchForLine = function (type, node) {

		// variables
		var position, target, Tree;
		var dims = lines.getDims(node)[type];
		var targetKey = Number.MAX_SAFE_INTEGER;

		// initialize Tree
		if ( type == "horizontal"){
			Tree = HTree;
		} else{
			Tree = VTree;
		}

		// check if node aligned in any dimension:
		// {center, left, right} or {center, top, bottom}
		for (var dimKey in dims) {
			position = dims[dimKey];

			// find the closest alignment in range of tolerance
			Tree.forEach(function (exKey, nodes) {

				if (exKey < targetKey) {
					target = nodes;
					targetKey = exKey;
				}

			}, position - Number(options.guidelinesTolerance), position + Number(options.guidelinesTolerance));

			// if alignment found, draw lines and break
			if (target) {
				target = target[0];
				targetKey = lines.getDims(node)[type][dimKey];

				// Draw horizontal or vertical alignment line
				if (type == "horizontal") {
					lines.drawLine({
						x: targetKey,
						y: node.renderedPosition("y")
					}, {
						x: targetKey,
						y: target.renderedPosition("y")
					}, "#000000");
				} else {
					lines.drawLine({
						x: node.renderedPosition("x"),
						y: targetKey
					}, {
						x: target.renderedPosition("x"),
						y: targetKey
					}, "#000000");
				}

				break;
			}
		}
	};

	lines.searchForDistances = function (type, node) {
		if (cy.nodes().not(excludedNodes).length < 2)
			return;

		var dims = lines.getDims(node)[type];


		var DH = [];
		var nodePos = node.position();

		var cur =  HTree.begin();
		while (cur.hasNext() && cur != HTree.end()) {
			bef = cur;
			cur = bef.next();

			var befKey = bef.key(),
				curKey = cur.key();

			var diff = Math.abs(curKey - befKey);

			if (Math.abs(diff-options.guidelinesTolerance) > 0) {
				bef.forEach(function (befNode) {
					befPos = befNode.position();
					if (Math.abs(befPos.y - nodePos.y) > options.distancelinesTolerance) // TODO: and if in viewport
					return;

				cur.forEach(function (curNode) {
					var curPos = curNode.position();
					if (Math.abs(curPos.x - nodePos.x) > options.distancelinesTolerance) // TODO: and if in viewport
					return;

				DH.push({
					from: {
						x: befKey,
					y: befPos.y
					},
					to: {
						x: curKey,
					y: curPos.y
					}
				});


				});
				});



			}

		}
	};

	lines.update = function (activeNodes) {
		lines.clear();

		activeNodes.each(function (i, node) {
			lines.searchForLine("horizontal", node);
			lines.searchForLine("vertical", node);
			lines.horizontalDistribution(node);
			lines.verticalDistribution(node);
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
