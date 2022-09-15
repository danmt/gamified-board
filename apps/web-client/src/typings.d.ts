declare module 'cytoscape-node-html-label' {
  declare global {
    namespace cytoscape {
      interface Core {
        nodeHtmlLabel: (...options: any) => any;
      }
    }
  }
}
