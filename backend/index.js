#!/usr/bin/env node
'use strict';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const auth = require('./middleware/auth');
const authz = require('./middleware/authz');

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();

const express = require("express");
const app = express();
const path = require("path");
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    const logData = {
        method: req.method,
        url: req.url,
        body: req.body,
        headers: {}
    };
    if (req.headers.authorization) {
        logData.headers.authorization = req.headers.authorization;
    }
    console.log(`Incoming request:`, logData);
    next();
});

// ADD YOUR WORK HERE

// Create a new user
app.post('/users', auth, authz('cashier'), async (req, res) => {
    // TODO: Add authentication and authorization (only cashier or higher)
    const { utorid, name, email, role } = req.body;

    if (!utorid || utorid.trim() === '' || !name || name.trim() === '' || !email || email.trim() === '') {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Role validation (similar to PATCH /users/:userId)
    if (role) {
        const userRole = req.user.role;
        if (userRole === 'cashier') {
            if (role !== 'regular') {
                return res.status(400).json({ error: 'Cashier can only assign regular role' });
            }
        } else if (userRole === 'manager') {
            if (role !== 'cashier' && role !== 'regular') {
                return res.status(400).json({ error: 'Manager can only assign cashier or regular roles' });
            }
        } else if (userRole === 'superuser') {
            const validRoles = ['regular', 'cashier', 'manager', 'superuser'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }
        } else {
            return res.status(403).json({ error: 'Forbidden: Insufficient role to assign user role' });
        }
    }
    
    // utorid validation
    if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
        return res.status(400).json({ error: 'Invalid utorid format' });
    }

    // name validation
    if (name.length < 1 || name.length > 50) {
        return res.status(400).json({ error: 'Name must be between 1 and 50 characters' });
    }

    // email validation (simple regex for @mail.utoronto.ca or @utoronto.ca)
    if (!/^[^@]+@(mail\.)?utoronto\.ca$/.test(email)) {
        return res.status(400).json({ error: 'Invalid University of Toronto email format' });
    }
    
    // check if user exists
    const existingUser = await prisma.user.findUnique({ where: { utorid } });
    if (existingUser) {
        return res.status(409).json({ error: 'User with that utorid already exists' });
    }
    
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
		return res.status(409).json({ error: 'User with that email already exists' });
	}

    // Generate resetToken and expiresAt for activation as per spec
    const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Token valid for 7 days
        expiresAt.setHours(expiresAt.getHours() + 1); // Ensure the time component is also in the future

    const user = await prisma.user.create({
        data: {
            utorid,
            name,
            email,
            role: role || 'regular',
            // No password field as per spec
            expiresAt,
            resetToken: uuidv4(),
        },
    });

    console.log(`User created - ${user.name} - ${user.id} : ${user.utorid} with email ${user.email} by ${req.user.utorid} with role: ${user.role} and status: ${user.verified ? 'verified' : 'unverified'}`);
    console.log(`Activation token: ${user.resetToken}, expires at: ${user.expiresAt}`);
    
    res.status(201).json({
        id: user.id,
        utorid: user.utorid,
        name: user.name,
        email: user.email,
        verified: user.verified,
        expiresAt: user.expiresAt,
        resetToken: user.resetToken,
    });
});

// Authenticate a user and generate a JWT token
app.post('/auth/tokens', async (req, res) => {
    const { utorid, password } = req.body;

    if (!utorid || !password) {
        return res.status(400).json({ error: 'Missing utorid or password' });
    }

    const user = await prisma.user.findUnique({ where: { utorid } });

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`Generating token for user ${user.utorid} with role: ${user.role}`);
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Update lastLogin time
    user.lastLogin = new Date();
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: user.lastLogin },
    });

    res.status(200).json({ token, expiresAt });
});




// app.patch('/users/:userId', auth, authz('manager'), async (req, res) => {
//     const { userId } = req.params;
//     const { email, verified, suspicious, role } = req.body;

//     // 400 if all fields are missing
//     if (!email && verified === undefined && suspicious === undefined && !role) {
//         return res.status(400).json({ error: 'Empty payload' });
//     }

//     const user = await prisma.user.findUnique({
//         where: { id: parseInt(userId) }
//     });

//     if (!user) {
//         return res.status(404).json({ error: 'User not found' });
//     }

//     const data = {};

//     // Update email (if different)
//     if (email && email !== user.email) {
//         if (!/^[^@]+@(mail\.)?utoronto\.ca$/.test(email)) {
//             return res.status(400).json({ error: 'Invalid University of Toronto email format' });
//         }
//         data.email = email;
//     }

//     // Update verified (must be boolean, but only if different)
//     if (verified !== undefined && verified !== user.verified) {
//         if (typeof verified !== 'boolean') {
//             return res.status(400).json({ error: 'Verified must be a boolean' });
//         }
//         data.verified = verified;
//     }

//     // Update suspicious
//     if (suspicious !== undefined && suspicious !== user.suspicious) {
//         if (typeof suspicious !== 'boolean') {
//             return res.status(400).json({ error: 'Suspicious must be a boolean' });
//         }
//         data.suspicious = suspicious;
//     }

//     // Role updates with constraints
//     if (role) {
//         const requesterRole = req.user.role;
//         const validRoles = ['regular', 'cashier', 'manager', 'superuser'];

//         if (requesterRole === 'manager') {
//             if (role !== 'cashier' && role !== 'regular') {
//                 return res.status(403).json({ error: 'Manager can only assign cashier or regular roles' });
//             }
//         } else if (requesterRole === 'superuser') {
//             if (!validRoles.includes(role)) {
//                 return res.status(400).json({ error: 'Invalid role' });
//             }
//         } else {
//             return res.status(403).json({ error: 'Forbidden: insufficient role to change user role' });
//         }

//         // Prevent suspicious users from being cashiers
//         if (role === 'cashier') {
//             if (user.suspicious || data.suspicious === true) {
//                 return res.status(400).json({ error: 'Suspicious users cannot be assigned cashier role' });
//             }
//             data.suspicious = false; // enforce rule
//         }

//         data.role = role;
//     }

//     // If nothing in data changed → reject
//     if (Object.keys(data).length === 0) {
//         return res.status(400).json({ error: 'No changes detected' });
//     }

//     const updatedUser = await prisma.user.update({
//         where: { id: parseInt(userId) },
//         data
//     });

//     // Return only id, utorid, name, and changed fields
//     res.status(200).json({
//         id: updatedUser.id,
//         utorid: updatedUser.utorid,
//         name: updatedUser.name,
//         ...data
//     });
// });


//const auth = require('./middleware/auth');

// Get the current logged-in user
app.get('/users/me', auth, async (req, res) => {
    res.status(200).json({
        id: req.user.id,
        utorid: req.user.utorid,
        name: req.user.name,
        email: req.user.email,
        birthday: req.user.birthday,
        role: req.user.role,
        points: req.user.points,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin,
        verified: req.user.verified,
        avatarUrl: req.user.avatarUrl,
        promotions: [], // TODO: Implement promotions
    });
});

// Update the current logged-in user
app.patch('/users/me', auth, async (req, res) => {
    const { name, email, birthday, avatar } = req.body;

    // Check for empty payload
    if (!name && !email && !birthday && !avatar) {
        return res.status(400).json({ error: 'Empty payload' });
    }

    if (email && !/^[^@]+@(mail\.)?utoronto\.ca$/.test(email)) {
        return res.status(400).json({ error: 'Invalid University of Toronto email format' });
    }
    if (name && (name.length < 1 || name.length > 50)) {
        return res.status(400).json({ error: 'Name must be between 1 and 50 characters' });
    }
    if (birthday) {
        const year = birthday.split('-')[0];
        if (parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear()) {
            return res.status(400).json({ error: 'Invalid birthday year' });
        }
        const month = birthday.split('-')[1];
        if (parseInt(month) < 1 || parseInt(month) > 12) {
            return res.status(400).json({ error: 'Invalid birthday month' });
        }
        const day = birthday.split('-')[2];
        if (parseInt(day) < 1 || parseInt(day) > 31) {
            return res.status(400).json({ error: 'Invalid birthday day' });
        }
        if ( (month == 4 || month == 6 || month == 9 || month == 11) && day > 30) {
            return res.status(400).json({ error: 'Invalid birthday day for the given month' });
        }
        if (month == 2) {
            const isLeapYear = (parseInt(year) % 4 === 0 && parseInt(year) % 100 !== 0) || (parseInt(year) % 400 === 0);
            if (isLeapYear && day > 29) {
                return res.status(400).json({ error: 'Invalid birthday day for February in a leap year' });
            } else if (!isLeapYear && day > 28) {
                return res.status(400).json({ error: 'Invalid birthday day for February in a non-leap year' });
            }
        }
        if (parseInt(year) === new Date().getFullYear()) {
            const currentMonth = new Date().getMonth() + 1; // getMonth() is zero-based
            if (parseInt(month) > currentMonth) {
                return res.status(400).json({ error: 'Birthday month cannot be in the future' });
            } else if (parseInt(month) === currentMonth) {
                const currentDay = new Date().getDate();
                if (parseInt(day) > currentDay) {
                    return res.status(400).json({ error: 'Birthday day cannot be in the future' });
                }
            }
        }
        const birthDate = new Date(birthday);
        if (isNaN(birthDate.getTime())) {
            return res.status(400).json({ error: 'Invalid birthday format' });
        }
    }
    if (avatar && typeof avatar !== 'string') {
        return res.status(400).json({ error: 'Invalid avatar format' });
    }

    const data = {};
    if (name) {
        data.name = name;
    }
    if (email) {
        data.email = email;
    }
    if (birthday) {
        data.birthday = birthday;
    }
    if (avatar) {
        // TODO: Handle file upload for avatar
        data.avatarUrl = avatar;
    }

    const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data,
    });

    res.status(200).json(updatedUser);
});



