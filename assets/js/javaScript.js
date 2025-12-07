let currentTab = 1;
let navItems = [];
let loveUnlocked = false;
let pendingProtectedTab = null;
let lockOverlay;
let lockForm;
let lockInput;
let lockError;
let lockCancel;
let loveHeartAnimationInitialized = false;
let loveHeartAnimationEnsureSize = null;

function queueFrame(callback) {
    const raf = window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.oRequestAnimationFrame
        || window.msRequestAnimationFrame;

    if (raf) {
        raf.call(window, callback);
    } else {
        window.setTimeout(callback, 16);
    }
}

function initLoveHeartAnimation() {
    if (loveHeartAnimationInitialized) {
        return;
    }

    const canvas = document.getElementById('love-canvas');
    if (!canvas) {
        return;
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = window.webkitRequestAnimationFrame
            || window.mozRequestAnimationFrame
            || window.oRequestAnimationFrame
            || window.msRequestAnimationFrame
            || function (callback) {
                return window.setTimeout(callback, 16);
            };
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    loveHeartAnimationInitialized = true;

    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test((navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase());
    const rand = Math.random;
    const traceCount = mobile ? 20 : 50;
    const config = {
        traceK: 0.4,
        timeDelta: 0.01
    };

    const heartPosition = rad => [
        Math.pow(Math.sin(rad), 3),
        -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
    ];

    const scaleAndTranslate = (pos, sx, sy, dx, dy) => [
        dx + pos[0] * sx,
        dy + pos[1] * sy
    ];

    const dr = mobile ? 0.3 : 0.1;
    const pointsOrigin = [];
    for (let angle = 0; angle < Math.PI * 2; angle += dr) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(angle), 210, 13, 0, 0));
    }
    for (let angle = 0; angle < Math.PI * 2; angle += dr) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(angle), 150, 9, 0, 0));
    }
    for (let angle = 0; angle < Math.PI * 2; angle += dr) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(angle), 90, 5, 0, 0));
    }

    const heartPointsCount = pointsOrigin.length;
    const targetPoints = new Array(heartPointsCount);

    const pulse = (kx, ky, width, height) => {
        for (let i = 0; i < heartPointsCount; i += 1) {
            const originPoint = pointsOrigin[i];
            targetPoints[i] = [
                kx * originPoint[0] + width / 2,
                ky * originPoint[1] + height / 2
            ];
        }
    };

    const particles = [];
    let width = 0;
    let height = 0;

    const createParticles = () => {
        particles.length = 0;
        for (let i = 0; i < heartPointsCount; i += 1) {
            const x = rand() * width;
            const y = rand() * height;
            const trace = Array.from({ length: traceCount }, () => ({ x, y }));
            particles.push({
                vx: 0,
                vy: 0,
                speed: rand() + 5,
                q: Math.floor(rand() * heartPointsCount),
                D: (i % 2 === 0 ? -1 : 1),
                force: 0.2 * rand() + 0.7,
                color: `hsla(0,${Math.floor(40 * rand() + 60)}%,${Math.floor(60 * rand() + 20)}%,0.3)`,
                trace
            });
        }
    };

    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            queueFrame(resizeCanvas);
            return;
        }
        const ratio = window.devicePixelRatio || 1;
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        width = rect.width;
        height = rect.height;
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fillRect(0, 0, width, height);
        createParticles();
    };

    loveHeartAnimationEnsureSize = () => {
        resizeCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;

    const loop = () => {
        if (width === 0 || height === 0) {
            queueFrame(loop);
            return;
        }
        const n = -Math.cos(time);
        pulse((1 + n) * 0.5, (1 + n) * 0.5, width, height);
        const timeStep = (Math.sin(time) < 0 ? 9 : (n > 0.8 ? 0.2 : 1)) * config.timeDelta;
        time += timeStep;

        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0, 0, width, height);

        for (let i = particles.length - 1; i >= 0; i -= 1) {
            const particle = particles[i];
            const target = targetPoints[particle.q];
            if (!target) {
                continue;
            }

            const dx = particle.trace[0].x - target[0];
            const dy = particle.trace[0].y - target[1];
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;

            if (distance < 10) {
                if (rand() > 0.95) {
                    particle.q = Math.floor(rand() * heartPointsCount);
                } else {
                    if (rand() > 0.99) {
                        particle.D *= -1;
                    }
                    particle.q += particle.D;
                    particle.q %= heartPointsCount;
                    if (particle.q < 0) {
                        particle.q += heartPointsCount;
                    }
                }
            }

            particle.vx += (-dx / distance) * particle.speed;
            particle.vy += (-dy / distance) * particle.speed;
            particle.trace[0].x += particle.vx;
            particle.trace[0].y += particle.vy;
            particle.vx *= particle.force;
            particle.vy *= particle.force;

            for (let k = 0; k < particle.trace.length - 1; k += 1) {
                const current = particle.trace[k];
                const next = particle.trace[k + 1];
                next.x -= config.traceK * (next.x - current.x);
                next.y -= config.traceK * (next.y - current.y);
            }

            ctx.fillStyle = particle.color;
            for (let k = 0; k < particle.trace.length; k += 1) {
                const point = particle.trace[k];
                ctx.fillRect(point.x, point.y, 1, 1);
            }
        }

        queueFrame(loop);
    };

    queueFrame(loop);
}

