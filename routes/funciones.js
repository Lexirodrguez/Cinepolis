const express = require('express');

class FuncionController {
    constructor(db) {
        this.db = db;
        this.router = express.Router();
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.router.get('/', this.getAll.bind(this));
        this.router.get('/:id', this.getById.bind(this));
        this.router.post('/', this.create.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.delete.bind(this));
        this.router.get('/data/related', this.getRelatedData.bind(this));
    }
    
    async getAll(req, res) {
        try {
            const [rows] = await this.db.execute(`
                SELECT f.*, p.titulo_peliculas, s.nombre_sala, s.tipo_sala, h.nombre_horario, h.hora_horario
                FROM funcion f
                JOIN peliculas p ON f.id_peliculasfuncion = p.id_peliculas
                JOIN sala s ON f.id_salafuncion = s.id_sala
                JOIN horario h ON f.id_horariofuncion = h.id_horario
            `);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getById(req, res) {
        try {
            const [rows] = await this.db.execute(`
                SELECT f.*, p.titulo_peliculas, s.nombre_sala, s.tipo_sala, h.nombre_horario, h.hora_horario
                FROM funcion f
                JOIN peliculas p ON f.id_peliculasfuncion = p.id_peliculas
                JOIN sala s ON f.id_salafuncion = s.id_sala
                JOIN horario h ON f.id_horariofuncion = h.id_horario
                WHERE f.id_funcion = ?
            `, [req.params.id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Función no encontrada' });
            }
            
            res.json(rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async create(req, res) {
        try {
            const { fechahora_funcion, estado_funcion, id_peliculasfuncion, id_salafuncion, id_horariofuncion } = req.body;
            
            const [result] = await this.db.execute(
                'INSERT INTO funcion (fechahora_funcion, estado_funcion, id_peliculasfuncion, id_salafuncion, id_horariofuncion) VALUES (?, ?, ?, ?, ?)',
                [fechahora_funcion, estado_funcion, id_peliculasfuncion, id_salafuncion, id_horariofuncion]
            );
            
            res.status(201).json({ 
                id: result.insertId,
                message: 'Función creada exitosamente' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async update(req, res) {
        try {
            const { fechahora_funcion, estado_funcion, id_peliculasfuncion, id_salafuncion, id_horariofuncion } = req.body;
            
            const [result] = await this.db.execute(
                'UPDATE funcion SET fechahora_funcion = ?, estado_funcion = ?, id_peliculasfuncion = ?, id_salafuncion = ?, id_horariofuncion = ? WHERE id_funcion = ?',
                [fechahora_funcion, estado_funcion, id_peliculasfuncion, id_salafuncion, id_horariofuncion, req.params.id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Función no encontrada' });
            }
            
            res.json({ message: 'Función actualizada exitosamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async delete(req, res) {
        try {
            const [result] = await this.db.execute(
                'DELETE FROM funcion WHERE id_funcion = ?',
                [req.params.id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Función no encontrada' });
            }
            
            res.json({ message: 'Función eliminada exitosamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getRelatedData(req, res) {
        try {
            const [peliculas] = await this.db.execute('SELECT * FROM peliculas');
            const [salas] = await this.db.execute('SELECT * FROM sala');
            const [horarios] = await this.db.execute('SELECT * FROM horario');
            
            res.json({
                peliculas,
                salas,
                horarios
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = (db) => new FuncionController(db).router;