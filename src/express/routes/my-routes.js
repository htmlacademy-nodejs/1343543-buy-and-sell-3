'use strict';

const {Router} = require(`express`);
const myRouter = new Router();
const api = require(`../api`).getAPI();

myRouter.get(`/`, (req, res) => res.render(`my-tickets`));
myRouter.get(`/comments`, async (req, res) => {
  const offers = await api.getOffers({comments: true});
  res.render(`comments`, {offers: offers.slice(0, 3)});
});

module.exports = myRouter;
