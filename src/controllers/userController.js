const pool = require('../config/db');
const JSONStream = require('JSONStream');

exports.get_results = async (req, res) => {
    console.log(req.body);
    try {
        // Получаем данные из базы
        const players = await pool.query('SELECT id, login FROM Users');
        const games = await pool.query('SELECT id, game_name FROM Games');
        const results = await pool.query(`
            SELECT user_id, game_id, best_score, total_score 
            FROM GameResult
        `);

        // Подготавливаем структуру данных для потоковой передачи
        const gamesData = games.rows.map(game => ({
            id: game.id,
            name: game.game_name,
            columns: ['Результат', 'Лучший']
        }));

        // Настраиваем потоковый ответ
        res.setHeader('Content-Type', 'application/json');
        
        // Создаем трансформирующий поток для форматирования JSON
        const jsonStream = JSONStream.stringify();
        
        // Подключаем поток к ответу
        jsonStream.pipe(res);

        // Отправляем начало объекта
        jsonStream.write({
            games: gamesData,
            players: {
                _isStreamingArray: true, // Флаг для клиента, что массив передается потоково
            }
        });

        // Отправляем игроков по одному
        for (const player of players.rows) {
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

            // Отправляем каждого игрока как часть массива players
            jsonStream.write(playerData);
        }

        // Завершаем поток
        jsonStream.end();
        
    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    }
};

exports.set_result = async (req, res) => {
    console.log(req.body);
    
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
