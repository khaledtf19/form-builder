"use strict";
import { computePosition } from "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.1/+esm";

if (typeof window === "undefined") {
  throw new Error("This script is intended to run in a browser environment.");
}
/**
 * @typedef {Object} NodeItemType
 * @property {string} type
 * @property {string} id
 * @property {NodeItemType[]}children
 */

class NodeItem {
  /**
   * @constructor
   * @param {Object} obj - The object containing initialization properties.
   * @param {string} obj.id - The unique identifier for the node.
   */
  constructor({ id }) {
    if (!id) {
      throw new Error("expected id");
    }

    this.id = id;
    this.type = "";
    this.attr = {};

    /**@type {NodeItem[]} */
    this.children = [];
  }
  /**
   * @param {NodeItem} node
   */
  pushToChildren(node) {
    this.children.push(node);
  }

  getHtmlElement() {
    return document.createElement("div");
  }
}
class SectionNode extends NodeItem {
  /**
   * @constructor
   * @param {Object} obj - The object containing initialization properties.
   * @param {string} obj.id - The unique identifier for the node.
   */
  constructor({ id }) {
    super({ id });
    this.type = "section";
    this.id = id;
    this.selected = false;

    // TODO => Class
    this.layouts = [
      "repeat(1, minmax(0, 1fr))",
      "repeat(2, minmax(0, 1fr))",
      "repeat(3, minmax(0, 1fr))",
    ];

    // make sure you have the class names in the css
    this.gapsX = ["noGapX", "gapX1", "gapX2", "gapX3", "gapX4"];
    this.gapsY = ["noGapY", "gapY1", "gapY2", "gapY3", "gapY4"];

    this.currGapX = this.gapsX[0];
    this.currGapY = this.gapsY[0];

    this.childrenTypes = ["Input", "Text"];

    /**
     * this will hold the count of every type in the children
     * @type {Map<string, number>}
     */
    this.countMap = new Map();

    this.childrenTypes.forEach((type) => {
      this.countMap.set(type, 0);
    });

    let title = "";

    let withBorders = false;
    this.attr = { withBorders, title, layout: this.layouts[0] };
  }

  /**
   * this will handle the add input, text, any... to the section
   * @param {string} type
   */
  addNewChildToSection(type) {
    const currentCount = this.countMap.get(type) || 0;
    this.countMap.set(type, currentCount + 1);
    switch (type) {
      case "Input":
        this.addNewInputToSection(this.countMap.get(type));
        break;
      default:
        break;
    }

    // this.countMap.set(type, Math.max(0, currentCount - 1));
  }

  addNewInputToSection(count) {
    const inputNode = new InputNode({ id: this.id, count: count });
    this.pushToChildren(inputNode);
    console.log(this.children);
  }

  /**
   * @param {boolean} isEdit
   * @param {Function} editOnClick
   */
  getHtmlElement(isEdit, editOnClick) {
    const section = document.createElement("section");
    section.id = this.id;

    section.classList.add("formBuilder_section");
    if (this.attr.withBorders) {
      section.classList.add("withBorers");
    }

    // Handle Gaps Class
    section.classList.add(this.currGapX);
    section.classList.add(this.currGapY);

    if (this.selected) {
      section.classList.add("selected");
    }

    // TODO => Class
    section.style.gridTemplateColumns = this.attr.layout;

    if (isEdit) {
      const editPoint = document.createElement("div");
      editPoint.classList.add("formBuilder_section_editPoint");

      editPoint.onclick = () => editOnClick(section.id);

      section.append(editPoint);
    }

    if (this.children.length > 0) {
      this.children.forEach((node) => {
        section.append(node.getHtmlElement());
      });
    }

    return section;
  }
}

class InputNode extends NodeItem {
  /**
   * @constructor
   * @param {Object} obj - The object containing initialization properties.
   * @param {string} obj.id - The unique identifier for the node.
   * @param {number} obj.count - The unique identifier for the node.
   */
  constructor({ id, count }) {
    super({ id });
    this.type = "input";
    this.count = count || 0;

    this.withLabel = false;
    this.label = "Label";
  }

