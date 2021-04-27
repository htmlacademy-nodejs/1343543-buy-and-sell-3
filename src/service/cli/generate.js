'use strict';

// Подключаем модуль `fs`
const fs = require(`fs/promises`);
const chalk = require(`chalk`);

const {
  getRandomInt,
  shuffle,
} = require(`../../utils`);

const {
  ExitCode
} = require(`../../constants`);

const FILE_NAME = `mocks.json`;

const FILE_SENTENCES_PATH = `./data/sentences.txt`;
const FILE_TITLES_PATH = `./data/titles.txt`;
const FILE_CATEGORIES_PATH = `./data/categories.txt`;

const OfferType = {
  OFFER: `offer`,
  SALE: `sale`,
};

const MocksCount = {
  DEFAULT: 1,
  MAX: 1000
};

const SumRestrict = {
  MIN: 1000,
  MAX: 100000,
};

const PictureRestrict = {
  MIN: 1,
  MAX: 16,
};

const getPictureFileName = (number) => `item${number.toString().padStart(2, 0)}.jpg`;

const generateOffers = (params) => {
  const {count, titles, categories, sentences} = params;
  if (count > MocksCount.MAX) {
    console.error(chalk.red(`Не больше 1000 объявлений`));
    process.exit(ExitCode.error);
  }

  return Array(count).fill({}).map(() => ({
    category: [categories[getRandomInt(0, categories.length - 1)]],
    description: shuffle(sentences).slice(1, 5).join(` `),
    picture: getPictureFileName(getRandomInt(PictureRestrict.MIN, PictureRestrict.MAX)),
    title: titles[getRandomInt(0, titles.length - 1)],
    type: OfferType[Object.keys(OfferType)[Math.floor(Math.random() * Object.keys(OfferType).length)]],
    sum: getRandomInt(SumRestrict.MIN, SumRestrict.MAX),
  }));
};

module.exports = {
  name: `--generate`,
  async run(args) {
    const readContent = async (filePath) => {
      try {
        const content = await fs.readFile(filePath, `utf8`);
        return content.split(`\n`);
      } catch (err) {
        console.error(chalk.red(err));
        return [];
      }
    };

    const sentences = await readContent(FILE_SENTENCES_PATH);
    const titles = await readContent(FILE_TITLES_PATH);
    const categories = await readContent(FILE_CATEGORIES_PATH);

    const [count] = args;
    const countOffer = Number.parseInt(count, 10) || MocksCount.DEFAULT;
    const content = JSON.stringify(generateOffers({count: countOffer, sentences, titles, categories}));

    try {
      await fs.writeFile(FILE_NAME, content, () => {});
      console.log(chalk.green(`Operation success. File created.`));
    } catch (err) {
      console.log(err);
      console.error(chalk.red(`Can't write data to file...`));
    }
  }
};
