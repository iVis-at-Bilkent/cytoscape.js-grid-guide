(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function (cy, snap) {

    var attachedNode;

    function tapDrag(e) {
        var nodePos = attachedNode.position();
        var mousePos = snap.snapPos(e.cyPosition);
        if (nodePos.x != mousePos.x || nodePos.y != mousePos.y){
            attachedNode.unlock();
            snap.snapNode(attachedNode, mousePos);
            attachedNode.lock();
            attachedNode.trigger("drag");
        }
    }

    function tapStartNode(e){
        attachedNode = e.cyTarget;
        attachedNode.lock();
        attachedNode.trigger("grab");
        cy.on("tapdrag", tapDrag);
        cy.on("tapend", tapEnd);
    }

    function tapEnd(e){
        attachedNode.unlock();
        attachedNode.trigger("free");
        cy.off("tapdrag", tapDrag);
        cy.off("tapend", tapEnd);
    }

    return {
        tapStartNode: tapStartNode
    };
    

};
},{}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
module.exports = function ( cy, snap, resize, discreteDrag, drawGrid, guidelines, $) {

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
        guidelines: new feature(setGuidelines)
    };

    
    function applyToCyTarget(func) {
        return function (e) {
            if(!e.cyTarget.is(":parent"))
                func(e.cyTarget);
        }
    }
    
    function applyToAllNodes(func) {
        return function () {
            cy.nodes().not(":parent").each(function (i, ele) {
                func(ele);
            });
        };
    }
    function eventStatus(enable) {
        return enable ? "on" : "off";
    }


    // Discrete Drag
    function setDiscreteDrag(enable) {
        cy[eventStatus(enable)]("tapstart", "node", discreteDrag.tapStartNode);
    }

    // Resize
    var resizeAllNodes = applyToAllNodes(resize.resizeNode);
    var resizeNode = applyToCyTarget(resize.resizeNode);
    var recoverAllNodeDimensions = applyToAllNodes(resize.recoverNodeDimensions);

    function setResize(enable) {
        cy[eventStatus(enable)]("ready", resizeAllNodes);
        cy[eventStatus(enable)]("style", "node", resizeNode);
        enable ? resizeAllNodes() : recoverAllNodeDimensions();
    }

    // Snap To Grid
    var snapAllNodes= applyToAllNodes(snap.snapNode);
    var snapNode = applyToCyTarget(snap.snapNode);

    function setSnapToGrid(enable) {
        cy[eventStatus(enable)]("add", "node", snapNode);
        cy[eventStatus(enable)]("ready", snapAllNodes);

        cy[eventStatus(enable)]("free", "node", snapNode); // TODO: If discrete drag is disabled

        if (enable) {
            snapAllNodes();
        } else {

        }
    }
    
    // Draw Grid
    var drawGridOnZoom = function () { if( latestOptions.zoomDash ) drawGrid.drawGrid() };
    var drawGridOnPan = function () { if( latestOptions.panGrid ) drawGrid.drawGrid() };

    function setDrawGrid(enable) {

        cy[eventStatus(enable)]( 'zoom', drawGridOnZoom );
        cy[eventStatus(enable)]( 'pan', drawGridOnPan );

        if (enable){
            drawGrid.changeOptions(currentOptions);
            drawGrid.initCanvas();
            $( window ).on( 'resize', drawGrid.resizeCanvas );
        } else {
            drawGrid.clearCanvas();
            $( window ).off( 'resize', drawGrid.resizeCanvas );
        }
    }

    // Guidelines

    function setGuidelines(enable) {
        if (enable)
            guidelines.changeOptions(currentOptions);

        cy[eventStatus(enable)]( 'zoom', guidelines.onZoom);
        cy[eventStatus(enable)]( 'drag', "node", guidelines.onDragNode);
        cy[eventStatus(enable)]( 'grab', "node", guidelines.onGrabNode);
        cy[eventStatus(enable)]( 'free', "node", guidelines.onFreeNode);


    }

    // Sync with options: Enables/disables changed via options.
    var latestOptions = {};
    var currentOptions;
    function syncWithOptions(options) {
        currentOptions = options;
        for (var key in controller)
            if (latestOptions[key] != options[key])
                controller[key](options[key]);
        latestOptions = options;
    }

    function init(options) {
        currentOptions = options;
        syncWithOptions(options);
        latestOptions = options;
    }
    
    return {
        init: init,
        syncWithOptions: syncWithOptions
    };

};
},{}],4:[function(require,module,exports){
module.exports = function (opts, cy, $) {

    var options = opts;

    var changeOptions = function (opts) {
        options = opts;
    };

    function calcDistance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    var dims = function (node) {

        var pos = node.renderedPosition();
        var width = node.renderedWidth();
        var height = node.renderedHeight();
        this.horizontal = {
            center: pos.x,
            left: pos.x - width / 2,
            right: pos.x + width / 2
        };

        this.vertical = {
            center: pos.y,
            top: pos.y - height / 2,
            bot: pos.y + height / 2
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

            cy.nodes(":visible").not(":parent").not(node).each(function (i, ele) {
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
},{}],5:[function(require,module,exports){
;(function(){ 'use strict';

    // registers the extension on a cytoscape lib ref
    var register = function( cytoscape ){

        if( !cytoscape ){ return; } // can't register if cytoscape unspecified


        var options = {
            snapToGrid: true,
            discreteDrag: true,
            resize: true,
            guidelines: true,
            drawGrid: true,
            parentPadding: true,
            
            zoomDash: true,
            panGrid: true,
            gridSpacing: 40,
            gridStackOrder: -1,
            strokeStyle: '#CCCCCC',
            lineWidth: 1.0,
            lineDash: [5,8],
            guidelinesStackOrder: 4,
            guidelinesTolerance: 0.08
        };

        var _snap = require("./snap");
        var _discreteDrag = require("./discrete_drag");
        var _drawGrid = require("./draw_grid");
        var _resize = require("./resize");
        var _eventsController = require("./events_controller");
        var _guidelines = require("./guidelines");
        var _parentSnap = require("./parentage");
        var snap, resize, discreteDrag, drawGrid, eventsController, guidelines, parentSnap;

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
                parentSnap = _parentSnap(options, cy);

                eventsController = _eventsController(cy, snap, resize, discreteDrag, drawGrid, guidelines, $);


                eventsController.init(options);
            } else
                eventsController.syncWithOptions(options)


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

},{"./discrete_drag":1,"./draw_grid":2,"./events_controller":3,"./guidelines":4,"./parentage":6,"./resize":7,"./snap":8}],6:[function(require,module,exports){
module.exports = function (options, cy) {

    cy.style()
        .selector(':parent')
        .style('width', 1231)
        .update();
};
},{}],7:[function(require,module,exports){
module.exports = function (gridSpacing) {


    var getScratch = function (node) {
        if (!node.scratch("_snapToGrid"))
            node.scratch("_snapToGrid", {});

        return node.scratch("_snapToGrid");
    };

    function resizeNode(node) {
        var width = node.width();
        var height = node.height();

        var newWidth = Math.round((width-gridSpacing) / (gridSpacing * 2)) * (gridSpacing * 2);
        var newHeight = Math.round((height-gridSpacing) / (gridSpacing * 2)) * (gridSpacing * 2);

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
        var oldSizes = getScratch(node);
        if (oldSizes.resize)
            node.style({
                "width": oldWidth,
                "height": oldHeight
            });

    }



    return {
        resizeNode: resizeNode,
        recoverNodeDimensions: recoverNodeDimensions
    };

};
},{}],8:[function(require,module,exports){
module.exports = function (gridSpacing) {


    var snapPos = function (pos) {
        var newPos = {
            x: (Math.floor(pos.x / gridSpacing) + 0.5) * gridSpacing,
            y: (Math.floor(pos.y / gridSpacing) + 0.5) * gridSpacing
        };

        return newPos;
    };

    var snapNode = function (node, toPos) {
        var pos = node.position();

        if (!toPos)
            var newPos = snapPos(pos);
        else
            newPos = snapPos(toPos);

        return node.position(newPos);

    };

    return {
        snapPos: snapPos,
        snapNode: snapNode
    };

};
},{}]},{},[5]);
