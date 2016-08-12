module.exports = function (opts, cy, $, debounce) {


    var RBTree = require("functional-red-black-tree");

    var options = opts;

    var changeOptions = function (opts) {
        options = opts;
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

        var pos = lines.renderPos(node.renderedPosition());
        var width = lines.renderDim(node.renderedWidth());
        var height = lines.renderDim(node.renderedHeight());
        var padding = {
            left: lines.renderDim(Number(node.renderedStyle("padding-left").replace("px", ""))),
            right: lines.renderDim(Number(node.renderedStyle("padding-right").replace("px", ""))),
            top: lines.renderDim(Number(node.renderedStyle("padding-top").replace("px", ""))),
            bottom: lines.renderDim(Number(node.renderedStyle("padding-bottom").replace("px", "")))
        };

        // v for vertical, h for horizontal
        return {
            horizontal: {
                center: pos.x,
                left: pos.x - (padding.left + width / 2),
                right: pos.x + (padding.right + width / 2)
            },
            vertical: {
                center: pos.y,
                top: pos.y - (padding.top + height / 2),
                bottom: pos.y + (padding.bottom + height / 2)
            }
        };

    };

    lines.calcDistance = function (p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
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
        VTree = null;
        HTree = null;
        lines.clear();
    };

    lines.clear = clearDrawing;

    lines.renderDim = function (val) {
        return val;// * cy.zoom();
    };
    lines.renderPos = function (pos) {
        return pos;/*var pan = cy.pan();
        return {
            x: lines.renderDim(pos.x) + pan.x,
            y: lines.renderDim(pos.y) + pan.y
        };*/
    };

    lines.drawLine = function (from, to) {
        from = lines.renderPos(from);
        to = lines.renderPos(to);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    };

    var locked = { horizontal: false, vertical: false };
    lines.searchForLine = function (type, node) {
        var dims = lines.getDims(node)[type];
        var target;
        var minDist = Number.MAX_SAFE_INTEGER;
        var targetKey;
        for (var dimKey in dims) {
            var key = dims[dimKey];
            (type == "horizontal" ? HTree : VTree).forEach(function (exKey, nodes) {
                nodes.forEach(function (targetNode) {
                    var dist = lines.calcDistance(node.renderedPosition(), targetNode.renderedPosition());
                    if (dist < minDist) { // TODO: AND node is in viewport AND if does not overlap with node
                        target = targetNode;
                        minDist = dist;
                        targetKey = exKey;
                    }

                });
            }, key - options.guidelinesTolerance, key + options.guidelinesTolerance);
        }
        if (target) {
            if (type == "horizontal") {
                lines.drawLine({
                    x: targetKey,
                    y: node.renderedPosition("y")
                }, {
                    x: targetKey,
                    y: target.renderedPosition("y")
                });/*
                if (!locked.horizontal){
                    node.position("x", targetKey + (node.renderedPosition("x") < targetKey ? -1 : 1) * node.renderedWidth()/2);
                    locked.horizontal = true;
                    var onTapDrag;
                    cy.on("tapdrag", onTapDrag = function (e) {
                        var ePos = e.cyRenderedPosition;
                        if (Math.abs(ePos.x - targetKey) <= options.guidelinesTolerance) {
                            node.renderedPosition("x", targetKey + (node.renderedPosition("x") < targetKey ? -1 : 1) * node.renderedWidth()/2);
                        }else {
                            locked.horizontal = false;
                            node.renderedPosition("x", ePos.x);
                            cy.off("tapdrag", onTapDrag);
                        }
                    });
                }*/
            } else {
                lines.drawLine({
                    x: node.renderedPosition("x"),
                    y: targetKey
                }, {
                    x: target.renderedPosition("x"),
                    y: targetKey
                });
            }
        }
    };

    lines.searchForDistances = function (type, node) {
        if (cy.nodes().not(excludedNodes).length < 2)
            return;

        var dims = lines.getDims(node)[type];

        var lastNode;
        var lastDistance;
        var cur = HTree.le(dims.left);


        while (cur) {
            var curNode = cur.value();
            if (Math.abs(curNode.position("x") - node.position("x")) > options.distanceLinesTolerance) {
                cur = cur.prev();
                continue;
            }

            if (!curNode.is(node) && Math.abs(curNode.position("x") - node.position("x")) <= options.guidelinesTolerance) { // todo: maybe new option

            }


            lastNode = curNode;
            cur = cur.prev();
        }




    };

    lines.update = function (activeNodes) {
        lines.clear();

        activeNodes.each(function (i, node) {
            lines.searchForLine("horizontal", node);
            lines.searchForLine("vertical", node);
            lines.searchForDistances("horizontal", node);
            lines.searchForDistances("vertical", node);
        });

    };

    lines.resize = function () {
        resizeCanvas();
        this.update();
    };

    var applyToActiveNodes = function (f) {
        return function (e) {
            var nodes = e.cyTarget.selected() ? e.cy.$(":selected") : e.cyTarget;
            f(nodes);
        };
    };
    cy.on("grab", applyToActiveNodes(lines.init));

    cy.on("drag", applyToActiveNodes(lines.update));

    cy.on("free", lines.destroy);


    return {
        changeOptions: changeOptions
    }

};