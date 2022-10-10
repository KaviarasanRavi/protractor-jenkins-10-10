var xlsx = require('xlsx');

class xlReader{
     
    read_from_excel(sheetName, filePath){
        var workbook =xlsx.readFile(filePath)
        var worksheet =workbook.Sheets[sheetName];
        
        return xlsx.utils.sheet_to_json(worksheet);



    }
}

module.exports = new xlReader();