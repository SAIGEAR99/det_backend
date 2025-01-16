const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.fetch = async (req, res) => {

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
  
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(user_id) },  
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

   
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.edit_profile = async (req, res) => {
  const { user_id, full_name, bio, link } = req.body;

  if (!user_id || !full_name || !bio || !link) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {

    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(user_id) },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

  
    const updatedUser = await prisma.users.update({
      where: { user_id: parseInt(user_id) },
      data: {
        full_name: full_name,
        bio: bio,
        link: link,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser, 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

