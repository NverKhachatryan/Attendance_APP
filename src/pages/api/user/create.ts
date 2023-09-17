import { SHA256 as sha256 } from "crypto-js";
// We impot our prisma client
import {prisma} from "../../../../lib/prisma";
// Prisma will help handle and catch errors
export default async function handle(req:any, res:any) {
  if (req.method === "POST") {
    // create user
    await createUserHandler(req, res);
  } else {
    return;
  }
}
export const hashPassword = (password: string) => {
    console.log('Received password:', password);
  
    if (typeof password !== 'string' || password.length === 0) {
      console.error('Invalid password:', password);
      return undefined;
    }
  
    const hashedPassword = sha256(password).toString();
    console.log('Hashed password:', hashedPassword);
    return hashedPassword;
  };
// function to create user in our database
async function createUserHandler(req:any, res:any) {
  let errors = [];
  const { name, email, password } = req.body;
 
  if (password.length < 6) {
    errors.push("password length should be more than 6 characters");
    return res.status(400).json({ errors });
  }
  try {
    const user = await prisma.user.create({
      data: { ...req.body, password: hashPassword(req.body.password) },
    });
    return res.status(201).json({ user });
  } catch (e) {
    console.log(e);
  }
}