import express from 'express';
import recipeScraper from './scraper';

const cors = require('cors');
require('dotenv').config({ path: '.env' });

const app = express();
app.use(cors());

app.use(express.json());

app.post('/api/recipe', async (req, res) => {
  const { url } = req.body;

  const result = await recipeScraper(url);

  res.json(result);
});

app.listen(process.env.PORT || 3333, () => console.log(`
🚀 Server ready at: http://localhost:${process.env.PORT}
`));
