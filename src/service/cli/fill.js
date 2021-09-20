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

const FILE_NAME = `fill-db2.sql`;

const FILE_SENTENCES_PATH = `./data/sentences.txt`;
const FILE_TITLES_PATH = `./data/titles.txt`;
const FILE_CATEGORIES_PATH = `./data/categories.txt`;
const FILE_COMMENTS_PATH = `./data/comments.txt`;

const MAX_COMMENTS = 4;

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

const generateComments = (count, offerId, userCount, comments) => (
  Array(count).fill({}).map(() => ({
    userId: getRandomInt(1, userCount),
    offerId,
    text: shuffle(comments)
      .slice(0, getRandomInt(1, 3))
      .join(` `),
  }))
);

const generateOffers = (params) => {
  const {count, commentSentences, titles, categoryCount, userCount, sentences} = params;
  if (count > MocksCount.MAX) {
    console.error(chalk.red(`Не больше 1000 объявлений`));
    process.exit(ExitCode.ERROR);
  }

  return Array(count).fill({}).map((_, index) => ({
    category: [getRandomInt(1, categoryCount)],
    comments: generateComments(getRandomInt(1, MAX_COMMENTS), index + 1, userCount, commentSentences),
    description: shuffle(sentences).slice(1, 5).join(` `),
    picture: getPictureFileName(getRandomInt(PictureRestrict.MIN, PictureRestrict.MAX)),
    title: titles[getRandomInt(0, titles.length - 1)],
    type: OfferType[Object.keys(OfferType)[Math.floor(Math.random() * Object.keys(OfferType).length)]],
    sum: getRandomInt(SumRestrict.MIN, SumRestrict.MAX),
    userId: getRandomInt(1, userCount)
  }));
};

const users = [
  {
    email: `ivanov@example.com`,
    passwordHash: `5f4dcc3b5aa765d61d8327deb882cf99`,
    firstName: `Иван`,
    lastName: `Иванов`,
    avatar: `avatar1.jpg`
  },
  {
    email: `petrov@example.com`,
    passwordHash: `5f4dcc3b5aa765d61d8327deb882cf99`,
    firstName: `Пётр`,
    lastName: `Петров`,
    avatar: `avatar2.jpg`
  }
];

module.exports = {
  name: `--fill`,
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

    const [commentSentences, sentences, titles, categories] = await Promise.all([
      readContent(FILE_COMMENTS_PATH),
      readContent(FILE_SENTENCES_PATH),
      readContent(FILE_TITLES_PATH),
      readContent(FILE_CATEGORIES_PATH),
    ]);

    console.log(commentSentences);

    const [count] = args;
    const countOffer = Number.parseInt(count, 10) || MocksCount.DEFAULT;
    const offers = generateOffers({count: countOffer, sentences, titles, categories: categories.length, commentSentences, users: users.length});

    const comments = offers.flatMap((offer) => offer.comments);

    const offerCategories = offers.map((offer, index) => ({offerId: index + 1, categoryId: offer.category[0]}));

    const userValues = users.map(
        ({email, passwordHash, firstName, lastName, avatar}) =>
          `('${email}', '${passwordHash}', '${firstName}', '${lastName}', '${avatar}')`
    ).join(`,\n`);

    const categoryValues = categories.map((name) => `('${name}')`).join(`,\n`);

    const offerValues = offers.map(
        ({title, description, type, sum, picture, userId}) =>
          `('${title}', '${description}', '${type}', ${sum}, '${picture}', ${userId})`
    ).join(`,\n`);

    const offerCategoryValues = offerCategories.map(
        ({offerId, categoryId}) =>
          `(${offerId}, ${categoryId})`
    ).join(`,\n`);

    const commentValues = comments.map(
        ({text, userId, offerId}) =>
          `('${text}', ${userId}, ${offerId})`
    ).join(`,\n`);

    const content = `
INSERT INTO users(email, password_hash, first_name, last_name, avatar) VALUES
${userValues};
INSERT INTO categories(name) VALUES
${categoryValues};
ALTER TABLE offers DISABLE TRIGGER ALL;
INSERT INTO offers(title, description, type, sum, picture, user_id) VALUES
${offerValues};
ALTER TABLE offers ENABLE TRIGGER ALL;
ALTER TABLE offer_categories DISABLE TRIGGER ALL;
INSERT INTO offer_categories(offer_id, category_id) VALUES
${offerCategoryValues};
ALTER TABLE offer_categories ENABLE TRIGGER ALL;
ALTER TABLE comments DISABLE TRIGGER ALL;
INSERT INTO COMMENTS(text, user_id, offer_id) VALUES
${commentValues};
ALTER TABLE comments ENABLE TRIGGER ALL;`;

    try {
      await fs.writeFile(FILE_NAME, content);
      console.log(chalk.green(`Operation success. File created.`));
    } catch (err) {
      console.log(err);
      console.error(chalk.red(`Can't write data to file...`));
    }
  }
};
