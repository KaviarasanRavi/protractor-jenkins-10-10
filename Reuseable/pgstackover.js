//pgstackover.js
//import * as path from 'path';
 //Keys = OpenQA.Selenium.Keys;
 //import org.openqa.selenium.Keys

let {mkdirp} = require('mkdirp');
var scrollIntoView = require('../utilitily/utils').scrollIntoView;
'use strict';   
module.exports = {  

          txt_username: element(by.id('email')),
          txt_password: element(by.id('password')),
          btn_submit: element(by.id('submit-button')),
          podpage:element(by.xpath("//li[@id='CatHDesktopliWashingMachines']")),
          beforeprice:element(by.xpath("(//div[@class='Dynamic-Bucket-vsp dvpricepdlft'])")),
          afterprice:element(by.xpath("(//span[contains(text(),'₹')])")), 
          search1:element(by.xpath("//input[@name='ctl00$txtSearch']")),
          foc:element(by.xpath("//input[@name='ctl00$btnSearch']")),
          add_to_card:element(by.xpath('//a[@id="ContentPlaceHolder1_btnAddtoBag"]')),
          edit:element(by.xpath("//img[@class='edit_icon']")),
          editbox:element(by.xpath("//input[@name='ctl00$txtpincode']")),
          Apply:element(by.xpath("//input[@name='ctl00$btnapply']")),
          Review:element(by.xpath("//button[@class='btnFullRed_WriteReview_New']")),
          viewdet:element(by.xpath("(//span[contains(text(),'View Details')] )[2]")),
          async clearme() {
            await this.txt_username.isDisplayed();
            await this.txt_username.clear();
            await this.txt_password.clear();
          }, 

          wait:function(){
            browser.manage().timeouts().implicitlyWait(3000);
          },
          windowhandles:function(input){
            try{
              browser.getAllWindowHandles().then(function(handles){
                browser.switchTo().window(handles[input]).then(function(){
                   
                });
            });

            }catch{
              console.log("Unable to use windowhandles"+error)
            }
            
          },

         go: function() {  
                browser.driver.ignoreSynchronization = true;
                browser.waitForAngularEnabled(false);
                browser.driver.manage().window().maximize();
                browser.driver.get("https://www.vijaysales.com/"); //overrides baseURL  
            },

          search:function(fun,fun2,value){
            try {
              return fun.isDisplayed().then(function(result){
                if(result){
                 fun.clear().sendKeys(value).then(
                  function(){
                  browser.sleep(2000);
                  fun2.click();

                  }
                 )

                }
              })
              
            } catch (error) {
              console.error(error);
            }
              
          } ,
          getext:function(element){
            try{
              if (typeof element !== 'undefined') {
                return element.isDisplayed().then(function () {
                    return element.isEnabled().then(function () {
                        return element.getText().then(function (text) {
                            return text;
                        })
                    });
                });
  
              }
             else{
              throw new Error(`${element} is undefined`);
            }
                                
            }catch{
              console.error(error);
            }
           
          } ,
          Tapclosed:function(){
            try{
              browser.getAllWindowHandles().then(function(handles) {
                let newWindowHandle = handles[1]; // this is your new window
                browser.switchTo().window(newWindowHandle).then(function() {
                  browser.close();
                  browser.sleep(2000);
                  browser.switchTo().window(handles[0]);
                });
              });

            }catch{
              console.log("Unable to use Tapclosed"+error)
            }
            
          },
          Scrollviewclick:function(element){
            var el = element;
            scrollIntoView(el);
            el.click();
            return;

          },

               //element(by.css('div[class="login"]')),element(by.css('input[name="password"]'))
            varauth : function(loginstr, passwordstr,fun,fun1,fun2) {
              return element(by.css('div[class="login"]')).isDisplayed().then(function (result) {
                if (result) {
                  fun.clear().sendKeys(loginstr).then(
                    function () {
                      fun1.clear().sendKeys(passwordstr).then(function () {
                        fun2.click().then(function () {
                          return element(by.id('welcome')).isPresent();
                        });
                      });
                    });
                }
              });
            }  ,
            click:function(element){
             try{
              
                var el=element;
                browser.wait(() => (el.isDisplayed()), 30000).then(function(){
                browser.executeScript("arguments[0].setAttribute('style', 'background: yellow; border: 2px solid red;');",el).then(function(){
                 //whatever you need to check for here
                 allure.createStep("Click on",function(){
                 el.click();
                 })();
                });

              })
           
            }catch{
              console.error("Unable to click"+error);
             }
             
            },
           sendkeys:function(element,value){
            try{
              return browser.wait(() => (element.isDisplayed()), 30000).then(function(){
                element.clear().sendKeys(value);

           }) }catch{
            console.log('unable to use sendkeys'+error)
           }
          },
          Enter:function(element,value){
            try{
             
             element.clear().sendKeys(value);
             browser.actions().sendKeys(protractor.Key.ENTER).perform();


            }catch{
              console.log("unable to use  actionsend"+error)

            }

          },
          mouseoverclick:function(element){
            try{
             browser.sleep(3000);
             return browser.actions().click(element).perform();
               
              }catch{
             console.log("Unable to mouseoverclick"+error);
            }
          } ,
          draganddrop:function(element1,element2){
           var scr=element1;
           var trg=element2;

            try{
              browser.actions().dragAndDrop(scr, trg).perform();
            }catch{

              console.error("unable to use draganddrop"+error)

            }

          },
         scrollusingelement:function(element){
          var el=element;
           try{
            browser.wait(() => (el.isDisplayed()), 30000).then(function(){
              browser.executeScript("arguments[0].scrollIntoView(true);",el).then(function(){
               browser.sleep(3000);
              // el.click(); 
              })
            })

           }catch{
               console.log("unable to use scrollusingelement"+error)
           }


         }, 
         writescreenshot:function(data, filename) {
          let datetime = moment().format('YYYYMMDD-hhmmss');
          filename = `../../Report/${filename}.${datetime}.png`;
          
      
          let filePath = path.dirname(filename); // output: '../../..' (relative path)
                  // or
          if (!fs.existsSync(filePath )) {
              mkdirp.sync(filePath); // creates multiple folders if they don't exist
          }
      
          let stream = fs.createWriteStream(filename);
          stream.write(new Buffer(data,'base64'));
          stream.end();
      }






    }