// Get a specific user
app.get('/users/:userId', auth, authz('cashier'), async (req, res) => {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedUserId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await prisma.user.findUnique({
        where: { id: parsedUserId },
    });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const requesterRole = req.user.role;
    const roles = ['regular', 'cashier', 'manager', 'superuser'];

    if (roles.indexOf(requesterRole) >= roles.indexOf('manager')) {
        // Manager or higher gets full info
        res.status(200).json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
            promotions: [], // TODO: Implement promotions
        });
    } else {
        // Cashier gets limited info
        res.status(200).json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            points: user.points,
            verified: user.verified,
            promotions: [], // TODO: Implement promotions
        });
    }
});

// Update a specific user
app.patch('/users/:userId', auth, authz('manager'), async (req, res) => {
    // TODO: Add authentication and authorization (manager or higher)
    // TODO: Implement role-based restrictions on what can be updated
    const { userId } = req.params;
    const { email, verified, suspicious, role } = req.body;
    console.log('DEBUG: suspicious from req.body:', suspicious, 'Type:', typeof suspicious);

    // 400 error if payload is empty
    if (!email && verified === undefined && suspicious === undefined && !role) {
        return res.status(400).json({ error: 'Empty payload' });
    }
    

    console.log(`Updating user ${userId} with data:`, req.body);

    const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
    });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (email && email !== null) {
        if (!/^[^@]+@(mail\.)?utoronto\.ca$/.test(email)) {
           console.log('FAIL--- Invalid email format:', email);
          return res.status(400).json({ error: 'Invalid University of Toronto email format' });
        }
    }

    if (verified === false || verified === 'false') {
        console.log('Attempt to set verified to false');
        return res.status(400).json({ error: 'Cannot set verified to false' });
    }

    const emailChanged = email;
    const verifiedChanged = verified !== undefined && verified !== null && verified !== user.verified;
    const suspiciousChanged = suspicious !== undefined && suspicious !== null && suspicious !== user.suspicious;
    const roleChanged = role && role !== user.role;

    const data = {};
    if (email) {
        if (!/^[^@]+@(mail\.)?utoronto\.ca$/.test(email)) {
            console.log('FAIL--- Invalid email format (2):', email);
            return res.status(400).json({ error: 'Invalid University of Toronto email format' });
        }
        data.email = email;
    }
    if (verified !== undefined && verified !== null && verified !== user.verified) {
        if (typeof verified !== 'boolean') {
            console.log('Verified is not a boolean:', verified, 'Type:', typeof verified);
            return res.status(400).json({ error: 'Verified must be a boolean' });
        }
        if (verified === false) {
            console.log('Attempt to set verified to false');
            return res.status(400).json({ error: 'Cannot set verified to false' });
        }
        data.verified = verified;
    }
    if (suspicious !== undefined && suspicious !== null && suspicious !== user.suspicious) {
        data.suspicious = suspicious;
    }
    
    if (role) {
        const userRole = req.user.role;
        console.log ("User with role " + userRole + " is attempting to change role to " + role + "from " + user.role);
        if (userRole === 'manager') {
            if (role !== 'cashier' && role !== 'regular') {
                return res.status(403).json({ error: 'Manager can only assign cashier or regular roles' });
            }
        } else if (userRole === 'superuser') {
            const validRoles = ['regular', 'cashier', 'manager', 'superuser'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }
        } else {
            return res.status(403).json({ error: 'Forbidden: Insufficient role to update user role' });
        }
        data.role = role;
    }

    const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data,
    });

    // Remove fields from updatedUser that were not changed
    console.log(`User ${userId} updated successfully with data:`, data);
    if (!emailChanged) {
        delete updatedUser.email;
    }
    if (!verifiedChanged) {
        delete updatedUser.verified;
    }
    if (!suspiciousChanged) {
        delete updatedUser.suspicious;
    }
    if (!roleChanged) {
        delete updatedUser.role;
    }

    res.status(200).json(updatedUser);
});

// Update the current logged-in user's password
app.patch('/users/me/password', auth, async (req, res) => {
    const { old, new: newPassword } = req.body;
    console.log('Current user password update for user:', req.user.utorid);
    console.log('Old password provided:', old ? 'Yes' : 'No');
    console.log('New password provided:', newPassword ? 'Yes' : 'No');

    if (!old || !newPassword) {
        console.log('Missing old or new password in request body');
        return res.status(400).json({ error: 'Missing old or new password' });
    }

    // New password validation
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/.test(newPassword)) {
        console.log('New password does not meet complexity requirements');
        return res.status(400).json({ error: 'Password must be 8-20 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character' });
    }

    const userCurrentPassword = req.user.password;

    console.log('Old password is present:', old);
    const oldpass = await bcrypt.hash(old, 10);
    console.log("Old password hashed is: ", oldpass);
    console.log("User current password is: ", userCurrentPassword);

    const passwordMatch = await bcrypt.compare(old, userCurrentPassword);

    //const passwordMatch = await bcrypt.compare(old, req.user.password);

    if (!passwordMatch) {
        console.log('Old password does not match');
        return res.status(403).json({ error: 'Incorrect old password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
    });
    console.log('Password updated successfully for user:', req.user.utorid);
    res.status(200).json({ message: 'Password updated successfully' });
});

// Get all users
app.get('/users', auth, authz('manager'), async (req, res) => {
    
    const { name, role, verified, activated } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (isNaN(page) || page < 1) {
        return res.status(400).json({ error: 'Invalid page number' });
    }
    if (isNaN(limit) || limit < 1) {
        return res.status(400).json({ error: 'Invalid limit number' });
    }
    console.log(`Fetching users with filters - name: ${name}, role: ${role}, verified: ${verified}, activated: ${activated}, page: ${page}, limit: ${limit}`);
    const where = {};
    if (name) {
        where.OR = [
            { name: { contains: name } },
            { utorid: { contains: name } },
        ];
    }
    if (role) {
        where.role = role;
    }
    if (verified) {
        where.verified = verified === 'true';
    }
    if (activated) {
        // An activated user is a user that has logged in at least once.
        if (activated === 'true') {
            where.lastLogin = { not: null };
        } else {
            where.lastLogin = null;
        }
    }


    const users = await prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
    });

    const totalUsers = await prisma.user.count({ where });
    console.log(`Total users found: ${totalUsers}`);
    
    const logUnfilteredUsers = await prisma.user.findMany({where});
    
    logUnfilteredUsers.forEach(user => {
        console.log(`User - ID: ${user.id}, UTORID: ${user.utorid}, Name: ${user.name}, Role: ${user.role}, Verified: ${user.verified}`);
    });

    res.status(200).json({
        count: totalUsers,
        results: users.map(user => ({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
        })),
    });
});

const rateLimitMap = new Map();

// Request a password reset
app.post('/auth/resets', async (req, res) => {
    const { utorid } = req.body;

    if (!utorid) {
        return res.status(400).json({ error: 'Missing utorid' });
    }

    const user = await prisma.user.findUnique({ where: { utorid } });
    
    // if there was a request within last 60 seconds from this ip
    // return 429 too many requests
    const now = Date.now();
    const lastRequestTime = rateLimitMap.get(utorid);
    rateLimitMap.set(utorid, now);
    if (lastRequestTime && now - lastRequestTime < 60000) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    if (user) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const resetToken = uuidv4();

        await prisma.user.update({
            where: { utorid },
            data: { resetToken, expiresAt },
        });

        res.status(202).json({
            expiresAt,
            resetToken,
        });
    } else {
        // Even if the user doesn't exist, we return a 202 to prevent user enumeration
        res.status(404).json({
                expiresAt: null,
                resetToken: null,
            });
    }
});