  getHtmlElement() {
    const container = document.createElement("div");
    container.classList.add("formBuilder_input_container");

    if (this.withLabel) {
      const label = document.createElement("label");
      label.innerText = this.label;
      container.append(label);
    }

    // ID + type + count + container
    container.id = this.id + "Input" + this.count + "Container";

    const input = document.createElement("input");
    input.id = this.id + "Input" + this.count;
    input.style.width = "100%";
    container.append(input);

    return container;
  }

  /**
   *this will trigger the the the fn when change
   * @param {Function} fn
   */
  toggleWithLabel(fn) {
    this.withLabel = !this.withLabel;
    if (fn) {
      fn();
    }
  }

  /**
   * @param {string} newLabel
   */
  changeCurrLabel(newLabel) {
    this.label = newLabel;
  }
}

class Tree {
  /**
   * @param {HTMLElement} container
   */
  constructor(container, isEdit) {
    if (!(container instanceof Element)) {
      throw new Error("Expected an Element as the form element.");
    }
    this.isEdit = isEdit || false;
    const formElement = document.createElement("form");
    formElement.id = container.id + "Form";

    this.root = container;
    container.append(formElement);
    this.form = formElement;
    this.formId = formElement.id;

    /**
     * @type {HTMLDivElement?}
     */
    this.editSectionContainer = null;

    this.tree = {
      type: "form",
      id: formElement.id,
      /**@type {NodeItem[]} */
      children: [],
    };

    this.initRoot();
    this.initForm();
    this.addEditSection();

    const firstSection = this.getNewSection("First");
    this.tree.children.push(firstSection);
    const secSection = this.getNewSection("Sec");
    this.tree.children.push(secSection);
    this.renderTree();

    console.log(this.getNodeWithId(this.tree, "First"));
  }

  NodeTypes = {
    section: "section",
    input: "input",
  };

  initRoot() {
    this.root.style.position = "relative";
    // Create a native dialog element for sectionId input
    const sectionIdDialog = document.createElement("dialog");
    sectionIdDialog.classList.add("formBuilder_addSectionDialog");
    sectionIdDialog.id = this.root.id + "sectionIdDialog";
    sectionIdDialog.innerHTML = `
      <form method="dialog" style="display:flex;flex-direction:column;gap:1em;">
        <label for="sectionIdInput">Section ID:</label>
        <input type="text" id="sectionIdInput" name="sectionId" required>
        <menu style="display:flex;gap:1em;justify-content:flex-end;">
          <button id="sectionIdCancelBtn" type="reset">Cancel</button>
          <button id="sectionIdOkBtn" value="default" type="submit">OK</button>
        </menu>
      </form>
    `;

    this.root.append(sectionIdDialog);
    const cancelBtn = sectionIdDialog.querySelector("#sectionIdCancelBtn");
    cancelBtn.addEventListener("click", () => {
      sectionIdDialog.close();
    });
    this.openSectionIdDialog = () => {
      sectionIdDialog.showModal();
      sectionIdDialog.querySelector("#sectionIdInput").focus();
    };

    sectionIdDialog.addEventListener("close", () => {
      if (sectionIdDialog.returnValue === "default") {
        const input = sectionIdDialog.querySelector("#sectionIdInput");
        const sectionId = input.value.trim();
        if (sectionId) {
          this.pushToChildren(this.formId, this.getNewSection(sectionId));
          this.renderTree();
        }
        input.value = ""; // reset for next open
      }
    });

    // Add SectionButton to root
    const AddSectionButton = document.createElement("button");
    AddSectionButton.innerText = "Add New Section";
    AddSectionButton.style.position = "absolute";
    AddSectionButton.style.top = "0";

    AddSectionButton.addEventListener("click", () => {
      this.openSectionIdDialog();
    });

    this.root.append(AddSectionButton);
  }

  initForm() {
    this.form.style.width = "210mm";
    this.form.style.minHeight = "297mm";
    this.form.style.padding = "20mm";
    this.form.style.boxSizing = "border-box";
    this.form.style.backgroundColor = "white";
    this.form.style.margin = "20px auto";
    this.form.style.boxShadow = "0 0 10px rgba(0,0,0,0.1)";
    this.form.style.border = "1px solid #ddd";
    this.form.style.position = "relative";
  }

