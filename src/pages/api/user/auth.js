import {prisma} from "../../../../lib/prisma";
import { SHA256 as sha256 } from "crypto-js";

export default async function handle(req, res) {
  if (req.method === "POST") {
    //login uer
    await loginUserHandler(req, res);
  } else {
    return res.status(405);
  }
}
const hashPassword = (password) => {
  
    if (typeof password !== 'string' || password.length === 0) {
      console.error('Invalid password:', password);
      return undefined;
    }
  
    const hashedPassword = sha256(password).toString();
    return hashedPassword;
  };

async function loginUserHandler(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "invalid inputs" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });
    if (user && user.password === hashPassword(password)) {
      // exclude password from json response
      const userData = exclude(user, ["password"]);

      // Redirect to the homepage after successful login
      return res.status(200).json(userData);
    } else {
      return res.status(401).json({ message: "invalid credentials" });
    }
  } catch (e) {
    console.log(e, "e");
  }
}
// Function to exclude user password returned from prisma
function exclude(user, keys) {
  for (let key of keys) {
    delete user[key];
  }
  return user;
}
