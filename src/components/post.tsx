"use client";
import { useState } from "react";
import { api } from "@/trpc/react";

export function LatestPost() {
  const [latestPost] = api.post.getLatestMongoose.useSuspenseQuery();

  const utils = api.useUtils();
  const [text, setText] = useState("");
  const createPost = api.post.createMongoose.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setText("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <p className="truncate">Your most recent post: {latestPost.text}</p>
      ) : (
        <p>You have no posts yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ text });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Title"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