function setActiveNav(index) {
    if (!navItems.length) {
        return;
    }

    navItems.forEach(item => {
        const tab = Number(item.dataset.tab);
        if (tab === index) {
            item.classList.add('border-b-4', 'border-white');
        } else {
            item.classList.remove('border-b-4', 'border-white');
        }
    });
}

function openLockModal() {
    if (!lockOverlay) {
        return;
    }
    lockOverlay.classList.remove('hidden');
    lockOverlay.setAttribute('aria-hidden', 'false');
    if (lockError) {
        lockError.classList.add('hidden');
    }
    if (lockInput) {
        lockInput.value = '';
        setTimeout(() => lockInput.focus(), 20);
    }
}

function closeLockModal(options = {}) {
    const { restoreNav = true, clearPending = true } = options;
    if (!lockOverlay) {
        return;
    }
    lockOverlay.classList.add('hidden');
    lockOverlay.setAttribute('aria-hidden', 'true');
    if (lockInput) {
        lockInput.value = '';
    }
    if (lockError) {
        lockError.classList.add('hidden');
    }
    if (restoreNav) {
        setActiveNav(currentTab);
    }
    if (clearPending) {
        pendingProtectedTab = null;
    }
}

function activateTab(index) {
    const main1 = document.getElementById('main-1');
    const main2 = document.getElementById('main-2');
    const main3 = document.getElementById('main-3');
    const main4 = document.getElementById('main-4');
    const main5 = document.getElementById('main-5');

    const sections = [main1, main2, main3, main4, main5];
    sections.forEach(section => {
        if (section) {
            section.classList.add('hidden');
        }
    });

    const target = sections[index - 1];
    if (target) {
        target.classList.remove('hidden');
        currentTab = index;
        setActiveNav(currentTab);
        if (index === 5) {
            queueFrame(() => {
                initLoveHeartAnimation();
                if (typeof loveHeartAnimationEnsureSize === 'function') {
                    loveHeartAnimationEnsureSize();
                }
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const gallery = document.getElementById('gallery');
    if (gallery) {
        for (let i = 1; i <= 31; i++) {
            const img = document.createElement('img');
            img.src = "assets/image/blog-" + i + ".jpg";
            img.alt = "Ảnh " + i;
            gallery.appendChild(img);
        }
    }

    navItems = Array.from(document.querySelectorAll('nav .ui-item'));

    const uiItems = document.querySelectorAll('.ui-item');
    uiItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = Number(item.dataset.tab);
            if (!Number.isNaN(tab)) {
                setActiveNav(tab);
            }
        });
    });

    setActiveNav(currentTab);

    lockOverlay = document.getElementById('lock-overlay');
    lockForm = document.getElementById('lock-form');
    lockInput = document.getElementById('lock-input');
    lockError = document.getElementById('lock-error');
    lockCancel = document.getElementById('lock-cancel');

    if (lockForm) {
        lockForm.addEventListener('submit', event => {
            event.preventDefault();
            const attempt = lockInput ? lockInput.value.trim() : '';
            if (attempt === 'thienthan') {
                loveUnlocked = true;
                const targetTab = pendingProtectedTab ?? 5;
                closeLockModal({ restoreNav: false, clearPending: false });
                pendingProtectedTab = null;
                activateTab(targetTab);
            } else {
                if (lockError) {
                    lockError.classList.remove('hidden');
                }
                if (lockInput) {
                    lockInput.focus();
                }
            }
        });
    }

    if (lockCancel) {
        lockCancel.addEventListener('click', () => {
            closeLockModal();
        });
    }

    if (lockOverlay) {
        lockOverlay.addEventListener('click', event => {
            if (event.target === lockOverlay) {
                closeLockModal();
            }
        });
    }

    if (lockInput && lockError) {
        lockInput.addEventListener('input', () => {
            lockError.classList.add('hidden');
        });
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && lockOverlay && !lockOverlay.classList.contains('hidden')) {
            closeLockModal();
        }
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
    if (index === 5 && !loveUnlocked) {
        pendingProtectedTab = index;
        openLockModal();
        return;
    }

    activateTab(index);
}

