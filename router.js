const express = require('express');
const router = express.Router();

router.get('/',(req,res)=>{
   res.send('server working');
});

module.exports = router;