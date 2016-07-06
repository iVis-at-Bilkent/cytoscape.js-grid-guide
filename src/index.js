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
        var snap, resize, discreteDrag, drawGrid, eventsController, guidelines;

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
