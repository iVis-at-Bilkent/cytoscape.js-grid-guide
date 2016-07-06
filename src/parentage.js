module.exports = function (options, cy) {

    cy.style()
        .selector(':parent')
        .style('width', 1231)
        .update();
};