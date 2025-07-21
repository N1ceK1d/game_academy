const pool = require('../config/db');


exports.get_results = async (req, res) => {
    console.log(req.body);
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
    console.log(req);
    
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
