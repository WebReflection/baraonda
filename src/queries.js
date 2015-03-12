module.exports = {
  createTopTen: ''.concat(
    'CREATE TABLE IF NOT EXISTS top_ten(',
      'id SERIAL,',
      'score INTEGER NOT NULL,',
      'happened TIMESTAMP WITHOUT TIME ZONE NOT NULL,',
      'latitude DOUBLE PRECISION,',
      'longitude DOUBLE PRECISION',
    ')'),
  saveResult: 'INSERT INTO top_ten(score, happened, latitude, longitude) VALUES($1, NOW(), $2, $3)',
  getTopTepByDate: 'SELECT * FROM top_ten ORDER BY happened DESC, score DESC LIMIT 10',
  getTopTepByScore: 'SELECT * FROM top_ten ORDER BY score DESC, happened DESC LIMIT 10'
};