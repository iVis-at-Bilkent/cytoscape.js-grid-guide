module.exports = function (opts, cy, $, debounce) {


    var SortedMap = require("collections/sorted-map");

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
                .attr( 'height', $container.height() )
                .attr( 'width', $container.width() )
                .css( {
                    'top': -( canvasBb.top - containerBb.top ),
                    'left': -( canvasBb.left - containerBb.left )
                } );
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


    var hashIt = function (val) {
        var newVal = Math.floor(val);
        return newVal - (newVal % options.guidelinesTolerance);
    };

    var SMap = null;

    var onInitGuidelines = function () {
        if (!currentSMap) {
            SMap = new SortedMap();

            var nodes = cy.nodes();
            nodes.each(function (i, node) {
                dims(node).forEach(function (val) {
                    if(SMap.has(val))
                        SMap.get(val).push(node);
                     else
                        SMap.add(node, key);
                });
            });
        }
    };
    

    return {
        changeOptions: changeOptions
    }

};