(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function (options, cy, snap) {

    enable();


    var attachedNode;

    function tapDrag(e) {
        var nodePos = snap.snapPos(attachedNode.position());
        var mousePos = snap.snapPos(e.cyPosition);
        if (nodePos.x != mousePos.x || nodePos.y != mousePos.y){
            attachedNode.unlock();
            snap.snapNode(attachedNode, mousePos);
            attachedNode.lock();
        }
    }

    function tapStartNode(e){
        console.log("start");
        attachedNode = e.cyTarget;
        attachedNode.lock();
        cy.on("tapdrag", tapDrag);
        cy.on("tapend", tapEnd);
    }

    function tapEnd(e){
        console.log("end");
        attachedNode.unlock();
        cy.off("tapdrag", tapDrag);
        cy.off("tapend", tapEnd);
    }


    function enable() {
        cy.on("tapstart", "node", tapStartNode);
    }
    

};
},{}],2:[function(require,module,exports){
;(function(){ 'use strict';

    // registers the extension on a cytoscape lib ref
    var register = function( cytoscape ){

        if( !cytoscape ){ return; } // can't register if cytoscape unspecified


        var options = {
            gridSpacing: 40,
            discreteDragEnabled: true
        };

        var _snap = require("./snap");
        var _discreteDrag = require("./discrete_drag");

        cytoscape( 'core', 'snapToGrid', function(opts){
            var cy = this;
            $.extend(true, options, opts);

            var snap = _snap(options);
            console.log(_snap);
            var discreteDrag = _discreteDrag(options, cy, snap);

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

},{"./discrete_drag":1,"./snap":3}],3:[function(require,module,exports){
module.exports = function (options) {

    snapPos = function (pos) {
        var newPos = {
            x: Math.round(pos.x / options.gridSpacing) * options.gridSpacing,
            y: Math.round(pos.y / options.gridSpacing) * options.gridSpacing
        };

        return newPos;
    };

    snapNode = function (node, toPos) {
        var pos = node.position();

        if (!toPos)
            var toPos = snapPos(pos);

        return node.position(toPos);

    };

    return {
        snapPos: snapPos,
        snapNode: snapNode
    };

};
},{}]},{},[2]);
