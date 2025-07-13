import { Schema, model, models, type Document, type Model } from "mongoose";

interface IPost extends Document {
  text: string;
}

const PostSchema = new Schema<IPost>({
  text: { type: String, required: true, maxlength: 50 },
});

export const Post: Model<IPost> =
  models.Post ?? model<IPost>("Post", PostSchema);
