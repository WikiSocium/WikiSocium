var asyncLoop = function(o)
{
    var i =- 1;
    var loop = function()
    {
        i++;
        if(i == o.length)
        {
            o.callback();
            return;
        }
        o.functionToLoop(loop, i);
    } 
    loop(); //init
}

RegionalizedData = 
{
    downloadedData: [],
    
    GetDataFromDBWithRegion: function(region, db, dataId, callback)
    {
        // [TODO] treat dataId, if it is only string (not array) as string
        // [TODO] also, if dataId is only a string, eturn only a string
        RegionalizedData.downloadedData = [];
        asyncLoop({
            length: dataId.length,
            functionToLoop: function(loop, i) {
                $.ajax({
                    url: '/GetRegionalizedData'
                    , type:'POST'
                    , data: 'region=' + encodeURIComponent(region) + '&db=' + encodeURIComponent(db) + '&dataId=' + encodeURIComponent(dataId[i])
                    , success: function(res) {
                            //callback(res);
                            RegionalizedData.downloadedData.push(res);
                            loop();
                		}
                	, error: function(jqXHR, textStatus, errorThrown) {
                	        // [TODO]
                        }
                  });
              },
              callback: function() {
                  callback(RegionalizedData.downloadedData);
              }
        });
    }
}