  /**
   *
   * @param {string} parentId
   * @param {NodeItemType} node
   */
  pushToChildren(parentId, node) {
    const parent = this.getNodeWithId(this.tree, parentId);
    parent.children.push(node);
  }

  /**
   *
   * @param {string} id
   * @returns {NodeItemType}
   */
  getNewSection(id) {
    if (!id || typeof id !== "string") {
      throw new Error("Invalid section ID provided.");
    }
    // const section = {
    //   id: id,
    //   type: this.NodeTypes.section,
    //   attr: attr,
    //   children: [],
    // };
    const section = new SectionNode({ id });
    return section;
  }

  /**
   * @param {NodeItemType} node this is the tree
   * @param {string} id
   * @returns {NodeItemType?}
   */
  getNodeWithId(node, id) {
    if (node === null || (node.id !== id && node.children.length === 0))
      return null;

    if (node.id === id) return node;

    for (let i = 0; i < node.children.length; i++) {
      const currNode = this.getNodeWithId(node.children[i], id);
      if (currNode) return currNode;
    }

    return null;
  }

  printTree(message) {
    console.log(message, "\n", this.tree);
  }

  addEditSection() {
    const container = document.createElement("div");
    container.id = this.root.id + "SectionEdit";
    container.classList.add("formBuilder_sectionEdit_container");
    container.dataset.isOpen = "false";

    const stringBody = `<div class="formBuilder_sectionEdit">
    <div class="formBuilder_sectionEdit_header"><p class="formBuilder_sectionEdit_header_id"></p></div>
    <div class="formBuilder_sectionEdit_body"></div>
    <div class="formBuilder_sectionEdit_btns"><button class="formBuilder_sectionEdit_btns_close">Close</button></div>
    </div>`;

    container.innerHTML = stringBody;

    // handle close the edit
    container.querySelector(".formBuilder_sectionEdit_btns_close").onclick =
      () => {
        this.resetSelectSection();
        container.dataset.isOpen = "false";
      };

    this.root.append(container);
    this.editSectionContainer = container;
  }

  resetSelectSection() {
    this.tree.children.forEach((node) => {
      if (node instanceof SectionNode) {
        node.selected = false;
      }
    });
    this.renderTree();
  }

  openEditSection(id) {
    this.resetSelectSection();

    const sectionNode = this.getNodeWithId(this.tree, id);

    if (!sectionNode || !(sectionNode instanceof SectionNode)) {
      throw new Error("This Section Not found");
    }
    sectionNode.selected = true;

    // set id
    this.editSectionContainer.querySelector(
      ".formBuilder_sectionEdit_header_id"
    ).innerHTML = sectionNode.id;

    const body = this.editSectionContainer.querySelector(
      ".formBuilder_sectionEdit_body"
    );

    body.innerHTML = "";

    body?.append(this.getEditSectionBody(sectionNode));

    this.editSectionContainer.dataset.isOpen = "true";

    //render to update everything
    this.renderTree();
  }

  /**
   * @param {SectionNode} node
   */
  getEditSectionBody(node) {
    const body = document.createElement("div");
    body.classList.add("formBuilder_sectionEdit_body_container");

    const layoutsContainer = this.getEditSectionBodyLayout(node);
    body.append(layoutsContainer);

    const withBordersContainer = this.getEditSectionBodyWithBorders(node);
    body.appendChild(withBordersContainer);

    const addChildContainer = this.getEditSectionBodyAddItem(node);
    body.appendChild(addChildContainer);

    const currItemsContainer = this.getEditSectionBodyCurrItems(node);
    body.appendChild(currItemsContainer);

    return body;
  }

