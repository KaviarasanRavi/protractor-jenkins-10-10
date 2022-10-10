let Loginpage = require('../Locator/Login');

let keywords =function(){

  this.click_action= function(){
  try {  
    Loginpage.username.click(); 
  
  } catch (error) {
    
  }
  }
  this.entertext = function(element,value){
    try {  
     
      element.sendKeys(value); 
    
    } catch (error) {
      
    }
    }

};

module.exports = new keywords();


























describe('Login procedure', function() {
    it('Login Username', function () {
      browser.get('anurl.com');
      auth('username', 'password').then(function(){console.log('NICE TO MEET YOU')});
  });
  
  
  var auth = function(loginstr, passwordstr) {
    return element(by.css('div[class="login"]')).isDisplayed().then(function (result) {
      if (result) {
        element(by.css('input[name="email"]')).clear().sendKeys(loginstr).then(
          function () {
            element(by.css('input[name="password"]')).clear().sendKeys(passwordstr).then(function () {
              element(by.css('button[class="submit"]')).click().then(function () {
                return element(by.id('welcome')).isPresent();
              });
            });
          });
      }
    });
  }
})










