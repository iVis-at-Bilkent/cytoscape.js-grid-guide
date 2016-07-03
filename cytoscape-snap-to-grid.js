(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function (options, cy, snap) {

    enable();


    var attachedNode;

    function tapDrag(e) {
        var nodePos = attachedNode.position();
        var mousePos = snap.snapPos(e.cyPosition);
        if (nodePos.x != mousePos.x || nodePos.y != mousePos.y){
            attachedNode.unlock();
            snap.snapNode(attachedNode, mousePos);
            attachedNode.lock();
        }
    }

    function tapStartNode(e){
        attachedNode = e.cyTarget;
        attachedNode.lock();
        cy.on("tapdrag", tapDrag);
        cy.on("tapend", tapEnd);
    }

    function tapEnd(e){
        attachedNode.unlock();
        cy.off("tapdrag", tapDrag);
        cy.off("tapend", tapEnd);
    }


    function enable() {
        cy.on("tapstart", "node", tapStartNode);
    }
    

};
},{}],2:[function(require,module,exports){
module.exports = function (options, cy, $) {

    var drawGrid = function() {
        clearDrawing();

        if(!options.drawGrid) {
            return;
        }

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
    
    var container = cy.container();
    var $canvas = $( '<canvas></canvas>' );
    var $container = $( container );
    var ctx = $canvas[ 0 ].getContext( '2d' );
    $container.append( $canvas );
    $( window ).on( 'resize', resizeCanvas );
    resizeCanvas();


    
};
},{}],3:[function(require,module,exports){
;(function(){ 'use strict';

    // registers the extension on a cytoscape lib ref
    var register = function( cytoscape ){

        if( !cytoscape ){ return; } // can't register if cytoscape unspecified


        var options = {
            gridSpacing: 40,
            discreteDragEnabled: true,
            drawGrid: true,
            stackOrder: -1,
            strokeStyle: '#CCCCCC',
            lineWidth: 1.0,
            lineDash: [5,8],
            zoomDash: true,
            panGrid: true
        };

        var _snap = require("./snap");
        var _discreteDrag = require("./discrete_drag");
        var _drawGrid = require("./draw_grid");

        cytoscape( 'core', 'snapToGrid', function(opts){
            var cy = this;
            $.extend(true, options, opts);

            var snap = _snap(options, cy);
            var discreteDrag = _discreteDrag(options, cy, snap);
            var drawGrid = _drawGrid(options, cy, $);

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

},{"./discrete_drag":1,"./draw_grid":2,"./snap":4}],4:[function(require,module,exports){
module.exports = function (options, cy) {

    function snapCyTarget(e) {
        snapNode(e.cyTarget);
    }

    cy.on("style", "node", snapCyTarget);
    cy.on("add", "node", snapCyTarget);
    cy.on("free", "node", snapCyTarget); // If discrete drag is disabled
    cy.on("ready", snapAllNodes);


    var snapPos = function (pos) {
        var newPos = {
            x: (Math.floor(pos.x / options.gridSpacing) + 0.5) * options.gridSpacing,
            y: (Math.floor(pos.y / options.gridSpacing) + 0.5) * options.gridSpacing
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

    var snapAllNodes = function () {
        return cy.nodes().each(function (i, node) {
            snapNode(node);
        });
    };

    return {
        snapPos: snapPos,
        snapNode: snapNode,
        snapAllNodes: snapAllNodes
    };

};
},{}]},{},[3]);
