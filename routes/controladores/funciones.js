/**
 * Controlador para gestionar operaciones CRUD de funciones
 * @class FuncionController
 */
class FuncionController {
    /**
     * Crea una instancia del controlador de funciones
     * @param {Object} db - Conexión a la base de datos MySQL
     */
    constructor(db) {
        this.db = db;
    }

    /**
     * Obtiene todas las funciones con información relacionada
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async getAll(req, res) {
        try {
            console.log('📥 [FuncionController] Obteniendo todas las funciones...');
            
            const [rows] = await this.db.execute(`
                SELECT 
                    f.*, 
                    p.titulo_peliculas, 
                    p.duracion_peliculas,
                    s.nombre_sala, 
                    s.tipo_sala, 
                    h.nombre_horario, 
                    h.hora_horario
                FROM funcion f
                JOIN peliculas p ON f.id_peliculasfuncion = p.id_peliculas
                JOIN sala s ON f.id_salafuncion = s.id_sala
                JOIN horario h ON f.id_horariofuncion = h.id_horario
                ORDER BY f.fechahora_funcion DESC
            `);
            
            console.log(`✅ [FuncionController] Se encontraron ${rows.length} funciones`);
            
            res.json({
                success: true,
                data: rows,
                count: rows.length,
                message: 'Funciones obtenidas exitosamente'
            });
            
        } catch (error) {
            console.error('❌ [FuncionController] Error al obtener funciones:', error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al obtener funciones'
            });
        }
    }

    /**
     * Obtiene una función específica por su ID
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async getById(req, res) {
        try {
            const id = req.params.id;
            console.log(`📥 [FuncionController] Obteniendo función con ID: ${id}`);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID inválido',
                    message: 'El ID debe ser un número válido'
                });
            }
            
            const [rows] = await this.db.execute(`
                SELECT 
                    f.*, 
                    p.titulo_peliculas, 
                    p.duracion_peliculas,
                    s.nombre_sala, 
                    s.tipo_sala, 
                    h.nombre_horario, 
                    h.hora_horario
                FROM funcion f
                JOIN peliculas p ON f.id_peliculasfuncion = p.id_peliculas
                JOIN sala s ON f.id_salafuncion = s.id_sala
                JOIN horario h ON f.id_horariofuncion = h.id_horario
                WHERE f.id_funcion = ?
            `, [id]);
            
            if (rows.length === 0) {
                console.log(`❌ [FuncionController] Función con ID ${id} no encontrada`);
                
                return res.status(404).json({
                    success: false,
                    error: 'Función no encontrada',
                    message: `No se encontró ninguna función con el ID ${id}`
                });
            }
            
            console.log(`✅ [FuncionController] Función encontrada: ${rows[0].titulo_peliculas}`);
            
            res.json({
                success: true,
                data: rows[0],
                message: 'Función obtenida exitosamente'
            });
            
        } catch (error) {
            console.error(`❌ [FuncionController] Error al obtener función ID ${req.params.id}:`, error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al obtener la función'
            });
        }
    }

    /**
     * Crea una nueva función en la base de datos
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async create(req, res) {
        try {
            const { fechahora_funcion, estado_funcion, id_peliculasfuncion, id_salafuncion, id_horariofuncion } = req.body;
            
            console.log('📝 [FuncionController] Creando nueva función:', {
                fechahora_funcion, 
                estado_funcion, 
                id_peliculasfuncion, 
                id_salafuncion, 
                id_horariofuncion
            });
            
            // Validar datos
            const errors = this.validateFuncionData(req.body);
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    errors: errors,
                    message: 'Datos de validación incorrectos'
                });
            }
            
            // Verificar conflictos de horario
            const conflict = await this.checkScheduleConflict(
                fechahora_funcion, 
                id_salafuncion, 
                null // No hay ID para nueva función
            );
            
            if (conflict) {
                return res.status(409).json({
                    success: false,
                    error: 'Conflicto de horario',
                    message: 'Ya existe una función programada en esta sala para la fecha y hora seleccionada'
                });
            }
            
            // Insertar en la base de datos
            const [result] = await this.db.execute(
                'INSERT INTO funcion (fechahora_funcion, estado_funcion, id_peliculasfuncion, id_salafuncion, id_horariofuncion) VALUES (?, ?, ?, ?, ?)',
                [
                    fechahora_funcion, 
                    estado_funcion ? 1 : 0, 
                    parseInt(id_peliculasfuncion), 
                    parseInt(id_salafuncion), 
                    parseInt(id_horariofuncion)
                ]
            );
            
            console.log(`✅ [FuncionController] Función creada con ID: ${result.insertId}`);
            
            // Obtener la función recién creada con datos relacionados
            const [newFuncion] = await this.db.execute(`
                SELECT 
                    f.*, 
                    p.titulo_peliculas, 
                    s.nombre_sala, 
                    s.tipo_sala, 
                    h.nombre_horario, 
                    h.hora_horario
                FROM funcion f
                JOIN peliculas p ON f.id_peliculasfuncion = p.id_peliculas
                JOIN sala s ON f.id_salafuncion = s.id_sala
                JOIN horario h ON f.id_horariofuncion = h.id_horario
                WHERE f.id_funcion = ?
            `, [result.insertId]);
            
            res.status(201).json({
                success: true,
                data: newFuncion[0],
                message: 'Función creada exitosamente',
                id: result.insertId
            });
            
        } catch (error) {
            console.error('❌ [FuncionController] Error al crear función:', error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al crear la función'
            });
        }
    }

    /**
     * Actualiza una función existente
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async update(req, res) {
        try {
            const id = req.params.id;
            const { fechahora_funcion, estado_funcion, id_peliculasfuncion, id_salafuncion, id_horariofuncion } = req.body;
            
            console.log(`✏️ [FuncionController] Actualizando función ID: ${id}`, {
                fechahora_funcion, 
                estado_funcion, 
                id_peliculasfuncion, 
                id_salafuncion, 
                id_horariofuncion
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
            const errors = this.validateFuncionData(req.body);
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    errors: errors,
                    message: 'Datos de validación incorrectos'
                });
            }
            
            // Verificar que la función existe
            const [existing] = await this.db.execute(
                'SELECT * FROM funcion WHERE id_funcion = ?',
                [id]
            );
            
            if (existing.length === 0) {
                console.log(`❌ [FuncionController] Función con ID ${id} no encontrada para actualizar`);
                
                return res.status(404).json({
                    success: false,
                    error: 'Función no encontrada',
                    message: `No se encontró ninguna función con el ID ${id}`
                });
            }
            
            // Verificar conflictos de horario (excluyendo la función actual)
            const conflict = await this.checkScheduleConflict(
                fechahora_funcion, 
                id_salafuncion, 
                id
            );
            
            if (conflict) {
                return res.status(409).json({
                    success: false,
                    error: 'Conflicto de horario',
                    message: 'Ya existe otra función programada en esta sala para la fecha y hora seleccionada'
                });
            }
            
            // Actualizar en la base de datos
            const [result] = await this.db.execute(
                'UPDATE funcion SET fechahora_funcion = ?, estado_funcion = ?, id_peliculasfuncion = ?, id_salafuncion = ?, id_horariofuncion = ? WHERE id_funcion = ?',
                [
                    fechahora_funcion, 
                    estado_funcion ? 1 : 0, 
                    parseInt(id_peliculasfuncion), 
                    parseInt(id_salafuncion), 
                    parseInt(id_horariofuncion),
                    id
                ]
            );
            
            console.log(`✅ [FuncionController] Función ID ${id} actualizada exitosamente`);
            
            // Obtener la función actualizada con datos relacionados
            const [updatedFuncion] = await this.db.execute(`
                SELECT 
                    f.*, 
                    p.titulo_peliculas, 
                    s.nombre_sala, 
                    s.tipo_sala, 
                    h.nombre_horario, 
                    h.hora_horario
                FROM funcion f
                JOIN peliculas p ON f.id_peliculasfuncion = p.id_peliculas
                JOIN sala s ON f.id_salafuncion = s.id_sala
                JOIN horario h ON f.id_horariofuncion = h.id_horario
                WHERE f.id_funcion = ?
            `, [id]);
            
            res.json({
                success: true,
                data: updatedFuncion[0],
                message: 'Función actualizada exitosamente'
            });
            
        } catch (error) {
            console.error(`❌ [FuncionController] Error al actualizar función ID ${req.params.id}:`, error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al actualizar la función'
            });
        }
    }

    /**
     * Elimina una función de la base de datos
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async delete(req, res) {
        try {
            const id = req.params.id;
            console.log(`🗑️ [FuncionController] Eliminando función con ID: ${id}`);
            
            // Validar ID
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID inválido',
                    message: 'El ID debe ser un número válido'
                });
            }
            
            // Verificar que la función existe
            const [existing] = await this.db.execute(
                'SELECT * FROM funcion WHERE id_funcion = ?',
                [id]
            );
            
            if (existing.length === 0) {
                console.log(`❌ [FuncionController] Función con ID ${id} no encontrada para eliminar`);
                
                return res.status(404).json({
                    success: false,
                    error: 'Función no encontrada',
                    message: `No se encontró ninguna función con el ID ${id}`
                });
            }
            
            // Eliminar de la base de datos
            const [result] = await this.db.execute(
                'DELETE FROM funcion WHERE id_funcion = ?',
                [id]
            );
            
            console.log(`✅ [FuncionController] Función ID ${id} eliminada exitosamente`);
            
            res.json({
                success: true,
                message: 'Función eliminada exitosamente',
                deletedId: parseInt(id)
            });
            
        } catch (error) {
            console.error(`❌ [FuncionController] Error al eliminar función ID ${req.params.id}:`, error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al eliminar la función'
            });
        }
    }

    /**
     * Obtiene datos relacionados para formularios
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async getRelatedData(req, res) {
        try {
            console.log('📥 [FuncionController] Obteniendo datos relacionados...');
            
            const [peliculas] = await this.db.execute(
                'SELECT * FROM peliculas ORDER BY titulo_peliculas'
            );
            const [salas] = await this.db.execute(
                'SELECT * FROM sala WHERE estado_sala = 1 ORDER BY nombre_sala'
            );
            const [horarios] = await this.db.execute(
                'SELECT * FROM horario ORDER BY hora_horario'
            );
            
            console.log(`✅ [FuncionController] Datos relacionados: ${peliculas.length} películas, ${salas.length} salas, ${horarios.length} horarios`);
            
            res.json({
                success: true,
                data: {
                    peliculas,
                    salas,
                    horarios
                },
                message: 'Datos relacionados obtenidos exitosamente'
            });
            
        } catch (error) {
            console.error('❌ [FuncionController] Error al obtener datos relacionados:', error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al obtener datos relacionados'
            });
        }
    }

    /**
     * Valida los datos de una función
     * @param {Object} data - Datos a validar
     * @returns {Array} - Array de errores de validación
     * @private
     */
    validateFuncionData(data) {
        const errors = [];
        
        if (!data.fechahora_funcion) {
            errors.push('La fecha y hora de la función son requeridas');
        } else {
            const fechaFuncion = new Date(data.fechahora_funcion);
            const ahora = new Date();
            
            if (fechaFuncion <= ahora) {
                errors.push('La fecha y hora de la función deben ser futuras');
            }
        }
        
        if (!data.id_peliculasfuncion || isNaN(data.id_peliculasfuncion)) {
            errors.push('La película es requerida');
        }
        
        if (!data.id_salafuncion || isNaN(data.id_salafuncion)) {
            errors.push('La sala es requerida');
        }
        
        if (!data.id_horariofuncion || isNaN(data.id_horariofuncion)) {
            errors.push('El horario es requerido');
        }
        
        return errors;
    }

