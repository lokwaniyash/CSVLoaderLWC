import { LightningElement, api, wire, track } from "lwc";
import {
  subscribe,
  unsubscribe,
  onError,
  setDebugFlag,
  isEmpEnabled
} from "lightning/empApi";

import getPermSets from "@salesforce/apex/csvLoaderController.getPermSets";
import getGroups from "@salesforce/apex/csvLoaderController.getGroups";
import checkUpdatedUsersPerm from "@salesforce/apex/csvLoaderController.checkUpdatedUsersPerm";
import checkUpdatedUsersGroup from "@salesforce/apex/csvLoaderController.checkUpdatedUsersGroup";
import assignPermSets from "@salesforce/apex/CSVLoaderBatchableController.assignPermSets";
import assignGroups from "@salesforce/apex/CSVLoaderBatchableController.assignGroups";

export default class CsvPermsGroupsGrid extends LightningElement {
  @api records;
  error;
  permOptions = [];
  tempPermOptions = [];
  groupOptions = [];
  tempGroupOptions = [];

  selectedPerms = {};
  selectedGroups = {};
  colors = {};

  permSetReport = [];

  @track copyModal = false;
  isTrue = true;
  isFalse = false;

  subscription = {};
  @api channelName = "/event/BatchUserUpdated__e";


  @wire(getPermSets)
  wiredPermSets({ error, data }) {
    if (data) {
      this.error = undefined;
      console.log(data, "permData");
      data.forEach((record) => {
        var randomColor = '#'+Math.floor(Math.random()*16777215).toString(16);
        this.colors[record.Id] = randomColor;
        this.permOptions.push({
          label: record.Label,
          value: record.Id
        });
      });
      this.tempPermOptions = this.permOptions;
      console.log(this.permOptions);
    } else if (error) {
      this.error = error;
    }
  }

  @wire(getGroups)
  wiredGroups({ error, data }) {
    if (data) {
      this.error = undefined;
      console.log(data, "groupData");
      data.forEach((record) => {
        var randomColor = "hsl(" + Math.random() * 360 + ", 100%, 75%)";
        this.colors[record.Id] = randomColor;
        this.groupOptions.push({
          label: record.Name,
          value: record.Id
        });
      });
      this.tempGroupOptions = this.groupOptions;
      console.log(this.groupOptions);
    } else if (error) {
      this.error = error;
    }
  }

  handleChangePerms(event) {
    console.log(JSON.stringify(event.detail), event.target.dataset.field);
    this.selectedPerms[event.target.dataset.field] = [];
    // this.selectedPerms = [];
    this.records.forEach((record) => {
      event.detail.forEach((value) => {
        if (record.index == event.target.dataset.field) {
          this.selectedPerms[event.target.dataset.field].push({
            PermissionSetId: value,
            AssigneeId: record.Id
          });
        }
      });
    });
    // console.log(this.colors);
    // event.target.handlePillColors();
    console.log(this.selectedPerms);
  }

  handleChangeGroups(event) {
    console.log(JSON.stringify(event.detail), event.target.dataset.field);
    this.selectedGroups[event.target.dataset.field] = [];
    this.records.forEach((record) => {
      event.detail.forEach((value) => {
        if (record.index == event.target.dataset.field) {
          this.selectedGroups[event.target.dataset.field].push({
            GroupId: value,
            UserOrGroupId: record.Id
          });
        }
      });
    });
    console.log(this.selectedGroups);
  }

  copyToAllWindow() {
    this.copyModal = true;
  }

  closeModal() {
    this.copyModal = false;
  }

  handleCopy() {
    let picks = this.template.querySelectorAll("c-multi-select-picklist");
    console.log(JSON.stringify(picks), "picks");
    for (let i = 0; i < picks.length; i++) {
      picks[i].selectMultiple(this.copyPerms, "perms");
      picks[i].selectMultiple(this.copyGroups, "groups");
    }
  }

  copyGroups = [];
  handleCopyGroups(event) {
    this.copyGroups = [];
    this.copyGroups = event.detail;
  }

  copyPerms = [];
  handleCopyPerms(event) {
    this.copyPerms = [];
    this.copyPerms = event.detail;
  }

  updateRecords() {
    // console.log(this.selectedGroups, this.selectedPerms);
    let groups = Object.keys(this.selectedGroups);
    let perms = Object.keys(this.selectedPerms);

    let insertGroups = [];
    let insertPerms = [];
    if (groups.length > 0) {
      groups.forEach((key) => {
        // insertGroups.push(this.selectedGroups[key]);
        this.selectedGroups[key].forEach((val) => {
          insertGroups.push(val);
        });
      });
      let para = JSON.stringify(insertGroups);
      console.log(para);
      assignGroups({ groupDataString: para });
    }

    if (perms.length > 0) {
      perms.forEach((key) => {
        // insertPerms.push(this.selectedPerms[key]);
        this.selectedPerms[key].forEach((val) => {
          insertPerms.push(val);
        });
      });
      let para = JSON.stringify(insertPerms);
      console.log(para);
      assignPermSets({ permissionSetDataString: para });
    }
  }

  registerErrorListener() {
    // Invoke onError empApi method
    onError((error) => {
      console.log("Received error from server: ", JSON.stringify(error));
      // Error contains the server-side error
    });
  }

  handleSubscribe() {
    // Callback invoked whenever a new event message is received
    const messageCallback = (response) => {
      console.log("New message received: ", JSON.stringify(response));  
      // Response contains the payload of the new message received
      let wasSuccessful = Boolean(response.data.payload.isSuccessful__c);
      if(!wasSuccessful) {
        // Proccess and fetch successful users that got the 
        let permUsers = [];
        Object.keys(this.selectedPerms).forEach(key => {
          this.selectedPerms[key].forEach(perm => {
            permUsers.push(perm.AssigneeId);
          })
        });
        console.log(permUsers);
        checkUpdatedUsersPerm({userIds: permUsers}).then(res => {
          console.log(res, 'successPerms');
          
          Object.keys(this.selectedPerms).forEach(key => {
            let index = key;
            let currRecord, found = false;
            this.records.forEach(record => {
              if(found) return;
              if(record.index == index) {
                currRecord = record;
                found = true;
              }
            });

            this.selectedPerms[key].forEach(perm => {

            });
          });  

        })

        // Proccess and fetch successful users that got the groups
        let groupUsers = [];
        Object.keys(this.selectedGroups).forEach(key => {
          this.selectedGroups[key].forEach(group => {
            groupUsers.push(group.UserOrGroupId);
          })
        });
        console.log(groupUsers);
        checkUpdatedUsersGroup({userIds: groupUsers}).then(res => {
          console.log(res, 'successGroups');
        })
      }
    };

    // Invoke subscribe method of empApi. Pass reference to messageCallback
    subscribe(this.channelName, -1, messageCallback).then((response) => {
      // Response contains the subscription information on subscribe call
      console.log(
        "Subscription request sent to: ",
        JSON.stringify(response.channel)
      );
      this.subscription = response;
    });
  }

  connectedCallback() {
    // Register error listener
    this.registerErrorListener();
    this.handleSubscribe();
  }

  renderedCallback() {
    console.log(this.records);
  }
}