// Reset password
app.post('/auth/resets/:resetToken', async (req, res) => {
    console.log('Inside POST /auth/resets/:resetToken');
    const { resetToken } = req.params;
    const { password, utorid } = req.body;

    if (!password || !utorid) {
        return res.status(400).json({ error: 'Missing password or utorid' });
    }

    // password validation
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/.test(password)) {
        return res.status(400).json({ error: 'Password must be 8-20 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character' });
    }

    console.log('Attempting to find user by resetToken:', resetToken);
    const userByToken = await prisma.user.findFirst({
        where: {
            resetToken,
        },
    });
    console.log('User found by token:', userByToken);
    console.log('userByToken:', userByToken);

    if (!userByToken) {
        return res.status(404).json({ error: 'Reset token not found' });
    }

    if (userByToken.utorid !== utorid) {
        return res.status(401).json({ error: 'Reset token and utorid mismatch' });
    }

    console.log('Token expired:', new Date() > userByToken.expiresAt);

    if (new Date() > userByToken.expiresAt) {
        return res.status(410).json({ error: 'Reset token expired' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Updating password for user:', userByToken.utorid);
    console.log('New Password: ', password);
    console.log('Hashed Password: ', hashedPassword);

    await prisma.user.update({
        where: { id: userByToken.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            expiresAt: null,
        },
    });

    res.status(200).json({ message: 'Password reset successfully' });
});

app.post('/transactions', auth, async (req, res) => {
    const { utorid, type, spent, promotionIds, remark, amount, relatedId } = req.body;

    if (!utorid || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await prisma.user.findUnique({ where: { utorid } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const userRoleIndex = roles.indexOf(req.user.role);

    if (type === 'purchase') {
        console.log('Processing purchase transaction for user:', utorid);
        console.log('User role:', req.user.role);
        console.log('Details:', { spent, promotionIds, remark });
        console.log("Amount is: ", amount, " and relatedId is: ", relatedId);

        if (userRoleIndex < roles.indexOf('cashier')) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (typeof spent !== 'number' || spent <= 0) {
            return res.status(400).json({ error: 'Invalid spent amount' });
        }

                let earned = Math.round(spent / 0.25);
        const appliedPromotions = [];

        if (promotionIds && promotionIds.length > 0) {
            const userTransactions = await prisma.transaction.findMany({
                where: { utorid: user.utorid }
            });

            const usedPromotionIds = new Set();
            userTransactions.forEach(t => {
                if (t.promotionIds) {
                    t.promotionIds.split(',').forEach(idStr => {
                        if (idStr) usedPromotionIds.add(parseInt(idStr));
                    });
                }
            });

            const promotionsToApply = await prisma.promotion.findMany({
                where: {
                    id: {
                        in: promotionIds.map(id => parseInt(id)),
                    },
                },
            });
            
            if (promotionsToApply.length !== promotionIds.length) {
                const foundIds = new Set(promotionsToApply.map(p => p.id));
                const notFoundId = promotionIds.find(id => !foundIds.has(parseInt(id)));
                return res.status(400).json({ error: `Promotion with id ${notFoundId} not found.` });
            }

            for (const promo of promotionsToApply) {
                console.log('--- PROMO DEBUG ---');
                console.log('Promo ID:', promo.id);
                console.log('Spent Amount:', spent);
                console.log('Min Spending:', promo.minSpending);
                console.log('Is one-time:', promo.type === 'one-time');
                console.log('Already used?:', usedPromotionIds.has(promo.id));
                console.log('Current Time:', new Date());
                console.log('Promo Start Time:', new Date(promo.startTime));
                console.log('Promo End Time:', new Date(promo.endTime));
                console.log('Is active?:', (new Date() >= new Date(promo.startTime) && new Date() <= new Date(promo.endTime)));
                console.log('--- END PROMO DEBUG ---');

                if (promo.type === 'one-time' && usedPromotionIds.has(promo.id)) {
                    return res.status(400).json({ error: `Promotion '${promo.name}' has already been used.` });
                }
                const now = new Date();
                if (now < new Date(promo.startTime) || now > new Date(promo.endTime)) {
                    return res.status(400).json({ error: `Promotion '${promo.name}' is not active.` });
                }
                if (promo.minSpending && spent < promo.minSpending) {
                    continue; // Silently skip if min spend not met
                }
                appliedPromotions.push(promo);
            }

            for (const promo of appliedPromotions) {
                if (promo.points) {
                    earned += promo.points;
                }
                if (promo.rate) {
                    earned += Math.round(spent * promo.rate * 100);
                }
            }
        }

        const oldEarned = earned;
        if (req.user.suspicious) {
            earned = 0;
        }

        const transaction = await prisma.transaction.create({
            data: {
                utorid,
                type,
                spent,
                earned,
                amount: oldEarned,
                promotionIds: appliedPromotions.map(p => p.id).join(','),
                remark,
                createdBy: req.user.utorid,
                suspicious: req.user.suspicious,
            },
        });

                if (!req.user.suspicious) {
            await prisma.user.update({
                where: { utorid },
                data: { points: user.points + earned },
            });
        }
        console.log ("Response Json will be: ", {
            ...transaction,
            promotionIds: transaction.promotionIds ? transaction.promotionIds.split(',') : [],
        });
        
        return res.status(201).json({
            id: transaction.id,
            utorid: transaction.utorid,
            type: transaction.type,
            spent: transaction.spent,
            earned: transaction.earned,
            remark: transaction.remark,
            promotionIds: transaction.promotionIds ? transaction.promotionIds.split(',').map(Number) : [],
            createdBy: transaction.createdBy,
        });
    } else if (type === 'adjustment') {
        if (userRoleIndex < roles.indexOf('manager')) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (amount === undefined || relatedId === undefined) {
            return res.status(400).json({ error: 'Missing amount or relatedId' });
        }

        // if relatedId does not exist
        const relatedTransaction = await prisma.transaction.findUnique({
            where: { id: relatedId },
        });

        if (!relatedTransaction) {
            console.log('Related transaction not found for relatedId:', relatedId);
            return res.status(404).json({ error: 'Related transaction not found' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                utorid,
                type,
                amount,
                relatedId,
                remark,
                createdBy: req.user.utorid,
            },
        });

        await prisma.user.update({
            where: { utorid },
            data: { points: user.points + amount },
        });

        return res.status(201).json({
            ...transaction,
            promotionIds: [],
        });
    }

    return res.status(400).json({ error: 'Invalid transaction type' });
});


// // Create a new transaction
// app.post('/transactions', auth, async (req, res) => {
//     const { utorid, type, spent, promotionIds, remark, amount, relatedId } = req.body;

//     if (!utorid || !type) {
//         return res.status(400).json({ error: 'Missing required fields' });
//     }

//     const user = await prisma.user.findUnique({ where: { utorid } });
//     if (!user) {
//         return res.status(404).json({ error: 'User not found' });
//     }

//     const roles = ['regular', 'cashier', 'manager', 'superuser'];
//     const userRoleIndex = roles.indexOf(req.user.role);

//     if (type === 'purchase') {
//         if (userRoleIndex < roles.indexOf('cashier')) {
//             return res.status(403).json({ error: 'Forbidden' });
//         }
//         if (spent === undefined) {
//             return res.status(400).json({ error: 'Missing spent for purchase transaction' });
//         }

//         const earned = Math.round(spent / 0.25);

//         const transaction = await prisma.transaction.create({
//             data: {
//                 utorid,
//                 type,
//                 spent,
//                 earned,
//                 promotionIds: Array.isArray(promotionIds) ? promotionIds.join(',') : '', // save as string
//                 remark,
//                 createdBy: req.user.utorid,
//             },
//         });

//         await prisma.user.update({
//             where: { utorid },
//             data: { points: user.points + earned },
//         });

//         return res.status(201).json({
//             ...transaction,
//             promotionIds:
//                 transaction.promotionIds && transaction.promotionIds.trim() !== ''
//                     ? transaction.promotionIds.split(',')
//                     : [], // ✅ Always a list in response
//         });

//     } else if (type === 'adjustment') {
//         if (userRoleIndex < roles.indexOf('manager')) {
//             return res.status(403).json({ error: 'Forbidden' });
//         }
//         if (amount === undefined || relatedId === undefined) {
//             return res.status(400).json({ error: 'Missing amount or relatedId for adjustment transaction' });
//         }

//         const transaction = await prisma.transaction.create({
//             data: {
//                 utorid,
//                 type,
//                 amount,
//                 relatedId,
//                 remark,
//                 createdBy: req.user.utorid,
//             },
//         });

//         await prisma.user.update({
//             where: { utorid },
//             data: { points: user.points + amount },
//         });

//         return res.status(201).json({
//             ...transaction,
//             promotionIds: [], // ✅ Adjustment responses don't include promotions
//         });
//     }

//     return res.status(400).json({ error: 'Invalid transaction type' });
// });


// // Create a new transaction
// app.post('/transactions', auth, async (req, res) => {
//     const { utorid, type, spent, promotionIds, remark, amount, relatedId } = req.body;

//     if (!utorid || !type) {
//         return res.status(400).json({ error: 'Missing required fields' });
//     }

//     const user = await prisma.user.findUnique({ where: { utorid } });
//     if (!user) {
//         return res.status(404).json({ error: 'User not found' });
//     }

//     const roles = ['regular', 'cashier', 'manager', 'superuser'];
//     const userRoleIndex = roles.indexOf(req.user.role);

//     if (type === 'purchase') {
//         // Check if user is cashier or higher
//         if (userRoleIndex < roles.indexOf('cashier')) {
//             return res.status(403).json({ error: 'Forbidden' });
//         }
//         if (spent === undefined) {
//             return res.status(400).json({ error: 'Missing spent for purchase transaction' });
//         }

//         // For a regular purchase transaction without additional promotions,
//         // the rate of earning points is 1 point per 25 cents spent (rounded to nearest integer).
//         const earned = Math.round(spent / 0.25);

//         const transaction = await prisma.transaction.create({
//             data: {
//                 utorid,
//                 type,
//                 spent,
//                 earned,
//                 promotionIds: promotionIds ? promotionIds.join(',') : '',
//                 remark,
//                 createdBy: req.user.utorid,
//             },
//         });

//         // Update user points
//         await prisma.user.update({
//             where: { utorid },
//             data: { points: user.points + earned },
//         });

//         const responseTransaction = {
//             ...transaction,
//             promotionIds: transaction.promotionIds ? transaction.promotionIds.split(',') : [],
//         };

//         return res.status(201).json(responseTransaction);

        
//     } else if (type === 'adjustment') {
//         // Check if user is manager or higher
//         if (userRoleIndex < roles.indexOf('manager')) {
//             return res.status(403).json({ error: 'Forbidden' });
//         }
//         if (amount === undefined || relatedId === undefined) {
//             return res.status(400).json({ error: 'Missing amount or relatedId for adjustment transaction' });
//         }

//         const transaction = await prisma.transaction.create({
//             data: {
//                 utorid,
//                 type,
//                 amount,
//                 relatedId,
//                 remark,
//                 createdBy: req.user.utorid,
//             },
//         });

//         // Update user points
//         await prisma.user.update({
//             where: { utorid },
//             data: { points: user.points + amount },
//         });

//         return res.status(201).json(transaction);
//     } else {
//         return res.status(400).json({ error: 'Invalid transaction type' });
//     }
// });

// Get all transactions
app.get('/transactions', auth, authz('manager'), async (req, res) => {
    // TODO: Add authorization (manager or higher)
    const { name, createdBy, suspicious, promotionId, type, relatedId, amount, operator, page = 1, limit = 10 } = req.query;

    const where = {};
    if (name) {
        where.user = {
            OR: [
                { name: { contains: name } },
                { utorid: { contains: name } },
            ],
        };
    }
    if (createdBy) {
        where.createdBy = createdBy;
    }
    if (suspicious) {
        where.suspicious = suspicious === 'true';
    }
    if (promotionId) {
        where.promotionIds = {
            contains: promotionId,
        };
    }
    if (type) {
        where.type = type;
    }
    if (relatedId) {
        where.relatedId = parseInt(relatedId);
    }
    if (amount && operator) {
        if (operator === 'gte') {
            where.amount = { gte: parseInt(amount) };
        } else if (operator === 'lte') {
            where.amount = { lte: parseInt(amount) };
        }
    }

    const transactions = await prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
    });

    const totalTransactions = await prisma.transaction.count({ where });

    res.status(200).json({
        count: totalTransactions,
        results: transactions,
    });
});

// Get a specific transaction
app.get('/transactions/:transactionId', auth, authz('manager'), async (req, res) => {
    // TODO: Add authorization (manager or higher)
    const { transactionId } = req.params;

    const transaction = await prisma.transaction.findUnique({
        where: { id: parseInt(transactionId) },
    });

    if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
    }

    console.log("Transaction found: ", transaction);

    res.status(200).json(transaction);
});

// // Set or unset a transaction as suspicious
// app.patch('/transactions/:transactionId/suspicious', auth, authz('manager'), async (req, res) => {
//     // TODO: Add authorization (manager or higher)
//     const { transactionId } = req.params;
//     const { suspicious } = req.body;

//     if (suspicious === undefined) {
//         return res.status(400).json({ error: 'Missing suspicious field' });
//     }

//     const transaction = await prisma.transaction.findUnique({
//         where: { id: parseInt(transactionId) },
//     });

//     if (!transaction) {
//         return res.status(404).json({ error: 'Transaction not found' });
//     }

//     if (transaction.suspicious === suspicious) {
//         return res.status(200).json(transaction);
//     }

//     const user = await prisma.user.findUnique({ where: { utorid: transaction.utorid } });

//     if (!user) {
//         return res.status(404).json({ error: 'User not found' });
//     }

//     let pointsChange = 0;
//     if (transaction.type === 'purchase') {
//         pointsChange = transaction.earned;
//     } else if (transaction.type === 'adjustment' || transaction.type === 'transfer' || transaction.type === 'event') {
//         pointsChange = transaction.amount;
//     }

//     if (suspicious) {
//         await prisma.user.update({
//             where: { utorid: transaction.utorid },
//             data: { points: user.points - pointsChange },
//         });
//     } else {
//         await prisma.user.update({
//             where: { utorid: transaction.utorid },
//             data: { points: user.points + pointsChange },
//         });
//     }

//     const updatedTransaction = await prisma.transaction.update({
//         where: { id: parseInt(transactionId) },
//         data: { suspicious },
//     });

//     res.status(200).json(updatedTransaction);
// });

// Update a specific transaction (for processing redemptions)
app.patch('/transactions/:transactionId', auth, authz('manager'), async (req, res) => {
    const { transactionId } = req.params;
    const { processedBy, redeemed } = req.body;

    if (processedBy === undefined && redeemed === undefined) {
        return res.status(400).json({ error: 'Empty payload' });
    }

    const transaction = await prisma.transaction.findUnique({
        where: { id: parseInt(transactionId) },
    });

    if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
    }

    const data = {};
    if (processedBy !== undefined) {
        data.processedBy = processedBy;
    }
    if (redeemed !== undefined) {
        data.redeemed = redeemed;
    }

    const updatedTransaction = await prisma.transaction.update({
        where: { id: parseInt(transactionId) },
        data,
    });

    res.status(200).json(updatedTransaction);
});

// Set or unset a transaction as suspicious
app.patch('/transactions/:transactionId/suspicious', auth, authz('manager'), async (req, res) => {
    const { transactionId } = req.params;
    const { suspicious } = req.body;
    
    if (suspicious === undefined) {
        return res.status(400).json({ error: 'Missing suspicious field' });
    }

    const transaction = await prisma.transaction.findUnique({
        where: { id: parseInt(transactionId) },
    });

    if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.suspicious === suspicious) {
        // ✅ Format response to match schema requirement
        return res.status(200).json({
            ...transaction,
            promotionIds: transaction.promotionIds
                ? transaction.promotionIds.split(',')
                : [],
        });
    }

    const user = await prisma.user.findUnique({ where: { utorid: transaction.utorid } });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    let pointsChange = 0;
    if (transaction.type === 'purchase') {
        pointsChange = transaction.earned;
    } else if (['adjustment', 'transfer', 'event'].includes(transaction.type)) {
        pointsChange = transaction.amount;
    }
    console.log(`Points change calculated: ${pointsChange} for transaction type: ${transaction.type}`);

    let sus = null;
    if (suspicious) {
        sus = await prisma.user.update({
            where: { utorid: transaction.utorid },
            data: { points: user.points - pointsChange },
        });
    } else {
        sus = await prisma.user.update({
            where: { utorid: transaction.utorid },
            data: { points: user.points + pointsChange },
        });
    }

    const updatedTransaction = await prisma.transaction.update({
        where: { id: parseInt(transactionId) },
        data: { suspicious },
    });
    
    if (!suspicious) {
        console.log("Unflagging transaction as suspicious, updated transaction: ", updatedTransaction);
        console.log("User after updating points: ", sus);
    }

    // ✅ Ensure consistent response format
    res.status(200).json({
        ...updatedTransaction,
        promotionIds: updatedTransaction.promotionIds
            ? updatedTransaction.promotionIds.split(',')
            : [],
    });
});

