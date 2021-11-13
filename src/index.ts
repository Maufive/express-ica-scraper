import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
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
      return res.json({ message: 'Recepted finns redan i databasen', status: 409 });
    }
  } catch (error) {
    console.error(error);
  }

  const result = await recipeScraper(url);

  if (!result) return null;

  // eslint-disable-next-line max-len
  const ingredients = result.ingredients?.map((ingredient: Prisma.IngredientCreateInput) => ({ amount: ingredient?.amount, name: ingredient?.name }));

  const recipe = await prisma.recipe.create({
    data: {
      title: result.title,
      description: result.description,
      imageSrc: result.imageSrc,
      ratings: result.ratings,
      time: result.time,
      difficulty: result.difficulty,
      amountOfIngredients: result.amountOfIngredients,
      url: result.url,
      categories: result.categories,
      ingredients: {
        create: ingredients,
      },
    },
  });

  return res.json(recipe);
});

app.listen(process.env.PORT || 3333, () => console.log(`
🚀 Server ready at: http://localhost:${process.env.PORT}
`));
