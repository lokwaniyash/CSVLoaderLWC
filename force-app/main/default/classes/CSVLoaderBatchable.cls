global class CSVLoaderBatchable implements Database.Batchable<sObject>,database.stateful {
    
    private List<sObject> dataList;
    private List<JSON2User> userList;
    global integer totalSuccessfulRecs=0;
    global integer totalFailedRecs=0;
    global boolean successful=true;

    global Map<String, JSON2User> errorMap = new Map<String, JSON2User>();
    global Map<String, SObject> IdToSObjectMap = new Map<String, sObject>();
    global Map<Id, String> successMap = new Map<Id, String>();
    global String baseURL;
    global String objType;
    
    public CSVLoaderBatchable(List<sObject> data, String type, List<JSON2User> userRecs) {
        dataList = data;
        objType = type;
        userList = userRecs;
    }
    
    global List<sObject> start(Database.BatchableContext BC) {
        
        return dataList;
    }
    
    global void execute(Database.BatchableContext BC, List<sObject> scope) {
        database.SaveResult[] myResult=database.insert(scope,false);
        for(Integer i=0; i < myResult.size(); i++) {
            if(myResult.get(i).isSuccess()) {
                System.debug('Records are updated Successfully');
                totalSuccessfulRecs++;
            } 
            else if(!myResult.get(i).isSuccess()) {
                Database.Error errors =  myResult.get(i).getErrors().get(0);
                System.debug('Error Occurs While Processing The Record'+errors.getMessage());
                // System.debug('Failure Record Ids While Updating'+myResult.get(i).Id);
                totalFailedRecs++;
                successful = false;
            }
        }
        Integer index = 0;
        Integer mapIndex = 0;
        // if(objType == 'perm') {
        //   List<PermissionSetAssignment> permScope = new List<PermissionSetAssignment>();
        //   permScope = scope;
        //   for(Database.SaveResult dsr : myResult){
        //     if(!dsr.isSuccess()){
        //         String errMsg = dsr.getErrors()[0].getMessage();
        //         errorMap.put(permScope[index].AssigneeId, errMsg);
               
        //     } else {
        //         String sucMsg = baseURL + '/' + permScope[index].Id;
        //         successMap.put(permScope[index].AssigneeId, sucMsg);
        //     }
        //     IdToSObjectMap.put(permScope[index].AssigneeId, permScope[index]);
        //     index++;
        //   }
        // } else if(objType == 'group') {
        //   List<GroupMember> groupScope = new List<GroupMember>();
        //   groupScope = scope;
        //   for(Database.SaveResult dsr : myResult){
        //     if(!dsr.isSuccess()){
        //         String errMsg = dsr.getErrors()[0].getMessage();
        //         errorMap.put(groupScope[index].UserOrGroupId, errMsg);
               
        //     } else {
        //         String sucMsg = baseURL + '';
        //         successMap.put(groupScope[index].UserOrGroupId, sucMsg);
        //     }
        //     IdToSObjectMap.put(groupScope[index].UserOrGroupId, groupScope[index]);
        //     index++;
        //   }
        // } else 
        if(objType == 'both') {
          for(Database.SaveResult dsr : myResult){
            String scopeId = '';
            Boolean perm = true;
            try {
              scope[index].get('AssigneeId');
            } catch (Exception e) {
              perm = false;
            }

            if(perm) {
              scopeId = scope[index].get('AssigneeId') + '';
            } else {
              scopeId = scope[index].get('UserOrGroupId') + '';
            }

            if(!dsr.isSuccess()){
                String errMsg = dsr.getErrors()[0].getMessage();
                // errorMap.put(scopeId, errMsg);
                System.debug(dsr.getErrors());
                for(Database.Error err : dsr.getErrors()) {
                  for(JSON2User user : userList) {
                    if(scopeId == user.Id) {
                      JSON2User errUser = user.clone();
                      errUser.errorString = err.getMessage();
                      errorMap.put(mapIndex++ + '', errUser);
                      break;
                    }
                  }
                }
               
            } else {
                String sucMsg = baseURL + '/' + scopeId;
                // successMap.put(scopeId, sucMsg);
            }
            IdToSObjectMap.put(scopeId, scope[index]);
            index++;
          }
        }
    }
    
    global void finish(Database.BatchableContext BC) {
        BatchUserUpdated__e batchPlatEvent = new BatchUserUpdated__e();
        batchPlatEvent.Successful__c = totalSuccessfulRecs;
        batchPlatEvent.Failed__c = totalFailedRecs;
        batchPlatEvent.isSuccessful__c = successful;
        
        System.debug(totalFailedRecs + ' ' + totalSuccessfulRecs);
        
        
        // Call method to publish events
        Database.SaveResult result = EventBus.publish(batchPlatEvent);
        
        if (result.isSuccess()) {
            System.debug('Successfully published event.');
        } else {
            for(Database.Error err : result.getErrors()) {
                System.debug('Error returned: ' +
                             err.getStatusCode() +
                             ' - ' +
                             err.getMessage());
            }
        }

        if(! IdToSObjectMap.isEmpty()) {
          //Send an email to the User after your batch completes
          AsyncApexJob a = [SELECT id, ApexClassId,
                            JobItemsProcessed, TotalJobItems,
                            NumberOfErrors, CreatedBy.Email
                            FROM AsyncApexJob
                            WHERE id = :BC.getJobId()];
          String body = 'Your batch job '
              + 'CSVLoader '
              + 'has finished. \n'
              + 'There were total'
              + IdToSObjectMap.size()
              + ' records. Please find the attached success and error records CSV.';
          String subject = 'Users - Apex Batch Result for CSVLoader';
          // Define the email
          Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
          // Define email file attachment list
          Messaging.EmailFileAttachment[] emailAttList = new List<Messaging.EmailFileAttachment>();
          if(!errorMap.isEmpty()){
              // Creating the CSV file for error
              String finalstr = 'First Name, Last Name, Username, Email, Alias, Employee Number, Federation Identifier, Profile, Error\n';
             
              String attName = 'UserErrors' + system.now().format('YYYYMMDDhhmm') + '.csv';
              for(String id  : errorMap.keySet()){
                  JSON2User err = errorMap.get(id);
                  // sObject user = (sObject) IdToSObjectMap.get(id);
                  string recordString = '"'+err.FirstName+'","'+err.LastName+'","'+err.Username+'","'+err.Email+'","'+err.Alias+'","'+err.EmployeeNumber+'","'+err.FederationIdentifier+'","'+err.ProfileName+'","'+err.errorString+'"\n';
                  finalstr = finalstr +recordString;
              }
                             
              // Create the email attachment    
              Messaging.EmailFileAttachment efa = new Messaging.EmailFileAttachment();
              efa.setFileName(attName);
              efa.setBody(Blob.valueOf(finalstr));
              emailAttList.add(efa);
          }
          if(! successMap.isEmpty()) {
              // Creating the CSV file for successful updates
              String finalstr = 'Id, Name, Link \n';
              String attName = 'UserSuccess' + system.now().format('YYYYMMDDhhmm') + '.csv';
              for(Id id  : successMap.keySet()){
                  string suc = successMap.get(id);
                  sObject user = (sObject) IdToSObjectMap.get(id);
                  string recordString = '"'+id+'","'+user.Id+'","'+suc+'"\n';
                  finalstr = finalstr +recordString;
              }
             
              // Create the email attachment    
              Messaging.EmailFileAttachment efa = new Messaging.EmailFileAttachment();
              efa.setFileName(attName);
              efa.setBody(Blob.valueOf(finalstr));
              emailAttList.add(efa);
               
          }
          // Sets the paramaters of the email
          email.setSubject( subject );
          email.setToAddresses( new String[] {a.CreatedBy.Email} );
          email.setPlainTextBody( body );
          email.setFileAttachments(emailAttList);
         
          // Sends the email
          Messaging.SendEmailResult [] r =
              Messaging.sendEmail(new Messaging.SingleEmailMessage[] {email});
      }
  }
    
}