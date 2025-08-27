const h = require("./helper");

module.exports = function (cytoscape, cy, apiRegistered) {

    // Needed because parent nodes cannot be moved in Cytoscape.js < v3.2
    function moveTopDown(node, dx, dy) {
        var nodes = node.union(node.descendants());
        nodes = h.removeIgnored(nodes);
        nodes.filter(":childless").positions(function (node, i) {
            if(typeof node === "number") {
              node = i;
            }
            var pos = node.position();
            return {
                x: pos.x + dx,
                y: pos.y + dy
            };
        });
    }

    function getTopMostNodes(nodes) {
        var nodesMap = {};
        for (var i = 0; i < nodes.length; i++) {
            nodesMap[nodes[i].id()] = true;
        }
        var roots = nodes.filter(function (ele, i) {
            if(typeof ele === "number") {
              ele = i;
            }
            
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

    function widthOf(n) { return n.outerWidth ? n.outerWidth() : n.width(); }
    function heightOf(n) { return n.outerHeight ? n.outerHeight() : n.height(); }

    function leftEdge(n) { return n.position("x") - widthOf(n) / 2; }
    function rightEdge(n) { return n.position("x") + widthOf(n) / 2; }
    function topEdge(n) { return n.position("y") - heightOf(n) / 2; }
    function bottomEdge(n) { return n.position("y") + heightOf(n) / 2; }

    function setCenterX(n, cx) {
        var oldPos = n.position();
        moveTopDown(n, cx - oldPos.x, 0);
    }
    function setCenterY(n, cy) {
        var oldPos = n.position();
        moveTopDown(n, 0, cy - oldPos.y);
    }

    function placeByLeft(n, targetLeft) {
        var cx = targetLeft + widthOf(n) / 2;
        setCenterX(n, cx);
    }
    function placeByRight(n, targetRight) {
        var cx = targetRight - widthOf(n) / 2;
        setCenterX(n, cx);
    }
    function placeByTop(n, targetTop) {
        var cy = targetTop + heightOf(n) / 2;
        setCenterY(n, cy);
    }
    function placeByBottom(n, targetBottom) {
        var cy = targetBottom - heightOf(n) / 2;
        setCenterY(n, cy);
    }


    // If extension api functions are not registed to cytoscape yet register them here.
		// Note that ideally these functions should not be directly registered to core from cytoscape.js
		// extensions
    if ( !apiRegistered ) {

      cytoscape( "collection", "align", function (horizontal, vertical, alignTo) {

          var eles = getTopMostNodes(this.nodes(":visible"));

          var modelNode = alignTo ? alignTo : eles[0];

          eles = eles.not(modelNode);

          horizontal = horizontal ? horizontal : "none";
          vertical = vertical ? vertical : "none";


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
              var oldPos = Object.assign({}, node.position());
              var newPos = Object.assign({}, node.position());

              if (vertical != "none")
                  newPos.x = modelNode.position("x") + xFactor * (modelNode.outerWidth() - node.outerWidth()) / 2;


              if (horizontal != "none")
                  newPos.y = modelNode.position("y") + yFactor * (modelNode.outerHeight() - node.outerHeight()) / 2;

              moveTopDown(node, newPos.x - oldPos.x, newPos.y - oldPos.y);
          }

          return this;
      });

      cytoscape("collection", "distribute", function (orientation, mode) {
          var eles = getTopMostNodes(this.nodes(":visible"));
          var n = eles.length;
          if (n <= 2) return this;

          orientation = orientation || "horizontal";
          mode = mode || "center";
          var sorted;
          if (orientation === "horizontal") {
              if (mode === "left" || mode === "gap") {
                  sorted = eles.sort(function (a, b) { return leftEdge(a) - leftEdge(b); });
              } else if (mode === "right") {
                  sorted = eles.sort(function (a, b) { return rightEdge(a) - rightEdge(b); });
              } else { // center
                  sorted = eles.sort(function (a, b) { return a.position("x") - b.position("x"); });
              }

              if (mode === "gap") {
                  var minLeft = leftEdge(sorted[0]);
                  var maxRight = rightEdge(sorted[n - 1]);
                  var totalSpan = maxRight - minLeft;
                  var totalWidth = 0;
                  for (let i = 0; i < n; i++) totalWidth += widthOf(sorted[i]);

                  var freeSpace = Math.max(0, totalSpan - totalWidth);
                  var gap = freeSpace / (n - 1);

                  placeByLeft(sorted[0], minLeft);
                  var cursor = rightEdge(sorted[0]) + gap;
                  for (let i = 1; i < n - 1; i++) {
                      placeByLeft(sorted[i], cursor);
                      cursor = rightEdge(sorted[i]) + gap;
                  }
                  placeByRight(sorted[n - 1], maxRight);

              } else if (mode === "left") {
                  var start = leftEdge(sorted[0]);
                  var end = leftEdge(sorted[n - 1]);
                  var step = (n > 1) ? (end - start) / (n - 1) : 0;
                  for (let i = 0; i < n; i++) {
                      placeByLeft(sorted[i], start + i * step);
                  }
              } else if (mode === "right") {
                  var startR = rightEdge(sorted[0]);
                  var endR = rightEdge(sorted[n - 1]);
                  var stepR = (n > 1) ? (endR - startR) / (n - 1) : 0;
                  for (let i = 0; i < n; i++) {
                      placeByRight(sorted[i], startR + i * stepR);
                  }
              } else { // "center"
                  var startC = sorted[0].position("x");
                  var endC = sorted[n - 1].position("x");
                  var stepC = (n > 1) ? (endC - startC) / (n - 1) : 0;
                  for (let i = 0; i < n; i++) {
                      setCenterX(sorted[i], startC + i * stepC);
                  }
              }
          } else if (orientation === "vertical") {
            if (mode === "top" || mode === "gap") {
                sorted = eles.sort(function (a, b) { return topEdge(a) - topEdge(b); });
            } else if (mode === "bottom") {
                sorted = eles.sort(function (a, b) { return bottomEdge(a) - bottomEdge(b); });
            } else { // center
                sorted = eles.sort(function (a, b) { return a.position("y") - b.position("y"); });
            }

            if (mode === "gap") {
                var minTop = topEdge(sorted[0]);
                var maxBottom = bottomEdge(sorted[n - 1]);
                var totalSpanV = maxBottom - minTop;
                var totalHeight = 0;
                for (let j = 0; j < n; j++) totalHeight += heightOf(sorted[j]);

                var freeSpaceV = Math.max(0, totalSpanV - totalHeight);
                var gapV = freeSpaceV / (n - 1);

                placeByTop(sorted[0], minTop);
                var cursorV = bottomEdge(sorted[0]) + gapV;
                for (let j = 1; j < n - 1; j++) {
                    placeByTop(sorted[j], cursorV);
                    cursorV = bottomEdge(sorted[j]) + gapV;
                }
                placeByBottom(sorted[n - 1], maxBottom);

            } else if (mode === "top") {
                var startT = topEdge(sorted[0]);
                var endT = topEdge(sorted[n - 1]);
                var stepT = (n > 1) ? (endT - startT) / (n - 1) : 0;

                for (let j = 0; j < n; j++) {
                    placeByTop(sorted[j], startT + j * stepT);
                }
            } else if (mode === "bottom") {
                var startB = bottomEdge(sorted[0]);
                var endB = bottomEdge(sorted[n - 1]);
                var stepB = (n > 1) ? (endB - startB) / (n - 1) : 0;

                for (let j = 0; j < n; j++) {
                    placeByBottom(sorted[j], startB + j * stepB);
                }
            } else { // "center"
                var startCV = sorted[0].position("y");
                var endCV = sorted[n - 1].position("y");
                var stepCV = (n > 1) ? (endCV - startCV) / (n - 1) : 0;

                for (let j = 0; j < n; j++) {
                    setCenterY(sorted[j], startCV + j * stepCV);
                }
            }
        }
        return this;
      });
    }

    if (cy.undoRedo) {
        function getNodePositions() {
            var positionsAndSizes = {};
            var nodes = cy.nodes();

            for (var i = 0; i < nodes.length; i++) {
                var ele = nodes[i];
                positionsAndSizes[ele.id()] = {
                    x: ele.position("x"),
                    y: ele.position("y")
                };
            }

            return positionsAndSizes;
        }

        function returnToPositions(nodesData) {
            var currentPositions = {};
            cy.nodes().not(":parent").positions(function (ele, i) {
                if(typeof ele === "number") {
                  ele = i;
                }
                currentPositions[ele.id()] = {
                    x: ele.position("x"),
                    y: ele.position("y")
                };
                var data = nodesData[ele.id()];
                return {
                    x: data.x,
                    y: data.y
                };
            });

            return currentPositions
        }

        var ur = cy.undoRedo(null, true);

        ur.action("align", function (args) {

            var nodesData;
            if (args.firstTime){
                nodesData = getNodePositions();
                args.nodes.align(args.horizontal, args.vertical, args.alignTo);
            }
            else
                nodesData = returnToPositions(args);

            return nodesData;

        }, function (nodesData) {
            return returnToPositions(nodesData);
        });

        ur.action("distribute", function (args) {
            var nodesData;
            if (args.firstTime) {
                nodesData = getNodePositions();
                args.nodes.distribute(args.orientation, args.mode);
            } else {
                nodesData = returnToPositions(args);
            }
            return nodesData;
        }, function (nodesData) {
            return returnToPositions(nodesData);
        });

    }

};
