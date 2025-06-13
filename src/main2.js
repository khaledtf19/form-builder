"use strict";
import {
  computePosition,
  flip,
  shift,
  offset,
} from "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.1/+esm";

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

  createTextInput(value) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = value || "";
    return input;
  }

  createCheckbox(checked, label) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "8px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checked || false;

    if (label) {
      const labelEl = document.createElement("label");
      labelEl.textContent = label;
      labelEl.style.fontSize = "14px";
      labelEl.style.color = "#444";
      container.appendChild(checkbox);
      container.appendChild(labelEl);
    } else {
      container.appendChild(checkbox);
    }

    return container;
  }

  createConfigGroup(label) {
    const container = document.createElement("div");
    container.classList.add("formBuilder_configDialog_group");

    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    container.appendChild(labelEl);

    return container;
  }

  createSelect(options, value) {
    const select = document.createElement("select");
    options.forEach((option) => {
      const optionEl = document.createElement("option");
      optionEl.value = option;
      optionEl.textContent = option;
      select.appendChild(optionEl);
    });
    select.value = value;
    return select;
  }

  getEditItemElement() {
    // TODO for every Node
    return document.createElement("div");
  }

  getConfigBodyElement() {
    // TODO for every Node
    return document.createElement("div");
  }

  createColorInput(value) {
    const input = document.createElement("input");
    input.type = "color";
    input.value = value || "#000000";
    return input;
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
      "repeat(4, minmax(0, 1fr))",
    ];

    // make sure you have the class names in the css
    this.gapsX = ["noGapX", "gapX1", "gapX2", "gapX3", "gapX4"];
    this.gapsY = ["noGapY", "gapY1", "gapY2", "gapY3", "gapY4"];

    this.currGapX = this.gapsX[0];
    this.currGapY = this.gapsY[0];

    this.childrenTypes = [
      "Input",
      "Text",
      "Checkbox",
      "Radio",
      "Select",
      "Date",
    ];

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
      case "Text":
        this.addNewTextToSection(this.countMap.get(type));
        break;
      case "Checkbox":
        this.addNewCheckboxToSection(this.countMap.get(type));
        break;
      case "Radio":
        this.addNewRadioToSection(this.countMap.get(type));
        break;
      case "Select":
        this.addNewSelectToSection(this.countMap.get(type));
        break;
      case "Date":
        this.addNewDateToSection(this.countMap.get(type));
        break;
      default:
        break;
    }

    // this.countMap.set(type, Math.max(0, currentCount - 1));
  }

  addNewInputToSection(count) {
    const inputNode = new InputNode({ id: this.id, count: count });
    this.pushToChildren(inputNode);
  }

  addNewTextToSection(count) {
    const textNode = new TextNode({ id: this.id, count: count });
    this.pushToChildren(textNode);
  }

  addNewCheckboxToSection(count) {
    const checkboxNode = new CheckboxNode({ id: this.id, count: count });
    this.pushToChildren(checkboxNode);
  }

  addNewRadioToSection(count) {
    const radioNode = new RadioNode({ id: this.id, count: count });
    this.pushToChildren(radioNode);
  }

  addNewSelectToSection(count) {
    const selectNode = new SelectNode({ id: this.id, count: count });
    this.pushToChildren(selectNode);
  }

  addNewDateToSection(count) {
    const dateNode = new DateNode({ id: this.id, count: count });
    this.pushToChildren(dateNode);
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

      // Remove any existing tooltips
      const existingTooltips = document.querySelectorAll(
        ".formBuilder_section_tooltip"
      );
      existingTooltips.forEach((tooltip) => tooltip.remove());

      // Create tooltip
      const tooltip = document.createElement("div");
      tooltip.classList.add("formBuilder_section_tooltip");
      tooltip.textContent = this.id;
      tooltip.style.position = "absolute";
      tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      tooltip.style.color = "white";
      tooltip.style.padding = "4px 8px";
      tooltip.style.borderRadius = "4px";
      tooltip.style.fontSize = "12px";
      tooltip.style.pointerEvents = "none";
      tooltip.style.opacity = "0";
      tooltip.style.transition = "opacity 0.2s ease";
      tooltip.style.zIndex = "1000";
      tooltip.style.whiteSpace = "nowrap";

      // Add tooltip to document body

      // Show tooltip on hover
      editPoint.addEventListener("mouseenter", () => {
        document.body.appendChild(tooltip);
        tooltip.style.display = "block";
        computePosition(editPoint, tooltip, {
          placement: "top",
          middleware: [offset(4), flip(), shift({ padding: 5 })],
        }).then(({ x, y }) => {
          Object.assign(tooltip.style, {
            left: `${x}px`,
            top: `${y}px`,
            opacity: "1",
          });
        });
      });

      // Hide tooltip on mouse leave
      editPoint.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0";
        setTimeout(() => {
          tooltip.style.display = "none";
        }, 200);
      });

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
    this.inputType = "text";
    this.placeholder = "";
    this.required = false;
    this.minLength = 0;
    this.maxLength = 0;
    this.pattern = "";
    this.defaultValue = "";
    this.readOnly = false;
    this.disabled = false;
    this.validationMessage = "";
  }

  getHtmlElement() {
    const container = document.createElement("div");
    container.classList.add("formBuilder_input_container");

    if (this.withLabel) {
      const label = document.createElement("label");
      label.textContent = this.label;
      container.appendChild(label);
    }

    container.id = this.id + "Input" + this.count + "Container";

    const input = document.createElement("input");
    input.id = this.id + "Input" + this.count;
    input.type = this.inputType;
    input.style.width = "100%";

    // Apply all input properties
    if (this.placeholder) input.placeholder = this.placeholder;
    if (this.required) input.required = true;
    if (this.minLength) input.minLength = this.minLength;
    if (this.maxLength) input.maxLength = this.maxLength;
    if (this.pattern) input.pattern = this.pattern;
    if (this.defaultValue) input.value = this.defaultValue;
    if (this.readOnly) input.readOnly = true;
    if (this.disabled) input.disabled = true;
    if (this.validationMessage) input.title = this.validationMessage;

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

  createNumberInput(value, placeholder) {
    const input = document.createElement("input");
    input.type = "number";
    input.value = value || "";
    input.placeholder = placeholder;
    return input;
  }

  /**
   * @param {HTMLDivElement} container
   */
  getConfigBodyElement(container, renderTree) {
    // Label
    const labelContainer = this.createConfigGroup("Label");

    // Label Checkbox
    const labelCheckbox = this.createCheckbox(this.withLabel, "Show Label");
    labelCheckbox.onchange = (e) => {
      this.withLabel = e.target.checked;
      renderTree();
    };

    labelContainer.appendChild(labelCheckbox);

    // Label Text Input
    const labelTextInput = this.createTextInput(this.label);
    labelTextInput.placeholder = "Enter label text";
    labelTextInput.onchange = (e) => {
      this.label = e.target.value;
      renderTree();
    };
    labelContainer.appendChild(labelTextInput);

    if (this.withLabel) {
    }

    container.appendChild(labelContainer);

    // Input Type
    const inputTypeContainer = this.createConfigGroup("Input Type");
    const typeSelect = this.createSelect(
      ["text", "number", "email", "password", "tel", "url"],
      this.inputType
    );
    typeSelect.onchange = (e) => {
      this.inputType = e.target.value;
      renderTree();
    };
    inputTypeContainer.appendChild(typeSelect);
    container.appendChild(inputTypeContainer);

    // Placeholder
    const placeholderContainer = this.createConfigGroup("Placeholder");
    const placeholderInput = this.createTextInput(this.placeholder);
    placeholderInput.onchange = (e) => {
      this.placeholder = e.target.value;
      renderTree();
    };
    placeholderContainer.appendChild(placeholderInput);
    container.appendChild(placeholderContainer);

    // All Checkboxes Group
    const checkboxesGroup = this.createConfigGroup("Options");
    checkboxesGroup.style.display = "flex";
    checkboxesGroup.style.flexDirection = "column";
    checkboxesGroup.style.gap = "12px";

    // Required
    const requiredCheckbox = this.createCheckbox(
      this.required,
      "Required field"
    );
    requiredCheckbox.onchange = (e) => {
      this.required = e.target.checked;
      renderTree();
    };
    checkboxesGroup.appendChild(requiredCheckbox);

    // Read Only
    const readOnlyCheckbox = this.createCheckbox(this.readOnly, "Read Only");
    readOnlyCheckbox.onchange = (e) => {
      this.readOnly = e.target.checked;
      renderTree();
    };
    checkboxesGroup.appendChild(readOnlyCheckbox);

    // Disabled
    const disabledCheckbox = this.createCheckbox(this.disabled, "Disabled");
    disabledCheckbox.onchange = (e) => {
      this.disabled = e.target.checked;
      renderTree();
    };
    checkboxesGroup.appendChild(disabledCheckbox);

    container.appendChild(checkboxesGroup);

    // Min/Max Length
    const lengthContainer = this.createConfigGroup("Length Constraints");
    const minLengthInput = this.createNumberInput(this.minLength, "Min Length");
    const maxLengthInput = this.createNumberInput(this.maxLength, "Max Length");
    minLengthInput.onchange = (e) => {
      this.minLength = parseInt(e.target.value) || 0;
      renderTree();
    };
    maxLengthInput.onchange = (e) => {
      this.maxLength = parseInt(e.target.value) || 0;
      renderTree();
    };
    lengthContainer.appendChild(minLengthInput);
    lengthContainer.appendChild(maxLengthInput);
    container.appendChild(lengthContainer);

    // Pattern
    const patternContainer = this.createConfigGroup("Validation Pattern");
    const patternInput = this.createTextInput(this.pattern);
    patternInput.placeholder = "Enter regex pattern";
    patternInput.onchange = (e) => {
      this.pattern = e.target.value;
      renderTree();
    };
    patternContainer.appendChild(patternInput);
    container.appendChild(patternContainer);

    // Default Value
    const defaultValueContainer = this.createConfigGroup("Default Value");
    const defaultValueInput = this.createTextInput(this.defaultValue);
    defaultValueInput.onchange = (e) => {
      this.defaultValue = e.target.value;
      renderTree();
    };
    defaultValueContainer.appendChild(defaultValueInput);
    container.appendChild(defaultValueContainer);

    // Validation Message
    const validationContainer = this.createConfigGroup("Validation Message");
    const validationInput = this.createTextInput(this.validationMessage);
    validationInput.onchange = (e) => {
      this.validationMessage = e.target.value;
      renderTree();
    };
    validationContainer.appendChild(validationInput);
    container.appendChild(validationContainer);
  }
}

