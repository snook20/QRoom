const express = require('express');
const router = express.Router();

const key = require('../ClientIds.js').mod_key;

const PollResponceStore = require('./PollResponseStore.js');

const statusCode = require('./status.js');

const main = require('../app.js');

router.use('/', function(req, res, next){
    //to use moderation endpoints, they must have a key
    if(req.query.key !== key){
        res.sendStatus(statusCode.NO_PERMISSION);
        return;
    }

    next();
});

router.get('/current_state', function(req, res){
    res.json(main);
});

router.get('/current_polls', function(req, res){
    res.send(PollResponceStore.jsonify());
});

module.exports = router;