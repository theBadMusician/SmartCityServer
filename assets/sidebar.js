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
  if (dash_open) {
    document.getElementById("mySidebar").style.display = 'none';
    document.getElementById("myOverlay").style.display = "none";
    dash_open = false;
  } else {
    document.getElementById("mySidebar").style.display = 'block';
    document.getElementById("myOverlay").style.display = "block";
    dash_open = true;
  };
}

// Close the sidebar with the close button
function w3_close() {
  document.getElementById("mySidebar").style.display = "none";
  document.getElementById("myOverlay").style.display = "none";
  dash_open = false;
}