class TextNode extends NodeItem {
  /**
   * @constructor
   * @param {Object} obj - The object containing initialization properties.
   * @param {string} obj.id - The unique identifier for the node.
   * @param {number} obj.count - The count of this type in the section.
   */
  constructor({ id, count }) {
    super({ id });
    this.type = "text";
    this.count = count || 0;
    this.text = "Text";
    this.textStyle = "normal";
    this.fontSize = "16px";
    this.textColor = "#000000";
    this.textAlign = "left";
    this.lineHeight = "1.5";
    this.margin = "0";
    this.padding = "0";
    this.customClass = "";
    this.textTransform = "none";
  }

  getHtmlElement() {
    const container = document.createElement("div");
    container.classList.add("formBuilder_text_container");
    if (this.customClass) container.classList.add(this.customClass);

    container.id = this.id + "Text" + this.count + "Container";

    const text = document.createElement("p");
    text.id = this.id + "Text" + this.count;
    text.innerText = this.text;

    // Apply all text properties
    text.style.fontWeight = this.textStyle === "bold" ? "bold" : "normal";
    text.style.fontStyle = this.textStyle === "italic" ? "italic" : "normal";
    text.style.textDecoration =
      this.textStyle === "underline" ? "underline" : "none";
    text.style.fontSize = this.fontSize;
    text.style.color = this.textColor;
    text.style.textAlign = this.textAlign;
    text.style.lineHeight = this.lineHeight;
    text.style.margin = this.margin;
    text.style.padding = this.padding;
    text.style.textTransform = this.textTransform;

    container.append(text);

    return container;
  }

