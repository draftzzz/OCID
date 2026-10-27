document.addEventListener('DOMContentLoaded', function() {
            // Menú móvil
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            const navLinks = document.querySelector('.nav-links');

            mobileMenuBtn.addEventListener('click', function() {
                navLinks.classList.toggle('active');
                // Cambiar icono de menú
                const icon = this.querySelector('i');
                if (navLinks.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });

            // Cerrar menú al hacer clic en un enlace
            const navItems = document.querySelectorAll('.nav-links a');
            navItems.forEach(item => {
                item.addEventListener('click', function() {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                });
            });

            // Efectos de scroll
            const scrollSections = document.querySelectorAll('.scroll-section');

            const checkScroll = () => {
                const triggerBottom = window.innerHeight * 0.8;

                scrollSections.forEach(section => {
                    const sectionTop = section.getBoundingClientRect().top;
                    if (sectionTop < triggerBottom) {
                        section.classList.add('visible');
                    }
                });
            };

            // Ejecutar al cargar y al hacer scroll
            window.addEventListener('load', checkScroll);
            window.addEventListener('scroll', checkScroll);

            // Prevenir envío de formularios falsos
            const forms = document.querySelectorAll('form[href="#"]');
            forms.forEach(form => {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    alert('Esta función estará disponible en la versión completa de la plataforma.');
                });
            });
        });

