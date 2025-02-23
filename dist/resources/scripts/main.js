document.addEventListener('DOMContentLoaded', function () {


    const article = document.querySelector('article');
    article.addEventListener('scroll', function () {
        if (article.scrollTop > 0) {
            document.querySelector('.navbar').classList.add('scrolled');
        } else {
            document.querySelector('.navbar').classList.remove('scrolled');
        }
    });

    // Get all links in the navbar
const navLinks = document.querySelectorAll('.navbar-menu a');

// Add event listener to scroll event on article
article.addEventListener('scroll', () => {
  // Get the current scroll position
  const scrollPosition = article.scrollTop;

  // Loop through all sections
  const sections = document.querySelectorAll('.scroll-section');
  sections.forEach((section, index) => {
    // Get the top and bottom positions of the section
    const sectionTop = section.offsetTop;
    const sectionBottom = sectionTop + section.offsetHeight;

    // Check if the section is currently in view
    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
      // Get the corresponding link in the navbar
      const link = navLinks[index];

      // Add class to the link to apply the same style as when it's hovered
      link.classList.add('active');

      // Remove class from other links
      navLinks.forEach((otherLink) => {
        if (otherLink !== link) {
          otherLink.classList.remove('active');
        }
      });
    }
  });
});

// Add event listener to click event on links
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    // Add class to the link to apply the same style as when it's hovered
    link.classList.add('active');

    // Remove class from other links
    navLinks.forEach((otherLink) => {
      if (otherLink !== link) {
        otherLink.classList.remove('active');
      }
    });
  });
});
});

function openMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.right = '0';
}
function closeMenu() {
    const sidebar = document.querySelector('.sidebar');
    const screenWidth = window.innerWidth;
    if (screenWidth < 400) {
        sidebar.style.right = '-100vw';
    } else {
        sidebar.style.right = '-250px';
    }
}

document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    console.log(event.target)
    // Check if the click was outside of the sidebar
    if (event.target.classList.contains('fa-solid') && event.target.classList.contains('fa-bars')) {
        return;
    }
    
    if (sidebar.contains(event.target) && event.target.tagName === 'A' && !event.target.parentNode.classList.contains('sidebar-social') || event.target.classList.contains('spch') && !event.target.parentNode.classList.contains('sidebar-social')){
        // Close the sidebar
        closeMenu();
    }
    

      // Check if the click was outside of the sidebar
    if (!sidebar.contains(event.target)) {
        // Close the sidebar
        closeMenu();
    }
});













//SOURCETREE

// Get all links in the navbar
const navLinks = document.querySelectorAll('.navbar-menu a');

// Get the article element
const article = document.querySelector('article');

// Add event listener to scroll event on article
article.addEventListener('scroll', () => {
  // Remove active class from all links
  navLinks.forEach((link) => {
    link.classList.remove('active');
  });

  // Get the current scroll position
  const scrollPosition = article.scrollTop;

  // Loop through all sections
  const sections = document.querySelectorAll('.scroll-section');
  sections.forEach((section, index) => {
    // Get the top and bottom positions of the section
    const sectionTop = section.offsetTop;
    const sectionBottom = sectionTop + section.offsetHeight;

    // Check if the section is currently in view
    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
      // Get the corresponding link in the navbar
      const link = navLinks[index];

      // Add class to the link to apply the same style as when it's hovered
      link.classList.add('active');
    }
  });
});

// Add event listener to click event on links
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    // Remove active class from all links
    navLinks.forEach((otherLink) => {
      otherLink.classList.remove('active');
    });

    // Add class to the link to apply the same style as when it's hovered
    link.classList.add('active');
  });
});



