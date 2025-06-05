// const formBuilder = (function () {

//   const EmptyNode = {
//     type: "",
//     attributes: {
//       style: "",
//       id: "",
//     },
//     children: [],
//   };
//   const NodeTypes = [
//     "select",
//     "input",
//     "textarea",
//     "checkbox",
//     "radio",
//     "button",
//     "label",
//     "form",
//     "div",
//     "option",
//   ];

//   function createNode(type, attributes, children) {
//     if (!NodeTypes.includes(type)) {
//       throw new Error(`Invalid node type: ${type}`);
//     }
//     if (typeof attributes !== "object") {
//       throw new Error("Attributes must be an object");
//     }
//     if (!Array.isArray(children)) {
//       throw new Error("Children must be an array");
//     }

//     let newNode = structuredClone(EmptyNode);
//     (newNode.type = type),
//       (newNode.attributes = {
//         style: attributes.style || "",
//         id: attributes.id || "",
//       });
//     newNode.children = children || [];
//     return newNode;
//   }

//   function renderNode(node) {
//     if (typeof node !== "object" || !node.type) {
//       throw new Error("Invalid node structure");
//     }

//     let element = document.createElement(node.type);
//     for (let [key, value] of Object.entries(node.attributes)) {
//       if (value) {
//         element.setAttribute(key, value);
//       }
//     }
//     node.children.forEach((child) => {
//       if (typeof child === "string") {
//         element.appendChild(document.createTextNode(child));
//       } else {
//         element.appendChild(renderNode(child));
//       }
//     });
//     return element;
//   }

//   /**
//    * Renders a node to the DOM
//    * @param {String} id
//    * @param {Node} node
//    * @returns
//    */
//   function render(id, node) {
//     const container = document.getElementById(id);
//     if (!container) {
//       throw new Error(`Container with id ${id} not found`);
//     }
//     container.innerHTML = ""; // Clear previous content
//     const renderedNode = renderNode(node);
//     container.appendChild(renderedNode);
//   }

//   return { createNode, render, renderNode, NodeTypes };
// })();

// formBuilder.render("formContainer", {
//   type: "form",
//   attributes: { style: "width: 100%", id: "form1" },
//   children: [
//     formBuilder.createNode("input", { style: "width: 100%", id: "input1" }, []),
//     formBuilder.createNode("select", { style: "width: 100%", id: "select1" }, [
//       formBuilder.createNode(
//         "option",
//         { style: "width: 100%", id: "option1" },
//         ["Option 1"]
//       ),
//       formBuilder.createNode(
//         "option",
//         { style: "width: 100%", id: "option2" },
//         ["Option 2"]
//       ),
//     ]),
//     formBuilder.createNode("div", { style: "width: 100%", id: "div1" }, [
//       formBuilder.createNode("label", { style: "width: 100%", id: "label1" }, [
//         "Label Text",
//       ]),
//       formBuilder.createNode(
//         "input",
//         { type: "checkbox", id: "checkbox1" },
//         []
//       ),
//       formBuilder.createNode("input", { type: "radio", id: "radio1" }, []),
//       formBuilder.createNode(
//         "button",
//         { style: "width: 100%", id: "button1" },
//         ["Submit"]
//       ),
//     ]),
//   ],
// });

/**
 * @typedef {Object} BuilderNode
 * @property {String} type - The type of the node (e.g., "input", "select", etc.)
 * @property {Attributes} attributes - The attributes of the node
 * @property {String} attributes.style - The style of the node
 * @property {String} attributes.id - The id of the node
 * @property {Node[]} children - The children of the node, which can be strings or other nodes
 */

/**
 * @typedef {Object} Attributes
 * @property {String} style - The style of the node
 * @property {String} id - The id of the node
 * @property {String} value - The value of the node
 */

class FormBuilder {
  constructor(formId, name) {
    this.form = document.getElementById(formId);
    this.name = name;
    if (!name) {
      throw new Error(`name is required`);
    }
    if (!this.form) {
      throw new Error(`Form with id ${formId} not found`);
    }
    if (!this.form) {
      throw new Error("Form container not found");
    }
    this.rootNode = {
      type: "form",
      attributes: {
        style: "width: 100%",
        id: name,
        value: "",
      },
      children: [],
    };
    this.validTypes = [
      "select",
      "input",
      "textarea",
      "checkbox",
      "radio",
      "button",
      "label",
      "form",
      "div",
      "option",
    ];
    this.count = 0;
    this.state = {};
    this.editState = {};
    this.isEditing = true;
  }

