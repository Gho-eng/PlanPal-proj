import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./utils/prisma";
import { Expense, User, UserLogin, Category } from "../types/Users"; 

let database: User[] = [];

const app = express().use(cors({ exposedHeaders: ["Authorization"] })).use(express.json()).use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 4000;


const signup = app.post("/signup",(req, res) => {
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
        const user = req.body as UserLogin;
        db.user.findUnique({ where: { email: user.email } })
        .then((dbUser) => {
            if (dbUser) {
                bcrypt
                .compare(user.password, dbUser.password)
                .then((isMatch) => {
                    if (isMatch) {
                        const token = jwt.sign(
                            { name: dbUser.username, id: dbUser.id }, 
                            process.env.API_KEY!,
                            { expiresIn: "24h" }
                        )
                        res.setHeader("Authorization", `Bearer ${token}`);
                        res.json({ success: true, msg: 'verified', userId: dbUser.id });
                    } 
                    else res.json({ success: false, error: "Invalid credentials" });
                })
                .catch((error) => {
                    console.log(error);
                    res.json({ success: false, error });
                })
            }})
        .catch((error) => {
            console.log(error);
            res.json({ success: false, error });
        });
    });
const getUsers = app.get("/getUsers", (req, res) => {
        db.user.findMany({
        select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
            password: true,
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
    const { name, desc, userId: userIdString } = req.body;
    const userId = parseInt(userIdString, 10);
    
    const standardizedName = name ? String(name).trim().toLowerCase() : null;

    if (!standardizedName) {
         return res.status(400).json({ success: false, message: "Category name is required." });
    }
    
    //Find a category with the same user and name
    db.categoryData.findFirst({
        where: {
            userId: userId,
            name: standardizedName,
        },
    })
    .then(existingCategory => {
        if (existingCategory) {
            console.warn(`[Category Route] Duplicate category name found for user ${userId}: ${name}`);
            throw { success: false, message: "Similar Category name found" };
        }
        
        // If unique, create the new category
        return db.categoryData.create({ 
            data: { 
                name: standardizedName,
                desc: desc,
                user: { connect: { id: userId } },
            }
        });
    })
    .then(result => {
        // Only executes if creation was successful
        console.log("Created category:", result!.id);
        res.json({ success: true, data: result });
    })
    .catch(error => {
        res.json({ 
            success: false, 
            message: "Failed to create category due to a server error.",
            details: "An unknown error occurred.", error 
        });
    });
});
const categoryData = app.get("/category", (req, res) => {
        db.categoryData.findMany().then((result) => {
            res.json({ success: true, data: result });
        });
    });

const expenseInput = app.post("/expense",(req, res) => {
        const exp = req.body as Expense  
        db.expenseData.create({ data: { 
            name:   exp.name,
            amount: exp.amount, 
            user: { connect: { id: exp.userId } },
            category: { connect: { id: exp.cat_id } }
        }})
        .then((result) => {
            res.json({ success: true, data: result });
        })
        .catch((error) => {
            console.log(error);
            res.json({ success: false, error });
        })}
    );
const expensesData = app.get("/expenses", (req, res) => {
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



