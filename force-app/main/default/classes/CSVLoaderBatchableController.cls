public with sharing class CSVLoaderBatchableController {
    
  @AuraEnabled(cacheable=true)
  public static void assignPermSets(String permissionSetDataString) { 
      List<PermissionSetAssignment> permList = (List<PermissionSetAssignment>)System.JSON.deserializeStrict(permissionSetDataString, List<PermissionSetAssignment>.Class);
      System.debug(permList);
      CSVLoaderBatchable batch = new CSVLoaderBatchable(permList, 'perm');
      // CSVLoaderBatchablePermSets batch = new CSVLoaderBatchablePermSets(permList); 
      database.executeBatch(batch);
  } 
    
  @AuraEnabled(cacheable=true)
  public static void assignGroups(String groupDataString) { 
      List<GroupMember> groupList = (List<GroupMember>)System.JSON.deserializeStrict(groupDataString, List<GroupMember>.Class);
      System.debug(groupList);
      CSVLoaderBatchable batch = new CSVLoaderBatchable(groupList, 'group');
      // CSVLoaderBatchableGroups batch = new CSVLoaderBatchableGroups(groupList); 
      database.executeBatch(batch);
  } 
}