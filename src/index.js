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
