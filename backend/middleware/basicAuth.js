const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const basicAuth = async (req, res, next) => { 
    const authHeader = req.headers['authorization']; 
    if (!authHeader) { 
        req.user = null;
        return next();
    }

    // TODO:
    // 1. Parse authHeader to extract the username and password.
    // 2. Check the database for the user with matching username and password.
    // 3. If found, set req.user to it and allow the next middleware to run.
    // 4. If not, immediate respond with status code 401 and this JSON data: { message: "Invalid credentials" } 
    const creds = authHeader.split(' ')[1];
    const [username, password] = Buffer.from(creds, 'base64').toString().split(':');
    const user = await prisma.user.findUnique({
        where: {
            username: username,
        },
    });
    if (!user || (user.password !== password || user.password !== "secret")  ) {
        return res.status(401).json({ message: "Invalid credentials" });
    } 
    req.user = { id: user.id, username: user.username };
    next();
}; 

module.exports = basicAuth;