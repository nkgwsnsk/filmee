import { useEffect, useState } from 'react';

type ApiReview = {
  id: string;
  review_title: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  review_tags?: {
    tags: { name: string } | null;
  }[];
};

type Review = {
  id: string;
  title: string;
  rating: number;
  tags: string[];
  comment: string;
  createdAt: string;
};

type Props = {
  movieId: string;
  movieTitle: string;
};

const API_URL = import.meta.env.PUBLIC_API_BASE_URL ?? '';

const toReview = (review: ApiReview): Review => ({
  id: review.id,
  title: review.review_title ?? '',
  rating: Number(review.rating),
  tags:
    review.review_tags
      ?.map((item) => item.tags?.name)
      .filter((tag): tag is string => Boolean(tag)) ?? [],
  comment: review.comment ?? '',
  createdAt: review.created_at,
});

export function ReviewManager({ movieId, movieTitle }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const loadReviews = async () => {
    const response = await fetch(
      `${API_URL}/api/movies/${movieId}/reviews`,
    );

    if (!response.ok) {
      throw new Error('レビューを取得できませんでした');
    }

    const data = (await response.json()) as ApiReview[];
    setReviews(data.map(toReview));
  };

  useEffect(() => {
    loadReviews().catch((reason) => {
      console.error(reason);
      setError('レビューを読み込めませんでした');
    });
  }, [movieId]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setRating(0);
    setTags('');
    setComment('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEditModal = (review: Review) => {
    setEditingId(review.id);
    setTitle(review.title);
    setRating(review.rating);
    setTags(review.tags.join(', '));
    setComment(review.comment);
    setIsOpen(true);
  };

  const saveReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const tagList = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const body = {
      tmdb_id: Number(movieId),
      movie_title: movieTitle,
      review_title: title.trim(),
      rating,
      comment: comment.trim(),
      tags: tagList,
    };

    try {
      setError('');

      const response = await fetch(
        editingId
          ? `${API_URL}/api/reviews/${editingId}`
          : `${API_URL}/api/reviews`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadReviews();
      setIsOpen(false);
      resetForm();
    } catch (reason) {
      console.error(reason);
      setError('レビューの保存に失敗しました');
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm('このレビューを削除しますか？')) return;

    const response = await fetch(`${API_URL}/api/reviews/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      setError('レビューの削除に失敗しました');
      return;
    }

    setReviews((current) => current.filter((review) => review.id !== id));
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">レビュー</h2>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
        >
          ＋レビューを書く
        </button>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      {reviews.length === 0 ? (
        <p className="rounded-xl bg-slate-900 p-5 text-slate-400">
          まだレビューはありません。
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-white">{review.title}</h3>
                  <p className="text-yellow-400">
                    {'★'.repeat(review.rating)}
                    <span className="text-slate-600">
                      {'★'.repeat(5 - review.rating)}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => openEditModal(review)}
                    className="text-indigo-400"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReview(review.id)}
                    className="text-red-400"
                  >
                    削除
                  </button>
                </div>
              </div>

              {review.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-indigo-950 px-3 py-1 text-xs text-indigo-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-4 whitespace-pre-wrap text-slate-300">
                {review.comment}
              </p>
            </article>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={saveReview}
            className="w-full max-w-lg space-y-5 rounded-2xl bg-slate-900 p-6 text-white"
          >
            <div className="flex justify-between">
              <h3 className="text-xl font-bold">
                {editingId ? 'レビューを編集' : 'レビューを書く'}
              </h3>
              <button type="button" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </div>

            <p className="text-sm text-slate-400">{movieTitle}</p>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="レビュータイトル"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            />

            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`text-3xl ${
                    value <= rating ? 'text-yellow-400' : 'text-slate-600'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="感動, アクション, おすすめ"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            />

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={5}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            />

            <button
              type="submit"
              disabled={rating === 0}
              className="w-full rounded-lg bg-indigo-600 py-3 font-bold disabled:opacity-50"
            >
              保存する
            </button>
          </form>
        </div>
      )}
    </section>
  );
}