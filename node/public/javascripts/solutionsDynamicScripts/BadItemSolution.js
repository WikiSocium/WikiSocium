DynamicFunctions = {
  "DelayPenalty" : function(data) {
			var DeliveryBaseStr;
      var DeliveryBase;
      
      if(data.IsDeliveryCost.value == 0)
      { 
        DeliveryBase = data.ItemDeliveryCost;
      }
      else
      {
        DeliveryBase = data.ItemPrice;
      }
      
      if(data.IsDeliveryProblems.value == 1)
      {
        DeliveryBase *= data.DeliveryDelayDays;
      }
      else
      {
        var Current = new Date();        
        var one_day=1000*60*60*24;
        DeliveryBase *= Math.floor((Current.getTime() - data.DeliveryDate.UTC)/one_day);
      }  
      console.log(DeliveryBase);

      return Math.round(DeliveryBase*0.03);  
      
      }
};