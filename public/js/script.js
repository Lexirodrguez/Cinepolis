class CineManager {
    constructor() {
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPeliculas();
    }

    bindEvents() {
        // Botón agregar película
        document.querySelector('.btn-add').addEventListener('click', () => {
            this.showModal();
        });

        // Cerrar modal
        document.querySelector('.close').addEventListener('click', () => {
            this.hideModal();
        });

        // Enviar formulario
        document.getElementById('crud-form').addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Cerrar modal al hacer click fuera
        document.getElementById('crud-modal').addEventListener('click', (e) => {
            if (e.target.id === 'crud-modal') {
                this.hideModal();
            }
        });
    }

    async loadPeliculas() {
        try {
            const response = await fetch('/api/peliculas');
            const peliculas = await response.json();
            this.renderTable(peliculas);
        } catch (error) {
            this.showAlert('Error al cargar las películas: ' + error.message, 'error');
        }
    }

    renderTable(peliculas) {
        const tbody = document.querySelector('#data-table tbody');
        tbody.innerHTML = '';

        peliculas.forEach(pelicula => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pelicula.id_peliculas}</td>
                <td>${pelicula.titulo_peliculas}</td>
                <td>${pelicula.duracion_peliculas}</td>
                <td>${pelicula.año_peliculas}</td>
                <td>
                    <button class="btn btn-edit" onclick="cineManager.editPelicula(${pelicula.id_peliculas})">Editar</button>
                    <button class="btn btn-danger" onclick="cineManager.deletePelicula(${pelicula.id_peliculas})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    showModal() {
        this.currentEditId = null;
        document.getElementById('modal-title').textContent = 'Agregar Película';
        document.getElementById('crud-modal').style.display = 'block';
        document.getElementById('crud-form').reset();
    }

    hideModal() {
        document.getElementById('crud-modal').style.display = 'none';
        this.currentEditId = null;
    }

    async editPelicula(id) {
        try {
            const response = await fetch(`/api/peliculas/${id}`);
            const pelicula = await response.json();

            if (response.ok) {
                this.currentEditId = id;
                document.getElementById('modal-title').textContent = 'Editar Película';
                document.getElementById('titulo_peliculas').value = pelicula.titulo_peliculas;
                document.getElementById('duracion_peliculas').value = pelicula.duracion_peliculas;
                document.getElementById('año_peliculas').value = pelicula.año_peliculas;
                document.getElementById('crud-modal').style.display = 'block';
            } else {
                throw new Error(pelicula.error);
            }
        } catch (error) {
            this.showAlert('Error al cargar la película: ' + error.message, 'error');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            titulo_peliculas: formData.get('titulo_peliculas'),
            duracion_peliculas: parseInt(formData.get('duracion_peliculas')),
            año_peliculas: parseInt(formData.get('año_peliculas'))
        };

        try {
            let response;
            if (this.currentEditId) {
                // Actualizar película existente
                response = await fetch(`/api/peliculas/${this.currentEditId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
            } else {
                // Crear nueva película
                response = await fetch('/api/peliculas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
            }

            if (response.ok) {
                const result = await response.json();
                this.showAlert(result.message, 'success');
                this.hideModal();
                this.loadPeliculas();
            } else {
                const error = await response.json();
                throw new Error(error.error);
            }
        } catch (error) {
            this.showAlert('Error: ' + error.message, 'error');
        }
    }

    async deletePelicula(id) {
        if (!confirm('¿Está seguro de que desea eliminar esta película?')) {
            return;
        }

        try {
            const response = await fetch(`/api/peliculas/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const result = await response.json();
                this.showAlert(result.message, 'success');
                this.loadPeliculas();
            } else {
                const error = await response.json();
                throw new Error(error.error);
            }
        } catch (error) {
            this.showAlert('Error al eliminar: ' + error.message, 'error');
        }
    }

    showAlert(message, type) {
        // Crear alerta temporal
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        if (type === 'success') {
            alert.style.background = '#28a745';
        } else {
            alert.style.background = '#dc3545';
        }

        document.body.appendChild(alert);

        // Auto-remover después de 3 segundos
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.cineManager = new CineManager();
});