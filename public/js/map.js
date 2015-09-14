(function(window, document) {
  var countryElements = document.getElementById('countries').childNodes;
  var countryCount = countryElements.length;
  var messageEl = document.querySelector('.message');

  function observeCountryClick(e) {
    messageEl.innerHTML = e.target.getAttribute('data-name');
  }

  for (var i = 0; i < countryCount; i++) {
   countryElements[i].addEventListener("click", observeCountryClick, false);
  }
}(window, document));
