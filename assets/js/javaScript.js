document.addEventListener("DOMContentLoaded", function () {
    const gallery = document.getElementById('gallery');

    for (let i = 1; i <= 31; i++) {
        const img = document.createElement('img');
        img.src = "assets/image/blog-" + i + ".jpg";
        img.alt = "Ảnh " + i;
        gallery.appendChild(img);
    }


    const uiItems = document.querySelectorAll('.ui-item');

    uiItems.forEach(item => {
        item.addEventListener('click', () => {
            // Xóa border-2 của tất cả ui-item
            uiItems.forEach(el => {
                el.classList.remove('border-b-4', 'border-white');
            });

            // Thêm border-2 cho item được bấm
            item.classList.add('border-b-4', 'border-white');
        });
    });

    const textElement = document.getElementById("typing-text");
    const textToType = "Mobile App Development";
    let index = 0;
    let isDeleting = false;

    function type() {
        const currentText = textToType.substring(0, index);
        textElement.textContent = currentText;

        if (!isDeleting) {
            if (index < textToType.length) {
                index++;
                setTimeout(type, 100);
            } else {
                isDeleting = true;
                setTimeout(type, 1500);
            }
        } else {
            if (index > 0) {
                index--;
                setTimeout(type, 50);
            } else {
                isDeleting = false;
                setTimeout(type, 500);
            }
        }
    }
    type();

    const style = document.createElement('style');
    style.innerHTML = `
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }
            #cursor {
                animation: blink 1s step-end infinite;
            }
        `;
    document.head.appendChild(style);

    const openMenuBtn = document.getElementById('open-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const navLinks = mobileMenuOverlay?.querySelectorAll('a');

    function closeMenu() {
        mobileMenuOverlay?.classList.add('hidden');
    }

    if (openMenuBtn) {
        openMenuBtn.addEventListener('click', () => {
            mobileMenuOverlay?.classList.remove('hidden');
        });
    }

    if (navLinks) {
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });
    }

    const toggleButton = document.getElementById('dropdown-toggle');
    const dropdownMenu = document.getElementById('dropdown-menu');

    // Chuyển đổi lớp "hidden" khi nút được click
    if (toggleButton && dropdownMenu) {
        toggleButton.addEventListener('click', function (event) {
            event.stopPropagation(); // Ngăn sự kiện click lan truyền ra ngoài
            dropdownMenu.classList.toggle('hidden');
            const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
            toggleButton.setAttribute('aria-expanded', !isExpanded);
        });

        // Đóng menu khi click vào bất cứ đâu bên ngoài menu
        document.addEventListener('click', function (event) {
            if (!toggleButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.add('hidden');
                toggleButton.setAttribute('aria-expanded', 'false');
            }
        });

        // Đóng menu khi click vào một link bên trong nó
        dropdownMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function () {
                dropdownMenu.classList.add('hidden');
                toggleButton.setAttribute('aria-expanded', 'false');
            });
        });
    }
});

function change(index) {
    const main1 = document.getElementById('main-1');
    const main2 = document.getElementById('main-2');
    const main3 = document.getElementById('main-3');
    const main4 = document.getElementById('main-4');


    const allMains = [main1, main2, main3, main4];

    allMains.forEach(main => {
        if (main) {
            main.classList.add('hidden');
        }
    });

    if (index === 1 && main1) {
        main1.classList.remove('hidden');
    } else if (index === 2 && main2) {
        main2.classList.remove('hidden');
    } else if (index === 3 && main3) {
        main3.classList.remove('hidden');
    } else if (index === 4 && main4) {
        main4.classList.remove('hidden');
    }
}