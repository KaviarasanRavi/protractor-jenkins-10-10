const { search, search1, foc, getext, beforeprice, edit, editbox, Apply, add_to_card, Review, click, viewdet, scrollusingelement } = require('../../Reuseable/pgstackover');
var toDoPage = require('../../Reuseable/pgstackover');  
var xl = require('../../utilitily/XLReader.js'); 
var Test_Data = xl.read_from_excel('Sheet1','./Data/testdata.xlsx')

describe('My first non angular class1', function() {

     it('should navigate to stack overflow login page', function() { 
      allure.createStep("Launch the browser ",function(){
        toDoPage.go(); 
      })(); 
        allure.createStep("Click on pincode",function(){
          toDoPage.mouseoverclick(edit);
        })();   
          allure.createStep("data it passing in pincode textbox",function(){
            Test_Data.forEach(function(data){

             toDoPage.Enter(editbox,data.Pincode)  
             // toDoPage.sendkeys(editbox,data.Pincode) ;
  
              //click(Apply);
              })

          })();  
          
          }); 

          
          
    /*it ('My function', function() {
       // browser.driver.get('https://stackoverflow.com/users/login');
       
       // toDoPage.podpage.click();
       
       allure.createStep("verified that user able to search the products in search ",function(){
        Test_Data.forEach(function(data){
        search(search1,foc,data.Product);
      })
      browser.sleep(5000);
       
        
       })();
     
     });*/

    it('function',function(){
      allure.createStep("verified that user able to search the products in search ",function(){
        Test_Data.forEach(function(data){
        search(search1,foc,data.Product);
      })
      browser.sleep(5000);
       
        
       })();
     
      var beforeprice1=getext(beforeprice);
      toDoPage.wait();
      // var beforeprice=toDoPage.beforeprice.getText();
       //toDoPage.beforeprice.click();
       allure.createStep("Click on price amount",function(){
        toDoPage.click(beforeprice);
       })();
       allure.createStep("waiting processes",function(){
        toDoPage.wait();
       })();
       allure.createStep("Change for Another window",function(){
        toDoPage.windowhandles(1);
       })();
       
       var afterprice=toDoPage.afterprice.getText();
       allure.createStep(" verified that user can able to view the price as per the pod page in product page",function(){
        expect(beforeprice1).toEqual('₹ 67,400');

       })();
       
      
      toDoPage.wait();
      allure.createStep("untill it will be scrolled",function(){
        toDoPage.scrollusingelement(viewdet);
      })();
     
      //toDoPage.click(viewdet);
      //toDoPage.writescreenshot(sample,shi);

      toDoPage.Tapclosed();


  })

   /*  it('clear me', function() {  
            toDoPage.clearme();  
          });
*/

})  