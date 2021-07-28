const express = require("express");
const app = express();
const db = require('./db');
const authRoute = require("./routes/auth");
const cors = require('cors');
const verify = require("./routes/verifyToken");

app.use(cors());
app.use(express.json());

app.use("/api/user", authRoute);
app.get("/",async (req,res) => {
  try{
    let result = await db.query('SELECT * FROM users LIMIT 15');
    res.json({rows: result.rows});
  }
  catch(err){
    res.status(400).send({err});
    console.log(err);
  }
})

app.get("/chatscreen",verify,async (req,res) => {
    try{
      const tableid = req.user.tableid;
      let sql = `SELECT * FROM ${tableid} ORDER BY id DESC`;
      let result = await db.query(sql);
      res.json({data: result.rows});
    }
    catch(err){
      console.log(err);
      res.status(400).send(err);
    }
})

app.get("/chat/:id",verify,async (req,res) => {
  try{
    let sql = `SELECT * FROM ${req.params.id} ORDER BY id DESC LIMIT 30`;
    let result = await db.query(sql);
    let rows = [...result.rows];
    rows.reverse();
    res.json({data: rows});
  }
  catch(err){
    console.log(err);
    res.status(400).send(err);
  }

})

app.post("/createcontact",verify,async (req,res) => {
  try{
    let me = req.user;
    let tableid = req.user.tableid;
    let email = req.body.email;
    let sql = `SELECT * FROM users WHERE email='${email}'`;
    let result = await db.query(sql);
	console.log(result.rows);
    let fr = result.rows[0];
    let ftable = result.rows[0].tableid;
    let chatid = tableid + ftable;
    sql = `INSERT INTO ${tableid} (name,email,chatid) VALUES ('${fr.name}','${fr.email}','${chatid}')`;
    result = await db.query(sql);
    sql = `INSERT INTO ${ftable} (name,email,chatid) VALUES ('${me.name}','${me.email}','${chatid}')`;
    result = await db.query(sql);
    sql = `CREATE TABLE ${chatid} (id SERIAL PRIMARY KEY,sender VARCHAR(255) NOT NULL,text VARCHAR(1000) NOT NULL)`;
    result = await db.query(sql);

    res.send("successful");
  }
  catch(err){
    console.log(err);
    res.status(400).send(err);
  }
})

app.listen(4000, () => {
    console.log("hello");
});


