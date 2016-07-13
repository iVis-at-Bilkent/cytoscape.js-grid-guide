(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function (cytoscape) {
    
    // Needed because parent nodes cannot be moved!
    function moveTopDown(children, dx, dy) {
        for(var i = 0; i < children.length; i++){
            var child = children[i];
            child.position({
                x: child.position('x') + dx,
                y: child.position('y') + dy
            });

            moveTopDown(child.children(), dx, dy);
        }
    }

    function getTopMostNodes(nodes) {
        var nodesMap = {};
        for (var i = 0; i < nodes.length; i++) {
            nodesMap[nodes[i].id()] = true;
        }
        var roots = nodes.filter(function (i, ele) {
            var parent = ele.parent()[0];
            while(parent != null){
                if(nodesMap[parent.id()]){
                    return false;
                }
                parent = parent.parent()[0];
            }
            return true;
        });

        return roots;
    }


    cytoscape( "collection", "align", function (horizontal, vertical, alignTo) {

        var eles = getTopMostNodes(this.nodes(":visible"));

        var modelNode = alignTo ? alignTo : eles[0];

        eles = eles.not(modelNode);

        // 0 for center
        var xFactor = 0;
        var yFactor = 0;

        if (vertical == "left")
            xFactor = -1;
        else if (vertical == "right")
            xFactor = 1;

        if (horizontal == "top")
            yFactor = -1;
        else if (horizontal == "bottom")
            yFactor = 1;


        for (var i = 0; i < eles.length; i++) {
            var node = eles[i];
            var oldPos = node.position();
            var newPos = node.position();

            if (vertical != "none")
                newPos.x = modelNode.position("x") + xFactor * (modelNode.width() - node.width()) / 2;


            if (horizontal != "none")
                newPos.y = modelNode.position("y") + yFactor * (modelNode.height() - node.height()) / 2;


            moveTopDown(node, newPos.x - oldPos.x, newPos.y - oldPos.y);
        }


    });



};
},{}],2:[function(require,module,exports){
module.exports = function (cy, snap) {

    var discreteDrag = {};

    var attachedNode;
    var draggedNodes;

    var startPos;
    var endPos;


    discreteDrag.onTapStartNode = function (e) {
        if (e.cyTarget.selected())
            draggedNodes = e.cy.$(":selected");
        else
            draggedNodes = e.cyTarget;

        startPos = e.cyPosition;

        attachedNode = e.cyTarget;
        attachedNode.lock();
        attachedNode.trigger("grab");
        cy.on("tapdrag", onTapDrag);
        cy.on("tapend", onTapEndNode);

    };

    var onTapEndNode = function (e) {
        //attachedNode.trigger("free");
        cy.off("tapdrag", onTapDrag);
        cy.off("tapend", onTapEndNode);
        attachedNode.unlock();
        e.preventDefault();
    };

    var getDist = function () {
        return {
            x: endPos.x - startPos.x,
            y: endPos.y - startPos.y
        }
    };

    function getTopMostNodes(nodes) {
        var nodesMap = {};

        for (var i = 0; i < nodes.length; i++) {
            nodesMap[nodes[i].id()] = true;
        }

        var roots = nodes.filter(function (i, ele) {
            var parent = ele.parent()[0];
            while (parent != null) {
                if (nodesMap[parent.id()]) {
                    return false;
                }
                parent = parent.parent()[0];
            }
            return true;
        });

        return roots;
    }

    var moveNodesTopDown = function (nodes, dx, dy) {

/*
        console.log(nodes.map(function (e) {
            return e.id();
        }));
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var pos = node.position();

            if (!node.isParent()) {
                node.position({
                    x: pos.x + dx,
                    y: pos.y + dy
                });
                console.log(node.id() + " " + dx + " " + dy);
            }

            moveNodesTopDown(nodes.children(), dx, dy);
        }
*/
    };

    var onTapDrag = function (e) {

        var nodePos = attachedNode.position();
        endPos = e.cyPosition;
        endPos = snap.snapPos(endPos);
        var dist = getDist();
        if (dist.x != 0 || dist.y != 0) {
            attachedNode.unlock();
            //var topMostNodes = getTopMostNodes(draggedNodes);
            var nodes = draggedNodes.union(draggedNodes.descendants());

            nodes.positions(function (i, node) {
                var pos = node.position();
                return snap.snapPos({
                    x: pos.x + dist.x,
                    y: pos.y + dist.y
                });
            });

            startPos = endPos;
            attachedNode.lock();
            attachedNode.trigger("drag");
        }

    };

    return discreteDrag;


};
},{}],3:[function(require,module,exports){
module.exports = function (opts, cy, $) {

    var options = opts;

    var changeOptions = function (opts) {
      options = opts;
    };

    var drawGrid = function() {
        clearDrawing();

        var zoom = cy.zoom();
        var canvasWidth = $container.width();
        var canvasHeight = $container.height();
        var increment = options.gridSpacing*zoom;
        var pan = cy.pan();
        var initialValueX = pan.x%increment;
        var initialValueY = pan.y%increment;

        ctx.strokeStyle = options.strokeStyle;
        ctx.lineWidth = options.lineWidth;

        if(options.zoomDash) {
            var zoomedDash = options.lineDash.slice();

            for(var i = 0; i < zoomedDash.length; i++) {
                zoomedDash[ i ] = options.lineDash[ i ]*zoom;
            }
            ctx.setLineDash( zoomedDash );
        } else {
            ctx.setLineDash( options.lineDash );
        }

        if(options.panGrid) {
            ctx.lineDashOffset = -pan.y;
        } else {
            ctx.lineDashOffset = 0;
        }

        for(var i = initialValueX; i < canvasWidth; i += increment) {
            ctx.beginPath();
            ctx.moveTo( i, 0 );
            ctx.lineTo( i, canvasHeight );
            ctx.stroke();
        }

        if(options.panGrid) {
            ctx.lineDashOffset = -pan.x;
        } else {
            ctx.lineDashOffset = 0;
        }

        for(var i = initialValueY; i < canvasHeight; i += increment) {
            ctx.beginPath();
            ctx.moveTo( 0, i );
            ctx.lineTo( canvasWidth, i );
            ctx.stroke();
        }
    };
    var clearDrawing = function() {
        var width = $container.width();
        var height = $container.height();

        ctx.clearRect( 0, 0, width, height );
    };

    var resizeCanvas = function() {
        $canvas
            .attr( 'height', $container.height() )
            .attr( 'width', $container.width() )
            .css( {
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'z-index': options.gridStackOrder
            } );

        setTimeout( function() {
            var canvasBb = $canvas.offset();
            var containerBb = $container.offset();

            $canvas
                .attr( 'height', $container.height() )
                .attr( 'width', $container.width() )
                .css( {
                    'top': -( canvasBb.top - containerBb.top ),
                    'left': -( canvasBb.left - containerBb.left )
                } );
            drawGrid();
        }, 0 );
    };
    
    var $canvas = $( '<canvas></canvas>' );
    var $container = $( cy.container() );
    var ctx = $canvas[ 0 ].getContext( '2d' );
    $container.append( $canvas );



    return {
        initCanvas: resizeCanvas,
        resizeCanvas: resizeCanvas,
        clearCanvas: clearDrawing,
        drawGrid: drawGrid,
        changeOptions: changeOptions
    };
};
},{}],4:[function(require,module,exports){
module.exports = function (cy, snap, resize, discreteDrag, drawGrid, guidelines, parentPadding, $) {

    var feature = function (func) {
        return function (enable) {
            func(enable);
        };
    };

    var controller = {
        discreteDrag: new feature(setDiscreteDrag),
        resize: new feature(setResize),
        snapToGrid: new feature(setSnapToGrid),
        drawGrid: new feature(setDrawGrid),
        guidelines: new feature(setGuidelines),
        parentPadding: new feature(setParentPadding)
    };

    function applyToCyTarget(func, allowParent) {
        return function (e) {
            if (!e.cyTarget.is(":parent") || allowParent)
                func(e.cyTarget);
        }
    }

    function applyToActiveNodes(func, allowParent) {
        return function (e) {
            if (!e.cyTarget.is(":parent") || allowParent)
                if (e.cyTarget.selected())
                    func(e.cyTarget, e.cy.$(":selected"));
                else
                    func(e.cyTarget, e.cyTarget);
        }
    }

    function applyToAllNodesButNoParent(func) {
        return function () {
            cy.nodes().not(":parent").each(function (i, ele) {
                func(ele);
            });
        };
    }
    function applyToAllNodes(func) {
        return function () {
            cy.nodes().each(function (i, ele) {
                func(ele);
            });
        };
    }

    function eventStatus(enable) {
        return enable ? "on" : "off";
    }


    // Discrete Drag
    function setDiscreteDrag(enable) {
        cy[eventStatus(enable)]("tapstart", "node", discreteDrag.onTapStartNode);
    }

    // Resize
    var resizeAllNodes = applyToAllNodesButNoParent(resize.resizeNode);
    var resizeNode = applyToCyTarget(resize.resizeNode);
    var recoverAllNodeDimensions = applyToAllNodesButNoParent(resize.recoverNodeDimensions);

    function setResize(enable) {
        cy[eventStatus(enable)]("ready", resizeAllNodes);
      //  cy[eventStatus(enable)]("style", "node", resizeNode);
        enable ? resizeAllNodes() : recoverAllNodeDimensions();
    }

    // Snap To Grid
    var snapAllNodes = applyToAllNodes(snap.snapNodesTopDown);
    var recoverSnapAllNodes = applyToAllNodes(snap.recoverSnapNode);
    var snapCyTarget = applyToCyTarget(snap.snapNode, true);

    function setSnapToGrid(enable) {
        cy[eventStatus(enable)]("add", "node", snapCyTarget);
        cy[eventStatus(enable)]("ready", snapAllNodes);

        cy[eventStatus(enable)]("free", "node", snap.onFreeNode);

        if (enable) {
            snapAllNodes();
        } else {
            recoverSnapAllNodes();
        }
    }

    // Draw Grid
    var drawGridOnZoom = function () {
        if (currentOptions.zoomDash) drawGrid.drawGrid()
    };
    var drawGridOnPan = function () {
        if (currentOptions.panGrid) drawGrid.drawGrid()
    };

    function setDrawGrid(enable) {
        cy[eventStatus(enable)]('zoom', drawGridOnZoom);
        cy[eventStatus(enable)]('pan', drawGridOnPan);
        cy[eventStatus(enable)]('ready', drawGrid.resizeCanvas);

        if (enable) {
            drawGrid.initCanvas();
            $(window).on('resize', drawGrid.resizeCanvas);
        } else {
            drawGrid.clearCanvas();
            $(window).off('resize', drawGrid.resizeCanvas);
        }
    }

    // Guidelines

    function setGuidelines(enable) {
        cy[eventStatus(enable)]('zoom', guidelines.onZoom);
        cy[eventStatus(enable)]('drag', "node", guidelines.onDragNode);
        cy[eventStatus(enable)]('grab', "node", guidelines.onGrabNode);
        cy[eventStatus(enable)]('free', "node", guidelines.onFreeNode);

    }

    // Parent Padding
    var setAllParentPaddings = function (enable) {
        parentPadding.setPaddingOfParent(cy.nodes(":parent"), enable);
    };
    var enableParentPadding = function (node) {
        parentPadding.setPaddingOfParent(node, true);
    };


    function setParentPadding(enable) {

        setAllParentPaddings(enable);

        cy[eventStatus(enable)]('ready', setAllParentPaddings);
        cy[eventStatus(enable)]("add", "node:parent", applyToCyTarget(enableParentPadding, true));
    }

    // Sync with options: Enables/disables changed via options.
    var latestOptions = {};
    var currentOptions;

    var specialOpts = {
        drawGrid: ["gridSpacing", "zoomDash", "panGrid", "gridStackOrder", "strokeStyle", "lineWidth", "lineDash"],
        guidelines: ["gridSpacing", "guidelinesStackOrder", "guidelinesTolerance", "guidelinesStyle"],
        resize: ["gridSpacing"],
        parentPadding: ["gridSpacing", "parentSpacing"],
        snapToGrid: ["gridSpacing"]
    };

    function syncWithOptions(options) {
        currentOptions = $.extend(true, {}, options);
        for (var key in options)
            if (latestOptions[key] != options[key])
                if (controller.hasOwnProperty(key)) {
                    controller[key](options[key]);
                } else {
                    for (var optsKey in specialOpts) {
                        var opts = specialOpts[optsKey];
                        if (opts.indexOf(key) >= 0) {
                            if(optsKey == "drawGrid") {
                                drawGrid.changeOptions(options);
                                if (options.drawGrid)
                                    drawGrid.resizeCanvas();
                            }

                            if (optsKey == "snapToGrid"){
                                snap.changeOptions(options);
                                if (options.snapToGrid)
                                    snapAllNodes();
                            }

                            if(optsKey == "guidelines")
                                guidelines.changeOptions(options);

                            if (optsKey == "resize") {
                                resize.changeOptions(options);
                                if (options.resize)
                                    resizeAllNodes();
                            }

                            if (optsKey == "parentPadding")
                                parentPadding.changeOptions(options);

                                
                        }
                    }
                }
        latestOptions = $.extend(true, latestOptions, options);
    }

    return {
        init: syncWithOptions,
        syncWithOptions: syncWithOptions
    };

};
},{}],5:[function(require,module,exports){
module.exports = function (opts, cy, $) {

    var options = opts;

    var changeOptions = function (opts) {
        options = opts;
    };

    function calcDistance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }
    
    function getExtraDim(node, paddingDim) {

    }

    var dims = function (node) {

        var pos = node.renderedPosition();
        var width = node.renderedWidth();
        var height = node.renderedHeight();
        var padding = {
            left: Number(node.renderedStyle("padding-left").replace("px", "")),
            right: Number(node.renderedStyle("padding-right").replace("px", "")),
            top: Number(node.renderedStyle("padding-top").replace("px", "")),
            bottom: Number(node.renderedStyle("padding-bottom").replace("px", ""))
        };

        this.horizontal = {
            center: pos.x,
            left: pos.x - (padding.left + width / 2),
            right: pos.x + (padding.right + width / 2)
        };

        this.vertical = {
            center: pos.y,
            top: pos.y - (padding.top + height / 2),
            bottom: pos.y + (padding.bottom + height / 2)
        };

        return this;
    };

    var $canvas = $('<canvas></canvas>');
    var $container = $(cy.container());
    var ctx = $canvas[0].getContext('2d');
    $container.append($canvas);

    $canvas
        .attr('height', $container.height())
        .attr('width', $container.width())
        .css({
            'position': 'absolute',
            'top': 0,
            'left': 0,
            'z-index': options.guidelinesStackOrder
        });

    var canvasBb = $canvas.offset();
    var containerBb = $container.offset();

    $canvas
        .attr( 'height', $container.height() )
        .attr( 'width', $container.width() )
        .css( {
            'top': -( canvasBb.top - containerBb.top ),
            'left': -( canvasBb.left - containerBb.left )
        } );
    var clearDrawing = function () {
        var width = $container.width();
        var height = $container.height();

        ctx.clearRect(0, 0, width, height);
    };


    var pickedNode;

    function onGrabNode(e) {
        pickedNode = e.cyTarget;
        onDragNode(e);
    }

    function onDragNode(e) {
        if (pickedNode) {
            var node = pickedNode;

            var mainDims = new dims(node);

            var cy = e.cy;
            var nearests = {
                horizontal: {
                    distance: Number.MAX_VALUE
                },
                vertical: {
                    distance: Number.MAX_VALUE
                }
            };

            cy.nodes(":visible").not(node.ancestors()).not(node.descendants()).not(node).each(function (i, ele) {
                var nodeDims = new dims(ele);


                for (var dim in mainDims) {
                    var mainDim = mainDims[dim];
                    var nodeDim = nodeDims[dim];
                    var otherDim = dim == "horizontal" ? "y" : "x";
                    var eitherDim = otherDim == "x" ? "y" : "x";
                    for (var key in mainDim) {
                        for (var key2 in nodeDim) {
                            if (Math.abs(mainDim[key] - nodeDim[key2]) < options.guidelinesTolerance) {
                                var distance = calcDistance(node.renderedPosition(), ele.renderedPosition());
                                if (nearests[dim].distance > distance) {

                                    nearests[dim] = {
                                        to: ele.id(),
                                        toPos: {},
                                        from: node.id(),
                                        fromPos: {},
                                        distance: distance
                                    };
                                    nearests[dim].fromPos[eitherDim] = mainDim[key];
                                    nearests[dim].fromPos[otherDim] = node.renderedPosition(otherDim);
                                    nearests[dim].toPos[eitherDim] = nodeDim[key2];
                                    nearests[dim].toPos[otherDim] = ele.renderedPosition(otherDim);
                                }
                            }
                            // console.log(key + " of " + node.id() + " -> " + key2 + " of " + ele.id())
                        }
                    }
                }
            });

            clearDrawing();
            for (var key in nearests) {
                var item = nearests[key];
                if (item.from) {
                    ctx.beginPath();
                    ctx.moveTo(item.fromPos.x, item.fromPos.y);
                    ctx.lineTo(item.toPos.x, item.toPos.y);

                    for (var styleKey in options.guidelinesStyle)
                        ctx[styleKey] = options.guidelinesStyle[styleKey];

                    ctx.stroke();
                }
            }

        }
    }

    function onFreeNode() {
        pickedNode = undefined;
        clearDrawing();
    }

    return {
        onDragNode: onDragNode,
        onZoom: onDragNode,
        onGrabNode: onGrabNode,
        onFreeNode: onFreeNode,
        changeOptions: changeOptions
    }

};
},{}],6:[function(require,module,exports){
;(function(){ 'use strict';

    // registers the extension on a cytoscape lib ref
    var register = function( cytoscape ){

        if( !cytoscape ){ return; } // can't register if cytoscape unspecified


        var options = {
            // On/Off Modules
            snapToGrid: true, // Snap to grid functionality
            discreteDrag: true, // Discrete Drag
            guidelines: true, // Guidelines on dragging nodes
            resize: true, // Adjust node sizes to cell sizes
            parentPadding: true, // Adjust parent sizes to cell sizes by padding
            drawGrid: true, // Draw grid background

            // Other settings

            // General
            gridSpacing: 40, // Distance between the lines of the grid.

            // Draw Grid
            zoomDash: true, // Determines whether the size of the dashes should change when the drawing is zoomed in and out if grid is drawn.
            panGrid: true, // Determines whether the grid should move then the user moves the graph if grid is drawn.
            gridStackOrder: -1, // Namely z-index
            strokeStyle: '#CCCCCC', // Color of grid lines
            lineWidth: 1.0, // Width of grid lines
            lineDash: [5,8], // Defines style of dash. Read: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash

            // Guidelines
            guidelinesStackOrder: 4, // z-index of guidelines
            guidelinesTolerance: 2.00, // Tolerance distance for rendered positions of nodes' interaction.
            guidelinesStyle: { // Set ctx properties of line. Properties are here:
                strokeStyle: "black"
            },

            // Parent Padding
            parentSpacing: -1 // -1 to set paddings of parents to gridSpacing
        };

        var _snap = require("./snap");
        var _discreteDrag = require("./discrete_drag");
        var _drawGrid = require("./draw_grid");
        var _resize = require("./resize");
        var _eventsController = require("./events_controller");
        var _guidelines = require("./guidelines");
        var _parentPadding = require("./parentPadding");
        var _alignment = require("./alignment");
        var snap, resize, discreteDrag, drawGrid, eventsController, guidelines, parentPadding, alignment;

        var initialized = false;

        cytoscape( 'core', 'snapToGrid', function(opts){
            var cy = this;
            $.extend(true, options, opts);

            if (!initialized) {
                snap = _snap(options.gridSpacing);
                resize = _resize(options.gridSpacing);
                discreteDrag = _discreteDrag(cy, snap);
                drawGrid = _drawGrid(options, cy, $);
                guidelines = _guidelines(options, cy, $);
                parentPadding = _parentPadding(options, cy);

                eventsController = _eventsController(cy, snap, resize, discreteDrag, drawGrid, guidelines, parentPadding, $);

                alignment = _alignment(cytoscape);

                eventsController.init(options);
                initialized = true;
            } else
                eventsController.syncWithOptions(options);


            return this; // chainability
        } ) ;


    };

    if( typeof module !== 'undefined' && module.exports ){ // expose as a commonjs module
        module.exports = register;
    }

    if( typeof define !== 'undefined' && define.amd ){ // expose as an amd/requirejs module
        define('cytoscape-snap-to-grid', function(){
            return register;
        });
    }

    if( typeof cytoscape !== 'undefined' ){ // expose to global cytoscape (i.e. window.cytoscape)
        register( cytoscape );
    }

})();

},{"./alignment":1,"./discrete_drag":2,"./draw_grid":3,"./events_controller":4,"./guidelines":5,"./parentPadding":7,"./resize":8,"./snap":9}],7:[function(require,module,exports){
module.exports = function (opts, cy) {

    var options = opts;
    var ppClass = "_gridParentPadding";

    function initPadding() {
        var padding = options.parentSpacing < 0 ? options.gridSpacing : options.parentSpacing;
        cy.style()
            .selector('.' + ppClass)
            .style("compound-sizing-wrt-labels", "exclude")
            .style("padding-left", padding)
            .style("padding-right", padding)
            .style("padding-top", padding)
            .style("padding-bottom", padding)
            .update();

    }

    function changeOptions(opts) {
        options = opts;
        padding = options.parentSpacing < 0 ? options.gridSpacing : options.parentSpacing;
        initPadding();
    }

    function setPaddingOfParent(node, enable) {
        if (enable)
            node.addClass(ppClass);
        else
            node.removeClass(ppClass);
    }

    return {
        changeOptions: changeOptions,
        setPaddingOfParent: setPaddingOfParent
    };
};
},{}],8:[function(require,module,exports){
module.exports = function (gridSpacing) {


    var changeOptions = function (opts) {
        gridSpacing = Number(opts.gridSpacing);
    };

    var getScratch = function (node) {
        if (!node.scratch("_snapToGrid"))
            node.scratch("_snapToGrid", {});

        return node.scratch("_snapToGrid");
    };

    function resizeNode(node) {
        var width = node.width();
        var height = node.height();

        var newWidth = Math.round((width - gridSpacing) / (gridSpacing * 2)) * (gridSpacing * 2);
        var newHeight = Math.round((height - gridSpacing) / (gridSpacing * 2)) * (gridSpacing * 2);
        newWidth = newWidth > 0 ? newWidth + gridSpacing : gridSpacing;
        newHeight = newHeight > 0 ? newHeight + gridSpacing : gridSpacing;

        if (width != newWidth || height != newHeight) {
            node.style({
                "width": newWidth,
                "height": newHeight
            });
            getScratch(node).resize = {
                oldWidth: width,
                oldHeight: height
            };
        }
    }

    function recoverNodeDimensions(node) {
        var oldSizes = getScratch(node).resize;
        if (oldSizes) 
            node.style({
                "width": oldSizes.oldWidth,
                "height": oldSizes.oldHeight
            });


    }


    return {
        resizeNode: resizeNode,
        recoverNodeDimensions: recoverNodeDimensions,
        changeOptions: changeOptions
    };

};
},{}],9:[function(require,module,exports){
module.exports = function (gridSpacing) {

    var snap = { };

    snap.changeOptions = function (opts) {
        gridSpacing = opts.gridSpacing;
    };

    var getScratch = function (node) {
        if (!node.scratch("_snapToGrid"))
            node.scratch("_snapToGrid", {});

        return node.scratch("_snapToGrid");
    };


    function getTopMostNodes(nodes) {
        var nodesMap = {};

        for (var i = 0; i < nodes.length; i++) {
            nodesMap[nodes[i].id()] = true;
        }

        var roots = nodes.filter(function (i, ele) {
            var parent = ele.parent()[0];
            while(parent != null){
                if(nodesMap[parent.id()]){
                    return false;
                }
                parent = parent.parent()[0];
            }
            return true;
        });

        return roots;
    }

    snap.snapPos = function (pos) {
        var newPos = {
            x: (Math.floor(pos.x / gridSpacing) + 0.5) * gridSpacing,
            y: (Math.floor(pos.y / gridSpacing) + 0.5) * gridSpacing
        };

        return newPos;
    };

    snap.snapNode = function (node) {

        var pos = node.position();
        var newPos = snap.snapPos(pos);

        node.position(newPos);
    };

    function snapTopDown(nodes) {

        nodes.union(nodes.descendants()).positions(function (i, node) {
            var pos = node.position();
            return snap.snapPos(pos);
        });
        /*
        for (var i = 0; i < nodes.length; i++) {

            if (!nodes[i].isParent())
                snap.snapNode(nodes[i]);

            snapTopDown(nodes.children());
        }*/

    }

    snap.snapNodesTopDown = function (nodes) {
        // getTOpMostNodes -> nodes
        cy.startBatch();
        nodes.union(nodes.descendants()).positions(function (i, node) {
            var pos = node.position();
            return snap.snapPos(pos);
        });
        cy.endBatch();
    };

    snap.onFreeNode = function (e) {
        var nodes;
        if (e.cyTarget.selected())
            nodes = e.cy.$(":selected");
        else
            nodes = e.cyTarget;

        snap.snapNodesTopDown(nodes);

    };


    snap.recoverSnapNode = function (node) {
        var snapScratch = getScratch(node).snap;
        if (snapScratch) {
            node.position(snapScratch.oldPos);
        }
    };

    return snap;





};
},{}]},{},[6]);
