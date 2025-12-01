import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./utils/prisma";
import { User, UserLogin } from "../types/Users"; 

let database: User[] = [];

const app = express();
const PORT = process.env.PORT || 3000;

app
    .use(cors({ exposedHeaders: ["Authorization"] }))
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .post("/signup",(req, res) => {
        const user = req.body as User
        console.log(user);
        
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
    })
    .post("/login",(req, res) => {
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
    })
    .get("/getUsers", (req, res) => {
        db.user.findMany().then((results) => {console.log(results)})
    })
    .listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });



