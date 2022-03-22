public with sharing class CSVLoaderBatchableController {
    
  // @AuraEnabled(cacheable=true)
  // public static void assignPermSets(String permissionSetDataString) { 
  //     List<PermissionSetAssignment> permList = (List<PermissionSetAssignment>)System.JSON.deserializeStrict(permissionSetDataString, List<PermissionSetAssignment>.Class);
  //     System.debug(permList);
  //     CSVLoaderBatchable batch = new CSVLoaderBatchable(permList, 'perm');
  //     // CSVLoaderBatchablePermSets batch = new CSVLoaderBatchablePermSets(permList); 
  //     database.executeBatch(batch);
  // } 
    
  // @AuraEnabled(cacheable=true)
  // public static void assignGroups(String groupDataString) { 
  //     List<GroupMember> groupList = (List<GroupMember>)System.JSON.deserializeStrict(groupDataString, List<GroupMember>.Class);
  //     System.debug(groupList);
  //     CSVLoaderBatchable batch = new CSVLoaderBatchable(groupList, 'group');
  //     // CSVLoaderBatchableGroups batch = new CSVLoaderBatchableGroups(groupList); 
  //     database.executeBatch(batch);
  // } 

  @AuraEnabled(cacheable=true)
  public static void assignBoth(String permDataString, String groupDataString, List<String> records) { 
      List<sObject> permList = (List<PermissionSetAssignment>)System.JSON.deserializeStrict(permDataString, List<PermissionSetAssignment>.Class);
      List<sObject> groupList = (List<GroupMember>)System.JSON.deserializeStrict(groupDataString, List<GroupMember>.Class);
      List<sObject> scope = new List<sObject>();

      List<JSON2User> parseRecs = new List<JSON2User>();
      for(String rec : records) {
        JSON2User parseRec = JSON2User.parse(rec);
        parseRecs.add(parseRec);
      }

      for(sObject perm : permList) {
        scope.add(perm);
      }
      for(sObject gr : groupList) {
        scope.add(gr);
      }
      // System.debug(groupList);
      CSVLoaderBatchable batch = new CSVLoaderBatchable(scope, 'both', parseRecs);
      // CSVLoaderBatchableGroups batch = new CSVLoaderBatchableGroups(groupList); 
      database.executeBatch(batch);
  } 
}