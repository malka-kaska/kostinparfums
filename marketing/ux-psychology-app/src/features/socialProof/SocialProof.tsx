import { useState } from "react";

const INITIAL = 128;

export function SocialProof() {
  const [likes, setLikes] = useState(INITIAL);
  const [liked, setLiked] = useState(false);

  const toggle = () => {
    setLiked((l) => {
      setLikes((n) => (l ? n - 1 : n + 1));
      return !l;
    });
  };

  return (
    <div>
      <button onClick={toggle} data-testid="like" aria-pressed={liked}>
        {liked ? "♥ Liked" : "♡ Like"}
      </button>
      <p data-testid="count">{likes} likes</p>
      <p data-testid="proof">{likes} people like this too</p>
      <button data-testid="share">Share</button>
    </div>
  );
}

export default SocialProof;
