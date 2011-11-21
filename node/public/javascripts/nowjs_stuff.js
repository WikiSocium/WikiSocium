function nowIsReady()
{
    console.log(now.testData); // Ok
}

now.ready(function()
{
    console.log(now.testData); // Ok
    now.checkData();
    nowIsReady();
});

console.log(now.testData); // this will fail!