import { LightningElement, api, track } from "lwc";
export default class MultiSelectPicklist extends LightningElement {
  @api colors;
  @api label = "Default label";
  @api type;
  @api copy = false;
  _disabled = false;
  @api
  get disabled() {
    return this._disabled;
  }
  set disabled(value) {
    this._disabled = value;
    this.handleDisabled();
  }
  @track inputOptions = [];
  @api
  get options() {
    return this.inputOptions.filter((option) => option.value !== "None");
  }
  set options(value) {
    let options = [
      {
        value: "None",
        label: "None"
      }
    ];
    this.inputOptions = options.concat(value);
    console.log(value);
  }
  @api
  clear() {
    this.handleAllOption();
  }

  @api
  handlePillColors() {
    let pills = this.template.querySelectorAll('.slds-pill');
    console.log(pills.length, 'pl');
    for(let i = 0; i < pills.length; i++) {
      let pill = pills[i];
      console.log(this.colors, this.colors[pill.dataset.id]);
      pill.style.backgroundColor = this.colors[pill.dataset.id];
    }
  }

  value = [];
  selectedLabels = [];
  @track inputValue = "None";
  hasRendered;
  renderedCallback() {
    if (!this.hasRendered) {
      this.handleDisabled();
    }
    this.hasRendered = true;
  }
  handleDisabled() {
    let input = this.template.querySelector("input");
    if (input) {
      input.disabled = this.disabled;
    }
  }
  comboboxIsRendered;
  handleClick() {
    let sldsCombobox = this.template.querySelector(".slds-combobox");
    sldsCombobox.classList.toggle("slds-is-open");
    if (!this.comboboxIsRendered) {
      let allOption = this.template.querySelector('[data-id="None"]');
      allOption.firstChild.classList.add("slds-is-selected");
      this.comboboxIsRendered = true;
    }
  }
  handleSelection(event) {
    let value = event.currentTarget.dataset.value;
    console.log(value, "postvalue");
    if (value === "None") {
      this.handleAllOption();
    } else {
      this.handleOption(event, value);
    }
    let input = this.template.querySelector("input");
    input.focus();
    this.sendValues();
  }
  
  sendValues() {
    let values = [];
    console.log(JSON.parse(JSON.stringify(this.value)), "testError1");
    for (const valueObject of this.value) {
      values.push(valueObject.value);
    }
    this.dispatchEvent(
      new CustomEvent("valuechange", {
        detail: values
      })
    );
  }

  removeOption(event) {
    let val = event.currentTarget.dataset.value;
    let searchString = `[data-id="` + val + `"]`;
    let currTarget = this.template.querySelectorAll(searchString);
    let tempTarget = this.template.querySelector(searchString);
    console.log(val, searchString);
    console.log(JSON.stringify(currTarget), JSON.stringify(tempTarget));
    // this.handleSelection(currTarget[0]);
    // currTarget.classList.toggle("slds-is-selected");
    // let allOption = this.template.querySelector('[data-id="None"]');
    // allOption.firstChild.classList.remove("slds-is-selected");
    // let option = this.options.find((option) => option.value === value);
    // this.value.push(option);
    currTarget[0].click();
  }

  @api
  selectMultiple(recIds, type) {
    console.log(JSON.stringify(recIds), type, this.type, 'recs');
    if(this.copy) return;
    if(this.type != type) return;
    if(recIds.length > 0) {
      this.handleAllOption();
      recIds.forEach((val) => {
        let searchString = `[data-id="` + val + `"]`;
        console.log(searchString);
        let currTarget = this.template.querySelectorAll(searchString);
        console.log(JSON.stringify(currTarget));
        currTarget[0].click();
      });
    }
  }

  handleAllOption() {
    this.value = [];
    this.inputValue = "None";
    let listBoxOptions = this.template.querySelectorAll(".slds-is-selected");
    for (let option of listBoxOptions) {
      option.classList.remove("slds-is-selected");
    }
    let allOption = this.template.querySelector('[data-id="None"]');
    allOption.firstChild.classList.add("slds-is-selected");
    this.closeDropbox();
  }
  handleOption(event, value) {
    let listBoxOption = event.currentTarget.firstChild;
    if (listBoxOption.classList.contains("slds-is-selected")) {
      this.value = this.value.filter((option) => option.value !== value);
    } else {
      let allOption = this.template.querySelector('[data-id="None"]');
      allOption.firstChild.classList.remove("slds-is-selected");
      let option = this.options.find((option) => option.value === value);
      this.value.push(option);
    }
    if (this.value.length > 1) {
      this.inputValue = this.value.length + " options selected";
    } else if (this.value.length === 1) {
      this.inputValue = this.value[0].label;
    } else {
      this.inputValue = "None";
    }
    listBoxOption.classList.toggle("slds-is-selected");
  }
  dropDownInFocus = false;
  handleBlur() {
    if (!this.dropDownInFocus) {
      this.closeDropbox();
    }
  }
  handleMouseleave() {
    this.dropDownInFocus = false;
  }
  handleMouseEnter() {
    this.dropDownInFocus = true;
  }
  closeDropbox() {
    let sldsCombobox = this.template.querySelector(".slds-combobox");
    sldsCombobox.classList.remove("slds-is-open");
  }
}
