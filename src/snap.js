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