let Login_page = require('../../Locator/Login');
let key_words = require('./../../Reuseable/keywords');
let testdata=require('./../../Data/Dataentry.json');

describe("A suite is just a function", function () {
    it("Vijaysales_loginpage", function () {
        browser.waitForAngularEnabled(false);
        browser.manage().timeouts().implicitlyWait(3000);
        browser.manage().window().maximize()
        browser.get('https://www.vijaysales.com/');
        key_words.entertext(Login_page.user, 'santhan.y@trackdfect.com');
        key_words.entertext(Login_page.password, 'test@123');
        key_words.click_action(Login_page.continue_btn);


    });

});

//module.exports = new Vijaysales_loginpage();