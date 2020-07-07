var express = require('express');
var mongodb = require('../db');

var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res) {
  const queue = await mongodb.seeQueue();
  res.json(queue);
});

router.post('/', async function(req, res) {
  const title = req.body.title;
  const order = req.body.order || null;
  const saved = await mongodb.enqueue(title, order);
  res.json(saved);
});

router.delete('/values/:id', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  var uuid = req.params.id;

  if (uuid === undefined || uuid === "") {
    res.send(JSON.stringify({status: "error", value: "UUID undefined"}));
    return
  }
  mongodb.delVal(uuid);
  res.send(JSON.stringify({status: "ok", value: uuid}));
});

module.exports = router;
