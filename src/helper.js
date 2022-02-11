/**
 * @param  {} elems collection of cytoscape elements
 * returns the new collection that does not contain ignored
 */
module.exports = {
  removeIgnored: (elems) => {
    const cy = elems.cy();
    const ignored = cy.scratch("_gridGuide").options.ignoredElems;
    if (!ignored) {
      return elems;
    }
    return elems.not(ignored);
  },
};