// Create a new redemption transaction
app.post('/users/me/transactions', auth, authz('regular'), async (req, res) => {
  // TODO: Add authorization (regular or higher)
  console.log("Redemption request body: ", req.body);

  const { type, amount, remark } = req.body;

  if (type !== 'redemption') {
      console.log("Invalid transaction type for redemption: ", type);
      return res.status(400).json({ error: 'Invalid transaction type' });
  }

  if (amount === undefined) {
      console.log("Missing amount for redemption");
      return res.status(400).json({ error: 'Missing amount' });
  }

  const user = req.user;

  if (!user.verified) {
      return res.status(403).json({ error: 'User not verified' });
  }

  if (user.points < amount) {
      console.log("Insufficient points for redemption. User points: ", user.points, " Requested amount: ", amount);
      return res.status(400).json({ error: 'Insufficient points' });
  }

  const updatedTransaction = await prisma.transaction.create({
      data: {
          utorid: user.utorid,
          type: 'redemption',
          amount: amount, // Negative amount for redemption?
          redeemed: amount,
          remark,
          createdBy: user.utorid,
      },
  });

  console.log("Redemption transaction created: ", updatedTransaction);

  res.status(201).json({
      id: updatedTransaction.id,
      utorid: updatedTransaction.utorid,
      type: updatedTransaction.type,
      processedBy: updatedTransaction.processedBy,
      amount: updatedTransaction.amount,
      //redeemed: updatedTransaction.redeemed,
      remark: updatedTransaction.remark,
      createdBy: updatedTransaction.createdBy,
  });
});

