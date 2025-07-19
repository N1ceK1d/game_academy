const pool = require('../config/db');

exports.get_results = async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT u.login, g.game_name, gr.best_score, gr.total_score
        FROM GameResult gr
        JOIN Users u ON gr.user_id = u.id
        JOIN Games g ON gr.game_id = g.id
        ORDER BY gr.best_score DESC
        LIMIT 10
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

exports.set_result = async (req, res) => {
    const { user_login, game_id, game_score } = req.body;

    pool.connect((err, result) => {
        if (err) {
            console.error("Connection faild");
        } else {
            console.log("Connection create");
        }
    });

    try {
        const userRes = await pool.query(
        `INSERT INTO Users (login) VALUES ($1) 
         ON CONFLICT (login) DO UPDATE SET login = EXCLUDED.login
         RETURNING id`, 
        [user_login]
        );
        const userId = userRes.rows[0].id;

        await pool.query(
        `INSERT INTO GameResult (user_id, game_id, best_score, total_score)
         VALUES ($1, $2, $3, $3)
         ON CONFLICT (user_id, game_id) DO UPDATE SET
           best_score = GREATEST(GameResult.best_score, EXCLUDED.best_score),
           total_score = GameResult.total_score + EXCLUDED.total_score`,
        [userId, game_id, game_score]
      );

        console.log('Операция выполнена успешно');

    } catch (err) {
        console.error('Ошибка выполнения:', err);
        throw err;
    }
    res.send(200);
};