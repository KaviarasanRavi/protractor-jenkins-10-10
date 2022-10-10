var xl = require('../../utilitily/XLReader.js');  


describe('Read XL data', function(){

     var Test_Data = xl.read_from_excel('Sheet1','./Data/testdata.xlsx')
     Test_Data.forEach(function(data){
     
     it('TC1', function(){
        
        browser.get(data.Username)
        console.log(data.Password)

     })

    })


})