// popup.js

document.getElementById('blockButton').addEventListener('click', function() {
    // Logic to add the current site to the blacklist
    alert('Site blocked!');
});

document.getElementById('openOptions').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
});