app.post('/users/:userId/transactions', auth, authz('regular'), async (req, res) => {
    const { userId } = req.params;
    const { type, amount, remark } = req.body;

    if (type !== 'transfer') {
        return res.status(400).json({ error: 'Invalid transaction type' });
    }

    if (amount === undefined) {
        return res.status(400).json({ error: 'Missing amount' });
    }

    const sender = req.user;
    const recipient = await prisma.user.findUnique({ where: { id: parseInt(userId) } });

    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
    if (!sender.verified) return res.status(403).json({ error: 'Sender not verified' });
    if (sender.points < amount) return res.status(400).json({ error: 'Insufficient points' });

    // Create transaction for sender
    const senderTransaction = await prisma.transaction.create({
        data: {
            utorid: sender.utorid,
            type: 'transfer',
            amount: -amount,
            relatedId: recipient.id,
            remark,
            createdBy: sender.utorid,
        },
    });

    // Create transaction for recipient
    await prisma.transaction.create({
        data: {
            utorid: recipient.utorid,
            type: 'transfer',
            amount: amount,
            relatedId: sender.id,
            remark,
            createdBy: sender.utorid,
        },
    });

    // Update points
    await prisma.user.update({ where: { id: sender.id }, data: { points: sender.points - amount } });
    await prisma.user.update({ where: { id: recipient.id }, data: { points: recipient.points + amount } });

    // Fetch full sender and recipient objects with required fields
    const senderFull = await prisma.user.findUnique({ where: { id: sender.id } });
    const recipientFull = await prisma.user.findUnique({ where: { id: recipient.id } });

    // Only include required fields in response
    const formatUser = (u) => ({
        //id: u.id,
        //utorid: u.utorid,
        //name: u.name,
        email: u.email,
        role: u.role,
        //points: u.points,
        //verified: u.verified,
        //promotions: u.promotions || [],
        createdAt: u.createdAt,
    });

    res.status(201).json({
        id: senderTransaction.id,
        //sender: formatUser(senderFull),
        recipientDetails: formatUser(recipientFull),
        sender: sender.utorid,       // <-- string now
        recipient: recipient.utorid, // <-- string now
        type: 'transfer',
        sent: amount,
        remark,
        createdBy: sender.utorid,
        createdAt: senderTransaction.createdAt,
    });
});


// // Create a new transfer transaction
// app.post('/users/:userId/transactions', auth, authz('regular'), async (req, res) => {
//     const { userId } = req.params;
//     const { type, amount, remark } = req.body;

//     if (type !== 'transfer') {
//         return res.status(400).json({ error: 'Invalid transaction type' });
//     }

//     if (amount === undefined) {
//         return res.status(400).json({ error: 'Missing amount' });
//     }

//     const sender = req.user;
//     const recipient = await prisma.user.findUnique({ where: { id: parseInt(userId) } });

//     if (!recipient) {
//         return res.status(404).json({ error: 'Recipient not found' });
//     }

//     if (!sender.verified) {
//         return res.status(403).json({ error: 'Sender not verified' });
//     }

//     if (sender.points < amount) {
//         return res.status(400).json({ error: 'Insufficient points' });
//     }

//     // Create transaction for sender
//     const senderTransaction = await prisma.transaction.create({
//         data: {
//             utorid: sender.utorid,
//             type: 'transfer',
//             amount: -amount,
//             relatedId: recipient.id,
//             remark,
//             createdBy: sender.utorid,
//         },
//     });

//     // Create transaction for recipient
//     await prisma.transaction.create({
//         data: {
//             utorid: recipient.utorid,
//             type: 'transfer',
//             amount: amount,
//             relatedId: sender.id,
//             remark,
//             createdBy: sender.utorid,
//         },
//     });

//     // Update points
//     await prisma.user.update({
//         where: { id: sender.id },
//         data: { points: sender.points - amount },
//     });

//     await prisma.user.update({
//         where: { id: recipient.id },
//         data: { points: recipient.points + amount },
//     });

//     // Respond with minimal schema: sender and recipient as strings
//     res.status(201).json({
//         id: senderTransaction.id,
//         sender: sender.utorid,       // <-- string now
//         recipient: recipient.utorid, // <-- string now
//         type: 'transfer',
//         sent: amount,
//         remark,
//         createdBy: sender.utorid,
//         createdAt: senderTransaction.createdAt,
//     });
// });


// // Create a new transfer transaction
// app.post('/users/:userId/transactions', auth, authz('regular'), async (req, res) => {
//     const { userId } = req.params;
//     const { type, amount, remark } = req.body;

//     if (type !== 'transfer') {
//         return res.status(400).json({ error: 'Invalid transaction type' });
//     }

//     if (amount === undefined) {
//         return res.status(400).json({ error: 'Missing amount' });
//     }

//     const sender = req.user;
//     const recipient = await prisma.user.findUnique({ where: { id: parseInt(userId) } });

//     if (!recipient) {
//         return res.status(404).json({ error: 'Recipient not found' });
//     }

//     if (!sender.verified) {
//         return res.status(403).json({ error: 'Sender not verified' });
//     }

//     if (sender.points < amount) {
//         return res.status(400).json({ error: 'Insufficient points' });
//     }

//     // Create transaction for sender
//     const senderTransaction = await prisma.transaction.create({
//         data: {
//             utorid: sender.utorid,
//             type: 'transfer',
//             amount: -amount,
//             relatedId: recipient.id,
//             remark,
//             createdBy: sender.utorid,
//         },
//     });

//     // Create transaction for recipient
//     const recipientTransaction = await prisma.transaction.create({
//         data: {
//             utorid: recipient.utorid,
//             type: 'transfer',
//             amount: amount,
//             relatedId: sender.id,
//             remark,
//             createdBy: sender.utorid,
//         },
//     });

//     // Update points for sender and recipient
//     await prisma.user.update({
//         where: { id: sender.id },
//         data: { points: sender.points - amount },
//     });

//     await prisma.user.update({
//         where: { id: recipient.id },
//         data: { points: recipient.points + amount },
//     });

//     // Fetch full sender and recipient objects with required fields
//     const senderFull = await prisma.user.findUnique({ where: { id: sender.id } });
//     const recipientFull = await prisma.user.findUnique({ where: { id: recipient.id } });

//     res.status(201).json({
//         id: senderTransaction.id,
//         sender: senderFull,
//         recipient: recipientFull,
//         type: 'transfer',
//         sent: amount,
//         remark,
//         createdBy: sender.utorid,
//         createdAt: senderTransaction.createdAt,
//     });
// });


// // Create a new transfer transaction
// app.post('/users/:userId/transactions', auth, authz('regular'), async (req, res) => {
//     // TODO: Add authorization (regular or higher)
//     const { userId } = req.params;
//     const { type, amount, remark } = req.body;

//     if (type !== 'transfer') {
//         return res.status(400).json({ error: 'Invalid transaction type' });
//     }

//     if (amount === undefined) {
//         return res.status(400).json({ error: 'Missing amount' });
//     }

//     const sender = req.user;
//     const recipient = await prisma.user.findUnique({ where: { id: parseInt(userId) } });

//     if (!recipient) {
//         return res.status(404).json({ error: 'Recipient not found' });
//     }

//     if (!sender.verified) {
//         return res.status(403).json({ error: 'Sender not verified' });
//     }

//     if (sender.points < amount) {
//         return res.status(400).json({ error: 'Insufficient points' });
//     }

//     // Create transaction for sender
//     const senderTransaction = await prisma.transaction.create({
//         data: {
//             utorid: sender.utorid,
//             type: 'transfer',
//             amount: -amount,
//             relatedId: recipient.id,
//             remark,
//             createdBy: sender.utorid,
//         },
//     });

//     // Create transaction for recipient
//     const recipientTransaction = await prisma.transaction.create({
//         data: {
//             utorid: recipient.utorid,
//             type: 'transfer',
//             amount: amount,
//             relatedId: sender.id,
//             remark,
//             createdBy: sender.utorid,
//         },
//     });

//     // Update points for sender and recipient
//     await prisma.user.update({
//         where: { id: sender.id },
//         data: { points: sender.points - amount },
//     });

//     await prisma.user.update({
//         where: { id: recipient.id },
//         data: { points: recipient.points + amount },
//     });

//     res.status(201).json({
//         id: senderTransaction.id,
//         sender: sender.utorid,
//         recipient: recipient.utorid,
//         type: 'transfer',
//         sent: amount,
//         remark,
//         createdBy: sender.utorid,
//     });
// });



// Create a new event
app.post('/events', auth, authz('manager'), async (req, res) => {
    // TODO: Add authorization (manager or higher)
    const { name, description, location, startTime, endTime, capacity, points } = req.body;

    if (!name || !description || !location || !startTime || !endTime || !points) {
        console.log('Missing required fields in event creation:', req.body);
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
        console.log('Invalid date format for startTime or endTime:', { startTime, endTime });
        return res.status(400).json({ error: 'Invalid date format for startTime or endTime' });
    }

    if (parsedStartTime >= parsedEndTime) {
        console.log('startTime must be before endTime:', { startTime, endTime });
        return res.status(400).json({ error: 'startTime must be before endTime' });
    }

    if (capacity !== undefined && capacity !== null && capacity <= 0) {
        console.log('Invalid capacity value:', capacity);
        return res.status(400).json({ error: 'capacity must be a positive number or null' });
    }

    if (points <= 0) {
        console.log('Invalid points value:', points);
        return res.status(400).json({ error: 'points must be a positive integer' });
    }

    const event = await prisma.event.create({
        data: {
            name,
            description,
            location,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            capacity,
            points,
            pointsRemain: points,
            pointsAwarded: 0,
            organizers: {
                connect: { id: req.user.id },
            },
        },
    });

    res.status(201).json({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
        pointsRemain: event.pointsRemain,
        pointsAwarded: event.pointsAwarded,
        published: event.published,
        organizers: [{ id: req.user.id, utorid: req.user.utorid, name: req.user.name }],
        guests: [],
    });
});

