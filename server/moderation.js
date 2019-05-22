const express = require('express');
const router = express.Router();

const key = require('../ClientIds.js').mod_key;

const main = require('../app.js');

router.use('/', function(req, res, next){
    //to use moderation endpoints, they must have a key
    if(req.query.key !== key){
        res.sendStatus(401);
        return;
    }

    next();
});

router.get('/current_state', function(req, res){
    res.json(main);
});

module.exports = router;