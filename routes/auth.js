const router = require("express").Router();
const db = require('../db');
const { registerValidation, loginValidation } = require("../validation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4 : uuid } = require('uuid');

router.post("/register", async (req, res) => {
    console.log(req.body);
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    try{
        const text = 'SELECT email FROM users WHERE email=$1';
        const values = [req.body.email];

        const result = await db.query(text, values);
        if(result.rows.length === 1) return res.status(400).send("email exists");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        let tableid = req.body.name + new Date().getMilliseconds();
        const sql = "INSERT INTO users (name, email, password, tableid) VALUES ($1, $2, $3, $4)";
        const val = [req.body.name,req.body.email,hashedPassword,tableid];
        await db.query(sql,val);

        const sq = `CREATE TABLE ${tableid} (id SERIAL PRIMARY KEY,name VARCHAR(255) NOT NULL,email VARCHAR(255) NOT NULL,chatid VARCHAR(255) NOT NULL,verified VARCHAR(10),image_url VARCHAR(1000),subtitle VARCHAR(255))`
        await db.query(sq);

        const token = jwt.sign({ tableid, name: req.body.name, email:req.body.email }, "fjsfjoewijflsdr");
        res.json({token,email:req.body.email,name: req.body.name});
    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }

    router.post("/login", async (req, res) => {
        try{
            const { error } = loginValidation(req.body);
            if (error) return res.status(400).send(error.details[0].message);

            const text = 'SELECT * FROM users WHERE email=$1';
            const values = [req.body.email];

            const result = await db.query(text, values);
            if(result.rows.length === 0) return res.status(400).send("email or password is wrong");

            const user = result.rows[0];
            const validPass = await bcrypt.compare(req.body.password, user.password);
            if (!validPass) return res.status(400).send("password is wrong");

            const token = jwt.sign({ tableid: user.tableid, email: user.email, name: user.name  }, "fjsfjoewijflsdr");
            res.json({token,email: user.email,name: user.name});
        }
        catch(err){
            console.log(err);
            res.status(400).send(err);
        }
});
});

module.exports = router;