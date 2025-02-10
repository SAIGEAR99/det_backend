const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.repost = async (req, res) => {
    let { user_id, post_id } = req.body;

    if (!user_id || !post_id) {
        return res.status(400).json({ error: 'Missing user_id or post_id' });
    }

    try {
        user_id = parseInt(user_id, 10);
        post_id = parseInt(post_id, 10);

        if (isNaN(user_id) || isNaN(post_id)) {
            return res.status(400).json({ error: 'Invalid user_id or post_id' });
        }

        const existingRepost = await prisma.reposts.findFirst({
            where: { user_id, post_id },
        });

        let updatedRepostCount;

        if (existingRepost) {
 
            await prisma.reposts.delete({
                where: { repost_id: existingRepost.repost_id }
            });

           
            updatedRepostCount = await prisma.posts.update({
                where: { post_id },
                data: { repostCount: { decrement: 1 } },
                select: { repostCount: true }
            });

            return res.status(200).json({
                message: 'Repost removed',
                reposted: false,
                repostCount: updatedRepostCount.repostCount,
            });
        } else {
          
            await prisma.reposts.create({
                data: { user_id, post_id }
            });

          
            updatedRepostCount = await prisma.posts.update({
                where: { post_id },
                data: { repostCount: { increment: 1 } },
                select: { repostCount: true }
            });

            return res.status(201).json({
                message: 'Repost successful',
                reposted: true,
                repostCount: updatedRepostCount.repostCount,
            });
        }
    } catch (error) {
        console.error('Error in reposting:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
