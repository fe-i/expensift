import { Schema, model, models, type Document, type Model } from "mongoose";

interface IPost extends Document {
  text: string;
}

const PostSchema = new Schema<IPost>({
  text: {
    type: String,
    required: [true, "Please provide text for this post."],
    maxlength: [50, "Text cannot exceed 50 characters."],
  },
});

export const Post: Model<IPost> =
  models.Post ?? model<IPost>("Post", PostSchema);