    /**
     * Verifica conflictos de horario en una sala
     * @param {string} fechahora - Fecha y hora de la función
     * @param {number} salaId - ID de la sala
     * @param {number} excludeFuncionId - ID de función a excluir (para actualizaciones)
     * @returns {Promise<boolean>} - True si hay conflicto
     * @private
     */
    async checkScheduleConflict(fechahora, salaId, excludeFuncionId = null) {
        try {
            let query = `
                SELECT COUNT(*) as count 
                FROM funcion 
                WHERE id_salafuncion = ? 
                AND fechahora_funcion = ?
                AND estado_funcion = 1
            `;
            
            const params = [salaId, fechahora];
            
            if (excludeFuncionId) {
                query += ' AND id_funcion != ?';
                params.push(excludeFuncionId);
            }
            
            const [rows] = await this.db.execute(query, params);
            
            return rows[0].count > 0;
            
        } catch (error) {
            console.error('❌ [FuncionController] Error verificando conflicto de horario:', error);
            throw error;
        }
    }

    /**
     * Obtiene funciones por rango de fechas
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @returns {Promise<void>}
     */
    async getByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    error: 'Fechas requeridas',
                    message: 'Las fechas de inicio y fin son requeridas'
                });
            }
            
            console.log(`📅 [FuncionController] Buscando funciones entre ${startDate} y ${endDate}`);
            
            const [rows] = await this.db.execute(`
                SELECT 
                    f.*, 
                    p.titulo_peliculas, 
                    s.nombre_sala, 
                    s.tipo_sala, 
                    h.nombre_horario, 
                    h.hora_horario
                FROM funcion f
                JOIN peliculas p ON f.id_peliculasfuncion = p.id_peliculas
                JOIN sala s ON f.id_salafuncion = s.id_sala
                JOIN horario h ON f.id_horariofuncion = h.id_horario
                WHERE DATE(f.fechahora_funcion) BETWEEN ? AND ?
                ORDER BY f.fechahora_funcion ASC
            `, [startDate, endDate]);
            
            console.log(`✅ [FuncionController] Encontradas ${rows.length} funciones en el rango de fechas`);
            
            res.json({
                success: true,
                data: rows,
                count: rows.length,
                startDate,
                endDate,
                message: `Funciones obtenidas para el rango de fechas`
            });
            
        } catch (error) {
            console.error('❌ [FuncionController] Error al obtener funciones por rango de fechas:', error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error interno del servidor al obtener funciones por rango de fechas'
            });
        }
    }
}

module.exports = FuncionController;