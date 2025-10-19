const express = require('express');

class PeliculaController {
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
    }
    
    async getAll(req, res) {
        try {
            const [rows] = await this.db.execute('SELECT * FROM peliculas');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getById(req, res) {
        try {
            const [rows] = await this.db.execute(
                'SELECT * FROM peliculas WHERE id_peliculas = ?',
                [req.params.id]
            );
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Película no encontrada' });
            }
            
            res.json(rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async create(req, res) {
        try {
            const { titulo_peliculas, duracion_peliculas, año_peliculas } = req.body;
            
            const [result] = await this.db.execute(
                'INSERT INTO peliculas (titulo_peliculas, duracion_peliculas, año_peliculas) VALUES (?, ?, ?)',
                [titulo_peliculas, duracion_peliculas, año_peliculas]
            );
            
            res.status(201).json({ 
                id: result.insertId,
                message: 'Película creada exitosamente' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async update(req, res) {
        try {
            const { titulo_peliculas, duracion_peliculas, año_peliculas } = req.body;
            
            const [result] = await this.db.execute(
                'UPDATE peliculas SET titulo_peliculas = ?, duracion_peliculas = ?, año_peliculas = ? WHERE id_peliculas = ?',
                [titulo_peliculas, duracion_peliculas, año_peliculas, req.params.id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Película no encontrada' });
            }
            
            res.json({ message: 'Película actualizada exitosamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async delete(req, res) {
        try {
            const [result] = await this.db.execute(
                'DELETE FROM peliculas WHERE id_peliculas = ?',
                [req.params.id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Película no encontrada' });
            }
            
            res.json({ message: 'Película eliminada exitosamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = (db) => new PeliculaController(db).router;