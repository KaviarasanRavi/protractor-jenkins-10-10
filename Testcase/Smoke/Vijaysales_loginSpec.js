const { work_flow, Searchbar, text, dropdown, addtocard } = require('./../../Locator/VijaysalespageObj');
let loginpage1 = require('./../../Locator/VijaysalespageObj')
//let keywords = require('../keywordspec.js/keywords')
//let Phone = require('./models/phone');
//let Select =new select
  let testdata=require('./../../Data/Dataentry.json')
 
//let alert = new Alert();
describe("A suite is just a function", function() {
    it("Vijaysals login", function() {
      browser.waitForAngularEnabled(false);
      browser.manage().timeouts().implicitlyWait(3000);
      browser.manage().window().maximize()
      loginpage1.get_url(testdata.login.dev_URL)
      browser.manage().timeouts().implicitlyWait(3000);
      // alert = browser.switch_to.alert
      // alert.dismiss()

      loginpage1.Searchbar()
      loginpage1.iphone_14()
      // loginpage1.dropdown()
      // loginpage1.dropdownvalue()

      
      loginpage1.text()
      //keywords.windowhandles1()

        browser.getAllWindowHandles().then(function(handles){
          browser.switchTo().window(handles[1]).then(function(){
             
          });
      });
      browser.executeScript('window.scrollTo(0,100);').then(function () {
        loginpage1.addtocard();
    })
       
          //loginpage1.addtocard();
   
        browser.sleep(2000);
        //browser.switchTo().alert().dismiss();  
       loginpage1.proceed_to_buy()
       loginpage1.email(testdata.login.username)
       loginpage1.continuebutton()
     })
    })
    