  /**
   * @param {SectionNode} node
   */
  getEditSectionBodyLayout(node) {
    const layoutsContainer = document.createElement("div");
    layoutsContainer.classList.add(
      "formBuilder_sectionEdit_body_layouts_container"
    );

    layoutsContainer.innerHTML = "<label>Layouts:</label>";

    const layouts = document.createElement("div");
    layouts.classList.add("formBuilder_sectionEdit_body_layouts");

    node.layouts.forEach((layoutValue, idx) => {
      const layoutBtn = document.createElement("div");
      layoutBtn.classList.add("formBuilder_sectionEdit_body_layouts_btn");

      layoutBtn.value = layoutValue;
      layoutBtn.onclick = () => {
        node.attr.layout = layoutValue;
        this.renderTree();
        layouts
          .querySelectorAll(".formBuilder_sectionEdit_body_layouts_btn")
          .forEach((btn) => {
            btn.classList.remove("selected");
          });
        layoutBtn.classList.add("selected");
      };

      for (let i = 0; i <= idx; i++) {
        const square = document.createElement("div");
        square.classList.add("formBuilder_sectionEdit_body_layouts_btn_square");
        layoutBtn.append(square);
      }
      if (layoutValue === node.attr.layout) {
        layoutBtn.classList.add("selected");
      }

      layouts.append(layoutBtn);
    });

    const gapsX = document.createElement("div");
    gapsX.classList.add("formBuilder_sectionEdit_input_with_label");
    const gapsXLabel = document.createElement("label");
    gapsXLabel.innerText = "Select Horizontal Gap:";
    const gapsXSelect = document.createElement("select");
    node.gapsX.forEach((option) => {
      const optionEl = document.createElement("option");
      optionEl.value = option;
      optionEl.innerText = option;

      gapsXSelect.append(optionEl);
    });
    gapsXSelect.value = node.currGapX;
    gapsXSelect.onchange = () => {
      node.currGapX = gapsXSelect.value;
      this.renderTree();
    };

    gapsX.append(gapsXLabel, gapsXSelect);

    const gapsY = document.createElement("div");
    gapsY.classList.add("formBuilder_sectionEdit_input_with_label");
    const gapsYLabel = document.createElement("label");
    gapsYLabel.innerText = "Select Horizontal Gap:";
    const gapsYSelect = document.createElement("select");
    node.gapsY.forEach((option) => {
      const optionEl = document.createElement("option");
      optionEl.value = option;
      optionEl.innerText = option;

      gapsYSelect.append(optionEl);
    });

    gapsYSelect.value = node.currGapY;
    gapsYSelect.onchange = () => {
      node.currGapY = gapsYSelect.value;
      this.renderTree();
    };

    gapsY.append(gapsYLabel, gapsYSelect);

    layoutsContainer.append(layouts, gapsX, gapsY);

    return layoutsContainer;
  }

  /**
   * @param {SectionNode} node
   */
  getEditSectionBodyWithBorders(node) {
    const withBordersContainer = document.createElement("div");
    const withBorderLabel = document.createElement("label");
    const withBorderCheckbox = document.createElement("input");
    withBorderCheckbox.type = "checkbox";
    withBorderCheckbox.checked = !!node.attr.withBorders;

    withBorderCheckbox.onchange = (e) => {
      node.attr.withBorders = e.target.checked;
      this.renderTree();
    };

    withBorderLabel.appendChild(withBorderCheckbox);
    withBorderLabel.appendChild(document.createTextNode(" With border"));
    withBordersContainer.appendChild(withBorderLabel);

    return withBordersContainer;
  }

  /**
   * @param {SectionNode} node
   */
  getEditSectionBodyAddItem(node) {
    const addChildContainer = document.createElement("div");
    addChildContainer.classList.add(
      "formBuilder_sectionEdit_body_addItem_container"
    );

    const addChildSelectContainer = document.createElement("div");
    addChildSelectContainer.classList.add(
      "formBuilder_sectionEdit_body_addItem_select_container"
    );

    const addChildLabel = document.createElement("label");
    addChildLabel.innerText = "Chose Item:";

    const addChildSelect = document.createElement("select");
    node.childrenTypes.forEach((type) => {
      const typeOption = document.createElement("option");
      typeOption.value = type;
      typeOption.innerText = type;
      addChildSelect.append(typeOption);
    });

    addChildSelectContainer.append(addChildLabel, addChildSelect);

    const addChildButton = document.createElement("button");
    addChildButton.innerText = "Add Item";
    addChildButton.classList.add("formBuilder_sectionEdit_body_addItem_btn");
    addChildButton.onclick = () => {
      node.addNewChildToSection(addChildSelect.value);
      this.openEditSection(node.id);
      this.renderTree();
    };

    addChildContainer.append(addChildSelectContainer, addChildButton);

    return addChildContainer;
  }

