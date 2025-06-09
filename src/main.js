import { computePosition } from "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.1/+esm";

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
    this.form.style.width = "210mm";
    this.form.style.minHeight = "297mm";
    this.form.style.padding = "20mm";
    this.form.style.boxSizing = "border-box";
    this.form.style.backgroundColor = "white";
    this.form.style.margin = "20px auto";
    this.form.style.boxShadow = "0 0 10px rgba(0,0,0,0.1)";
    this.form.style.border = "1px solid #ddd";
    this.form.style.position = "relative";

    // Add paper texture
    this.form.style.backgroundImage =
      "linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)";
    this.form.style.backgroundSize = "100% 2em";
    this.form.style.backgroundPosition = "0 1em";

    // Create a portal container for popups
    this.popupContainer = document.createElement("div");
    this.popupContainer.style.position = "fixed";
    this.popupContainer.style.top = "0";
    this.popupContainer.style.left = "0";
    this.popupContainer.style.width = "100%";
    this.popupContainer.style.height = "100%";
    this.popupContainer.style.pointerEvents = "none";
    this.popupContainer.style.zIndex = "1000";
    document.body.appendChild(this.popupContainer);

    this.rootNode = {
      type: "form",
      attributes: {
        style:
          "width: 100%; min-height: 100vh; padding: 20px; box-sizing: border-box;",
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

    // Add "Add Block" button for the root form
    if (node.type === "form") {
      const addBlockButton = document.createElement("button");
      addBlockButton.textContent = "Add New Block";
      addBlockButton.style.marginBottom = "20px";
      addBlockButton.style.padding = "10px 20px";
      addBlockButton.style.backgroundColor = "#4CAF50";
      addBlockButton.style.color = "white";
      addBlockButton.style.border = "none";
      addBlockButton.style.borderRadius = "4px";
      addBlockButton.style.cursor = "pointer";
      addBlockButton.addEventListener("click", () => {
        this.addNewBlock();
      });
      element.appendChild(addBlockButton);
    }
    if (!node.type === "form") {
      const attributes = this.getAttributes(node);
      element.appendChild(attributes);
    }

    // Add configuration controls for block divs
    if (node.type === "div" && node.role === "block") {
      const configDiv = document.createElement("div");
      configDiv.style.marginTop = "10px";
      configDiv.style.padding = "15px";
      configDiv.style.border = "1px solid #ccc";
      configDiv.style.borderRadius = "4px";
      configDiv.style.backgroundColor = "white";
      configDiv.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      configDiv.style.display = "none";
      configDiv.style.position = "fixed";
      configDiv.style.zIndex = "1001";
      configDiv.style.minWidth = "350px";
      configDiv.style.pointerEvents = "auto";

      // Block Information Section
      const blockInfoDiv = document.createElement("div");
      blockInfoDiv.style.marginBottom = "15px";
      blockInfoDiv.style.paddingBottom = "15px";
      blockInfoDiv.style.borderBottom = "1px solid #eee";

      const blockTitle = document.createElement("div");
      blockTitle.textContent = "Block Settings";
      blockTitle.style.fontWeight = "bold";
      blockTitle.style.marginBottom = "10px";
      blockTitle.style.fontSize = "16px";

      const blockIdInput = document.createElement("div");
      blockIdInput.style.marginBottom = "10px";

      const blockIdLabel = document.createElement("label");
      blockIdLabel.textContent = "Block ID:";
      blockIdLabel.style.display = "block";
      blockIdLabel.style.marginBottom = "5px";

      const blockIdField = document.createElement("input");
      blockIdField.type = "text";
      blockIdField.value = node.attributes.id || "";
      blockIdField.style.width = "100%";
      blockIdField.style.padding = "5px";
      blockIdField.style.border = "1px solid #ddd";
      blockIdField.style.borderRadius = "4px";
      blockIdField.addEventListener("change", (e) => {
        node.attributes.id = e.target.value;
      });

      blockIdInput.appendChild(blockIdLabel);
      blockIdInput.appendChild(blockIdField);
      blockInfoDiv.appendChild(blockTitle);
      blockInfoDiv.appendChild(blockIdInput);
      configDiv.appendChild(blockInfoDiv);

      // Layout Section
      const layoutDiv = document.createElement("div");
      layoutDiv.style.marginBottom = "15px";
      layoutDiv.style.paddingBottom = "15px";
      layoutDiv.style.borderBottom = "1px solid #eee";

      const layoutLabel = document.createElement("div");
      layoutLabel.textContent = "Layout:";
      layoutLabel.style.fontWeight = "bold";
      layoutLabel.style.marginBottom = "10px";

      const gridPreview = document.createElement("div");
      gridPreview.style.display = "flex";
      gridPreview.style.gap = "5px";
      gridPreview.style.marginBottom = "10px";

      // Create grid preview buttons
      const createGridButton = (columns) => {
        const button = document.createElement("button");
        button.style.padding = "5px";
        button.style.border = "1px solid #ccc";
        button.style.borderRadius = "4px";
        button.style.background = "white";
        button.style.cursor = "pointer";
        button.style.display = "flex";
        button.style.gap = "2px";

        for (let i = 0; i < columns; i++) {
          const column = document.createElement("div");
          column.style.width = "15px";
          column.style.height = "15px";
          column.style.border = "1px solid #ddd";
          column.style.backgroundColor = "#f5f5f5";
          button.appendChild(column);
        }

        button.addEventListener("click", (e) => {
          e.stopPropagation();
          gridPreview.querySelectorAll("button").forEach((btn) => {
            btn.style.background = "white";
            btn.style.borderColor = "#ccc";
          });
          button.style.background = "#e3f2fd";
          button.style.borderColor = "#2196f3";

          // Update block layout with proper grid styling
          const gridStyles = {
            1: {
              grid: "1fr",
              gap: "20px",
              padding: "20px",
            },
            2: {
              grid: "1fr 1fr",
              gap: "15px",
              padding: "15px",
            },
            3: {
              grid: "1fr 1fr 1fr",
              gap: "10px",
              padding: "10px",
            },
          };

          const selectedLayout = gridStyles[columns];

          // Reset and apply new styles
          element.style.cssText = `
            width: 100%;
            min-height: 100px;
            margin-bottom: 20px;
            border: 1px solid #eee;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: ${selectedLayout.grid};
            gap: ${selectedLayout.gap};
            padding: ${selectedLayout.padding};
            position: relative;
          `;

          // Update children styles to fit the grid
          node.children.forEach((child) => {
            if (typeof child === "object") {
              child.attributes.style = `
                width: 100%;
                min-height: 40px;
                padding: 8px;
                border: 1px solid #eee;
                border-radius: 4px;
                background-color: white;
                box-sizing: border-box;
              `;
            }
          });

          // Force a re-render
          this.render();
        });

        return button;
      };

      [1, 2, 3].forEach((columns) => {
        gridPreview.appendChild(createGridButton(columns));
      });

      layoutDiv.appendChild(layoutLabel);
      layoutDiv.appendChild(gridPreview);
      configDiv.appendChild(layoutDiv);

      // Elements Section
      const elementsDiv = document.createElement("div");
      elementsDiv.style.marginBottom = "15px";

      const elementsLabel = document.createElement("div");
      elementsLabel.textContent = "Elements:";
      elementsLabel.style.fontWeight = "bold";
      elementsLabel.style.marginBottom = "10px";

      // Create element list
      const elementList = document.createElement("div");
      elementList.style.maxHeight = "200px";
      elementList.style.overflowY = "auto";
      elementList.style.marginBottom = "15px";
      elementList.style.border = "1px solid #eee";
      elementList.style.borderRadius = "4px";
      elementList.style.padding = "10px";

      const updateElementList = () => {
        elementList.innerHTML = "";
        node.children.forEach((child, index) => {
          if (typeof child === "object") {
            const elementDiv = document.createElement("div");
            elementDiv.style.padding = "8px";
            elementDiv.style.border = "1px solid #eee";
            elementDiv.style.borderRadius = "4px";
            elementDiv.style.marginBottom = "5px";
            elementDiv.style.backgroundColor = "#f9f9f9";

            const elementHeader = document.createElement("div");
            elementHeader.style.display = "flex";
            elementHeader.style.justifyContent = "space-between";
            elementHeader.style.alignItems = "center";
            elementHeader.style.marginBottom = "5px";

            const elementType = document.createElement("span");
            elementType.textContent = `${child.type} (${
              child.attributes.id || "No ID"
            })`;
            elementType.style.fontWeight = "500";

            const elementIdInput = document.createElement("input");
            elementIdInput.type = "text";
            elementIdInput.placeholder = "Element ID";
            elementIdInput.value = child.attributes.id || "";
            elementIdInput.style.width = "150px";
            elementIdInput.style.padding = "4px";
            elementIdInput.style.border = "1px solid #ddd";
            elementIdInput.style.borderRadius = "4px";
            elementIdInput.addEventListener("change", (e) => {
              child.attributes.id = e.target.value;
              this.render();
            });

            const elementStyleInput = document.createElement("input");
            elementStyleInput.type = "text";
            elementStyleInput.placeholder = "Custom Style";
            elementStyleInput.value = child.attributes.style || "";
            elementStyleInput.style.width = "150px";
            elementStyleInput.style.padding = "4px";
            elementStyleInput.style.border = "1px solid #ddd";
            elementStyleInput.style.borderRadius = "4px";
            elementStyleInput.addEventListener("change", (e) => {
              child.attributes.style = e.target.value;
              this.render();
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "×";
            deleteButton.style.border = "none";
            deleteButton.style.background = "none";
            deleteButton.style.color = "#ff4444";
            deleteButton.style.cursor = "pointer";
            deleteButton.style.fontSize = "18px";
            deleteButton.style.padding = "0 5px";
            deleteButton.addEventListener("click", () => {
              node.children.splice(index, 1);
              this.render();
              updateElementList();
            });

            elementHeader.appendChild(elementType);
            elementHeader.appendChild(elementIdInput);
            elementHeader.appendChild(elementStyleInput);
            elementHeader.appendChild(deleteButton);
            elementDiv.appendChild(elementHeader);
            elementList.appendChild(elementDiv);
          }
        });
      };

      updateElementList();

      elementsDiv.appendChild(elementsLabel);
      elementsDiv.appendChild(elementList);
      configDiv.appendChild(elementsDiv);

      // Add new element section
      const addElementDiv = document.createElement("div");
      addElementDiv.style.display = "flex";
      addElementDiv.style.gap = "10px";
      addElementDiv.style.alignItems = "center";

      const typeSelect = document.createElement("select");
      typeSelect.style.flex = "1";
      this.validTypes.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
      });

      const addButton = document.createElement("button");
      addButton.textContent = "+ Add Element";
      addButton.style.padding = "8px 16px";
      addButton.style.backgroundColor = "#4CAF50";
      addButton.style.color = "white";
      addButton.style.border = "none";
      addButton.style.borderRadius = "4px";
      addButton.style.cursor = "pointer";
      addButton.style.display = "flex";
      addButton.style.alignItems = "center";
      addButton.style.gap = "5px";

      addButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const selectedType = typeSelect.value;
        const newNode = this.createNode(selectedType, {
          style: "width: 100%",
          id: `${selectedType}-${this.count++}`,
        });
        node.children.push(newNode);
        this.render();
        updateElementList();
      });

      addElementDiv.appendChild(typeSelect);
      addElementDiv.appendChild(addButton);
      configDiv.appendChild(addElementDiv);

      // Add the config div to the popup container
      this.popupContainer.appendChild(configDiv);

      // Create a wrapper for the block content
      const blockContent = document.createElement("div");
      blockContent.style.position = "relative";
      blockContent.style.width = "100%";
      blockContent.style.height = "100%";

      while (element.firstChild) {
        blockContent.appendChild(element.firstChild);
      }

      blockContent.addEventListener("click", async (e) => {
        const isVisible = configDiv.style.display === "block";
        if (isVisible) {
          configDiv.style.display = "none";
        } else {
          configDiv.style.display = "block";
          const { x, y } = await computePosition(element, configDiv, {
            placement: "bottom",
            middleware: [
              {
                name: "offset",
                options: {
                  offset: [0, 8],
                },
              },
            ],
          });

          const formRect = this.form.getBoundingClientRect();
          configDiv.style.left = `${x + formRect.left}px`;
          configDiv.style.top = `${y + formRect.top}px`;
        }
      });

      element.appendChild(blockContent);

      const indicator = document.createElement("div");
      indicator.style.position = "absolute";
      indicator.style.top = "5px";
      indicator.style.right = "5px";
      indicator.style.width = "10px";
      indicator.style.height = "10px";
      indicator.style.borderRadius = "50%";
      indicator.style.backgroundColor = "#ccc";
      blockContent.appendChild(indicator);

      document.addEventListener("click", (e) => {
        if (!configDiv.contains(e.target) && !element.contains(e.target)) {
          configDiv.style.display = "none";
        }
      });
    }

    node.children.forEach((child) => {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(this.renderEditable(child));
      }
    });
    element;
    return element;
  }

  /**
   * @param {BuilderNode} node - The node to render
   */
  getAttributes(node) {
    if (node.type === "option") {
      const el = document.createElement("div");
      const valueInput = document.createElement("input");
      valueInput.type = "text";
      valueInput.placeholder = "Value";
      valueInput.value = node.attributes.value || "";
      valueInput.addEventListener("input", (e) => {
        node.attributes.value = e.target.value;
      });
      el.appendChild(valueInput);
      const idInput = document.createElement("input");
      idInput.type = "text";
      idInput.placeholder = "ID";
      idInput.value = node.attributes.id || "";
      idInput.addEventListener("input", (e) => {
        node.attributes.id = e.target.value;
      });
      el.appendChild(idInput);
      return el;
    }
    const el = document.createElement("div");
    const typeSelect = document.createElement("select");
    this.validTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      if (node.type === type) {
        option.selected = true;
      }
      typeSelect.appendChild(option);
    });
    el.appendChild(typeSelect);

    typeSelect.addEventListener("change", (e) => {
      node.type = e.target.value;
    });

    const idInput = document.createElement("input");
    idInput.type = "text";
    idInput.placeholder = "ID";
    idInput.value = node.attributes.id || "";
    idInput.addEventListener("input", (e) => {
      node.attributes.id = e.target.value;
    });
    el.appendChild(idInput);

    return el;
  }

  getAttributesForDiv(node) {
    return el;
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

  // Add new method to create a new block
  addNewBlock() {
    const newBlock = this.createNode("div", {
      role: "block",
      style:
        "width: 100%; min-height: 100px; margin-bottom: 20px; border: 1px solid #eee; padding: 10px; box-sizing: border-box;",
      id: `block-${this.count++}`,
    });
    this.rootNode.children.push(newBlock);
    this.render();
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
    this.role = attributes.role || "";
    this.children = Array.isArray(children) ? children : [];
  }
}

const formBuilder = new FormBuilder("formContainer", "myForm");

formBuilder.addChild(
  "myForm",
  formBuilder.createNode("div", { role: "block", style: "width: 100%" })
);

formBuilder.render();
