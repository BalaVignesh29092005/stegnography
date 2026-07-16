import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  from: string;
  to: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IMessageModel extends Model<IMessage> {
  createMessage(data: {
    from: string;
    to: string;
    text?: string;
    imageUrl?: string;
    audioUrl?: string;
    fileUrl?: string;
  }): Promise<IMessage>;
}

const messageSchema = new Schema<IMessage>(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    text: { type: String },
    imageUrl: { type: String },
    audioUrl: { type: String },
    fileUrl: { type: String },
  },
  { timestamps: true }
);

messageSchema.statics.createMessage = function (data: any) {
  const message = new this(data);
  return message.save();
};

const Message = mongoose.model<IMessage, IMessageModel>("Message", messageSchema);
export default Message;
