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