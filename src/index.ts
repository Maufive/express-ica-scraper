import express from 'express';
import { PrismaClient } from '@prisma/client';
import recipeScraper from './scraper';

const { MongoClient } = require('mongodb');

const prisma = new PrismaClient();
const cors = require('cors');
require('dotenv').config({ path: '.env' });

const client = new MongoClient(process.env.DATABASE_URL);
client.connect();
const database = client.db('recept');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/search', async (req, res) => {
  const searchQuery = req.query?.query;

  const query = { $text: { $search: searchQuery } };
  const sort = { score: { $meta: 'textScore' } };
  const projection = {
    _id: 1,
    title: 1,
  };

  const recipes = database.collection('Recipe');
  const result = await recipes
    .find(query)
    .project(projection)
    .sort(sort)
    .limit(10)
    .toArray();

  return res.json(result);
});

app.post('/api/recipe', async (req, res) => {
  const { url } = req.body;

  try {
    const alreadyExists = await prisma.recipe.findUnique({
      where: { url: String(url) },
    });

    if (alreadyExists) {
      console.log('RECIPE ALREADY EXISTS IN THE DB !!! ');
      return res.json({ message: 'Recepted finns redan i databasen', status: 409 });
    }
  } catch (error) {
    console.error(error);
  }

  const result = await recipeScraper(url);

  if (!result) return null;

  // eslint-disable-next-line max-len

  const recipe = await prisma.recipe.create({
    data: {
      title: result.title,
      description: result.description,
      imageSrc: result.imageSrc,
      rating: result.rating,
      ratings: result.ratings,
      time: result.time,
      difficulty: result.difficulty,
      amountOfIngredients: result.amountOfIngredients,
      url: result.url,
      categories: result.categories,
      ingredients: {
        create: result.ingredients.filter((item) => item.name),
      },
      steps: result.steps,
    },
  });
  console.log('saved recipe!');
  return res.json(recipe);
});

app.listen(process.env.PORT || 3333, () => console.log(`
🚀 Server ready at: http://localhost:${process.env.PORT}
`));
