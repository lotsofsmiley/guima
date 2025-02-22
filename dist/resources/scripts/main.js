document.addEventListener('DOMContentLoaded', function () {


    const article = document.querySelector('article');
    article.addEventListener('scroll', function () {
        if (article.scrollTop > 0) {
            document.querySelector('.navbar').classList.add('scrolled');
        } else {
            document.querySelector('.navbar').classList.remove('scrolled');
        }
    });
    
    const navbarToggle = document.getElementById('navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    const navbarSocial = document.querySelector('.navbar-social');

    navbarToggle.addEventListener('click', () => {
        navbarMenu.classList.toggle('show');
        navbarSocial.classList.toggle('show');
    });

});

