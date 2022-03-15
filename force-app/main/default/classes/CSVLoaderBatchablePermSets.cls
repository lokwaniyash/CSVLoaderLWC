global class CSVLoaderBatchablePermSets implements Database.Batchable<sObject> {
    
    private List<PermissionSetAssignment> dataList;
    
    public CSVLoaderBatchablePermSets(List<PermissionSetAssignment> data) {
        dataList = data;
    }
    
	 global List<PermissionSetAssignment> start(Database.BatchableContext BC) {

        return dataList;
    }

    global void execute(Database.BatchableContext BC, List<PermissionSetAssignment> scope) {
      Database.insert(scope, false);
    }   

    global void finish(Database.BatchableContext BC) {
    }
}