  createNode(type, attributes = {}, children = []) {
    if (!this.validTypes.includes(type)) {
      throw new Error(`Invalid node type: ${type}`);
    }
    if (typeof attributes !== "object") {
      throw new Error("Attributes must be an object");
    }
    if (!Array.isArray(children)) {
      throw new Error("Children must be an array");
    }
    if (!attributes.id) {
      attributes.id = `${type}-${this.count++}`;
    }
    if (children.length === 0) {
      children = []; // Ensure children is always an array
    }

    return new Node(type, attributes, children);
  }

  appendToRoot(node) {
    if (!node || typeof node !== "object" || !node.type) {
      throw new Error("Invalid node structure");
    }
    if (!this.validTypes.includes(node.type)) {
      throw new Error(`Invalid node type: ${node.type}`);
    }
    this.rootNode.children.push(node);
    this.render(); // Re-render the form after adding the node
  }

  /**
   * Renders Root Node to the DOM
   */
  render() {
    this.form.innerHTML = ""; // Clear previous content
    const renderedNode = this.renderNode(this.rootNode);
    this.form.appendChild(renderedNode);
  }

  /**
   * Renders a node to the DOM
   */
  renderNode(node) {
    if (typeof node !== "object" || !node.type) {
      throw new Error("Invalid node structure");
    }

    let element = document.createElement(node.type);
    for (let [key, value] of Object.entries(node.attributes)) {
      if (value) {
        element.setAttribute(key, value);
      }
    }
    node.children.forEach((child) => {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(this.renderNode(child));
      }
    });
    return element;
  }
  renderEditable(node) {
    let element = document.createElement(node.type);

    return element;
  }
  render() {
    this.form.innerHTML = ""; // Clear previous content
    if (this.isEditing) {
      const editableNode = this.renderEditable(this.rootNode);
      this.form.appendChild(editableNode);
      return;
    }
    const renderedNode = this.renderNode(this.rootNode);
    this.form.appendChild(renderedNode);
  }
  /**
   * Adds a child node to node
   */
  addChild(nodeId, childNode) {
    const parentNode = this.findNodeById(this.rootNode, nodeId);
    if (!parentNode) {
      throw new Error(`Node with id ${nodeId} not found`);
    }
    if (!this.validTypes.includes(childNode.type)) {
      throw new Error(`Invalid child node type: ${childNode.type}`);
    }

    parentNode.children.push(childNode);
    this.render(); // Re-render the form after adding the child
  }
  findNodeById(node, id) {
    if (node.attributes.id === id) {
      return node;
    }
    for (let child of node.children) {
      if (typeof child === "object") {
        const found = this.findNodeById(child, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Removes a child node by id
   */
  removeChild(childId) {
    const parentNode = this.findParentNodeById(this.rootNode, childId);
    if (!parentNode) {
      throw new Error(`Node with id ${childId} not found`);
    }
    parentNode.children = parentNode.children.filter(
      (child) => child.attributes.id !== childId
    );
    this.render(); // Re-render the form after removing the child
  }

  findParentNodeById(node, id) {
    for (let child of node.children) {
      if (typeof child === "object" && child.attributes.id === id) {
        return node; // Return the parent node
      }
      if (typeof child === "object") {
        const found = this.findParentNodeById(child, id);
        if (found) {
          return found; // Return the parent node
        }
      }
    }
    return null; // No parent found
  }
  handleStateChange(nodeId, state) {
    const node = this.findNodeById(this.rootNode, nodeId);
    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }
    if (typeof state !== "object") {
      throw new Error("State must be an object");
    }
    Object.assign(node.attributes, state);
    this.render(); // Re-render the form after state change
  }

  clear() {
    this.form.innerHTML = "";
  }
}

class Node {
  constructor(type, attributes = {}, children = []) {
    this.type = type;
    this.attributes = {
      style: attributes.style || "",
      id: attributes.id || "",
      value: attributes.value || "",
      class: attributes.class || "",
      ...attributes,
    };
    this.children = Array.isArray(children) ? children : [];
  }
}

// const formBuilder = new FormBuilder("formContainer", "myForm");

// formBuilder.addChild(
//   "myForm",
//   formBuilder.createNode("input", { style: "width: 100%", id: "input1" })
// );

// formBuilder.render();
// setTimeout(() => {
//   formBuilder.appendToRoot(
//     formBuilder.createNode("select", { style: "width: 100%", id: "select1" }, [
//       formBuilder.createNode(
//         "option",
//         { style: "width: 100%", id: "option1", value: "1" },
//         ["Option 1"]
//       ),
//       formBuilder.createNode(
//         "option",
//         { style: "width: 100%", id: "option2", value: "2" },
//         ["Option 2"]
//       ),
//     ])
//   );
// }, 3000);
// setTimeout(() => {
//   formBuilder.removeChild("option1");
// }, 6000);
// console.log(formBuilder);
