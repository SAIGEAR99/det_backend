const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.follow_status = async (req, res) => {
    try {
        const { follower_id, following_id } = req.query;

        if (!follower_id || !following_id) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

     
        const followRecord = await prisma.follows.findFirst({
            where: {
                follower_id: parseInt(follower_id),
                following_id: parseInt(following_id),
            },
        });

        return res.status(200).json({
            is_following: followRecord ? true : false, 
        });
    } catch (error) {
        console.error('Error checking follow status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};



exports.follow_toggle = async (req, res) => {
    try {
        const { follower_id, following_id } = req.body;

        if (!follower_id || !following_id) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

    
        const existingFollow = await prisma.follows.findFirst({
            where: {
                follower_id: parseInt(follower_id),
                following_id: parseInt(following_id),
            },
        });

        if (existingFollow) {
    
            await prisma.follows.delete({
                where: {
                    follow_id: existingFollow.follow_id,
                },
            });

            await prisma.notifications.deleteMany({
                where: {
                    sender_id: parseInt(follower_id),
                    user_id: parseInt(following_id),
                    type: 'follow',
                },
            });

            return res.status(200).json({ is_following: false, message: 'Unfollowed successfully' });
        } else {
       
            await prisma.follows.create({
                data: {
                    follower_id: parseInt(follower_id),
                    following_id: parseInt(following_id),
                },
            });

    
            await prisma.notifications.create({
                data: {
                    user_id: parseInt(following_id), 
                    sender_id: parseInt(follower_id), 
                    type: 'follow',
                    message: 'ติดตามคุณ',
                    post_id: null,
                },
            });

            return res.status(200).json({ is_following: true, message: 'Followed successfully' });
        }
    } catch (error) {
        console.error('Error toggling follow status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

