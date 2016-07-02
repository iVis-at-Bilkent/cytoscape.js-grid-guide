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