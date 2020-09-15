const header = document.getElementsByTagName('header')[0];
const profileIconImg = document.getElementById('profile-icon-img');
const profileIcon = profileIconImg.parentElement;

let currentScrollOffset = window.scrollY;
window.addEventListener('scroll', function() {
    if (window.scrollY > currentScrollOffset) {
        header.classList.remove('shown');
    } else {
        header.classList.add('shown');
    }
    currentScrollOffset = window.scrollY;
});

window.addEventListener('click', (e) => {
    if (e.target !== profileIconImg) {
        profileIcon.classList.remove('open');
    } else {
        profileIcon.classList.toggle('open');
    }
})