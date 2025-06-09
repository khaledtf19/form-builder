"use strict";
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

    // TODO => Class
    this.layouts = ["repeat(1, 1fr)", " repeat(2, 1fr)", "repeat(3, 1fr)"];
    let title = "";

    let withBorders = false;
    this.attr = { withBorders, title, layout: this.layouts[0] };
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
   */
  constructor({ id }) {
    super({ id });
    this.type = "input";
  }

  getHtmlElement() {
    const container = document.createElement("div");
    container.classList.add("input_container");
    container.id = this.id;

    const input = document.createElement("input");
    input.id = this.id + "inputs";
    input.style.width = "100%";
    container.append(input);

    return container;
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

    const firstSection = this.handleNewSection("First");
    this.tree.children.push(firstSection);
    const secSection = this.handleNewSection("Sec");
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
          this.handlePushToChildren(
            this.formId,
            this.handleNewSection(sectionId)
          );
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
  handlePushToChildren(parentId, node) {
    const parent = this.getNodeWithId(this.tree, parentId);
    parent.children.push(node);
  }

  /**
   *
   * @param {string} id
   * @returns {NodeItemType}
   */
  handleNewSection(id) {
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
    container.querySelector(".formBuilder_sectionEdit_btns_close").onclick =
      () => {
        container.dataset.isOpen = "false";
      };

    this.root.append(container);
    this.editSectionContainer = container;
  }

  openEditSection(id) {
    const sectionNode = this.getNodeWithId(this.tree, id);

    if (!sectionNode) {
      throw new Error("This Section Not found");
    }

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
    layoutsContainer.append(layouts);

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
