module.exports = function (opts, cy, $, debounce) {


    var SortedMap = require("collections/sorted-map");

    var options = opts;

    var changeOptions = function (opts) {
        options = opts;
    };

    var getCyScratch = function () {
        var sc = cy.scratch("_guidelines");
        if (!sc)
            sc = cy.scratch("_guidelines", { });

        return sc;
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
        return val;
    };


    var SMap = null;
    var lines = { };

    lines.getDims = function (node) {

        var pos = node.renderedPosition();
        var width = node.renderedWidth();
        var height = node.renderedHeight();
        var padding = {
            left: Number(node.renderedStyle("padding-left").replace("px", "")),
            right: Number(node.renderedStyle("padding-right").replace("px", "")),
            top: Number(node.renderedStyle("padding-top").replace("px", "")),
            bottom: Number(node.renderedStyle("padding-bottom").replace("px", ""))
        };

        // v for vertical, h for horizontal
        return {
            hcenter: pos.x,
            hleft: pos.x - (padding.left + width / 2),
            hright: pos.x + (padding.right + width / 2),
            vcenter: pos.y,
            vtop: pos.y - (padding.top + height / 2),
            vbottom: pos.y + (padding.bottom + height / 2)
        };

    };

    lines.calcDistance = function (p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };

    lines.init = function (activeNodes) {
        SMap = new SortedMap();

        var nodes = cy.nodes();
        nodes.not(activeNodes).each(function (i, node) {
            var dims = lines.getDims(node);
            for (var dimKey in dims) {
                var val = dims[dimKey];
                var key = hashIt(val);
                if(SMap.has(key))
                    SMap.get(key).push(node);
                else
                    SMap.add(node, key);
            }

        });
        this.update(activeNodes);
    };

    lines.destroy = function () {
        SMap = null;
    };

    lines.clear = clearDrawing;

    lines.renderPos = function (pos) {
        return pos*cy.zoom() + cy.pan();
    };

    lines.drawLine = function (fromNode, toNode) {
        var from = this.renderPos(fromNode.position());
        var to = this.renderPos(toNode.position());
        ctx.beginPath();
        ctx.moveTo(from.x,from.y);
        ctx.lineTo(to.x,to.y);
        ctx.stroke();
    };

    lines.update = function (activeNodes) {
        this.clear();

        activeNodes.each(function (i, node) {
            lines.getDims(node).forEach(function (val) {
                var key = hashIt(val);

                if ( SMap.has(key) )
                    lines.drawLine(node, SMap.get(key));

            });

        });
    };

    lines.resize = function () {
        resizeCanvas();
        this.update();
    };


    cy.on("grab", function (e) {
        lines.init(e.cyTarget);
    });

    cy.on("drag", function (e) {
        lines.update(e.cyTarget);
    });

    cy.on("free", lines.destroy);


    return {
        changeOptions: changeOptions
    }

};