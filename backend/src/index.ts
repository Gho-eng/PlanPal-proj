import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./utils/prisma";
import { Expense, User, UserLogin, Category, Goal } from "../types/Users"; 

let database: User[] = [];

const app = express().use(cors({ exposedHeaders: ["Authorization"] })).use(express.json()).use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 4000;

// format : { "email": "user email", "username": "user name", "password": "user password" }
app.post("/signup",(req, res) => {
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
// format : { "email": "user email", "password": "user password" }
app.post("/login",(req, res) => {
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
app.get("/getUsers", (req, res) => {
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
app.get("/getUserId", (req, res) => {
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
 // Input format: { "name": "category name", "desc": "category description", "userId": user_id_number }
app.post("/category",(req, res) => {
    const { name, desc, userId: userIdString, id: id } = req.body;
    const userId = parseInt(userIdString, 10);
    
    const standardizedName = name ? String(name).trim().toLowerCase() : null;

    if (!standardizedName) {
         return res.json({ success: false, message: "Category name is required." });
    }
    
    db.categoryData.findFirst({
        where: {
            userId: userId,
            name: standardizedName,
        },
    })
    .then(existingCategory => {
        if (existingCategory) {
            console.warn(`Duplicate category name found for user ${userId}: ${name}`);
            throw { success: false, message: "Similar Category name found" };
        }
        // If unique, create the new category
        return db.categoryData.create({ 
            data: { 
                id: id,
                name: standardizedName,
                desc: desc,
                user: { connect: { id: userId } },
            }
        });
    })
    .then(result => {
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
// format: { "name": "expense name", "amount": 100, "userId": user_id_number, "cat_id": category_id_number }
app.post("/expense",(req, res) => {
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
app.post("/goals",(req, res) => {
    const goal = req.body as Goal  
    db.goalData.create({ data: { 
        name:            goal.name,
        description:            goal.desc,
        targetAmount:    goal.targetAmount,
        savedAmount:     goal.savedAmount,
        user: { connect: { id: goal.userId } },
    }})
    .then((result) => {
        res.json({ success: true, data: result });
    })
    .catch((error) => {
        console.log(error);
        res.json({ success: false, error });
    })}
);
// format: http://localhost:4000/category/id_number
app.get("/category/:id", (req, res) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
        return res.json({ success: false, error: "Invalid ID provided" });
    }

    db.categoryData
        .findUnique({
            where: {
                id: id,
            },
        })
        .then((category) => {
            if (!category) {
                return res.json({ success: false, error: "Category not found" });
            }
            res.json({ success: true, data: category });
        })
        .catch((err: any) => {
            res.json({ success: false, error: err.message || "Internal Server Error" });
        });
});
// same format as above
app.get("/goal/:id", (req, res) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
        return res.json({ success: false, error: "Invalid ID provided" });
    }

    db.goalData
        .findUnique({
            where: {
                id: id,
            },
        })
        .then((category) => {
            if (!category) {
                return res.json({ success: false, error: "Category not found" });
            }
            res.json({ success: true, data: category });
        })
        .catch((err: any) => {
            res.json({ success: false, error: err.message || "Internal Server Error" });
        });
});
// again format as above
app.get("/expense/:id", (req, res) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
        return res.json({ success: false, error: "Invalid ID provided" });
    }

    db.expenseData
        .findUnique({
            where: {
                id: id,
            },
        })
        .then((category) => {
            if (!category) {
                return res.json({ success: false, error: "Category not found" });
            }
            res.json({ success: true, data: category });
        })
        .catch((err: any) => {
            res.json({ success: false, error: err.message || "Internal Server Error" });
        });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