// Firebase Logic
document.addEventListener('DOMContentLoaded', function () {
    const firebaseConfig = {
        apiKey: "AIzaSyDi9hGm6bCVJwSkL2wr5D9edNK9myy9MAg",
        authDomain: "phuckk-profile.firebaseapp.com",
        databaseURL: "https://phuckk-profile-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "phuckk-profile",
        storageBucket: "phuckk-profile.firebasestorage.app",
        messagingSenderId: "259778554642",
        appId: "1:259778554642:web:7dc51916c7774d056ea1cb",
        measurementId: "G-9W44B8MWD4"
    };

    // Initialize Firebase
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();

        // Initialize EmailJS
        // Replace with your actual EmailJS credentials
        const EMAILJS_PUBLIC_KEY = "6eXxmxONlwXQBpfMh";
        const EMAILJS_SERVICE_ID = "service_0b66sr6dsgds";
        const EMAILJS_TEMPLATE_ID = "template_jqox8ac"; // You need to create a template in EmailJS dashboard

        if (typeof emailjs !== 'undefined') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
        } else {
            console.error("EmailJS SDK not loaded");
        }

        // Show Name Modal
        const nameModal = document.getElementById('name-modal');
        const nameInput = document.getElementById('visitor-name-input');
        const submitBtn = document.getElementById('submit-name-btn');
        const nameError = document.getElementById('name-error');

        if (nameModal && nameInput && submitBtn) {
            // Show modal immediately
            nameModal.classList.remove('hidden');
            nameInput.focus();

            const submitName = () => {
                const visitorName = nameInput.value.trim();

                if (visitorName === "") {
                    nameError.classList.remove('hidden');
                    nameInput.classList.add('border-red-500');
                    return;
                }

                // Disable input and button while saving
                nameInput.disabled = true;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

                // 1. Save to Firestore
                db.collection("visitors").add({
                    name: visitorName,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    userAgent: navigator.userAgent
                })
                    .then((docRef) => {
                        console.log("Visitor recorded with ID: ", docRef.id);

                        // 2. Send Email via EmailJS
                        if (typeof emailjs !== 'undefined') {
                            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Đang gửi mail...';

                            const templateParams = {
                                title: "Có khách mới ghé thăm Profile!",
                                name: visitorName,
                                message: `Người dùng tên là ${visitorName} vừa truy cập vào website của bạn lúc ${new Date().toLocaleString()}.`,
                                email: "visitor@example.com"
                            };

                            return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
                        } else {
                            return Promise.resolve(); // Skip email if SDK missing
                        }
                    })
                    .then(() => {
                        console.log("Email sent successfully!");
                        // Hide modal with animation
                        nameModal.classList.add('opacity-0', 'transition-opacity', 'duration-500');
                        setTimeout(() => {
                            nameModal.classList.add('hidden');
                        }, 500);
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                        // Even if email fails, we let them in if Firestore succeeded, or handle error
                        // For now, let's assume if Firestore worked, we let them in. 
                        // If Firestore failed, we show error.

                        // Check if it was Firestore error or EmailJS error
                        if (error.code) { // Firestore errors usually have code
                            nameInput.disabled = false;
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = 'Thử lại';
                            alert("Có lỗi kết nối, vui lòng thử lại!");
                        } else {
                            // EmailJS error or other, still let them in but log it
                            console.warn("Email sending failed but visitor recorded.");
                            nameModal.classList.add('opacity-0', 'transition-opacity', 'duration-500');
                            setTimeout(() => {
                                nameModal.classList.add('hidden');
                            }, 500);
                        }
                    });
            };

            submitBtn.addEventListener('click', submitName);

            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitName();
                }
            });

            nameInput.addEventListener('input', () => {
                if (nameInput.value.trim() !== "") {
                    nameError.classList.add('hidden');
                    nameInput.classList.remove('border-red-500');
                }
            });
        }
    } else {
        console.error("Firebase SDK not loaded");
    }
});

// Typing Effect
const texts = ["Developer", "Designer", "Freelancer", "Gamer"];
let count = 0;
let index = 0;
let currentText = "";
let letter = "";

(function type() {
    if (count === texts.length) {
        count = 0;
    }
    currentText = texts[count];
    letter = currentText.slice(0, ++index);

    const typingElement = document.getElementById("typing-text");
    if (typingElement) {
        typingElement.textContent = letter;
    }

    if (letter.length === currentText.length) {
        count++;
        index = 0;
        setTimeout(type, 2000); // Wait before typing next word
    } else {
        setTimeout(type, 100);
    }
})();

// Particle Background
const canvas = document.getElementById("particle-canvas");
if (canvas) {
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.directionX = (Math.random() * 0.4) - 0.2;
            this.directionY = (Math.random() * 0.4) - 0.2;
            this.size = Math.random() * 2;
            this.color = '#ffffff';
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        update() {
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }
            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    function init() {
        particlesArray = [];
        let numberOfParticles = (canvas.height * canvas.width) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
    }

    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    });

    init();
    animate();
}

