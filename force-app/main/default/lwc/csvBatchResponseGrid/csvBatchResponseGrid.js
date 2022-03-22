import { LightningElement, api, track } from "lwc";

export default class CsvBatchResponseGrid extends LightningElement {
  @track records;

  @api
  get reportrecords() {
    return records;
  }
  set reportrecords(recs) {
    this.records = recs;
    console.log(recs);
  }
}
