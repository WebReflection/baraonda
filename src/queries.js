module.exports = {
  createTopTen: ''.concat(
    'CREATE TABLE IF NOT EXISTS top_ten(',
      'id SERIAL,',
      'score INTEGER NOT NULL,',
      'happened DATE NOT NULL,',
      'latitude DOUBLE PRECISION,',
      'longitude DOUBLE PRECISION',
    ')'),
  saveResult: 'INSERT INTO top_ten(score, happened, latitude, longitude) VALUES($1, NOW(), $2, $3)',
  getTopTepByDate: 'SELECT * FROM top_ten ORDER BY happened, score LIMIT 10',
  getTopTepByScore: 'SELECT * FROM top_ten ORDER BY score, happened LIMIT 10'
};