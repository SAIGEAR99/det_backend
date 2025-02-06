const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.register = async (req, res) => {
  const { username, name, lastName, email, password } = req.body;

  if (!username || !name || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {

    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

  
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
        data: {
          username,
          email,
          password_hash: hashedPassword,
          full_name: `${name} ${lastName}`,
          profile_img: '/img/processed/profile.jpg', // เพิ่มฟิลด์ profile_img
        },
      });
      

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'An error occurred while registering the user.' });
  }
};
