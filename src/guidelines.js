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
                    });
                } else {
                    lines.drawLine({
                        x: node.renderedPosition("x"),
                        y: targetKey
                    }, {
                        x: target.renderedPosition("x"),
                        y: targetKey
                    });
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
            //lines.searchForDistances("horizontal", node);
            //lines.searchForDistances("vertical", node);
        });

    };

    lines.resize = function () {
        resizeCanvas();
        this.update();
    };




    return {
        changeOptions: changeOptions,
        lines: lines
    }

};
