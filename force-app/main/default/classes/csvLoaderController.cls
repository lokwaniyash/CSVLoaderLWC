public with sharing class csvLoaderController {
    public csvLoaderController() {

    }

    @AuraEnabled(cacheable=true)
    public static List<String> getUserFields(){
        SObjectType userType = Schema.getGlobalDescribe().get('User');
        Map<String,Schema.SObjectField> mfields = userType.getDescribe().fields.getMap();

        List<String> sObjectDetailsList = new List<String>();
        for(String s : mfields.keySet()){
            sObjectDetailsList.add(String.valueOf(mfields.get(s)));
        }
        return sObjectDetailsList;
    }

    @AuraEnabled(cacheable=true)
    public static List<PermissionSet> getPermSets() {
      return [SELECT Id, Label, Name From PermissionSet WHERE IsOwnedByProfile = FALSE WITH SECURITY_ENFORCED];
    }

    @AuraEnabled(cacheable=true)
    public static List<Group> getGroups() {
      String str = '%';
      return [SELECT Id, Name, OwnerId FROM Group WHERE Name like :str WITH SECURITY_ENFORCED];
    }

    @AuraEnabled
    public static Map<String, String> insertUserRecords(String userDataString, List<String> profNames) {
      List<User> userList = (List<User>)System.JSON.deserializeStrict(userDataString, List<User>.Class);
      List<String> profIds = new List<String>();
      // Map<String, String> profMap = new Map<String, String>();
      List<Profile> profFromDB = [SELECT Id, Name FROM Profile Where Name IN :profNames OR Id IN :profNames];
      System.debug(profNames);
      System.debug(profFromDB);
      for(Profile p : profFromDB) {
        profIds.add(p.Id);
        System.debug(p.Id);
      }

      System.debug(profIds);
      for(Integer i = 0; i < userList.size(); i++) {
        System.debug(userList[i]);
        for(Profile prof : profFromDB) {
          if(profNames[i].toLowercase() == prof.Name.toLowercase() || profNames[i] == prof.Id) {
            userList[i].ProfileId = prof.Id;
            break;
          }
        }
      }

      // for(User u : userList) {
      //   u.ProfileId = profMap.get(u.ProfileId.toLowercase());
      // }
      Database.SaveResult[] SR = Database.insert(userList, false);
      Map<String, String> postRecords = new Map<String, String>();
      // Map<User, Database.Error> postInsertRecords = new Map<User, Database.Error>();

      for(Integer i=0;i<SR.size();i++){
        // postInsertRecords.put(userList[i], SR[i].getErrors());
        postRecords.put(JSON.serialize(userList[i]), JSON.serialize(SR[i].getErrors()));
        if(!SR[i].isSuccess()){//only look at failures, or NOT Successes
          system.debug(SR[i]. getErrors());
          system.debug(userList[i]); //instead of debug, you could have an email processor something else that looks at that record and the error message
        }
    }

      System.debug(userList);
      return postRecords;
    }

    @AuraEnabled(cacheable = true)
    public static Map<String, Boolean> getUserDescr(){
      // String obj = 'User';
      // String[] types = new String[]{obj};
      // System.debug('START DESCRIBE SOBJECTS');

      // // for (Integer i = 0; i < 50; i++) {
      //   List<Schema.DescribeSobjectResult> results = Schema.describeSObjects(types); 
      // }


      Schema.DescribeSObjectResult r = User.sObjectType.getDescribe();
            // SObjectType r = Schema.getGlobalDescribe().get('User').getDescribe();
            Map<String, Boolean> res = new Map<String, Boolean>();
            Map<String,Schema.SObjectField> M = r.fields.getMap();
            for(String fieldName : M.keySet())
            { 
                Schema.SObjectField field = M.get(fieldName);
                Schema.DescribeFieldResult F = field.getDescribe();
               //A nillable field can have empty content. A isNillable Boolean non-nillable field must have a value for the object to be                       //created or saved. 
              // if F.isNillable() is false then field is mandatory
              Boolean isFieldreq  = !F.isNillable() && F.isCreateable() && !F.isDefaultedOnCreate();
             System.debug ('F = ' + fieldName + ' isnul= ' +  isFieldreq);
             res.put(fieldName, isFieldreq);
           }

           return res;
    }

    @AuraEnabled(cacheable=true)
    public static List<PermissionSetAssignment> checkUpdatedUsersPerm(List<String> userIds) {
      return [Select AssigneeId, PermissionSetId From PermissionSetAssignment Where AssigneeId in :userIds WITH SECURITY_ENFORCED];
    }

    @AuraEnabled(cacheable=true)
    public static List<GroupMember> checkUpdatedUsersGroup(List<String> userIds) {
      return [Select UserOrGroupId, GroupId From GroupMember Where UserOrGroupId in :userIds WITH SECURITY_ENFORCED];
    }
}