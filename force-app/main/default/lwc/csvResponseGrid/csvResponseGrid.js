import { LightningElement, api } from 'lwc';

export default class CsvResponseGrid extends LightningElement {
  @api records

  renderedCallback() {
    console.log(this.records);
  }

  showErrors(event) {
    let index = event.target.dataset.id;
    console.log(index);
    let ele = this.template.querySelector(`[data-index="${index}"]`);
    console.log(ele);
    ele.style.display = 'block';
    // ele.classList.remove('slds-transition-hide');
    // ele.classList.add('slds-transition-show');
  }

  hideErrors(event) {
    let index = event.target.dataset.id;
    let ele = this.template.querySelector(`[data-index="${index}"]`);
    ele.style.display = 'none';
    // ele.classList.add('slds-transition-hide');
    // ele.classList.remove('slds-transition-show');
  }

  close(){
    this.dispatchEvent(
      new CustomEvent("close")
    );
  }

  download() {
    this.dispatchEvent(
      new CustomEvent("download")
    );
  }

  navToPermComp() {
    this.dispatchEvent(
      new CustomEvent("next")
    );
  }
}