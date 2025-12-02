import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./utils/prisma";
import { Expense, User, UserLogin, Category } from "../types/Users"; 

let database: User[] = [];

const app = express().use(cors({ exposedHeaders: ["Authorization"] })).use(express.json()).use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;


const signupInput = app.post("/signup",(req, res) => {
        const user = req.body as User  
        bcrypt.hash(user.password, 10).then((hashedPwd) => {
            return db.user.create({ data: { 
                email: user.email, 
                username: user.username, 
                password: hashedPwd    
            }})
            .then((result) => {
                console.log(result);
                res.json({ success: true });
            })
            .catch((error) => {
                console.log(error);
                res.json({ success: false, error });
        })});
    });
const login = app.post("/login",(req, res) => {
        const user = req.body as UserLogin
        const dbUser = database.find((u) => u.email === user.email);
        if (dbUser) {
            bcrypt
                .compare(user.password, dbUser.password)
                .then((isMatch) => {
                    if (isMatch) {
                        const token = jwt.sign(
                            { name: dbUser.username },
                            process.env.API_KEY!,
                            { expiresIn: "24h",}
                        )
                        res.setHeader("Authorization", `Bearer ${token}`);
                        res.json({ success: true, msg: 'verified' });
                    } else res.json({ success: false, error: "user not found" });
                })
                .catch((err) => ({ success: false, error: err }));
        } else res.json({ success: false, error: "user not found" });
    });
const getUsers = app.get("/getUsers", (req, res) => {
        db.user.findMany({
        select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
        }})
        .then((result) => {
            res.json({ success: true, data: result });
        });
    });
const getUserId = app.get("/getUserId", (req, res) => {
        db.user
        .findUnique({where: {id: Number((req.query.id)) } })
        .then((result) => {
            res.json({ success: true, data: {
                id: result!.id,
                email: result!.email, 
                username: result!.username,
                createdAt: result!.createdAt
            }});
        });
    });
const categoryInput = app.post("/category",(req, res) => {
        const cat = req.body as Category  
        db.categoryData.create({ data: { 
            name:   cat.name,
            user:   { connect: { id: cat.userId } },
            desc:   cat.desc,
        }})
        .then((result) => {
            res.json({ success: true });
        })
        .catch((error) => {
            console.log(error);
            res.json({ success: false, error });
        })}
    );
const expenseInput = app.post("/expense",(req, res) => {
        const exp = req.body as Expense  
        db.expenseData.create({ data: { 
            name:   exp.name,
            amount: exp.amount, 
            user: { connect: { id: exp.userId } },
            category: { connect: { id: exp.cat_id } }
        }})
        .then((result) => {
            res.json({ success: true });
        })
        .catch((error) => {
            console.log(error);
            res.json({ success: false, error });
        })}
    );
const expensesData = app.get("/getExpenses", (req, res) => {
        db.expenseData.findMany().then((result) => {
            res.json({ success: true, data: result });
        });
    });
const goalData = app.get("/getGoal", (req, res) => {
        db.goalData.findMany().then((result) => {
            res.json({ success: true, data: result });
        });
    })

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



