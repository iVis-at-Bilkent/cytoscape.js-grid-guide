module.exports = function (options, cy, snap) {

    enable();


    var attachedNode;

    function tapDrag(e) {
        var nodePos = snap.snapPos(attachedNode.position());
        var mousePos = snap.snapPos(e.cyPosition);
        console.log(nodePos, mousePos);
        if (nodePos.x != mousePos.x || nodePos.y != mousePos.y){
            attachedNode.unlock();
            snap.snapNode(attachedNode, mousePos);
            attachedNode.lock();
        }
    }

    function tapStartNode(e){
        console.log("start");
        attachedNode = e.cyTarget;
        attachedNode.lock();
        cy.on("tapdrag", tapDrag);
        cy.on("tapend", tapEnd);
    }

    function tapEnd(e){
        console.log("end");
        attachedNode.unlock();
        cy.off("tapdrag", tapDrag);
        cy.off("tapend", tapEnd);
    }


    function enable() {
        cy.on("tapstart", "node", tapStartNode);
    }
    

};