// Get all events
app.get('/events', auth, authz('regular'), async (req, res) => {
    let { name, location, started, ended, showFull, published } = req.query;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    

    const where = {};
    if (name) {
        where.name = { contains: name };
    }
    if (location) {
        where.location = { contains: location };
    }
    if (started) {
        where.startTime = { [started === 'true' ? 'lte' : 'gt']: new Date() };
    }
    if (ended) {
        where.endTime = { [ended === 'true' ? 'lte' : 'gt']: new Date() };
    }
    if (showFull === 'true') {
        where.numGuests = { lt: prisma.event.capacity };
    }
    // Regular users cannot see unpublished events
    if (req.user.role !== 'superuser') {
        // Regular users can only see published events
        where.published = true;
    } else {
        // Managers or higher can choose what to view
        if (published === 'true') {
            where.published = true;
        } else if (published === 'false') {
            where.published = false;
        }
    }
    

    if (limit <= 0 || page <= 0) {
        return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    console.log(`Fetching events with filters - name: ${name}, location: ${location}, started: ${started}, ended: ${ended}, showFull: ${showFull}, published: ${published}, page: ${page}, limit: ${limit}`);

    const events = await prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
            organizers: {
                select: { id: true, utorid: true, name: true },
            },
            guests: {
                select: { id: true, utorid: true, name: true },
            },
        },
    });

    let totalEvents = await prisma.event.count({ where });
    console.log(`Total events found: ${totalEvents}`);
    console.log('Events:', events);

    res.status(200).json({
        count: totalEvents,
        results: events.map(event => ({
            id: event.id,
            name: event.name,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            capacity: event.capacity,
            numGuests: event.numGuests,
            pointsRemain: event.pointsRemain,
            pointsAwarded: event.pointsAwarded,
            published: event.published,
            organizers: event.organizers,
            guests: event.guests,
        })),
    });
});

// Get a specific event
app.get('/events/:eventId', auth, authz('regular'), async (req, res) => {
    // TODO: Add authorization (regular or higher)
    // TODO: Implement different responses based on the user's role
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
            organizers: {
                select: { id: true, utorid: true, name: true },
            },
            guests: {
                select: { id: true, utorid: true, name: true },
            },
        },
    });

    if (!event || !event.published) {
        return res.status(404).json({ error: 'Event not found or not published' });
    }

    res.status(200).json({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
        numGuests: event.numGuests,
        organizers: event.organizers,
        guests: event.guests,
        pointsRemain: event.pointsRemain,
        pointsAwarded: event.pointsAwarded,
        published: event.published,
    });
});

// Update an existing event

// 400 Bad Request 

app.patch('/events/:eventId', auth, async (req, res) => {
    const { eventId } = req.params;
    const parsedEventId = parseInt(eventId);

    if (isNaN(parsedEventId)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }

    const { name, description, location, startTime, endTime, capacity, points, published } = req.body;

    const event = await prisma.event.findUnique({
        where: { id: parsedEventId },
        include: { organizers: true },
    });

    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const isOrganizer = event.organizers.some(organizer => organizer.id === req.user.id);
    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const userRoleIndex = roles.indexOf(req.user.role);

    if (userRoleIndex < roles.indexOf('manager') && !isOrganizer) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const data = {};
    if (name) data.name = name;
    if (description) data.description = description;
    if (location) data.location = location;
    if (startTime) data.startTime = new Date(startTime);
    if (endTime) data.endTime = new Date(endTime);
    if (capacity !== undefined || capacity !== null) {
        if (capacity !== null && capacity <= 0) {
            console.log('Invalid capacity value:', capacity);
            return res.status(400).json({ error: 'capacity must be a positive number or null' });
        }
        data.capacity = capacity;
    }
    if (points !== undefined && points !== null) {
        // Points can only be set by managers or higher
        if (userRoleIndex < roles.indexOf('manager')) {
            return res.status(403).json({ error: 'Only managers or higher can update points' });
        }
        if (points <= 0) {
            console.log('Invalid points value:', points);
            return res.status(400).json({ error: 'points must be a positive integer' });
        }
        console.log('Updating points to:', points);
        data.points = points;
    }

    if (published !== undefined && userRoleIndex < roles.indexOf('manager')) {
        return res.status(403).json({ error: 'Only managers or higher can update published status' });
    }

    if (published !== null && (published === false || published === 'false')) {
        console.log('Attempt to set published to false is not allowed');
        return res.status(400).json({ error: 'Cannot set published to false' });
    }

    if (published !== undefined && published !== null) data.published = published;

    // start or end in the past
    if ((startTime && new Date(startTime) < new Date()) ||
        (endTime && new Date(endTime) < new Date())) {
        console.log('startTime or endTime cannot be in the past:', { startTime, endTime });
        console.log("Current time:", new Date());
        return res.status(400).json({ error: 'startTime or endTime cannot be in the past' });
    }

// ▪ If capacity is reduced, but the number of confirmed guests exceeds the 
// new capacity. 
    if (capacity !== undefined && capacity !== null && capacity < event.numGuests) {
        console.log('Cannot reduce capacity below number of confirmed guests:', { capacity, numGuests: event.numGuests });
        return res.status(400).json({ error: 'Cannot reduce capacity below number of confirmed guests' });
    }
// ▪ If the total amount of points is reduced, resulting in the remaining points 
// allocated to the event falling below zero. Points already awarded to 
// guests cannot be retracted through this API. 
    if (points !== undefined && points !== null) {
        const pointsAlreadyAwarded = event.pointsAwarded;
        const newPointsRemain = points - pointsAlreadyAwarded;
        if (newPointsRemain < 0) {
            console.log('Cannot reduce points below points already awarded to guests:', { points, pointsAlreadyAwarded });
            return res.status(400).json({ error: 'Cannot reduce points below points already awarded to guests' });
        }
    }
// ▪ If update(s) to name, description, location, startTime, or capacity is made 
// after the original start time has passed.
    // if (new Date() > event.startTime) {
    //     if (name || description || location || startTime || capacity !== undefined || capacity !== null) {
    //         console.log('Cannot update name, description, location, startTime, or capacity after event has started');
    //         return res.status(400).json({ error: 'Cannot update name, description, location, startTime, or capacity after event has started' });
    //     }
    // }

    if (new Date() > event.startTime) {
        if (
            name !== undefined && name !== null ||
            description !== undefined && description !== null ||
            location !== undefined && location !== null ||
            startTime !== undefined && startTime !== null ||
            capacity !== undefined && capacity !== null
        ) {
            console.log('Cannot update name, description, location, startTime, or capacity after event has started');
            return res.status(400).json({ error: 'Cannot update name, description, location, startTime, or capacity after event has started' });
        }
    }
    

// ▪ In addition to the above, if update to endTime is made after the original 
// end time has passed.
    if (new Date() > event.endTime) {
        if (endTime) {
            console.log('Cannot update endTime after event has ended');
            console.log('Attempted endTime update:', endTime);
            console.log('Now:', new Date());
            return res.status(400).json({ error: 'Cannot update endTime after event has ended' });
        }
    }

    // Handle null values for data fields
    data.capacity = capacity === null ? event.capacity : capacity;
    console.log('Points before update:', event.points);
    console.log('Points from request:', points);
    if (points !== null && points !== undefined) {
            data.points = points === null ? event.points : points - event.pointsAwarded;
            data.pointsRemain = points === null ? event.pointsRemain : points - event.pointsAwarded;
    } else {
        data.points = points === null ? event.points : points - event.pointsAwarded;
    }
    data.published = published === null ? event.published : published;
    data.startTime = startTime === null ? event.startTime : new Date(startTime);
    data.endTime = endTime === null ? event.endTime : new Date(endTime);
    data.name = name === null ? event.name : name;
    data.description = description === null ? event.description : description;
    data.location = location === null ? event.location : location;


    const updatedEvent = await prisma.event.update({
        where: { id: parseInt(eventId) },
        data,
    });

    console.log(`Event ${eventId} updated successfully with data:`, data);
    console.log('Updated event:', updatedEvent);

    res.status(200).json(updatedEvent);
});

// Delete an event
app.delete('/events/:eventId', auth, authz('manager'), async (req, res) => {
    // TODO: Add authorization (manager or higher)
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
    });

    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    if (event.published) {
        return res.status(400).json({ error: 'Cannot delete a published event' });
    }

    await prisma.event.delete({
        where: { id: parseInt(eventId) },
    });

    res.status(204).send();
});

// Add an organizer to an event
app.post('/events/:eventId/organizers', auth, authz('manager'), async (req, res) => {
    // TODO: Add authorization (manager or higher)
    const { eventId } = req.params;
    const { utorid } = req.body;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: { organizers: true, guests: true },
    });

    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    if (new Date() > event.endTime) {
        return res.status(410).json({ error: 'Event has ended' });
    }

    const user = await prisma.user.findUnique({ where: { utorid } });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (event.guests.some(guest => guest.id === user.id)) {
        return res.status(400).json({ error: 'User is already a guest of this event' });
    }

    await prisma.event.update({
        where: { id: parseInt(eventId) },
        data: {
            organizers: {
                connect: { id: user.id },
            },
        },
    });

    const updatedEvent = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
            organizers: {
                select: { id: true, utorid: true, name: true },
            },
        },
    });

    res.status(201).json({
        id: updatedEvent.id,
        name: updatedEvent.name,
        location: updatedEvent.location,
        organizers: updatedEvent.organizers,
    });
});

