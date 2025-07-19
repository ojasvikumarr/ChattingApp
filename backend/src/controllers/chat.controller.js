
export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);
    res.status(200).json({ token });
  } catch (error) {
    console.log("error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


export async function createOrGetConversation(req, res) {
  const { userId1, userId2 } = req.body;

  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [userId1, userId2] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId1, userId2],
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("error creating/getting conversation:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


export async function getMessages(req, res) {
  const { conversationId } = req.params;

  try {
    const messages = await Message.find({
      conversation: conversationId,
    }).populate("sender", "username");

    res.status(200).json(messages);
  } catch (error) {
    console.error("error fetching messages:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


export async function sendMessage(req, res) {
  const { conversationId, senderId, text } = req.body;

  try {
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("error sending message:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}