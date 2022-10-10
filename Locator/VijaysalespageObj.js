let loginpage1= function(){
      
let Sign_in =element(by.xpath('//span[text()="Hi")'));
let Sign_in1  =element(by.xpath('//a[@id="btnsigninhover")'));
let Search_bar =element(by.xpath('(//input[@type="text"])[4]'));
let product_text1 =element(by.xpath('//a[text()="Washing Machines"]'));
let edit_icon =element(by.xpath('//img[@class="edit_icon"]'));
let product_text=element(by.xpath('(//h2[@class="Dynamic-Bucket-ProductName"])[1]'));
let iphone=element(by.xpath('//a[text()="iPhone 14"]'));
let add_to_card=element(by.xpath('//a[@id="ContentPlaceHolder1_btnAddtoBag"]'));
let proceed=element(by.xpath('//a[@id="ProceedtoPay"]'));
let drop_down=element(by.xpath('//span[@id="ContentPlaceHolder1_dvSortName"]'));
let drop_down_value=element(by.xpath('//span[text()="Price: Low to High"]'));
let mail_id=element(by.xpath('//input[@id="ContentPlaceHolder1_txtemailmobile"]'));
let continue_btn=element(by.xpath('//input[@id="ContentPlaceHolder1_Button2"]'));
let beforeprice=element(by.xpath("(//div[@class='Dynamic-Bucket-vsp dvpricepdlft'])"));
let afterprice=element(by.xpath("(//span[contains(text(),'₹')])"));
let podpage=element(by.xpath("//li[@id='CatHDesktopliWashingMachines']"));

this.addtocard = function(){
    add_to_card.click();
}

this.get_url = function(url){
    browser.get(url);
 }

 this.SignIn = function(){
    Sign_in.click();
    Sign_in1.click();
}

//this.SignIn1 = function(){
 //   Sign_in1.click();
//}

this.Searchbar = function(){
    Search_bar.click();
}

this.icon = function(){
    edit_icon.click();
 }
 this.text = function(){
    product_text.click();
 }
 this.text1 = function(){
    product_text1.click();
 }
 this.iphone_14 = function(){
    iphone.click();
 }

 this.proceed_to_buy= function(){
    proceed.click();
 }
 this.dropdown= function(){
   drop_down.click();
}
this.dropdownvalue= function(){
   drop_down_value.click();
}
this.select= function(){
   drop_down_value.click();
}
this.email= function(emailid){
   mail_id.sendKeys(emailid);
}
this.continuebutton= function(){
   continue_btn.click();
}
this.podpagebutton=function(){
  podpage.click();
}
this.beforepricegettext=function(){
beforeprice.getText();
}
this.select1=function(){
   beforeprice.click();
}
this.afterpricegettext=function(){
   afterprice.getText();
}




}
module.exports = new loginpage1();