  /**
   * @param {SectionNode} node
   */
  getEditSectionBodyCurrItems(node) {
    const currItemsContainer = document.createElement("div");
    currItemsContainer.classList.add(
      "formBuilder_sectionEdit_body_currItems_container"
    );

    // Create a scrollable container for the items
    const itemsList = document.createElement("div");
    itemsList.classList.add("formBuilder_sectionEdit_body_currItems");

    // For each child node, render a summary/config based on its type
    node.children.forEach((child, idx) => {
      const itemDiv = document.createElement("div");
      itemDiv.classList.add(
        "formBuilder_sectionEdit_body_currItems_item_container"
      );
      const titleEl = document.createElement("p");
      titleEl.innerText = idx + 1 + "-" + child.type;
      itemDiv.append(titleEl);

      const bodyEl = document.createElement("div");
      bodyEl.classList.add("formBuilder_sectionEdit_body_currItems_item_body");
      // Type-specific config handle the styles
      if (child.type === "input" && child instanceof InputNode) {
        // Show label, input preview, and count

        const label = document.createElement("span");
        label.innerText = child.withLabel ? child.label : "(No Label)";
        label.style.fontWeight = "bold";

        const withLabelContainer = document.createElement("span");
        withLabelContainer.style.display = "flex";
        withLabelContainer.style.alignItems = "center";
        withLabelContainer.style.gap = "5px";

        const withLabelCheckbox = document.createElement("input");
        withLabelCheckbox.type = "checkbox";
        withLabelCheckbox.checked = !!child.withLabel;
        withLabelCheckbox.title = "Show label";

        const withLabelText = document.createElement("label");
        withLabelText.innerText = "Label";
        withLabelText.style.fontSize = "0.9em";

        withLabelCheckbox.onchange = (e) => {
          child.withLabel = withLabelCheckbox.checked;
          // If turning off, clear label

          if (withLabelCheckbox.checked) {
            labelInput.style.visibility = "visible";
          } else {
            labelInput.style.visibility = "hidden";
          }

          // Re-open edit section to refresh UI
          // this.openEditSection(node.id);
          this.renderTree();
        };

        withLabelContainer.appendChild(withLabelCheckbox);
        withLabelContainer.appendChild(withLabelText);

        bodyEl.appendChild(withLabelContainer);

        // If withLabel is true, show input to update label
        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.value = child.label || "";
        labelInput.placeholder = "Label text";
        labelInput.style.marginLeft = "5px";
        labelInput.style.width = "100px";
        labelInput.style.visibility = "hidden";
        labelInput.oninput = (e) => {
          child.label = e.target.value;
          // Optionally, update preview label live
          this.debounce(this.renderTree(), 100);
        };
        bodyEl.appendChild(labelInput);
      } else if (child.type === "text") {
        // Placeholder for text node config
        const textSpan = document.createElement("span");
        textSpan.innerText = "Text Node";
        bodyEl.appendChild(textSpan);
      } else {
        // Fallback for unknown types
        const unknownSpan = document.createElement("span");
        unknownSpan.innerText = `Unknown type: ${child.type}`;
        bodyEl.appendChild(unknownSpan);
      }

      itemDiv.append(bodyEl);
      itemsList.appendChild(itemDiv);
    });

    currItemsContainer.appendChild(itemsList);
    return currItemsContainer;
  }

  /**
   * @param {Function} fn
   * @param {number} delay
   */
  debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  renderTree() {
    this.form.innerHTML = "";
    this.printTree("NEW");
    this.tree.children.forEach((node) => {
      this.form.append(
        node.getHtmlElement(this.isEdit, () => this.openEditSection(node.id))
      );
    });
  }
}

window.FormTree = Tree;

/**
 * TreeShape
 *
 * Node {
 *  id: Root,
 *  children [
 *    Node {
 *    type : section,
 *    id : "ID",
 *    children [
 *      Node*
 *    ]
 *    }
 * ]
 * }
 *
 *
 */
