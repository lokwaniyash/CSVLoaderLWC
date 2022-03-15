global class CSVLoaderBatchableGroups implements Database.Batchable<sObject> {
    
    private List<GroupMember> dataList;
    
    public CSVLoaderBatchableGroups(List<GroupMember> data) {
        dataList = data;
    }
    
	 global List<GroupMember> start(Database.BatchableContext BC) {

        return dataList;
    }

    global void execute(Database.BatchableContext BC, List<GroupMember> scope) {
      Database.insert(scope, false);
    }   

    global void finish(Database.BatchableContext BC) {
    }
}