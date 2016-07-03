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
                'z-index': options.stackOrder
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
module.exports = function ( cy, snap, resize, discreteDrag, drawGrid, $) {

    var feature = function (func) {
        return function (enable) {
            func(enable);
        };
    };

    var controller = {
        discreteDrag: new feature(setDiscreteDrag),
        resize: new feature(setResize),
        snapToGrid: new feature(setSnapToGrid),
        drawGrid: new feature(setDrawGrid)
    };

    
    function applyToCyTarget(func) {
        return function (e) {
            func(e.cyTarget);
        }
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
    var drawGridOnZoom = function () { console.log("zoom"); if( latestOptions.zoomDash ) drawGrid.drawGrid() };
    var drawGridOnPan = function () { console.log("pan"); if( latestOptions.panGrid ) drawGrid.drawGrid() };

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
;(function(){ 'use strict';

    // registers the extension on a cytoscape lib ref
    var register = function( cytoscape ){

        if( !cytoscape ){ return; } // can't register if cytoscape unspecified


        var options = {
            snapToGrid: true,
            discreteDrag: true,
            resize: true,
            drawGrid: true,
            zoomDash: true,
            panGrid: true,
            gridSpacing: 40,
            stackOrder: -1,
            strokeStyle: '#CCCCCC',
            lineWidth: 1.0,
            lineDash: [5,8],
        };

        var _snap = require("./snap");
        var _discreteDrag = require("./discrete_drag");
        var _drawGrid = require("./draw_grid");
        var _resize = require("./resize");
        var _eventsController = require("./events_controller");
        var snap, resize, discreteDrag, drawGrid, eventsController;

        var initialized = false;
        cytoscape( 'core', 'snapToGrid', function(opts){
            var cy = this;
            $.extend(true, options, opts);

            if (!initialized) {
                snap = _snap(options.gridSpacing);
                resize = _resize(options.gridSpacing);
                discreteDrag = _discreteDrag(cy, snap);
                drawGrid = _drawGrid(options, cy, $);
                eventsController = _eventsController(cy, snap, resize, discreteDrag, drawGrid, $);


                eventsController.init(options);
            } else
                eventsController.syncWithOptions(options)


            return this; // chainability
        } );

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

},{"./discrete_drag":1,"./draw_grid":2,"./events_controller":3,"./resize":5,"./snap":6}],5:[function(require,module,exports){
module.exports = function (gridSpacing) {


    var getScratch = function (node) {
        if (!node.scratch("_snapToGrid"))
            node.scratch("_snapToGrid", {});

        return node.scratch("_snapToGrid");
    };

    function resizeNode(node) {
        var width = node.width();
        var height = node.height();

        var newWidth = Math.round(width / gridSpacing) * gridSpacing;
        var newHeight = Math.round(height / gridSpacing) * gridSpacing;

        newWidth = newWidth > 0 ? newWidth : gridSpacing;
        newHeight = newHeight > 0 ? newHeight : gridSpacing;

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
},{}],6:[function(require,module,exports){
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
},{}]},{},[4]);
