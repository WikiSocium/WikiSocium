RegionalizedData = 
{
    GetDataFromDBWithRegion: function(region, db, dataId, callback)
    {
        $.ajax({
            url: '/GetRegionalizedData'
            , type:'POST'
            , data: 'region=' + encodeURIComponent(region) + '&db=' + encodeURIComponent(db) + '&dataId=' + encodeURIComponent(dataId)
            , success: function(res) {
                    callback(res);
        		}
        	, error: function(jqXHR, textStatus, errorThrown) {
        	        // [TODO]
                }
          });
    }
}