import express from 'express';
import { PrismaClient } from '@prisma/client';
import recipeScraper from './scraper';

const prisma = new PrismaClient();
const cors = require('cors');
require('dotenv').config({ path: '.env' });

const app = express();
app.use(cors());
app.use(express.json());

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