  /**
   * @param {string} newText
   */
  changeText(newText) {
    this.text = newText;
  }

  /**
   * @param {HTMLDivElement} container
   * @param {Function} renderTree
   */
  getConfigBodyElement(container, renderTree) {
    // Text Style
    const styleContainer = this.createConfigGroup("Text Style");
    const styleSelect = this.createSelect(
      ["normal", "bold", "italic", "underline"],
      this.textStyle
    );
    styleSelect.onchange = (e) => {
      this.textStyle = e.target.value;
      renderTree();
    };
    styleContainer.appendChild(styleSelect);
    container.appendChild(styleContainer);

    // Font Size
    const fontSizeContainer = this.createConfigGroup("Font Size");
    const fontSizeInput = this.createTextInput(this.fontSize);
    fontSizeInput.onchange = (e) => {
      this.fontSize = e.target.value;
      renderTree();
    };
    fontSizeContainer.appendChild(fontSizeInput);
    container.appendChild(fontSizeContainer);

    // Text Color
    const colorContainer = this.createConfigGroup("Text Color");
    const colorInput = this.createColorInput(this.textColor);
    colorInput.onchange = (e) => {
      this.textColor = e.target.value;
      renderTree();
    };
    colorContainer.appendChild(colorInput);
    container.appendChild(colorContainer);

    // Text Align
    const alignContainer = this.createConfigGroup("Text Alignment");
    const alignSelect = this.createSelect(
      ["left", "center", "right"],
      this.textAlign
    );
    alignSelect.onchange = (e) => {
      this.textAlign = e.target.value;
      renderTree();
    };
    alignContainer.appendChild(alignSelect);
    container.appendChild(alignContainer);

    // Line Height
    const lineHeightContainer = this.createConfigGroup("Line Height");
    const lineHeightInput = this.createTextInput(this.lineHeight);
    lineHeightInput.onchange = (e) => {
      this.lineHeight = e.target.value;
      renderTree();
    };
    lineHeightContainer.appendChild(lineHeightInput);
    container.appendChild(lineHeightContainer);

    // Margin
    const marginContainer = this.createConfigGroup("Margin");
    const marginInput = this.createTextInput(this.margin);
    marginInput.onchange = (e) => {
      this.margin = e.target.value;
      renderTree();
    };
    marginContainer.appendChild(marginInput);
    container.appendChild(marginContainer);

    // Padding
    const paddingContainer = this.createConfigGroup("Padding");
    const paddingInput = this.createTextInput(this.padding);
    paddingInput.onchange = (e) => {
      this.padding = e.target.value;
      renderTree();
    };
    paddingContainer.appendChild(paddingInput);
    container.appendChild(paddingContainer);

    // Custom Class
    const classContainer = this.createConfigGroup("Custom Class");
    const classInput = this.createTextInput(this.customClass);
    classInput.onchange = (e) => {
      this.customClass = e.target.value;
      renderTree();
    };
    classContainer.appendChild(classInput);
    container.appendChild(classContainer);

    // Text Transform
    const transformContainer = this.createConfigGroup("Text Transform");
    const transformSelect = this.createSelect(
      ["none", "uppercase", "lowercase", "capitalize"],
      this.textTransform
    );
    transformSelect.onchange = (e) => {
      this.textTransform = e.target.value;
      renderTree();
    };
    transformContainer.appendChild(transformSelect);
    container.appendChild(transformContainer);
  }
}

class CheckboxNode extends NodeItem {
  /**
   * @constructor
   * @param {Object} obj - The object containing initialization properties.
   * @param {string} obj.id - The unique identifier for the node.
   * @param {number} obj.count - The count of this type in the section.
   */
  constructor({ id, count }) {
    super({ id });
    this.type = "checkbox";
    this.count = count || 0;

    this.withLabel = false;
    this.label = "Label";
    this.value = "value";
    this.checked = false;
    this.required = false;
    this.disabled = false;
    this.customClass = "";
    this.groupName = "";
    this.indeterminate = false;
    this.validationMessage = "";
  }

  getHtmlElement() {
    const container = document.createElement("div");
    container.classList.add("formBuilder_checkbox_container");
    if (this.customClass) container.classList.add(this.customClass);

    container.id = this.id + "Checkbox" + this.count + "Container";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = this.id + "Checkbox" + this.count;
    checkbox.checked = this.checked;
    checkbox.required = this.required;
    checkbox.disabled = this.disabled;
    checkbox.indeterminate = this.indeterminate;
    checkbox.value = this.value;
    if (this.groupName) checkbox.name = this.groupName;
    if (this.validationMessage) checkbox.title = this.validationMessage;
    container.append(checkbox);

    if (this.withLabel) {
      const label = document.createElement("label");
      label.innerText = this.label;
      label.htmlFor = checkbox.id;
      container.append(label);
    }

    return container;
  }

  /**
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

  /**
   * @param {boolean} checked
   */
  setChecked(checked) {
    this.checked = checked;
  }

