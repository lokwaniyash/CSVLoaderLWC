import { LightningElement, wire, track } from "lwc";
import getUserFields from "@salesforce/apex/csvLoaderController.getUserFields";
import insertUserRecords from "@salesforce/apex/csvLoaderController.insertUserRecords";
import { loadScript } from "lightning/platformResourceLoader";
// import PARSER from "@salesforce/resourceUrl/PapaParse";

import { ShowToastEvent } from "lightning/platformShowToastEvent";

const fieldsReq = [
  "FirstName",
  "LastName",
  "Alias",
  "Username",
  "Email",
  "ProfileId",
  "EmployeeNumber",
  "FederationIdentifier"
];

const defaults = {
  EmailEncodingKey: "ISO-8859-1",
  TimeZoneSidKey: "America/Los_Angeles",
  LocaleSidKey: "en_US",
  LanguageLocaleKey: "en_US"
};
export default class CsvLoaderMain extends LightningElement {
  userFields;
  options = [];
  fieldsReq = fieldsReq;
  defaults = defaults;

  currRecord = {};
  currMatch;

  resRecord;
  userReport1;
  successRecords;

  chosen = [];

  confirmMatch = false;
  userDataSent = false;
  permGrid = false;
  importData = true;

  @track isLoading = false;

  value;
  error;

  _rows;
  _cols = [];

  @track colsThere = false;

  @wire(getUserFields)
  wiredUserFields({ error, data }) {
    if (data) {
      // for(let i = 0; i < data.length; i++) {
      //   data[i] = data[i] == "ProfileId" ? "Profile" : data[i];
      // }
      console.log(data);
      this.userFields = data;
      this.userFields.forEach((field) => {
        // field = field == "ProfileId" ? "Profile" : field;
        let label = this.fieldsReq.includes(field)
          ? field + " (REQUIRED)"
          : field;
        this.options.push({
          label: field == "ProfileId" ? "Profile (REQUIRED)" : label,
          value: field
        });
      });
      console.log(this.options);
      this.error = undefined;
    } else if (error) {
      this.userFields = undefined;
      this.error = error;
    }
  }

  async handleInputChange(event) {
    if (event.target.files.length > 0) {
      this.chosen = [];
      this.resRecord = undefined;
      const file = event.target.files[0];
      this.loading = true;
      const result = await this.load(file);
      console.log(result, "res");
      let data = JSON.parse(this.csvJSON(result));
      console.log(data, "test2");

      this._rows = data;
      this.handleCols(data[0]);

      // Papa.parse(file, {
      //   quoteChar: '"',
      //   header: "true",
      //   complete: (results) => {
      //     this._rows = results.data;
      //     // this.loading = false;
      //     console.log(results.data);
      //     this.handleCols(results.data[0]);
      //   },
      //   error: (error) => {
      //     console.error(error);
      //     this.loading = false;
      //   }
      // });
    }
  }

  downloadUserReport1() {
    // Prepare report for Display and Download
    this.userReport1.forEach((record) => {
      delete record.error;
      delete record.attributes;
      delete record.index;
      delete record.errorString;
      // console.log(record.errorString, "string1");
    });
    this.JSONToCSVConvertor(this.userReport1, "User Insertion Report", true);
  }

