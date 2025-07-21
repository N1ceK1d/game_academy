const pool = require('../config/db');


exports.get_results = async (req, res) => {

    try {
        const players = await pool.query('SELECT id, login FROM Users');
        
        const games = await pool.query('SELECT id, game_name FROM Games');
        
        const results = await pool.query(`
            SELECT user_id, game_id, best_score, total_score 
            FROM GameResult
        `);

        const responseData = {
            games: games.rows.map(game => ({
                id: game.id,
                name: game.game_name,
                columns: ['Результат', 'Лучший']
            })),
            players: players.rows.map(player => {
                const playerData = {
                    name: player.login,
                    games: {},
                    total: 0
                };

                
                games.rows.forEach(game => {
                    const result = results.rows.find(r => 
                        r.user_id === player.id && r.game_id === game.id
                    );

                    playerData.games[game.id] = {
                        score: result ? result.total_score : null,
                        best: result ? result.best_score : null
                    };

                    if (result) {
                        playerData.total += result.total_score || 0;
                    }
                });

                return playerData;
            })
        };
        console.log(responseData);
        res.json(responseData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

exports.set_result = async (req, res) => {
    try {
        const { user_login, game_id, game_score } = req.body;
        
        // Валидация входных данных
        if (!user_login || !game_id || isNaN(game_score)) {
            return res.status(400).json({ error: "Неверные параметры запроса" });
        }

        const numericGameId = parseInt(game_id);
        const numericGameScore = parseInt(game_score);

        const userRes = await pool.query(
            `INSERT INTO Users (login) VALUES ($1) 
             ON CONFLICT (login) DO UPDATE SET login = EXCLUDED.login
             RETURNING id`, 
            [user_login.toString()]  // Явное преобразование в строку
        );
        
        const userId = userRes.rows[0].id;

        await pool.query(
            `INSERT INTO GameResult (user_id, game_id, best_score, total_score)
             VALUES ($1, $2, $3, $3)
             ON CONFLICT (user_id, game_id) DO UPDATE SET
               best_score = GREATEST(GameResult.best_score, EXCLUDED.best_score),
               total_score = GameResult.total_score + EXCLUDED.total_score`,
            [userId, numericGameId, numericGameScore]
        );

        res.status(200).json({ success: true });
        
    } catch (err) {
        console.error('Ошибка выполнения:', err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};
