/*
document.addEventListener('DOMContentLoaded', function() {
    const images = [
        '/background/back1.jpg',
        '/background/back2.jpg',
        '/background/back3.jpg',
        '/background/back4.jpg',
        '/background/back5.jpg'
    ];

    images.forEach(src => {const img = new Image();
    img.src = src;
    });
});
*/


window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if(header) {
        if (window.scrollY > 50) { // Adjust the scroll threshold as needed
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}
});


const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn){
logoutBtn.onclick = async function() {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/login.html';
};
}