  /**
   * @param {HTMLDivElement} container
   * @param {Function} renderTree
   */
  getConfigBodyElement(container, renderTree) {
    // Label
    const labelContainer = this.createConfigGroup("Label");

    // Label Checkbox
    const labelCheckbox = this.createCheckbox(this.withLabel, "Show Label");
    labelCheckbox.onchange = (e) => {
      this.withLabel = e.target.checked;
      renderTree();
    };
    labelContainer.appendChild(labelCheckbox);

    // Label Text Input
    const labelTextInput = this.createTextInput(this.label);
    labelTextInput.placeholder = "Enter label text";
    labelTextInput.onchange = (e) => {
      this.label = e.target.value;
      renderTree();
    };
    labelContainer.appendChild(labelTextInput);

    container.appendChild(labelContainer);

    // Value
    const valueContainer = this.createConfigGroup("Value");
    const valueInput = this.createTextInput(this.value);
    valueInput.onchange = (e) => {
      this.value = e.target.value;
      renderTree();
    };
    valueContainer.appendChild(valueInput);
    container.appendChild(valueContainer);

    // All Checkboxes Group
    const checkboxesGroup = this.createConfigGroup("Options");
    checkboxesGroup.style.display = "flex";
    checkboxesGroup.style.flexDirection = "column";
    checkboxesGroup.style.gap = "12px";

    // Required
    const requiredCheckbox = this.createCheckbox(
      this.required,
      "Required field"
    );
    requiredCheckbox.onchange = (e) => {
      this.required = e.target.checked;
      renderTree();
    };
    checkboxesGroup.appendChild(requiredCheckbox);

    // Disabled
    const disabledCheckbox = this.createCheckbox(this.disabled, "Disabled");
    disabledCheckbox.onchange = (e) => {
      this.disabled = e.target.checked;
      renderTree();
    };
    checkboxesGroup.appendChild(disabledCheckbox);

    // Indeterminate
    const indeterminateCheckbox = this.createCheckbox(
      this.indeterminate,
      "Indeterminate state"
    );
    indeterminateCheckbox.onchange = (e) => {
      this.indeterminate = e.target.checked;
      renderTree();
    };
    checkboxesGroup.appendChild(indeterminateCheckbox);

    container.appendChild(checkboxesGroup);

    // Custom Class
    const classContainer = this.createConfigGroup("Custom Class");
    const classInput = this.createTextInput(this.customClass);
    classInput.onchange = (e) => {
      this.customClass = e.target.value;
      renderTree();
    };
    classContainer.appendChild(classInput);
    container.appendChild(classContainer);

    // Group Name
    const groupContainer = this.createConfigGroup("Group Name");
    const groupInput = this.createTextInput(this.groupName);
    groupInput.onchange = (e) => {
      this.groupName = e.target.value;
      renderTree();
    };
    groupContainer.appendChild(groupInput);
    container.appendChild(groupContainer);

    // Validation Message
    const validationContainer = this.createConfigGroup("Validation Message");
    const validationInput = this.createTextInput(this.validationMessage);
    validationInput.onchange = (e) => {
      this.validationMessage = e.target.value;
      renderTree();
    };
    validationContainer.appendChild(validationInput);
    container.appendChild(validationContainer);
  }
}

class RadioNode extends NodeItem {
  constructor({ id, count }) {
    super({ id });
    this.type = "radio";
    this.count = count || 0;

    this.withLabel = false;
    this.label = "Label";
    this.checked = false;
    this.required = false;
    this.disabled = false;
    this.customClass = "";
    this.groupName = "";
    this.validationMessage = "";
    this.options = ["Option 1", "Option 2", "Option 3"];
    this.layout = "horizontal";
  }

  getHtmlElement() {
    const container = document.createElement("div");
    container.classList.add("formBuilder_radio_container");
    if (this.customClass) container.classList.add(this.customClass);

    container.id = this.id + "Radio" + this.count + "Container";

    if (this.withLabel) {
      const label = document.createElement("label");
      label.innerText = this.label;
      container.append(label);
    }

    const optionsContainer = document.createElement("div");
    optionsContainer.classList.add("formBuilder_radio_options");
    optionsContainer.classList.add(this.layout);

    this.options.forEach((option, index) => {
      const optionContainer = document.createElement("div");
      optionContainer.classList.add("formBuilder_radio_option");

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.id = this.id + "Radio" + this.count + "_" + index;
      radio.name = this.groupName || this.id + "Radio" + this.count;
      radio.value = option;
      radio.checked = index === 0 && this.checked;
      radio.required = this.required;
      radio.disabled = this.disabled;
      if (this.validationMessage) radio.title = this.validationMessage;

      const optionLabel = document.createElement("label");
      optionLabel.htmlFor = radio.id;
      optionLabel.innerText = option;

      optionContainer.append(radio, optionLabel);
      optionsContainer.append(optionContainer);
    });

    container.append(optionsContainer);
    return container;
  }

  toggleWithLabel(fn) {
    this.withLabel = !this.withLabel;
    if (fn) {
      fn();
    }
  }

  changeCurrLabel(newLabel) {
    this.label = newLabel;
  }

  addOption(option) {
    this.options.push(option);
  }

  removeOption(index) {
    this.options.splice(index, 1);
  }

  updateOption(index, newValue) {
    if (index >= 0 && index < this.options.length) {
      this.options[index] = newValue;
    }
  }
}

class SelectNode extends NodeItem {
  constructor({ id, count }) {
    super({ id });
    this.type = "select";
    this.count = count || 0;

    this.withLabel = false;
    this.label = "Label";
    this.required = false;
    this.disabled = false;
    this.customClass = "";
    this.validationMessage = "";
    this.options = [
      { label: "Option 1", value: "option1" },
      { label: "Option 2", value: "option2" },
      { label: "Option 3", value: "option3" },
    ];
    this.multiple = false;
  }

  getHtmlElement() {
    const container = document.createElement("div");
    container.classList.add("formBuilder_select_container");
    if (this.customClass) container.classList.add(this.customClass);

    container.id = this.id + "Select" + this.count + "Container";

    if (this.withLabel) {
      const label = document.createElement("label");
      label.innerText = this.label;
      container.append(label);
    }

    const select = document.createElement("select");
    select.id = this.id + "Select" + this.count;
    select.required = this.required;
    select.disabled = this.disabled;
    select.multiple = this.multiple;
    if (this.validationMessage) select.title = this.validationMessage;

    this.options.forEach((option) => {
      const optionEl = document.createElement("option");
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      select.append(optionEl);
    });

    container.append(select);
    return container;
  }

  toggleWithLabel(fn) {
    this.withLabel = !this.withLabel;
    if (fn) {
      fn();
    }
  }

  changeCurrLabel(newLabel) {
    this.label = newLabel;
  }

