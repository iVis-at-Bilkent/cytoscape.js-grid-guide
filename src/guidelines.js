module.exports = function (cy) {

    function calcDistance(p1, p2){
        return Math.sqrt(Math.pow(p1.x - p2.y ,2) + Math.pow(p1.x - p2.y, 2));
    }

    var dims = function (node) {

        var pos = node.position();
        var width = node.width();
        var height = node.height();
        this.X = {
            center: pos.x,
            left: pos.x - width/2,
            right: pos.x + width/2
        };

        this.Y = {
            center: pos.y,
            top: pos.y - height/2,
            bot: pos.y + height/2
        };

        return this;
    };

    cy.on("drag", "node", function (e) {
        var node = e.cyTarget;

        var mainDims = new dims(node);

        var cy = e.cy;
        console.log("TRY");
        var nearests = {
            X: {
                id: "_none_",
                distance: Number.MAX_VALUE
            },
            Y: {
                id: "_none_",
                distance: Number.MAX_VALUE
            }
        };
        cy.nodes(":visible").not(node).each(function (i, ele) {
            var nodeDims = new dims(ele);


            for (var dim in mainDims) {
                var mainDim = mainDims[dim];
                var nodeDim = nodeDims[dim];
                var otherDim = dim == "X" ? "y" : "x";
                for (var key in mainDim) {
                    for (var key2 in nodeDim){
                        if (mainDim[key] == nodeDim[key2]) {
                            var distance = calcDistance(node.position(), ele.position()); //Math.abs(ele.position(otherDim) - node.position(otherDim));
                            if (nearests[dim].distance > distance) {
                                nearests[dim] = {
                                    id: ele.id(),
                                    distance: distance
                                }
                            }
                        }
                           // console.log(key + " of " + node.id() + " -> " + key2 + " of " + ele.id())
                    }
                }
            }
        });
        console.log(nearests.X.id + " of X with distance " + nearests.X.distance);
        console.log(nearests.Y.id + " of Y with distance " + nearests.Y.distance);

    });

};