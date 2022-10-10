const { work_flow, Searchbar, text, dropdown } = require('./../../Locator/VijaysalespageObj');
let loginpage1 = require('./../../Locator/VijaysalespageObj')
let testdata=require('./../../Data/Dataentry.json');
const { allureReporter } = require('jasmine-allure-reporter/src/Jasmine2AllureReporter');
describe("A suite is just a function", function() {
    it("Vijaysals", function() {
         browser.waitForAngularEnabled(false);
         browser.manage().timeouts().implicitlyWait(3000);
         browser.manage().window().maximize()
          loginpage1.get_url(testdata.login.dev_URL)
          browser.manage().timeouts().implicitlyWait(3000);
          allure.createStep("click on pod page",function(){
            loginpage1.podpagebutton();
          })();
          
         browser.manage().timeouts().implicitlyWait(3000);
         loginpage1.select1();
         browser.getAllWindowHandles().then(function(handles){
         browser.switchTo().window(handles[1]).then(function(){
         browser.manage().timeouts().implicitlyWait(3000);
          
                                       
         });
        
    

    })
})
})