  addOption(label, value) {
    this.options.push({ label, value });
  }

  removeOption(index) {
    this.options.splice(index, 1);
  }

  updateOption(index, label, value) {
    if (index >= 0 && index < this.options.length) {
      this.options[index] = { label, value };
    }
  }

  /**
   * @param {HTMLDivElement} container
   * @param {Function} renderTree
   */
  getConfigBodyElement(container, renderTree) {
    // Label
    const labelContainer = this.createConfigGroup("Label");

    // Label Checkbox
    const labelCheckbox = this.createCheckbox(this.withLabel, "Show Label");
    labelCheckbox.onchange = (e) => {
      this.withLabel = e.target.checked;
      renderTree();
    };
    labelContainer.appendChild(labelCheckbox);

    // Label Text Input
    const labelTextInput = this.createTextInput(this.label);
    labelTextInput.placeholder = "Enter label text";
    labelTextInput.onchange = (e) => {
      this.label = e.target.value;
      renderTree();
    };
    labelContainer.appendChild(labelTextInput);

    container.appendChild(labelContainer);

    // All Checkboxes Group
    const checkboxesGroup = this.createConfigGroup("Options");
    checkboxesGroup.style.display = "flex";
    checkboxesGroup.style.flexDirection = "column";
    checkboxesGroup.style.gap = "12px";

    // Required
    const requiredCheckbox = this.createCheckbox(
      this.required,
      "Required field"
    );
    requiredCheckbox.onchange = (e) => {
      this.required = e.target.checked;
      renderTree();
    };
    checkboxesGroup.appendChild(requiredCheckbox);

    // Disabled
    const disabledCheckbox = this.createCheckbox(this.disabled, "Disabled");
    disabledCheckbox.onchange = (e) => {
      this.disabled = e.target.checked;
      renderTree();
    };
    checkboxesGroup.appendChild(disabledCheckbox);

    // Multiple
    const multipleCheckbox = this.createCheckbox(
      this.multiple,
      "Allow multiple selection"
    );
    multipleCheckbox.onchange = (e) => {
      this.multiple = e.target.checked;
      renderTree();
    };
    checkboxesGroup.appendChild(multipleCheckbox);

    container.appendChild(checkboxesGroup);

    // Options
    const optionsContainer = this.createConfigGroup("Options");
    const optionsList = document.createElement("div");
    optionsList.classList.add("formBuilder_configDialog_options_list");

    this.options.forEach((option, index) => {
      const optionContainer = document.createElement("div");
      optionContainer.classList.add("formBuilder_configDialog_option_item");

      const labelInput = this.createTextInput(option.label);
      labelInput.placeholder = "Label";
      labelInput.onchange = (e) => {
        this.updateOption(index, e.target.value, option.value);
        renderTree();
      };

      const valueInput = this.createTextInput(option.value);
      valueInput.placeholder = "Value";
      valueInput.onchange = (e) => {
        this.updateOption(index, option.label, e.target.value);
        renderTree();
      };

      const removeButton = document.createElement("button");
      removeButton.innerHTML = "×";
      removeButton.classList.add("formBuilder_configDialog_option_remove");
      removeButton.onclick = () => {
        this.removeOption(index);
        renderTree();
        // Optionally, re-open dialog if needed
      };

      optionContainer.appendChild(labelInput);
      optionContainer.appendChild(valueInput);
      optionContainer.appendChild(removeButton);
      optionsList.appendChild(optionContainer);
    });

    const addOptionButton = document.createElement("button");
    addOptionButton.textContent = "Add Option";
    addOptionButton.classList.add("formBuilder_configDialog_add_option");
    addOptionButton.onclick = () => {
      const newLabel = "New Option";
      const newValue = "new_option_" + (this.options.length + 1);
      this.addOption(newLabel, newValue);
      renderTree();
      // Optionally, re-open dialog if needed
    };

    optionsContainer.appendChild(optionsList);
    optionsContainer.appendChild(addOptionButton);
    container.appendChild(optionsContainer);
  }
}

class DateNode extends NodeItem {
  constructor({ id, count }) {
    super({ id });
    this.type = "date";
    this.count = count || 0;

    this.withLabel = false;
    this.label = "Label";
    this.required = false;
    this.disabled = false;
    this.customClass = "";
    this.validationMessage = "";
    this.minDate = "";
    this.maxDate = "";
    this.defaultValue = "";
    this.format = "YYYY-MM-DD";
  }

  getHtmlElement() {
    const container = document.createElement("div");
    container.classList.add("formBuilder_input_container");

    if (this.withLabel) {
      const label = document.createElement("label");
      label.textContent = this.label;
      container.appendChild(label);
    }

    const input = document.createElement("input");
    input.type = "date";
    input.id = this.id;
    input.name = this.id;
    input.required = this.required;
    input.disabled = this.disabled;
    input.value = this.defaultValue;
    input.min = this.minDate;
    input.max = this.maxDate;
    input.className = this.customClass;

    if (this.validationMessage) {
      input.setCustomValidity(this.validationMessage);
    }

    container.appendChild(input);
    return container;
  }

  toggleWithLabel(fn) {
    this.withLabel = !this.withLabel;
    if (fn) {
      fn();
    }
  }

  changeCurrLabel(newLabel) {
    this.label = newLabel;
  }

