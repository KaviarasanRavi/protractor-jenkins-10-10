module.exports = {
    scrollIntoView: function(el) {
      browser.executeScript(function(el) {
        el.scrollIntoView();
      }, el.getWebElement());
    },
    
   
  }
  