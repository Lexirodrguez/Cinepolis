/**
 * Controlador para gestionar operaciones CRUD de películas
 * @class PeliculaController
 */
class PeliculaController {
    /**
     * Crea una instancia del controlador de películas
     * @param {Object} db - Conexión a la base de datos MySQL
     */
    constructor(db) {
        this.db = db;
    }

    /**
     * Obtiene todas las películas de la base de datos
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async getAll(req, res) {
        try {
            console.log('📥 [PeliculaController] Obteniendo todas las películas...');
            
            const [rows] = await this.db.execute(
                'SELECT * FROM peliculas ORDER BY id_peliculas DESC'
            );
            
            console.log(`✅ [PeliculaController] Se encontraron ${rows.length} películas`);
            
            res.json({
                success: true,
                data: rows,
                count: rows.length,
                message: 'Películas obtenidas exitosamente'
            });
            
        } catch (error) {
            console.error('❌ [PeliculaController] Error al obtener películas:', error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al obtener películas'
            });
        }
    }

    /**
     * Obtiene una película específica por su ID
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async getById(req, res) {
        try {
            const id = req.params.id;
            console.log(`📥 [PeliculaController] Obteniendo película con ID: ${id}`);
            
            // Validar que el ID sea un número
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID inválido',
                    message: 'El ID debe ser un número válido'
                });
            }
            
            const [rows] = await this.db.execute(
                'SELECT * FROM peliculas WHERE id_peliculas = ?',
                [id]
            );
            
            if (rows.length === 0) {
                console.log(`❌ [PeliculaController] Película con ID ${id} no encontrada`);
                
                return res.status(404).json({
                    success: false,
                    error: 'Película no encontrada',
                    message: `No se encontró ninguna película con el ID ${id}`
                });
            }
            
            console.log(`✅ [PeliculaController] Película encontrada: ${rows[0].titulo_peliculas}`);
            
            res.json({
                success: true,
                data: rows[0],
                message: 'Película obtenida exitosamente'
            });
            
        } catch (error) {
            console.error(`❌ [PeliculaController] Error al obtener película ID ${req.params.id}:`, error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al obtener la película'
            });
        }
    }

    /**
     * Crea una nueva película en la base de datos
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async create(req, res) {
        try {
            const { titulo_peliculas, duracion_peliculas, año_peliculas } = req.body;
            
            console.log('📝 [PeliculaController] Creando nueva película:', { 
                titulo_peliculas, 
                duracion_peliculas, 
                año_peliculas 
            });
            
            // Validar datos requeridos
            const errors = this.validatePeliculaData(req.body);
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    errors: errors,
                    message: 'Datos de validación incorrectos'
                });
            }
            
            // Insertar en la base de datos
            const [result] = await this.db.execute(
                'INSERT INTO peliculas (titulo_peliculas, duracion_peliculas, año_peliculas) VALUES (?, ?, ?)',
                [titulo_peliculas, parseInt(duracion_peliculas), año_peliculas]
            );
            
            console.log(`✅ [PeliculaController] Película creada con ID: ${result.insertId}`);
            
            // Obtener la película recién creada para devolverla
            const [newPelicula] = await this.db.execute(
                'SELECT * FROM peliculas WHERE id_peliculas = ?',
                [result.insertId]
            );
            
            res.status(201).json({
                success: true,
                data: newPelicula[0],
                message: 'Película creada exitosamente',
                id: result.insertId
            });
            
        } catch (error) {
            console.error('❌ [PeliculaController] Error al crear película:', error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al crear la película'
            });
        }
    }

    /**
     * Actualiza una película existente
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async update(req, res) {
        try {
            const id = req.params.id;
            const { titulo_peliculas, duracion_peliculas, año_peliculas } = req.body;
            
            console.log(`✏️ [PeliculaController] Actualizando película ID: ${id}`, { 
                titulo_peliculas, 
                duracion_peliculas, 
                año_peliculas 
            });
            
            // Validar ID
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID inválido',
                    message: 'El ID debe ser un número válido'
                });
            }
            
            // Validar datos
            const errors = this.validatePeliculaData(req.body);
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    errors: errors,
                    message: 'Datos de validación incorrectos'
                });
            }
            
            // Verificar que la película existe
            const [existing] = await this.db.execute(
                'SELECT * FROM peliculas WHERE id_peliculas = ?',
                [id]
            );
            
            if (existing.length === 0) {
                console.log(`❌ [PeliculaController] Película con ID ${id} no encontrada para actualizar`);
                
                return res.status(404).json({
                    success: false,
                    error: 'Película no encontrada',
                    message: `No se encontró ninguna película con el ID ${id}`
                });
            }
            
            // Actualizar en la base de datos
            const [result] = await this.db.execute(
                'UPDATE peliculas SET titulo_peliculas = ?, duracion_peliculas = ?, año_peliculas = ? WHERE id_peliculas = ?',
                [titulo_peliculas, parseInt(duracion_peliculas), año_peliculas, id]
            );
            
            console.log(`✅ [PeliculaController] Película ID ${id} actualizada exitosamente`);
            
            // Obtener la película actualizada
            const [updatedPelicula] = await this.db.execute(
                'SELECT * FROM peliculas WHERE id_peliculas = ?',
                [id]
            );
            
            res.json({
                success: true,
                data: updatedPelicula[0],
                message: 'Película actualizada exitosamente'
            });
            
        } catch (error) {
            console.error(`❌ [PeliculaController] Error al actualizar película ID ${req.params.id}:`, error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al actualizar la película'
            });
        }
    }

    /**
     * Elimina una película de la base de datos
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async delete(req, res) {
        try {
            const id = req.params.id;
            console.log(`🗑️ [PeliculaController] Eliminando película con ID: ${id}`);
            
            // Validar ID
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID inválido',
                    message: 'El ID debe ser un número válido'
                });
            }
            
            // Verificar que la película existe
            const [existing] = await this.db.execute(
                'SELECT * FROM peliculas WHERE id_peliculas = ?',
                [id]
            );
            
            if (existing.length === 0) {
                console.log(`❌ [PeliculaController] Película con ID ${id} no encontrada para eliminar`);
                
                return res.status(404).json({
                    success: false,
                    error: 'Película no encontrada',
                    message: `No se encontró ninguna película con el ID ${id}`
                });
            }
            
            // Eliminar de la base de datos
            const [result] = await this.db.execute(
                'DELETE FROM peliculas WHERE id_peliculas = ?',
                [id]
            );
            
            console.log(`✅ [PeliculaController] Película ID ${id} eliminada exitosamente`);
            
            res.json({
                success: true,
                message: 'Película eliminada exitosamente',
                deletedId: parseInt(id)
            });
            
        } catch (error) {
            console.error(`❌ [PeliculaController] Error al eliminar película ID ${req.params.id}:`, error);
            
            // Manejar error de clave foránea (si la película está en uso)
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({
                    success: false,
                    error: 'Película en uso',
                    message: 'No se puede eliminar la película porque está siendo utilizada en funciones existentes'
                });
            }
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al eliminar la película'
            });
        }
    }

    /**
     * Valida los datos de una película
     * @param {Object} data - Datos a validar
     * @returns {Array} - Array de errores de validación
     * @private
     */
    validatePeliculaData(data) {
        const errors = [];
        
        if (!data.titulo_peliculas || data.titulo_peliculas.trim() === '') {
            errors.push('El título de la película es requerido');
        } else if (data.titulo_peliculas.length > 255) {
            errors.push('El título de la película no puede exceder los 255 caracteres');
        }
        
        if (!data.duracion_peliculas || isNaN(data.duracion_peliculas)) {
            errors.push('La duración debe ser un número válido');
        } else if (parseInt(data.duracion_peliculas) <= 0) {
            errors.push('La duración debe ser mayor a 0 minutos');
        } else if (parseInt(data.duracion_peliculas) > 500) {
            errors.push('La duración no puede exceder los 500 minutos');
        }
        
        if (!data.año_peliculas || isNaN(data.año_peliculas)) {
            errors.push('El año debe ser un número válido');
        } else {
            const año = parseInt(data.año_peliculas);
            const currentYear = new Date().getFullYear();
            if (año < 1900 || año > currentYear + 5) {
                errors.push(`El año debe estar entre 1900 y ${currentYear + 5}`);
            }
        }
        
        return errors;
    }

    /**
     * Busca películas por título
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async search(req, res) {
        try {
            const { query } = req.query;
            
            if (!query || query.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'Query vacía',
                    message: 'El parámetro de búsqueda no puede estar vacío'
                });
            }
            
            console.log(`🔍 [PeliculaController] Buscando películas con query: "${query}"`);
            
            const [rows] = await this.db.execute(
                'SELECT * FROM peliculas WHERE titulo_peliculas LIKE ? ORDER BY titulo_peliculas',
                [`%${query}%`]
            );
            
            console.log(`✅ [PeliculaController] Búsqueda completada. Encontradas: ${rows.length} películas`);
            
            res.json({
                success: true,
                data: rows,
                count: rows.length,
                query: query,
                message: `Búsqueda completada. Encontradas ${rows.length} películas`
            });
            
        } catch (error) {
            console.error('❌ [PeliculaController] Error en búsqueda de películas:', error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor en la búsqueda'
            });
        }
    }
}

module.exports = PeliculaController;