// Remove an organizer from an event
app.delete('/events/:eventId/organizers/:userId', auth, authz('manager'), async (req, res) => {
    // TODO: Add authorization (manager or higher)
    const { eventId, userId } = req.params;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: { organizers: true },
    });

    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    await prisma.event.update({
        where: { id: parseInt(eventId) },
        data: {
            organizers: {
                disconnect: { id: user.id },
            },
        },
    });

    res.status(204).send();
});

// Add a guest to an event
app.post('/events/:eventId/guests', auth, async (req, res) => {
    const { eventId } = req.params;
    const { utorid } = req.body;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: { organizers: true, guests: true },
    });

    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const isOrganizer = event.organizers.some(organizer => organizer.id === req.user.id);
    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const userRoleIndex = roles.indexOf(req.user.role);

    if (userRoleIndex < roles.indexOf('manager') && !isOrganizer) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (!event.published) {
        return res.status(404).json({ error: 'Event not visible yet' });
    }

    if (new Date() > event.endTime) {
        return res.status(410).json({ error: 'Event has ended' });
    }

    if (event.capacity !== null && event.numGuests >= event.capacity) {
        return res.status(410).json({ error: 'Event is full' });
    }

    const user = await prisma.user.findUnique({ where: { utorid } });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (event.organizers.some(organizer => organizer.id === user.id)) {
        return res.status(400).json({ error: 'User is already an organizer of this event' });
    }

    await prisma.event.update({
        where: { id: parseInt(eventId) },
        data: {
            guests: {
                connect: { id: user.id },
            },
            numGuests: {
                increment: 1,
            },
        },
    });

    const updatedEvent = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
            guests: {
                select: { id: true, utorid: true, name: true },
            },
        },
    });

    res.status(201).json({
        id: updatedEvent.id,
        name: updatedEvent.name,
        location: updatedEvent.location,
        guestAdded: user,
        numGuests: updatedEvent.numGuests,
    });
});

// Add the logged-in user to an event
app.post('/events/:eventId/guests/me', auth, authz('regular'), async (req, res) => {
    // TODO: Add authorization (regular or higher)
    console.log('Self-RSVP request by user:', req.user);
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: { guests: true },
    });

    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    if (new Date() > event.endTime) {
        return res.status(410).json({ error: 'Event has ended' });
    }

    if (event.capacity !== null && event.numGuests >= event.capacity) {
        return res.status(410).json({ error: 'Event is full' });
    }

    if (event.guests.some(guest => guest.id === req.user.id)) {
        return res.status(400).json({ error: 'User is already a guest of this event' });
    }

    await prisma.event.update({
        where: { id: parseInt(eventId) },
        data: {
            guests: {
                connect: { id: req.user.id },
            },
            numGuests: {
                increment: 1,
            },
        },
    });

    // const updatedEvent = await prisma.event.findUnique({
    //     where: { id: parseInt(eventId) },
    //     include: {
    //         guests: {
    //             select: { id: true, utorid: true, name: true },
    //         },
    //         pointsAwarded,
    //         pointsRemain,
    //         published
    //     },
    // });

    const updatedEvent = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        select: {
            id: true,
            name: true,
            description: true,
            location: true,
            startTime: true,
            endTime: true,
            capacity: true,
            numGuests: true,
            points: true,
            pointsRemain: true,
            pointsAwarded: true,
            published: true,
            guests: {
                select: { id: true, utorid: true, name: true },
            },
            // If you also need organizers:
            // organizers: { select: { id: true, utorid: true, name: true } }
        }
    });
    

    console.log("Updated event after self-RSVP:", updatedEvent);

    res.status(201).json({
        id: updatedEvent.id,
        name: updatedEvent.name,
        location: updatedEvent.location,
        guestAdded: req.user,
        numGuests: updatedEvent.numGuests,
        pointsRemain: updatedEvent.pointsRemain,
        pointsAwarded: updatedEvent.pointsAwarded,
        published: updatedEvent.published,
    });
});

// Remove the logged-in user from an event
app.delete('/events/:eventId/guests/me', auth, authz('regular'), async (req, res) => {
    // TODO: Add authorization (regular or higher)
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: { guests: true },
    });

    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    if (new Date() > event.endTime) {
        return res.status(410).json({ error: 'Event has ended' });
    }

    if (!event.guests.some(guest => guest.id === req.user.id)) {
        return res.status(404).json({ error: 'User did not RSVP to this event' });
    }

    await prisma.event.update({
        where: { id: parseInt(eventId) },
        data: {
            guests: {
                disconnect: { id: req.user.id },
            },
            numGuests: {
                decrement: 1,
            },
        },
    });

    res.status(204).send();
});


// Remove a guest from an event
app.delete('/events/:eventId/guests/:userId', auth, async (req, res) => {
    const { eventId, userId } = req.params;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: { organizers: true, guests: true }, // Include guests to check if user is a guest
    });

    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const isOrganizer = event.organizers.some(organizer => organizer.id === req.user.id);
    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const userRoleIndex = roles.indexOf(req.user.role);

    // Authorization: Only manager or higher, or the event organizer can remove guests
    if (userRoleIndex < roles.indexOf('manager') && !isOrganizer) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const guestToRemove = event.guests.find(guest => guest.id === parseInt(userId));

    if (!guestToRemove) {
        return res.status(404).json({ error: 'Guest not found in this event' });
    }

    await prisma.event.update({
        where: { id: parseInt(eventId) },
        data: {
            guests: {
                disconnect: { id: guestToRemove.id },
            },
            numGuests: {
                decrement: 1,
            },
        },
    });

    res.status(204).send();
});



// Create a new reward transaction for an event
app.post('/events/:eventId/transactions', auth, async (req, res) => {
    const { eventId } = req.params;
    const { utorid, amount } = req.body;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: { organizers: true, guests: true },
    });

    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const isOrganizer = event.organizers.some(organizer => organizer.id === req.user.id);
    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const userRoleIndex = roles.indexOf(req.user.role);

    if (userRoleIndex < roles.indexOf('manager') && !isOrganizer) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (amount === undefined || amount <= 0) {
        return res.status(400).json({ error: 'Missing or invalid amount' });
    }

    if (event.pointsRemain < amount) {
        return res.status(400).json({ error: 'Remaining points are less than the requested amount' });
    }

    if (utorid) {
        const guest = event.guests.find(g => g.utorid === utorid);
        if (!guest) {
            return res.status(400).json({ error: 'User is not on the guest list' });
        }

        await prisma.transaction.create({
            data: {
                utorid: guest.utorid,
                type: 'event',
                amount,
                relatedId: event.id,
                createdBy: req.user.utorid,
            },
        });

        await prisma.user.update({
            where: { utorid: guest.utorid },
            data: { points: guest.points + amount },
        });

        await prisma.event.update({
            where: { id: event.id },
            data: {
                pointsRemain: event.pointsRemain - amount,
                pointsAwarded: event.pointsAwarded + amount,
            },
        });

        res.status(201).json({
            id: event.id,
            recipient: guest.utorid,
            awarded: amount,
            type: 'event',
            relatedId: event.id,
            createdBy: req.user.utorid,
        });
    } else {
        // Award to all guests
        if (event.pointsRemain < amount * event.guests.length) {
            return res.status(400).json({ error: 'Remaining points are less than the total amount to award all guests' });
        }

        const transactions = [];
        for (const guest of event.guests) {
            transactions.push(
                prisma.transaction.create({
                    data: {
                        utorid: guest.utorid,
                        type: 'event',
                        amount,
                        relatedId: event.id,
                        createdBy: req.user.utorid,
                    },
                })
            );
            await prisma.user.update({
                where: { utorid: guest.utorid },
                data: { points: guest.points + amount },
            });
        }

        await prisma.event.update({
            where: { id: event.id },
            data: {
                pointsRemain: event.pointsRemain - (amount * event.guests.length),
                pointsAwarded: event.pointsAwarded + (amount * event.guests.length),
            },
        });

        const createdTransactions = await prisma.$transaction(transactions);

        res.status(201).json(createdTransactions.map(t => ({
            id: t.id,
            recipient: t.utorid,
            awarded: t.amount,
            type: t.type,
            relatedId: t.relatedId,
            createdBy: t.createdBy,
        })));
    }
});

// Create a new promotion
// CREATE_PROMOTION_NEGATIVE_MIN_SPENDING: Expected 400, but got 201

