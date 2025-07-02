document.addEventListener('DOMContentLoaded', function () {
  
  var $grid = $('.gallery-section-grid');
  $grid.imagesLoaded(function () {
    $grid.masonry({
      itemSelector: '.gallery-section-grid-item',
      columnWidth: '.gallery-section-grid-item',
      percentPosition: true
    });
    $grid.masonry('layout');
  });

    const article = document.querySelector('article');
    article.addEventListener('scroll', function () {
        if (article.scrollTop > 0) {
            document.querySelector('.navbar').classList.add('scrolled');
            document.querySelector('.banner-section-title').classList.add('scrolled');
        } else {
            document.querySelector('.navbar').classList.remove('scrolled');
            document.querySelector('.banner-section-title').classList.remove('scrolled');
        }
    });

  //if(window.innerWidth > 1000 || window.innerHeight > 800) {
    const navLinks = document.querySelectorAll('.navbar-menu a');
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    const sections = document.querySelectorAll('.scroll-section');

    article.addEventListener('scroll', () => {
      const scrollPosition = article.scrollTop;
      sections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionMiddle = sectionTop + (sectionHeight / 2);
        
        if (scrollPosition >= sectionMiddle && (index === sections.length - 1 || scrollPosition < sections[index + 1].offsetTop)) {
          navLinks.forEach((link) => {
            link.classList.remove('active');
          });
          navLinks[index].classList.add('active');
    
          sidebarLinks.forEach((link) => {
            link.classList.remove('active');
          });
          sidebarLinks[index].classList.add('active');
        } else {
          navLinks[index].classList.remove('active');
          sidebarLinks[index].classList.remove('active');
        }
      });
    });
  //}
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


