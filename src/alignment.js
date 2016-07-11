module.exports = function (cytoscape) {
    
    // Needed because parent nodes cannot be moved!
    function moveTopDown(children, dx, dy) {
        for(var i = 0; i < children.length; i++){
            var child = children[i];
            child.position({
                x: child.position('x') + dx,
                y: child.position('y') + dy
            });

            moveTopDown(child.children(), dx, dy);
        }
    }

    function getTopMostNodes(nodes) {
        var nodesMap = {};
        for (var i = 0; i < nodes.length; i++) {
            nodesMap[nodes[i].id()] = true;
        }
        var roots = nodes.filter(function (i, ele) {
            var parent = ele.parent()[0];
            while(parent != null){
                if(nodesMap[parent.id()]){
                    return false;
                }
                parent = parent.parent()[0];
            }
            return true;
        });

        return roots;
    }


    cytoscape( "collection", "align", function (horizontal, vertical, alignTo) {

        var eles = getTopMostNodes(this.nodes(":visible"));

        var modelNode = alignTo ? alignTo : eles[0];

        eles = eles.not(modelNode);

        // 0 for center
        var xFactor = 0;
        var yFactor = 0;

        if (vertical == "left")
            xFactor = -1;
        else if (vertical == "right")
            xFactor = 1;

        if (horizontal == "top")
            yFactor = -1;
        else if (horizontal == "bottom")
            yFactor = 1;


        for (var i = 0; i < eles.length; i++) {
            var node = eles[i];
            var oldPos = node.position();
            var newPos = node.position();

            if (vertical != "none")
                newPos.x = modelNode.position("x") + xFactor * (modelNode.width() - node.width()) / 2;


            if (horizontal != "none")
                newPos.y = modelNode.position("y") + yFactor * (modelNode.height() - node.height()) / 2;


            moveTopDown(node, newPos.x - oldPos.x, newPos.y - oldPos.y);
        }


    });



};