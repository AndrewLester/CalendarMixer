const header = document.getElementsByTagName('header')[0];

let currentScrollOffset = window.scrollY;
window.addEventListener('scroll', function() {
    if (window.scrollY > currentScrollOffset) {
        header.classList.remove('shown');
    } else {
        header.classList.add('shown');
    }
    currentScrollOffset = window.scrollY;
});