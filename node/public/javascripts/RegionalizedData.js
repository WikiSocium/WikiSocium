RegionalizedData = 
{
    GetDataFromDBWithRegion: function(region, db, dataId)
    {
        $.ajax({
            url: '/GetRegionalizedData'
            , type:'POST'
            , data: 'region=' + encodeURIComponent(region) + '&db=' + encodeURIComponent(db) + '&dataId=' + encodeURIComponent(dataId)
            , success: function(res) {
                    console.log(res);
        		}
        	, error: function(jqXHR, textStatus, errorThrown) {
        	        // [TODO]
                }
          });
    }
}