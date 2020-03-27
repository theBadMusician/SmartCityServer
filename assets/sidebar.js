// Get the Sidebar
var mySidebar = document.getElementById("mySidebar");

// Get the DIV with overlay effect
var overlayBg = document.getElementById("myOverlay");

// var dash_open = window.mySidebar.style.display == 'block' ? false : true;
var dash_open = window.innerWidth <= 976 ? false : true;
window.addEventListener('resize', function () {
  if (window.innerWidth >= 976) dash_open = true;
  else dash_open = false;
});

// Toggle between showing and hiding the sidebar, and add overlay effect
function w3_open() {
  if (mySidebar.style.display === 'block') {
    mySidebar.style.display = 'none';
    overlayBg.style.display = "none";
    dash_open = false;
  } else {
    mySidebar.style.display = 'block';
    overlayBg.style.display = "block";
    dash_open = true;
  };
}

// Close the sidebar with the close button
function w3_close() {
  mySidebar.style.display = "none";
  overlayBg.style.display = "none";
  dash_open = false;
}