  getConfigBodyElement(container, renderTree) {
    // Label
    const labelContainer = this.createConfigGroup("Label");

    // Label Checkbox
    const labelCheckbox = this.createCheckbox(this.withLabel, "Show Label");
    labelCheckbox.onchange = (e) => {
      this.withLabel = e.target.checked;
      renderTree();
    };
    labelContainer.appendChild(labelCheckbox);

    // Label Text Input
    const labelTextInput = this.createTextInput(this.label);
    labelTextInput.placeholder = "Enter label text";
    labelTextInput.onchange = (e) => {
      this.label = e.target.value;
      renderTree();
    };
    labelContainer.appendChild(labelTextInput);

    container.appendChild(labelContainer);

    // All Checkboxes Group
    const checkboxesGroup = this.createConfigGroup("Options");
    checkboxesGroup.style.display = "flex";
    checkboxesGroup.style.flexDirection = "column";
    checkboxesGroup.style.gap = "12px";

    // Required
    const requiredCheckbox = this.createCheckbox(
      this.required,
      "Required field"
    );
    requiredCheckbox.onchange = (e) => {
      this.required = e.target.checked;
      renderTree();
    };
    checkboxesGroup.appendChild(requiredCheckbox);

    // Disabled
    const disabledCheckbox = this.createCheckbox(this.disabled, "Disabled");
    disabledCheckbox.onchange = (e) => {
      this.disabled = e.target.checked;
      renderTree();
    };
    checkboxesGroup.appendChild(disabledCheckbox);

    container.appendChild(checkboxesGroup);

    // Date Range
    const dateRangeContainer = this.createConfigGroup("Date Range");
    const minDateInput = document.createElement("input");
    minDateInput.type = "date";
    minDateInput.value = this.minDate;
    minDateInput.style.marginBottom = "8px";
    minDateInput.onchange = (e) => {
      this.minDate = e.target.value;
      renderTree();
    };

    const maxDateInput = document.createElement("input");
    maxDateInput.type = "date";
    maxDateInput.value = this.maxDate;
    maxDateInput.onchange = (e) => {
      this.maxDate = e.target.value;
      renderTree();
    };

    const minDateLabel = document.createElement("label");
    minDateLabel.textContent = "Minimum Date:";
    minDateLabel.style.display = "block";
    minDateLabel.style.marginBottom = "4px";

    const maxDateLabel = document.createElement("label");
    maxDateLabel.textContent = "Maximum Date:";
    maxDateLabel.style.display = "block";
    maxDateLabel.style.marginBottom = "4px";

    dateRangeContainer.appendChild(minDateLabel);
    dateRangeContainer.appendChild(minDateInput);
    dateRangeContainer.appendChild(maxDateLabel);
    dateRangeContainer.appendChild(maxDateInput);
    container.appendChild(dateRangeContainer);

    // Default Value
    const defaultValueContainer = this.createConfigGroup("Default Value");
    const defaultValueInput = document.createElement("input");
    defaultValueInput.type = "date";
    defaultValueInput.value = this.defaultValue;
    defaultValueInput.onchange = (e) => {
      this.defaultValue = e.target.value;
      renderTree();
    };
    defaultValueContainer.appendChild(defaultValueInput);
    container.appendChild(defaultValueContainer);

    // Custom Class
    const classContainer = this.createConfigGroup("Custom Class");
    const classInput = this.createTextInput(this.customClass);
    classInput.onchange = (e) => {
      this.customClass = e.target.value;
      renderTree();
    };
    classContainer.appendChild(classInput);
    container.appendChild(classContainer);

    // Validation Message
    const validationContainer = this.createConfigGroup("Validation Message");
    const validationInput = this.createTextInput(this.validationMessage);
    validationInput.onchange = (e) => {
      this.validationMessage = e.target.value;
      renderTree();
    };
    validationContainer.appendChild(validationInput);
    container.appendChild(validationContainer);
  }
}

class Tree {
  /**
   * if isEdit True this will have edit section
   * @constructor
   * @param {HTMLElement} container
   * @param {Boolean} isEdit
   */
  constructor(container, isEdit) {
    if (!(container instanceof Element)) {
      throw new Error("Expected an Element as the form element.");
    }
    this.isEdit = isEdit || false;
    const formElement = document.createElement("form");
    formElement.classList.add("formBuilder_form");
    formElement.id = container.id + "Form";

    container.classList.add("FormBuilderRoot");

    this.root = container;
    this.initRoot();
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

    this.addEditSection();
    this.renderTree();
  }

  NodeTypes = {
    section: "section",
    input: "input",
  };

