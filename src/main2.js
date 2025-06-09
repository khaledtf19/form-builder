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

    this.layouts = [" repeat(1, 1fr);", " repeat(2, 1fr);", "repeat(3, 1fr);"];
    let title = "";

    let withBorders = false;
    this.attr = { withBorders, title, layout: this.layouts[0] };
  }
  getHtmlElement() {
    const section = document.createElement("section");
    section.id = this.id;
    section.style.width = "100%";

    section.style.display = "grid";
    section.style.gridTemplateColumns = this.attr.layout;

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
  constructor(container) {
    if (!(container instanceof Element)) {
      throw new Error("Expected an Element as the form element.");
    }
    const formElement = document.createElement("form");
    formElement.id = container.id + "Form";

    this.root = container;
    container.append(formElement);
    this.form = formElement;
    this.formId = formElement.id;

    this.tree = {
      type: "form",
      id: formElement.id,
      /**@type {NodeItem[]} */
      children: [],
    };

    this.initRoot();
    this.initForm();

    const firstSection = this.handleNewSection("First");
    this.tree.children.push(firstSection);
    const secSection = this.handleNewSection("Sec");
    this.tree.children.push(secSection);

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
    sectionIdDialog.id = "sectionIdDialog";
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

    // Add paper texture
    this.form.style.backgroundImage =
      "linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)";
    this.form.style.backgroundSize = "100% 2em";
    this.form.style.backgroundPosition = "0 1em";
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

  handleChangeSectionAttr(id) {
    const sectionNode = this.getNodeWithId(this.tree, id);
    if (!sectionNode) {
      return;
    }
    const sectionElement = document.getElementById(sectionNode.id);
  }

  /**
   * @param {NodeItemType} node this is the tree
   * @param {string} id
   * @returns {NodeItemType}
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