  async load(file) {
    return new Promise((resolve, reject) => {
      this.showLoadingSpinner = true;
      const reader = new FileReader();
      // Read file into memory as UTF-8
      //reader.readAsText(file);
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error);
      };
      reader.readAsText(file);
    });
  }

  csvJSON(csv) {
    var lines = csv.split(/\r\n|\n/);

    var result = [];

    var headers = lines[0].split(",");
    console.log("headers.." + JSON.stringify(headers));
    for (var i = 1; i < lines.length - 1; i++) {
      var obj = {};
      var currentline = lines[i].split(",");

      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }

      result.push(obj);
    }
    console.log("result.." + JSON.stringify(result));
    //return result; //JavaScript object
    return JSON.stringify(result); //JSON
  }

  JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != "object" ? JSON.parse(JSONData) : JSONData;
    var CSV = "";
    //This condition will generate the Label/Header
    if (ShowLabel) {
      var row = "";

      //This loop will extract the label from 1st index of on array
      for (var index in arrData[0]) {
        //Now convert each value to string and comma-seprated
        row += index + ",";
      }
      row = row.slice(0, -1);
      //append Label row with line break
      CSV += row + "\r\n";
    }

    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
      var row = "";
      //2nd loop will extract each column and convert it in string comma-seprated
      for (var index in arrData[i]) {
        row += '"' + arrData[i][index] + '",';
        console.log(arrData[i][index], 'd1');
      }
      row.slice(0, row.length - 1);
      //add a line break after each row
      CSV += row + "\r\n";
    }

    if (CSV == "") {
      alert("Invalid data");
      return;
    }

    //this trick will generate a temp "a" tag
    var link = this.template.querySelector(`[data-id="downloadUserReport1"]`);

    var csv = CSV;
    let blob = new Blob([csv], { type: "text/plain" });
    console.log(blob);
    var csvUrl = window.URL.createObjectURL(blob);
    console.log(csvUrl);
    var filename = (ReportTitle || "UserExport") + ".csv";
    // $("#lnkDwnldLnk").attr({
    //   download: filename,
    //   href: csvUrl
    // });

    link.setAttribute("download", filename);
    link.setAttribute("href", csvUrl);

    link.click();
    // document.body.removeChild(link);
  }

  handleChange(event) {
    let val = event.detail.value;
    if (!this.chosen.includes(val)) this.chosen.push(val);

    this.currRecord[event.currentTarget.dataset.field] = val;
  }

  handleConfirm() {
    this.currMatch = [];
    Object.keys(this.currRecord).forEach((key) => {
      this.currMatch.push({
        key: key,
        value: this.currRecord[key]
      });
    });

    this.confirmMatch = true;
  }

  closeModal() {
    this.confirmMatch = false;
    this.currMatch = undefined;
  }

  closeUserReport1() {
    this.userDataSent = false;
    this.importData = true;
  }

  closePermGrid() {
    this.permGrid = false;
  }

  navToPermComp() {
    this.userDataSent = false;
    this.permGrid = true;
  }

  handleCols(row) {
    Object.keys(row).forEach((item) => {
      this._cols.push(item);
    });
    console.log(this._cols);
    this.colsAvailable();
  }

  colsAvailable() {
    if (this._cols.length > 0) this.colsThere = true;
    else this.colsThere = false;
  }

  handleLoading() {
    this.isLoading = true;
  }

  handleDoneLoading() {
    this.isLoading = false;
  }

  submit(event) {
    let flag = true;
    console.log("test1");
    for (let i = 0; i < this.fieldsReq.length; i++) {
      let curr = this.fieldsReq[i];
      if (!this.chosen.includes(curr)) {
        flag = false;
        break;
      }
    }

    if (!flag || this.chosen.length < this._cols.length) {
      let msg = "";
      this.fieldsReq.forEach((field) => {
        msg += field + ", ";
      });
      const evt = new ShowToastEvent({
        title: "Error",
        message: `Make sure you have chosen all Required Fields, Which are: ${msg} And have matched all CSV Columns to a Field using the Dropdowns`,
        variant: "error",
        mode: "dismissable"
      });
      this.dispatchEvent(evt);
    } else {
      this.confirmMatch = false;
      this.isLoading = true;

      let recordList = [];
      let profNames = [];

      this._rows.forEach((row, index) => {
        console.log(row);
        // if (index == this._rows.length - 1) return;
        let userRecord = {};
        this._cols.forEach((col) => {
          console.log(col, userRecord, 1, this.currRecord);
          if (this.currRecord[col] == "ProfileId") {
            profNames.push(row[col]);
            return;
          }
          userRecord[this.currRecord[col]] = row[col];
          console.log(col, userRecord, 2);
        });
        console.log(userRecord, 4);
        userRecord["EmailEncodingKey"] = "ISO-8859-1";
        userRecord["TimeZoneSidKey"] = "America/Los_Angeles";
        userRecord["LocaleSidKey"] = "en_US";
        userRecord["LanguageLocaleKey"] = "en_US";
        // Object.assign(userRecord, this.defaults);
        console.log(userRecord, 5);
        recordList.push(userRecord);
      });
      console.log(recordList, 3);

      insertUserRecords({
        userDataString: JSON.stringify(recordList),
        profNames: profNames
      })
        .then((result) => {
          console.log(result, "postRes");
          this.resRecord = [];
          this.successRecords = [];

          let index = 0;
          Object.keys(result).forEach((user) => {
            index++;
            let newObj = JSON.parse(user);
            console.log(newObj, "obj");
            newObj["index"] = index;
            newObj["error"] = JSON.parse(result[user]);
            newObj["status"] = newObj.error.length > 0 ? "ERROR" : "SUCCESS";
            if(newObj.status == "SUCCESS") {
              this.successRecords.push(newObj);
            }
            let errorString = newObj.error.length > 0 ? "" : "ALL GOOD!";
            newObj.error.forEach((error, index) => {
              // let str = `(${index + 1}) `;
              let str = '';
              str += error.statusCode + ", ";
              str += error.message;
              errorString += str + "\n";
              console.log(str, "errorStr");
            });
            newObj["errorString"] = errorString;
            this.resRecord.push(newObj);
            // this.resRecord.errors = JSON.parse(result[user]);
          });

          console.log(this.resRecord, "postRes1");

          for(let i = 0; i < this.resRecord.length; i++) {
            for(let j = 0; j < profNames.length; j++) {
              delete this.resRecord[i].ProfileId;

              this.resRecord[i]['ProfileName'] = profNames[j];
            }
          }

          this.userReport1 = this.resRecord;
          this.userDataSent = true;
          this.confirmMatch = false;
          this.importData = false;

          this.isLoading = false;
        })
        .catch((error) => {
          this.isLoading = false;
          const evt = new ShowToastEvent({
            title: "Error",
            message: error.message,
            variant: "error",
            mode: "dismissable"
          });
          this.dispatchEvent(evt);
        })
    }
  }
}
