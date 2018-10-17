module.exports = function (opts, cy, $, debounce) {

    var options = opts;

    var changeOptions = function (opts) {
      options = opts;
    };


    var $canvas = $( '<canvas></canvas>' );
    var $container = $( cy.container() );
    var ctx = $canvas[ 0 ].getContext( '2d' );
    $container.append( $canvas );

    var resetCanvas = function () {
        $canvas
            .attr('height', 0)
            .attr('width', 0)
            .css( {
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'z-index': options.gridStackOrder
            });
    };

    resetCanvas();

    var drawGrid = function() {
        var zoom = cy.zoom();
        var canvasWidth = $container.width();
        var canvasHeight = $container.height();
        var increment = options.gridSpacing*zoom;
        var pan = cy.pan();
        var initialValueX = pan.x%increment;
        var initialValueY = pan.y%increment;

        ctx.strokeStyle = options.gridColor;
        ctx.lineWidth = options.lineWidth;

        var data = '\t<svg width="'+ canvasWidth + '" height="'+ canvasHeight + '" xmlns="http://www.w3.org/2000/svg">\n\
            <defs>\n\
                <pattern id="horizontalLines" width="' + increment + '" height="' + increment + '" patternUnits="userSpaceOnUse">\n\
                    <path d="M ' + increment + ' 0 L 0 0 0 ' + 0 + '" fill="none" stroke="' + options.gridColor + '" stroke-width="' + options.lineWidth + '" />\n\
                </pattern>\n\
                <pattern id="verticalLines" width="' + increment + '" height="' + increment + '" patternUnits="userSpaceOnUse">\n\
                    <path d="M ' + 0 + ' 0 L 0 0 0 ' + increment + '" fill="none" stroke="' + options.gridColor + '" stroke-width="' + options.lineWidth + '" />\n\
                </pattern>\n\
            </defs>\n\
            <rect width="100%" height="100%" fill="url(#horizontalLines)" transform="translate('+ 0 + ', ' + initialValueY + ')" />\n\
            <rect width="100%" height="100%" fill="url(#verticalLines)" transform="translate('+ initialValueX + ', ' + 0 + ')" />\n\
        </svg>\n';

        var img = new Image();
        data = encodeURIComponent(data);
        
        img.onload = function () {
            clearDrawing();
            ctx.drawImage(img, 0, 0);
        };
        
        img.src = "data:image/svg+xml," + data;
    };
    
    var clearDrawing = function() {
        var width = $container.width();
        var height = $container.height();

        ctx.clearRect( 0, 0, width, height );
    };

    var resizeCanvas = debounce(function() {
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

    }, 250);




    return {
        initCanvas: resizeCanvas,
        resizeCanvas: resizeCanvas,
        resetCanvas: resetCanvas,
        clearCanvas: clearDrawing,
        drawGrid: drawGrid,
        changeOptions: changeOptions,
        sizeCanvas: drawGrid
    };
};