  initRoot() {
    this.root.style.position = "relative";

    const buttonsContainer = document.createElement("div");

    buttonsContainer.classList.add("formBuilder_buttonsContainer");

    const printButton = document.createElement("button");
    printButton.classList.add("formBuilder_button");
    printButton.innerText = "Print Form";

    printButton.onmouseover = () => {
      printButton.style.backgroundColor = "#45a049";
    };
    printButton.onmouseout = () => {
      printButton.style.backgroundColor = "#4CAF50";
    };

    printButton.onclick = () => {
      const editorToggle = this.root.querySelector(
        ".formBuilder_button_editForm"
      );

      if (this.isEdit && editorToggle) {
        editorToggle.click(); // Toggle edit mode off if it's on
      }
      this.printForm();
    };

    buttonsContainer.appendChild(printButton);
    if (this.isEdit) {
      const eyeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><g fill="none" stroke="#000000" stroke-width="1.5"><path d="M3.275 15.296C2.425 14.192 2 13.639 2 12c0-1.64.425-2.191 1.275-3.296C4.972 6.5 7.818 4 12 4s7.028 2.5 8.725 4.704C21.575 9.81 22 10.361 22 12c0 1.64-.425 2.191-1.275 3.296C19.028 17.5 16.182 20 12 20s-7.028-2.5-8.725-4.704Z"/><path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z"/></g></svg>`;
      const closedEyesSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="#000000" fill-rule="evenodd" d="M1.606 6.08a1 1 0 0 1 1.313.526L2 7l.92-.394v-.001l.003.009l.021.045l.094.194c.086.172.219.424.4.729a13.4 13.4 0 0 0 1.67 2.237a12 12 0 0 0 .59.592C7.18 11.8 9.251 13 12 13a8.7 8.7 0 0 0 3.22-.602c1.227-.483 2.254-1.21 3.096-1.998a13 13 0 0 0 2.733-3.725l.027-.058l.005-.011a1 1 0 0 1 1.838.788L22 7l.92.394l-.003.005l-.004.008l-.011.026l-.04.087a14 14 0 0 1-.741 1.348a15.4 15.4 0 0 1-1.711 2.256l.797.797a1 1 0 0 1-1.414 1.415l-.84-.84a12 12 0 0 1-1.897 1.256l.782 1.202a1 1 0 1 1-1.676 1.091l-.986-1.514c-.679.208-1.404.355-2.176.424V16.5a1 1 0 0 1-2 0v-1.544c-.775-.07-1.5-.217-2.177-.425l-.985 1.514a1 1 0 0 1-1.676-1.09l.782-1.203c-.7-.37-1.332-.8-1.897-1.257l-.84.84a1 1 0 0 1-1.414-1.414l.797-.797a15.4 15.4 0 0 1-1.87-2.519a14 14 0 0 1-.591-1.107l-.033-.072l-.01-.021l-.002-.007l-.001-.002v-.001C1.08 7.395 1.08 7.394 2 7l-.919.395a1 1 0 0 1 .525-1.314" clip-rule="evenodd"/></svg>`;

      const toggleEditButton = document.createElement("button");
      toggleEditButton.classList.add("formBuilder_button_editForm");
      toggleEditButton.innerHTML = eyeSvg;

      toggleEditButton.onclick = () => {
        if (this.isEdit) {
          this.isEdit = false;
          toggleEditButton.innerHTML = closedEyesSvg;
          this.renderTree();
        } else {
          this.isEdit = true;
          toggleEditButton.innerHTML = eyeSvg;
          this.renderTree();
        }
      };

      buttonsContainer.appendChild(toggleEditButton);
    }

    this.root.appendChild(buttonsContainer);

    // Create config dialog
    const configDialog = document.createElement("dialog");
    configDialog.classList.add("formBuilder_configDialog");
    configDialog.id = this.root.id + "configDialog";
    configDialog.innerHTML = `
      <div class="formBuilder_configDialog_content">
        <div class="formBuilder_configDialog_header">
          <h3 class="formBuilder_configDialog_title"></h3>
          <button class="formBuilder_configDialog_close">x</button>
        </div>
        <div class="formBuilder_configDialog_body"></div>
      </div>
    `;

    this.root.append(configDialog);
    this.configDialog = configDialog;

    // Handle dialog close
    configDialog.querySelector(".formBuilder_configDialog_close").onclick =
      () => {
        configDialog.close();
      };
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

      // Add hover effect styles
      itemDiv.style.transition = "box-shadow 0.3s ease";
      itemDiv.addEventListener("mouseover", () => {
        itemDiv.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
      });
      itemDiv.addEventListener("mouseout", () => {
        itemDiv.style.boxShadow = "none";
      });

      // Add remove button
      const removeButton = document.createElement("button");
      removeButton.innerHTML = "×";
      removeButton.classList.add(
        "formBuilder_sectionEdit_body_currItems_remove"
      );
      removeButton.title = "Remove item";
      removeButton.onclick = () => {
        // Remove the child from the section
        const childIndex = node.children.findIndex((c) => c === child);
        if (childIndex !== -1) {
          node.children.splice(childIndex, 1);
          // Update the count map
          const currentCount = node.countMap.get(child.type) || 0;
          node.countMap.set(child.type, Math.max(0, currentCount - 1));

          // Remove the item from the UI
          itemDiv.remove();

          // Update the numbering of remaining items
          const remainingItems = this.editSectionContainer
            .querySelector(".formBuilder_sectionEdit_body_currItems")
            .querySelectorAll(
              ".formBuilder_sectionEdit_body_currItems_item_container"
            );
          remainingItems.forEach((item, index) => {
            const titleEl = item.querySelector("p");
            if (titleEl) {
              const type = titleEl.innerText.split("-")[1];
              titleEl.innerText = `${index + 1}-${type}`;
            }
          });

          this.renderTree();
        }
      };
      itemDiv.appendChild(removeButton);

      // Add more config button
      const configButton = document.createElement("button");
      configButton.innerHTML = "⚙";
      configButton.classList.add(
        "formBuilder_sectionEdit_body_currItems_config"
      );
      configButton.title = "More configuration";
      configButton.onclick = () => {
        this.openConfigDialog(child);
      };
      itemDiv.appendChild(configButton);

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

          this.renderTree();
        };

        withLabelContainer.appendChild(withLabelCheckbox);
        withLabelContainer.appendChild(withLabelText);

        bodyEl.appendChild(withLabelContainer);

        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.value = child.label || "";
        labelInput.placeholder = "Label text";
        labelInput.style.marginLeft = "5px";
        labelInput.style.width = "100px";
        labelInput.style.visibility = "hidden";
        labelInput.oninput = (e) => {
          child.label = e.target.value;
          this.debounce(this.renderTree(), 100);
        };
        if (child.withLabel) {
          labelInput.style.visibility = "visible";
        }
        bodyEl.appendChild(labelInput);
      } else if (child.type === "text") {
        // Text node config
        const textContentContainer = document.createElement("div");
        textContentContainer.style.width = "100%";

        const textContentLabel = document.createElement("label");
        textContentLabel.innerText = "Text Content:";
        textContentLabel.style.display = "block";
        textContentLabel.style.marginBottom = "5px";

        const textContentInput = document.createElement("textarea");
        textContentInput.value = child.text;
        textContentInput.style.width = "100%";
        textContentInput.style.minHeight = "60px";
        textContentInput.style.padding = "5px";
        textContentInput.style.resize = "vertical";

        textContentInput.oninput = (e) => {
          child.text = e.target.value;
          this.debounce(this.renderTree(), 100);
        };

        textContentContainer.appendChild(textContentLabel);
        textContentContainer.appendChild(textContentInput);
        bodyEl.appendChild(textContentContainer);
      } else if (child.type === "checkbox") {
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
          if (!child.withLabel) {
            child.label = "";
          }

          if (withLabelCheckbox.checked) {
            labelInput.style.visibility = "visible";
          } else {
            labelInput.style.visibility = "hidden";
          }

          this.renderTree();
        };

        withLabelContainer.appendChild(withLabelCheckbox);
        withLabelContainer.appendChild(withLabelText);
        bodyEl.appendChild(withLabelContainer);

        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.value = child.label || "";
        labelInput.placeholder = "Label text";
        labelInput.style.marginLeft = "5px";
        labelInput.style.width = "100px";
        labelInput.style.visibility = "hidden";
        labelInput.oninput = (e) => {
          child.label = e.target.value;
          this.debounce(this.renderTree(), 100);
        };
        bodyEl.appendChild(labelInput);

        // Add checkbox state toggle
        const checkboxStateContainer = document.createElement("div");
        checkboxStateContainer.style.marginTop = "10px";
        checkboxStateContainer.style.display = "flex";
        checkboxStateContainer.style.alignItems = "center";
        checkboxStateContainer.style.gap = "5px";

        const checkboxStateLabel = document.createElement("label");
        checkboxStateLabel.innerText = "Default State:";

        const checkboxStateToggle = document.createElement("input");
        checkboxStateToggle.type = "checkbox";
        checkboxStateToggle.checked = child.checked;
        checkboxStateToggle.onchange = (e) => {
          child.checked = e.target.checked;
          this.renderTree();
        };

        checkboxStateContainer.appendChild(checkboxStateLabel);
        checkboxStateContainer.appendChild(checkboxStateToggle);
        bodyEl.appendChild(checkboxStateContainer);
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

  getAddSectionButtonElement() {
    const AddSectionButton = document.createElement("button");
    AddSectionButton.classList.add("formBuilder_form_addSectionBtn");
    AddSectionButton.type = "button";
    AddSectionButton.innerText = "New Section";

    // Create floating menu
    const floatingMenu = document.createElement("div");
    floatingMenu.classList.add("formBuilder_form_addSectionBtn_floatingMenu");
    floatingMenu.style.display = "none";

    // Create input container
    const inputContainer = document.createElement("div");
    inputContainer.classList.add(
      "formBuilder_form_addSectionBtn_inputContainer"
    );

    const label = document.createElement("label");
    label.textContent = "Section ID:";
    label.classList.add("formBuilder_form_addSectionBtn_label");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter section ID";
    input.classList.add("formBuilder_form_addSectionBtn_input");

    inputContainer.appendChild(label);
    inputContainer.appendChild(input);

    // Create buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add(
      "formBuilder_form_addSectionBtn_buttonsContainer"
    );

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.classList.add("formBuilder_form_addSectionBtn_cancelButton");

    const addButton = document.createElement("button");
    addButton.textContent = "Add";
    addButton.classList.add("formBuilder_form_addSectionBtn_addButton");

    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(addButton);

    floatingMenu.appendChild(inputContainer);
    floatingMenu.appendChild(buttonsContainer);

    // Add hover effect to the button
    AddSectionButton.addEventListener("mouseover", () => {
      AddSectionButton.style.backgroundColor = "#45a049";
    });

    AddSectionButton.addEventListener("mouseout", () => {
      AddSectionButton.style.backgroundColor = "#4CAF50";
    });

    // Show/hide floating menu
    let isMenuVisible = false;

    const showMenu = () => {
      floatingMenu.style.display = "block";
      // Position the menu
      computePosition(AddSectionButton, floatingMenu, {
        placement: "bottom",
        middleware: [
          offset(8), // 8px gap between button and menu
          flip(), // Flip to top if not enough space below
          shift({ padding: 8 }), // Shift if too close to viewport edge
        ],
      }).then(({ x, y }) => {
        Object.assign(floatingMenu.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });

      // Trigger animation
      requestAnimationFrame(() => {
        floatingMenu.classList.add("visible");
      });
      isMenuVisible = true;
    };

    const hideMenu = () => {
      floatingMenu.classList.remove("visible");
      setTimeout(() => {
        floatingMenu.style.display = "none";
      }, 200); // Match transition duration
      isMenuVisible = false;
    };

    AddSectionButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isMenuVisible) {
        showMenu();
        input.focus();
      } else {
        hideMenu();
      }
    });

    // Handle clicks outside
    document.addEventListener("click", (e) => {
      if (
        isMenuVisible &&
        !floatingMenu.contains(e.target) &&
        e.target !== AddSectionButton
      ) {
        hideMenu();
      }
    });

    // Handle form submission
    addButton.addEventListener("click", () => {
      const sectionId = input.value.trim();
      const node = this.getNodeWithId(this.tree, sectionId);
      if (node) {
        alert("Section with this ID already exists.");
        return;
      }
      if (sectionId) {
        this.pushToChildren(this.formId, this.getNewSection(sectionId));
        this.renderTree();
        input.value = "";
        hideMenu();
      }
    });

    cancelButton.addEventListener("click", () => {
      input.value = "";
      hideMenu();
    });

    // Handle Enter key
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addButton.click();
      } else if (e.key === "Escape") {
        hideMenu();
      }
    });

    this.root.append(floatingMenu);
    return AddSectionButton;
  }

  renderTree() {
    this.form.innerHTML = "";
    this.printTree("NEW");
    this.tree.children.forEach((node) => {
      this.form.append(
        node.getHtmlElement(this.isEdit, () => this.openEditSection(node.id))
      );
    });
    if (this.isEdit) {
      this.form.append(this.getAddSectionButtonElement());
    }
  }

  /**
   * @param {NodeItem} node
   */
  openConfigDialog(node) {
    const dialog = this.configDialog;
    const title = dialog.querySelector(".formBuilder_configDialog_title");
    const body = dialog.querySelector(".formBuilder_configDialog_body");

    // Set title based on node type
    title.textContent = `${
      node.type.charAt(0).toUpperCase() + node.type.slice(1)
    } Configuration`;

    // Clear previous content
    body.innerHTML = "";

    // Add type-specific configuration
    node.getConfigBodyElement(body, () => this.renderTree());

    dialog.showModal();
  }
  printForm() {
    printJS({
      printable: this.formId,
      type: "html",
      targetStyles: ["*"],
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
// TODO Make every node to handle the render config Body instead of handling it on the section !!!!