app.post('/promotions', auth, authz('manager'), async (req, res) => {
    // TODO: Add authorization (manager or higher)
    const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

    if (!name || !description || !type || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (new Date(startTime) < new Date()) {
        return res.status(400).json({ error: 'startTime cannot be in the past' });
    }

    if (new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({ error: 'startTime must be before endTime' });
    }

    if (minSpending !== undefined && minSpending < 0) {
        return res.status(400).json({ error: 'minSpending cannot be negative' });
    }

    if (rate != null && (rate <= 0 || rate > 100)) {
        return res.status(400).json({ error: 'rate must be between 0 and 100' });
    }

    if (points != null && (!Number.isInteger(points) || points < 0)) {
        return res.status(400).json({ error: 'points cannot be negative' });
    }

    const promotion = await prisma.promotion.create({
        data: {
            name,
            description,
            type,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            minSpending,
            rate,
            points,
        },
    });

    res.status(201).json(promotion);
});

// Get all promotions
app.get('/promotions', auth, authz('regular'), async (req, res) => {
    // TODO: Add authorization (regular or higher)
    const { name, type, started, ended } = req.query;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');

    if (isNaN(page) || page < 1) {
        return res.status(400).json({ error: 'Invalid page number' });
    }
    if (isNaN(limit) || limit < 1) {
        return res.status(400).json({ error: 'Invalid limit number' });
    }

    // cant have both started and ended
    if (started !== undefined && ended !== undefined) {
      console.log('Cannot filter by both started and ended:', { started, ended });
      return res.status(400).json({ error: 'Cannot filter by both started and ended' });
  }
  

    const where = {};
    if (name) {
        where.name = { contains: name };
    }
    if (type) {
        where.type = type;
    }
    if (started) {
        where.startTime = { [started === 'true' ? 'lte' : 'gt']: new Date() };
    }
    if (ended) {
        where.endTime = { [ended === 'true' ? 'lte' : 'gt']: new Date() };
    }

    if (req.user.role === 'regular' || req.user.role === 'cashier') {
        const now = new Date().getTime();
        where.startTime = { lte: new Date(now) };
        where.endTime = { gt: new Date(now) };
        console.log('Regular user - filtering for active promotions only');

        // Check if the promotions have been used by the user
        const usedPromotions = await prisma.transaction.findMany({
            where: {
                utorid: req.user.utorid,
                type: 'promotion',
            },
            select: {
                relatedId: true,
            },
        });
        const usedPromotionIds = usedPromotions.map(tp => tp.relatedId);
        if (usedPromotionIds.length > 0) {
            where.id = { notIn: usedPromotionIds };
            console.log('Excluding used promotions:', usedPromotionIds);
        }
    }

    const promotions = await prisma.promotion.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
    });

    console.log(`Fetched promotions with filters - name: ${name}, type: ${type}, started: ${started}, ended: ${ended}, page: ${page}, limit: ${limit}`);
    console.log('Promotions:', promotions);

    // A regular user may only see available promotions, i.e., active promotions that they have not 
    // used. An active promotion is one that has started, but not ended.

    

    const totalPromotions = await prisma.promotion.count({ where });

    res.status(200).json({
        count: totalPromotions,
        results: promotions,
    });
});

// Get a specific promotion
app.get('/promotions/:promotionId', auth, authz('regular'), async (req, res) => {
    // TODO: Add authorization (regular or higher)
    const { promotionId } = req.params;

    const promotion = await prisma.promotion.findUnique({
        where: { id: parseInt(promotionId) },
    });

    if (!promotion) {
        console.log('Promotion not found with ID:', promotionId);
        return res.status(404).json({ error: 'Promotion not found' });
    }

    const userRole = req.user.role;
    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const userRoleIndex = roles.indexOf(userRole);

    // Only check for active status if the user is not a manager or superuser
    if (userRoleIndex < roles.indexOf('manager')) { // If user is regular or cashier
        const now = new Date().getTime();
        if (now < promotion.startTime.getTime() || now > promotion.endTime.getTime()) {
            console.log('Promotion is inactive:', promotion);
            console.log('Current time:', now, 'Start time:', promotion.startTime.getTime(), 'End time:', promotion.endTime.getTime());
            
            return res.status(404).json({ error: 'Promotion is inactive' });
        }
    }

    res.status(200).json(promotion);
});

// Update an existing promotion
app.patch('/promotions/:promotionId', auth, authz('manager'), async (req, res) => {
    // TODO: Add authorization (manager or higher)
    // TODO: Implement all validation rules as per handout
    const { promotionId } = req.params;
    const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

    const promotion = await prisma.promotion.findUnique({
        where: { id: parseInt(promotionId) },
    });

    if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
    }
    
    const now = new Date();

    // If start time is in the past
    if (startTime && new Date(startTime) < now) {
        return res.status(400).json({ error: 'startTime cannot be in the past' });
    }

    // If end time is in the past
    if (endTime && new Date(endTime) < now) {
        return res.status(400).json({ error: 'endTime cannot be in the past' });
    }

    // If promotion has started, restrict updates
    if (now > promotion.startTime) {
        if (name || description || type || startTime || minSpending !== undefined || rate !== undefined || points !== undefined) {
            return res.status(400).json({ error: 'Cannot update most fields after promotion has started' });
        }
    }

    // If promotion has ended, cannot update endTime
    if (now > promotion.endTime) {
        if (endTime) {
            return res.status(400).json({ error: 'Cannot update endTime after promotion has ended' });
        }
    }

    const start = startTime ? new Date(startTime) : promotion.startTime;
    const end = endTime ? new Date(endTime) : promotion.endTime;
    if (start >= end) {
        return res.status(400).json({ error: 'startTime must be before endTime' });
    }
    if (minSpending != null && minSpending < 0) {
        return res.status(400).json({ error: 'minSpending must be a positive value' });
    }
    if (rate != null && rate <= 0) {
        return res.status(400).json({ error: 'rate must be a positive value' });
    }
    if (points != null && (!Number.isInteger(points) || points < 0)) {
        return res.status(400).json({ error: 'points must be a positive integer' });
    }

    const data = {};
    if (name) data.name = name;
    if (description) data.description = description;
    if (type) data.type = type;
    if (startTime) data.startTime = new Date(startTime);
    if (endTime) data.endTime = new Date(endTime);
    if (minSpending !== undefined) data.minSpending = minSpending;
    if (rate !== undefined) data.rate = rate;
    if (points !== undefined) data.points = points;

    const updatedPromotion = await prisma.promotion.update({
        where: { id: parseInt(promotionId) },
        data,
    });

    res.status(200).json(updatedPromotion);
});

// Delete a promotion
app.delete('/promotions/:promotionId', auth, authz('manager'), async (req, res) => {
    // TODO: Add authorization (manager or higher)
    const { promotionId } = req.params;

    const promotion = await prisma.promotion.findUnique({
        where: { id: parseInt(promotionId) },
    });

    if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
    }

    if (new Date() > promotion.startTime) {
        return res.status(403).json({ error: 'Cannot delete a promotion that has already started' });
    }

    await prisma.promotion.delete({
        where: { id: parseInt(promotionId) },
    });

    res.status(204).send();
});

// Get transactions for the current user
app.get('/users/me/transactions', auth, authz('regular'), async (req, res) => {
    // TODO: Add authorization (regular or higher)
    const { type, relatedId, promotionId, amount, operator, page = 1, limit = 10 } = req.query;

    const where = { utorid: req.user.utorid };
    if (type) {
        where.type = type;
    }
    if (relatedId) {
        where.relatedId = parseInt(relatedId);
    }
    if (promotionId) {
        where.promotionIds = {
            contains: promotionId,
        };
    }
    if (amount && operator) {
        if (operator === 'gte') {
            where.amount = { gte: parseInt(amount) };
        } else if (operator === 'lte') {
            where.amount = { lte: parseInt(amount) };
        }
    }

    const transactions = await prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
    });

    const totalTransactions = await prisma.transaction.count({ where });

    res.status(200).json({
        count: totalTransactions,
        results: transactions,
    });
});

// Process a redemption transaction
app.patch('/transactions/:transactionId/processed', auth, authz('cashier'), async (req, res) => {
    // TODO: Add authorization (cashier or higher)
    const { transactionId } = req.params;
    //const { processed } = req.body;

    let { processed } = req.body;
    console.log('Processing redemption transaction:', { transactionId, processed });

// Normalize both boolean true and string 'true' to true
processed = processed === true || processed === 'true';

if (!processed) {
  console.log('Invalid processed field:', req.body.processed, typeof req.body.processed);
  return res.status(400).json({ error: 'Invalid processed field' });
}


    // if (processed === undefined || (processed !== true && processed !== 'true')) {
    //     console.log('Invalid processed field:', processed);
    //     return res.status(400).json({ error: 'Invalid processed field' });
    // }

    const transaction = await prisma.transaction.findUnique({
        where: { id: parseInt(transactionId) },
    });

    if (!transaction) {
        console.log('Transaction not found with ID:', transactionId);
        return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.type !== 'redemption') {
        console.log('Transaction is not a redemption type:', transaction);
        return res.status(400).json({ error: 'Transaction is not a redemption type' });
    }

    if (transaction.processedBy) {
        console.log('Transaction already processed:', transaction);
        return res.status(400).json({ error: 'Transaction already processed' });
    }

    const user = await prisma.user.findUnique({ where: { utorid: transaction.utorid } });

    if (!user) {
        console.log('User not found for transaction:', transaction);
        return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.update({
        where: { utorid: transaction.utorid },
        data: { points: user.points + transaction.amount }, // transaction.amount is negative for redemption
    });

    const updatedTransaction = await prisma.transaction.update({
        where: { id: parseInt(transactionId) },
        data: { processedBy: req.user.utorid },
    });

    res.status(200).json({
        id: updatedTransaction.id,
        utorid: updatedTransaction.utorid,
        type: updatedTransaction.type,
        processedBy: updatedTransaction.processedBy,
        redeemed: updatedTransaction.redeemed,
        remark: updatedTransaction.remark,
        createdBy: updatedTransaction.createdBy,
    });
});


// ==================

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});